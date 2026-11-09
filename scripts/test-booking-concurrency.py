#!/usr/bin/env python3
"""Local disposable-database race test; called only with the core test container name."""
import pathlib,subprocess,sys,time,tempfile
container=sys.argv[1]
if not container.startswith('onevet-core-test-'):raise SystemExit('Only a disposable core-test container is supported')
base=['docker','--host=unix:///var/run/docker.sock','exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-qAt']
def sql(query):return subprocess.run(base,input=query,text=True,capture_output=True,check=True).stdout.strip()
fixture=pathlib.Path('supabase/tests/provider-booking-setup.sql').read_text()
sql('BEGIN;'+fixture+'COMMIT;')
for customer,pet,key in [('b8222222-2222-4222-8222-222222222222','b9111111-1111-4111-8111-111111111111','c9111111-1111-4111-8111-111111111111'),('b8333333-3333-4333-8333-333333333333','b9222222-2222-4222-8222-222222222222','c9222222-2222-4222-8222-222222222222')]:
 sql(f"BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','{customer}',true);SELECT request_provider_booking((SELECT id FROM provider_service_catalog WHERE provider_slug='booking-fixture-a'),2,(((now() AT TIME ZONE 'Africa/Lagos')::date+2)::text||'T09:00:00+01:00')::timestamptz,'{key}','{pet}',NULL,'08012345678','','Race test');COMMIT;")
def confirm(key):return f"BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','b8111111-1111-4111-8111-111111111111',true);SELECT respond_provider_booking((SELECT id FROM provider_booking_requests WHERE request_key='{key}'),1,'confirmed','Race confirmation');"
with tempfile.TemporaryFile(mode='w+t') as output:
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=output,stderr=output,text=True)
 first.stdin.write("SET application_name='onevet-booking-race-first';"+confirm('c9111111-1111-4111-8111-111111111111')+"SELECT pg_sleep(4);COMMIT;")
 first.stdin.close()
 for attempt in range(40):
  if sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='onevet-booking-race-first' AND wait_event='PgSleep');")=='t':break
  if first.poll() is not None:raise SystemExit('First confirmation did not reach its transaction hold')
  time.sleep(.1)
 else:raise SystemExit('Timed out waiting for the first transaction')
 second=subprocess.run(base,input=confirm('c9222222-2222-4222-8222-222222222222')+'COMMIT;',text=True,capture_output=True)
 if first.wait(timeout=10)!=0 or second.returncode==0 or '23P01' not in second.stderr:raise SystemExit('Expected one confirmation and one slot conflict')
counts=sql("SELECT count(*) FILTER(WHERE status='confirmed')||','||count(*) FILTER(WHERE status='pending') FROM provider_booking_requests WHERE request_key IN ('c9111111-1111-4111-8111-111111111111','c9222222-2222-4222-8222-222222222222');")
if counts!='1,1':raise SystemExit('Race did not leave exactly one confirmed and one pending request')
print('PASS: two concurrent confirmations produce exactly one confirmed appointment and one slot conflict')
# Race original cancellation against replacement confirmation. The losing confirmation
# must not resurrect the cancelled original or its pending alternative.
sql("BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','b8222222-2222-4222-8222-222222222222',true);SELECT request_booking_reschedule((SELECT id FROM provider_booking_requests WHERE request_key='c9111111-1111-4111-8111-111111111111'),2,2,(((now() AT TIME ZONE 'Africa/Lagos')::date+2)::text||'T09:15:00+01:00')::timestamptz,'c9333333-3333-4333-8333-333333333333','Race reschedule request');COMMIT;")
cancel="BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','b8222222-2222-4222-8222-222222222222',true);SELECT respond_provider_booking((SELECT id FROM provider_booking_requests WHERE request_key='c9111111-1111-4111-8111-111111111111'),2,'cancelled','Cancel original and alternative.');"
with tempfile.TemporaryFile(mode='w+t') as output:
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=output,stderr=output,text=True)
 first.stdin.write("SET application_name='onevet-reschedule-race-first';"+cancel+"SELECT pg_sleep(4);COMMIT;")
 first.stdin.close()
 for attempt in range(40):
  if sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='onevet-reschedule-race-first' AND wait_event='PgSleep');")=='t':break
  if first.poll() is not None:raise SystemExit('Cancellation did not reach its transaction hold')
  time.sleep(.1)
 else:raise SystemExit('Timed out waiting for original cancellation')
 second=subprocess.run(base,input=confirm('c9333333-3333-4333-8333-333333333333')+'COMMIT;',text=True,capture_output=True)
 if first.wait(timeout=10)!=0 or second.returncode==0 or '40001' not in second.stderr:raise SystemExit('Expected original cancellation to invalidate the alternative')
if sql("SELECT count(*) FROM provider_booking_requests WHERE request_key IN ('c9111111-1111-4111-8111-111111111111','c9333333-3333-4333-8333-333333333333') AND status='cancelled';")!='2':raise SystemExit('Original and alternative must both remain cancelled')
print('PASS: concurrent original cancellation prevents replacement confirmation and leaves both records cancelled')
# Permission revocation and booking confirmation serialize on the same organization.
sql("INSERT INTO auth.users(id,email,raw_user_meta_data,email_confirmed_at) VALUES('c8555555-5555-4555-8555-555555555555','local-team-race@example.invalid','{}',now());BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','b8111111-1111-4111-8111-111111111111',true);SELECT invite_provider_team_member((SELECT id FROM provider_organizations WHERE slug='booking-fixture-a'),'local-team-race@example.invalid','staff');COMMIT;")
sql("BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','c8555555-5555-4555-8555-555555555555',true);SELECT respond_provider_team_invitation((SELECT id FROM provider_team_invitations WHERE invited_email='local-team-race@example.invalid'),1,'accept');COMMIT;")
revoke="BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','b8111111-1111-4111-8111-111111111111',true);SELECT update_provider_team_member((SELECT id FROM list_provider_team((SELECT id FROM provider_organizations WHERE slug='booking-fixture-a')) WHERE user_id='c8555555-5555-4555-8555-555555555555'),1,'staff',false);"
with tempfile.TemporaryFile(mode='w+t') as output:
 first=subprocess.Popen(base,stdin=subprocess.PIPE,stdout=output,stderr=output,text=True)
 first.stdin.write("SET application_name='onevet-team-revoke-first';"+revoke+"SELECT pg_sleep(4);COMMIT;")
 first.stdin.close()
 for attempt in range(40):
  if sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='onevet-team-revoke-first' AND wait_event='PgSleep');")=='t':break
  if first.poll() is not None:raise SystemExit('Revocation did not reach its transaction hold')
  time.sleep(.1)
 else:raise SystemExit('Timed out waiting for membership revocation')
 second=subprocess.run(base,input="BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','c8555555-5555-4555-8555-555555555555',true);SELECT respond_provider_booking((SELECT id FROM provider_booking_requests WHERE request_key='c9222222-2222-4222-8222-222222222222'),1,'confirmed','Team race response');COMMIT;",text=True,capture_output=True)
 if first.wait(timeout=10)!=0 or second.returncode==0 or '42501' not in second.stderr:raise SystemExit('A revoked coordinator must not confirm a request waiting on the organization lock')
if sql("SELECT status FROM provider_booking_requests WHERE request_key='c9222222-2222-4222-8222-222222222222';")!='pending':raise SystemExit('Revoked operation changed the pending request')
print('PASS: concurrent membership revocation blocks a queued coordinator confirmation')
