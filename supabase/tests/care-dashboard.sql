-- Run after pet-owner-health-journal.sql; only synthetic owner histories are involved.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','eb222222-2222-4222-8222-222222222222',true);
SELECT add_pet_owner_health_entry('ec111111-1111-4111-8111-111111111111','vaccination',current_setting('journal_test.day')::date-60,'Past recorded date','',NULL,current_setting('journal_test.day')::date-1,gen_random_uuid());
SELECT add_pet_owner_health_entry('ec111111-1111-4111-8111-111111111111','vaccination',current_setting('journal_test.day')::date,'Soon recorded date','',NULL,current_setting('journal_test.day')::date+30,gen_random_uuid());
SELECT add_pet_owner_health_entry('ec111111-1111-4111-8111-111111111111','vaccination',current_setting('journal_test.day')::date,'Outside recorded window','',NULL,current_setting('journal_test.day')::date+31,gen_random_uuid());
SELECT add_pet_owner_health_entry('ec111111-1111-4111-8111-111111111111','vaccination',current_setting('journal_test.day')::date,'No due date supplied','',NULL,NULL,gen_random_uuid());
SELECT set_config('journal_test.corrected_date',add_pet_owner_health_entry('ec111111-1111-4111-8111-111111111111','vaccination',current_setting('journal_test.day')::date,'Incorrect recorded date','',NULL,current_setting('journal_test.day')::date+3,gen_random_uuid())::text,true);
SELECT void_pet_owner_health_entry(current_setting('journal_test.corrected_date')::uuid,'Incorrect due date entered');
SELECT journal_test_assert((SELECT count(*)=2 FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.owner_id=get_profile_id(auth.uid()) AND e.entry_type='vaccination' AND e.voided_at IS NULL AND e.next_due_on<=current_setting('journal_test.day')::date+30),'dashboard date window includes past and day-30 dates but excludes future, missing and corrected dates');
SELECT journal_test_assert((SELECT array_agg(title ORDER BY next_due_on,e.id)=ARRAY['Past recorded date','Soon recorded date'] FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.owner_id=get_profile_id(auth.uid()) AND e.entry_type='vaccination' AND e.voided_at IS NULL AND e.next_due_on<=current_setting('journal_test.day')::date+30),'dashboard date order is oldest first');
SELECT journal_test_assert((SELECT count(*)=0 FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.owner_id=get_profile_id('eb111111-1111-4111-8111-111111111111')),'owner filter uses current pet ownership rather than original journal author');
SELECT journal_test_assert(NOT EXISTS(SELECT 1 FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.owner_id=get_profile_id(auth.uid()) AND e.voided_at IS NULL AND e.id=current_setting('journal_test.entry')::uuid),'recent observations exclude corrected entries');
SELECT set_config('request.jwt.claim.sub','eb111111-1111-4111-8111-111111111111',true);
SELECT journal_test_assert((SELECT count(*)=0 FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.id='ec111111-1111-4111-8111-111111111111'),'cross-owner dashboard embedding cannot expose transferred journal history');
SELECT set_config('request.jwt.claim.sub','eb333333-3333-4333-8333-333333333333',true);
SELECT journal_test_assert((SELECT count(*)=0 FROM pet_owner_health_entries e JOIN pets p ON p.id=e.pet_id WHERE p.id='ec111111-1111-4111-8111-111111111111'),'administrator pet reads do not bypass private journal row policies');
RESET ROLE;
