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
