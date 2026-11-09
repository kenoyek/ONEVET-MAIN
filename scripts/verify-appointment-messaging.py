#!/usr/bin/env python3
"""Validate main appointment messaging with randomized fixtures in a rollback-only transaction."""
import argparse
import importlib.util
import json
import pathlib
import re
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--main', action='store_true', help='Execute randomized rollback-only checks on main')
    args = parser.parse_args()
    sql = (ROOT / 'supabase/tests/appointment-messaging.sql').read_text()
    assertions = len(re.findall(r'\bSELECT message_test_(?:assert|reject)\(', sql))
    if not args.main:
        print(f'{assertions} assertions ready; use --main to run rollback-only checks on the main project.')
        return
    spec = importlib.util.spec_from_file_location('deployment', ROOT / 'scripts/deploy-reviewed-repairs.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fixture_ids = []
    for value in set(re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', sql)):
        replacement = str(uuid.uuid4())
        fixture_ids.append(replacement)
        sql = sql.replace(value, replacement)
    suffix = uuid.uuid4().hex[:12]
    for name in ['message_test_assert', 'message_test_reject']:
        sql = sql.replace(name, name + '_' + suffix)
    sql = sql.replace('@example.invalid', '+' + suffix + '@example.invalid')
    sql = sql.replace('message-fixture-a', 'message-fixture-' + suffix)
    sql = "BEGIN; SET LOCAL statement_timeout='30s';\n" + sql + "\nROLLBACK; SELECT 'passed_and_rolled_back' AS verification;"
    result = module.request('/database/query', {'query': sql, 'read_only': False})
    if result != [{'verification': 'passed_and_rolled_back'}]:
        raise SystemExit('Unexpected verification result; inspect transaction outcome.')
    # This follow-up is independent of the rolled-back transaction.
    fixture_files = ','.join("'" + value + ".pdf'" for value in fixture_ids)
    cleanup = module.request('/database/query', {'query': f"""
      SELECT (SELECT count(*) FROM auth.users WHERE email LIKE '%+{suffix}@example.invalid') AS users,
             (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE '%_{suffix}') AS functions,
             (SELECT count(*) FROM public.provider_organizations WHERE slug LIKE 'message-fixture-{suffix}%') AS organizations,
             (SELECT count(*) FROM storage.objects WHERE bucket_id='provider-credentials' AND split_part(name,'/',2) IN ({fixture_files})) AS objects
    """, 'read_only': True})
    if cleanup != [{'users': 0, 'functions': 0, 'organizations': 0, 'objects': 0}]:
        raise SystemExit('Fixture cleanup could not be confirmed; inspect before retrying.')
    print(json.dumps({'assertions_passed': assertions, 'transaction': 'rolled back', 'remaining_fixtures': cleanup[0]}))

if __name__ == '__main__':
    main()
