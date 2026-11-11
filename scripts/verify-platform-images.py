#!/usr/bin/env python3
"""Install and test image storage SQL inside a fully rolled-back main transaction."""
import argparse, importlib.util, pathlib, re, uuid, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--main',action='store_true');args=p.parse_args()
sql=(ROOT/'supabase/tests/platform-images.sql').read_text();count=len(re.findall(r'SELECT image_test_(?:assert|denied)\(',sql))
if not args.main:print(f'{count} assertions ready; use --main for rollback-only checks.');raise SystemExit(0)
for value in set(re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',sql)):sql=sql.replace(value,str(uuid.uuid4()))
suffix=uuid.uuid4().hex[:12]
for name in ['image_test_assert','image_test_denied']:sql=sql.replace(name,name+'_'+suffix)
sql=sql.replace('@example.invalid','+'+suffix+'@example.invalid')
spec=importlib.util.spec_from_file_location('deployment',ROOT/'scripts/deploy-reviewed-repairs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
query="BEGIN; SET LOCAL statement_timeout='30s'; SET LOCAL storage.allow_delete_query='true';\n"+(ROOT/'supabase/migrations/20261111020000_platform_image_uploads.sql').read_text()+'\n'+sql+"\nROLLBACK; SELECT 'passed_and_rolled_back' AS verification;"
assert m.request('/database/query',{'query':query})==[{'verification':'passed_and_rolled_back'}]
cleanup=m.request('/database/query',{'query':f"select count(*) as users from auth.users where email like '%+{suffix}@example.invalid';",'read_only':True});assert cleanup==[{'users':0}]
print(json.dumps({'checks':count,'transaction':'rolled back','test_users_remaining':0}))
