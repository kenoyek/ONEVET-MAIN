#!/usr/bin/env python3
"""Rollback-only main auth trigger/profile checks; no emails or lasting test accounts."""
import argparse
import importlib.util
import json
import pathlib
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--main', action='store_true')
args = parser.parse_args()
if not args.main:
    print('Ready: signup roles, account preferences, vet approval boundaries and private license bucket. Use --main for rollback-only checks.')
    raise SystemExit(0)
spec = importlib.util.spec_from_file_location('deployment', ROOT / 'scripts/deploy-reviewed-repairs.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
suffix = uuid.uuid4().hex
owner, farmer, vet, provider, forged = [str(uuid.uuid4()) for _ in range(5)]
checks = []
def check(condition, label):
    checks.append(label)
    return "do $check$ begin if not (" + condition + ") then raise exception 'Onboarding check failed: " + label + "'; end if; end $check$;"
records = [(owner, {'role':'pet_owner','customer_type':'pet_owner'}), (farmer, {'role':'pet_owner','customer_type':'farm_owner'}), (vet, {'role':'veterinarian','license_number':'FIXTURE-NOT-A-REAL-LICENSE','vendor_type':'veterinarian'}), (provider, {'role':'service_provider','vendor_type':'vendor_store','business_name':'Rollback fixture'}), (forged, {'role':'admin','license_verified':True})]
sql = ["begin; set local statement_timeout='30s';"]
for index, (uid, metadata) in enumerate(records):
    email = f'onboarding-{index}+{suffix}@example.invalid'
    payload = json.dumps(metadata).replace("'", "''")
    sql.append(f"insert into auth.users(id,email,raw_user_meta_data) values('{uid}','{email}','{payload}'::jsonb);")
    sql.append(check(f"(select count(*)=1 from profiles where user_id='{uid}' and is_active and not license_verified and not email_verified)", f'profile created safely {index}'))
    expected = metadata['role'] if metadata['role'] != 'admin' else 'pet_owner'
    sql.append(check(f"(select count(*)=1 from user_roles where user_id='{uid}' and role::text='{expected}')", f'database role {index}'))
sql.append(check(f"(select customer_type='farm_owner' from profiles where user_id='{farmer}')", 'farmer preference retained'))
sql.append(check(f"(select verification_status='pending' from profiles where user_id='{vet}')", 'new vet pending review'))
sql.append(check(f"not exists(select 1 from user_roles where user_id='{forged}' and role::text='admin')", 'signup cannot grant admin'))
sql.append(check("exists(select 1 from storage.buckets where id='licenses' and not public)", 'license bucket private'))
sql.append(f"update profiles set license_verified=true,verification_status='approved',is_available=true where user_id='{vet}';")
sql.append(f"set local role authenticated; select set_config('request.jwt.claim.sub','{vet}',true);")
sql.append(f"update profiles set license_url='{vet}/fixture-license.pdf' where user_id='{vet}';")
sql.append(check(f"(select not license_verified and verification_status='pending' and not is_available from profiles where user_id='{vet}')", 'license replacement resets approval'))
sql.append(f"select set_config('request.jwt.claim.sub','{owner}',true);")
sql.append(check(f"not exists(select 1 from profiles where user_id='{vet}')", 'customer cannot read private vet profile'))
sql.append("reset role;")
sql.append(f"insert into user_roles(user_id,role) values('{forged}','admin');")
sql.append(f"set local role authenticated; select set_config('request.jwt.claim.sub','{forged}',true);")
sql.append(f"update profiles set verification_status='approved',license_verified=true where user_id='{vet}';")
sql.append(check(f"(select license_verified and verification_status='approved' from profiles where user_id='{vet}')", 'trusted administrator can approve vet'))
sql.append(check(f"exists(select 1 from audit_logs where user_id='{forged}' and action='profile_verification_changed')", 'professional approval is audited'))
sql.append("reset role; rollback; select 'passed_and_rolled_back' as verification;")
result = m.request('/database/query', {'query':'\n'.join(sql)})
assert result == [{'verification':'passed_and_rolled_back'}], 'Unexpected rollback verification response'
cleanup = m.request('/database/query', {'query':f"select count(*) as users from auth.users where email like '%+{suffix}@example.invalid';", 'read_only':True})
assert cleanup == [{'users':0}], 'Rollback cleanup not confirmed'
print(json.dumps({'checks_passed':len(checks),'transaction':'rolled back','test_users_remaining':0}))
