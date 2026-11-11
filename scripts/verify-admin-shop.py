#!/usr/bin/env python3
"""Install and test catalogue SQL inside a fully rolled-back main transaction."""
import argparse, importlib.util, pathlib, re, uuid, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--main',action='store_true');args=p.parse_args()
sql=(ROOT/'supabase/tests/admin-shop-catalogue.sql').read_text();count=len(re.findall(r'SELECT shop_test_(?:assert|denied)\(',sql))
if not args.main:print(f'{count} assertions ready; use --main for rollback-only checks.');raise SystemExit(0)
for value in set(re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',sql)):sql=sql.replace(value,str(uuid.uuid4()))
suffix=uuid.uuid4().hex[:12]
for name in ['shop_test_assert','shop_test_denied']:sql=sql.replace(name,name+'_'+suffix)
sql=sql.replace('@example.invalid','+'+suffix+'@example.invalid').replace('shop-catalogue-fixture-org','shop-catalogue-'+suffix)
spec=importlib.util.spec_from_file_location('deployment',ROOT/'scripts/deploy-reviewed-repairs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
query="BEGIN; SET LOCAL statement_timeout='30s';\n"+(ROOT/'supabase/migrations/20261111010000_admin_shop_catalogue.sql').read_text()+'\n'+sql+"\nROLLBACK; SELECT 'passed_and_rolled_back' AS verification;"
assert m.request('/database/query',{'query':query})==[{'verification':'passed_and_rolled_back'}]
cleanup=m.request('/database/query',{'query':f"select count(*) as users from auth.users where email like '%+{suffix}@example.invalid';",'read_only':True});assert cleanup==[{'users':0}]
print(json.dumps({'checks':count,'transaction':'rolled back','test_users_remaining':0}))
