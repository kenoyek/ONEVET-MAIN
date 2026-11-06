-- Fixtures contain invented IDs only; assertions execute as non-owner roles, not postgres.
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
INSERT INTO auth.users VALUES
 ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333'),('44444444-4444-4444-8444-444444444444');
INSERT INTO profiles VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
INSERT INTO user_roles VALUES ('33333333-3333-4333-8333-333333333333','veterinarian'),('44444444-4444-4444-8444-444444444444','admin');
INSERT INTO livestock_farms(id,owner_id,farm_name,farm_type,location_address,city,state) VALUES
 ('a0000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fixture farm A','poultry','Fixture location','Test city','Test state'),
 ('b0000000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fixture farm B','poultry','Fixture location','Test city','Test state');
INSERT INTO livestock_batches(id,farm_id,batch_code,species,head_count) VALUES
 ('a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','fixture-a','poultry',100),
 ('b1000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','fixture-b','poultry',100);
INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations,attending_vet_id) VALUES
 ('b1000000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','clinical_note','Existing assigned-vet record','cccccccc-cccc-4ccc-8ccc-cccccccccccc');

CREATE FUNCTION public.test_assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
 BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',message; END IF; RAISE NOTICE 'PASS: %',message; END;
$$;
CREATE FUNCTION public.test_denied(statement text, message text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
 BEGIN
  BEGIN EXECUTE statement; EXCEPTION WHEN insufficient_privilege OR check_violation THEN RAISE NOTICE 'PASS: %',message; RETURN; END;
  RAISE EXCEPTION 'FAIL: expected write denial: %',message;
 END;
$$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT test_assert((SELECT count(*)=1 FROM livestock_farms),'owner sees only own farm');
SELECT test_assert((SELECT count(*)=1 FROM livestock_batches),'owner sees only own animal groups');
SELECT test_assert((SELECT count(*)=0 FROM flock_health_records),'owner cannot read another farm health record');
INSERT INTO livestock_farms(owner_id,farm_name,farm_type,location_address,city,state)
 VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Owner created farm','mixed','Test','Test','Test');
SELECT test_assert((SELECT count(*)=2 FROM livestock_farms),'owner can create own farm');
INSERT INTO livestock_batches(farm_id,batch_code,species,head_count)
 VALUES ('a0000000-0000-4000-8000-000000000001','owner-created','goat',10);
SELECT test_assert((SELECT count(*)=2 FROM livestock_batches),'owner can create own group');
SELECT test_denied($q$ INSERT INTO livestock_batches(farm_id,batch_code,species,head_count) VALUES ('b0000000-0000-4000-8000-000000000001','forged-group','pig',2) $q$,'cross-owner group insert denied');
SELECT test_denied($q$ UPDATE livestock_farms SET owner_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' WHERE id='a0000000-0000-4000-8000-000000000001' $q$,'farm ownership transfer denied');
SELECT test_denied($q$ UPDATE livestock_batches SET farm_id='b0000000-0000-4000-8000-000000000001' WHERE batch_code='owner-created' $q$,'cross-owner group transfer denied');
WITH changed AS (UPDATE livestock_farms SET farm_name='Attack' WHERE id='b0000000-0000-4000-8000-000000000001' RETURNING id)
 SELECT test_assert((SELECT count(*)=0 FROM changed),'cross-owner update affects no farm');
INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations,affected_count,mortality_count)
 VALUES ('a1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner_observation','Eating less today',3,1);
SELECT test_assert((SELECT count(*)=1 FROM flock_health_records),'owner can append an observation');
SELECT test_denied($q$ INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations) VALUES ('b1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner_observation','Cross-farm forgery') $q$,'cross-owner observation denied');
SELECT test_denied($q$ INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations) VALUES ('a1000000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','owner_observation','Forged author') $q$,'forged author denied');
SELECT test_denied($q$ INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations,treatment_administered) VALUES ('a1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner_observation','Owner prescribing','Fake clinical treatment') $q$,'owner cannot author clinical treatment');
SELECT test_denied($q$ INSERT INTO flock_health_records(batch_id,recorded_by_id,record_type,observations,affected_count) VALUES ('a1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner_observation','Invalid count',101) $q$,'affected count beyond group size denied');
SELECT test_denied($q$ INSERT INTO livestock_batches(farm_id,batch_code,species,head_count) VALUES ('a0000000-0000-4000-8000-000000000001','invalid-count','pig',-1) $q$,'negative group size denied');
WITH changed AS (DELETE FROM flock_health_records RETURNING id) SELECT test_assert((SELECT count(*)=0 FROM changed),'observations are append-only');

WITH removed AS (DELETE FROM livestock_farms RETURNING id) SELECT test_assert((SELECT count(*)=0 FROM removed),'parent farm deletion cannot cascade through records');
WITH removed AS (DELETE FROM livestock_batches RETURNING id) SELECT test_assert((SELECT count(*)=0 FROM removed),'parent group deletion cannot cascade through records');

SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
SELECT test_assert((SELECT count(*)=0 FROM livestock_farms),'unassigned vet has no blanket farm access');
SELECT test_assert((SELECT count(*)=0 FROM livestock_batches),'unassigned vet has no blanket group access');
SELECT test_assert((SELECT count(*)=1 FROM flock_health_records),'assigned vet retains access to explicitly assigned record only');

SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
SELECT test_assert((SELECT count(*)=3 FROM livestock_farms),'existing admin farm visibility preserved');
SELECT test_assert((SELECT count(*)=2 FROM flock_health_records),'existing admin record visibility preserved');

RESET ROLE;
SET ROLE anon;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT test_assert((SELECT count(*)=0 FROM livestock_farms),'anonymous farm access denied');
SELECT test_assert((SELECT count(*)=0 FROM livestock_batches),'anonymous group access denied');
SELECT test_assert((SELECT count(*)=0 FROM flock_health_records),'anonymous record access denied');
RESET ROLE;
