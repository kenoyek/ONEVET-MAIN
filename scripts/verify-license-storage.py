#!/usr/bin/env python3
"""Validate new license policies in a rollback-only transaction before or after deployment."""
import argparse
import importlib.util
import pathlib
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--main', action='store_true')
args = parser.parse_args()
if not args.main:
    print('Ready: owner upload, private access, overwrite protection, referenced deletion and orphan cleanup.')
    raise SystemExit(0)
spec = importlib.util.spec_from_file_location('deployment', ROOT / 'scripts/deploy-reviewed-repairs.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
uid, other = str(uuid.uuid4()), str(uuid.uuid4())
suffix = uuid.uuid4().hex
checks = []
def check(condition, label):
    checks.append(label)
    return f"do $check$ begin if not ({condition}) then raise exception 'License storage check failed: {label}'; end if; end $check$;"
path = uid + '/reviewed.pdf'; orphan = uid + '/orphan.pdf'; fresh = uid + '/new.pdf'
# Match the Storage API's transaction flag for metadata deletion; RLS remains active.
sql = ["begin; set local storage.allow_delete_query='true';", (ROOT / 'supabase/migrations/20261110010000_license_document_integrity.sql').read_text()]
for index, actor in enumerate([uid, other]):
    sql.append(f"insert into auth.users(id,email,raw_user_meta_data) values('{actor}','license-{index}+{suffix}@example.invalid','{{\"role\":\"veterinarian\"}}');")
sql.append(f"insert into storage.objects(bucket_id,name,owner_id) values('licenses','{path}','{uid}'),('licenses','{orphan}','{uid}');")
sql.append(f"update profiles set license_url='{path}',license_verified=true,verification_status='approved' where user_id='{uid}';")
sql.append(f"set local role authenticated; select set_config('request.jwt.claim.sub','{uid}',true);")
sql.append(check(f"exists(select 1 from storage.objects where bucket_id='licenses' and name='{path}')", 'owner reads document'))
sql.append(f"update storage.objects set metadata='{{\"tampered\":true}}' where bucket_id='licenses' and name='{path}';")
sql.append(check(f"not exists(select 1 from storage.objects where name='{path}' and metadata->>'tampered'='true')", 'reviewed object cannot be overwritten'))
sql.append(f"delete from storage.objects where bucket_id='licenses' and name='{path}';")
sql.append(check(f"exists(select 1 from storage.objects where name='{path}')", 'referenced document cannot be deleted'))
sql.append(f"delete from storage.objects where bucket_id='licenses' and name='{orphan}';")
sql.append(check(f"not exists(select 1 from storage.objects where name='{orphan}')", 'orphan cleanup allowed'))
sql.append(f"insert into storage.objects(bucket_id,name,owner_id) values('licenses','{fresh}','{uid}');")
sql.append(check(f"exists(select 1 from storage.objects where name='{fresh}')", 'new object upload remains allowed'))
sql.append(f"select set_config('request.jwt.claim.sub','{other}',true);")
sql.append(check(f"not exists(select 1 from storage.objects where bucket_id='licenses' and name='{path}')", 'other account cannot read license'))
sql.append(f"select set_config('request.jwt.claim.sub','{uid}',true);")
sql.append(f"update profiles set license_url='{fresh}' where user_id='{uid}';")
sql.append(check(f"(select not license_verified and verification_status='pending' from profiles where user_id='{uid}')", 'replacement requires fresh approval'))
sql.append("reset role; rollback; select 'passed_and_rolled_back' as verification;")
result = m.request('/database/query', {'query':'\n'.join(sql)})
assert result == [{'verification':'passed_and_rolled_back'}], 'Unexpected response'
cleanup = m.request('/database/query', {'query':f"select (select count(*) from auth.users where email like '%+{suffix}@example.invalid') as users, (select count(*) from storage.objects where bucket_id='licenses' and name like '{uid}/%') as objects;",'read_only':True})
assert cleanup == [{'users':0,'objects':0}], 'Fixture cleanup not confirmed'
print({'checks_passed':len(checks),'transaction':'rolled back','remaining_fixtures':cleanup[0]})
