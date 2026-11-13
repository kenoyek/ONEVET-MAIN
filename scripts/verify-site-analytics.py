#!/usr/bin/env python3
"""Install and test site analytics SQL inside a fully rolled-back main transaction."""
import argparse, importlib.util, pathlib, re, uuid, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--main',action='store_true');args=p.parse_args()
sql=(ROOT/'supabase/tests/site-analytics.sql').read_text();count=len(re.findall(r'SELECT analytics_test_(?:assert|denied)\(',sql))
if not args.main:print(f'{count} assertions ready; use --main for rollback-only checks.');raise SystemExit(0)
for value in set(re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',sql)):sql=sql.replace(value,str(uuid.uuid4()))
suffix=uuid.uuid4().hex[:12]
for name in ['analytics_test_assert','analytics_test_denied','analytics_test_event']:sql=sql.replace(name,name+'_'+suffix)
sql=sql.replace('@example.invalid','+'+suffix+'@example.invalid')
spec=importlib.util.spec_from_file_location('deployment',ROOT/'scripts/deploy-reviewed-repairs.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
deployed=m.request('/database/query',{'query':"select to_regclass('public.site_analytics_events') is not null as deployed;",'read_only':True})
if deployed==[{'deployed':True}]:
    checks=m.request('/database/query',{'query':"select not has_table_privilege('authenticated','public.site_analytics_events','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') as raw_events_private,not has_function_privilege('anon','public.site_analytics_report(integer,text)','EXECUTE') as anonymous_reports_blocked,has_function_privilege('anon','public.record_site_visit(jsonb,text)','EXECUTE') as collector_available;",'read_only':True})
    assert checks==[{'raw_events_private':True,'anonymous_reports_blocked':True,'collector_available':True}]
    print(json.dumps({'state':'already_deployed','migration_replayed':False,'permission_checks':checks[0]}));raise SystemExit(0)
query="BEGIN; SET LOCAL statement_timeout='30s';\n"+(ROOT/'supabase/migrations/20261111030000_site_analytics.sql').read_text()+'\n'+sql+"\nROLLBACK; SELECT 'passed_and_rolled_back' AS verification;"
assert m.request('/database/query',{'query':query})==[{'verification':'passed_and_rolled_back'}]
cleanup=m.request('/database/query',{'query':f"select count(*) as users from auth.users where email like '%+{suffix}@example.invalid';",'read_only':True});assert cleanup==[{'users':0}]
print(json.dumps({'checks':count,'transaction':'rolled back','test_users_remaining':0}))
