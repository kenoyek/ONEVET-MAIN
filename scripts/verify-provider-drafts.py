#!/usr/bin/env python3
"""Validate main provider isolation with randomized fixtures in a rollback-only transaction."""
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
    sql = (ROOT / 'supabase/tests/provider-drafts.sql').read_text()
    assertions = len(re.findall(r'\bSELECT provider_test_(?:assert|denied)\(', sql))
    if not args.main:
        print(f'{assertions} assertions ready; use --main to run rollback-only checks on the main project.')
        return
    spec = importlib.util.spec_from_file_location('deployment', ROOT / 'scripts/deploy-reviewed-repairs.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for value in set(re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', sql)):
        sql = sql.replace(value, str(uuid.uuid4()))
    suffix = uuid.uuid4().hex[:12]
    for name in ['provider_test_assert', 'provider_test_denied']:
        sql = sql.replace(name, name + '_' + suffix)
    sql = sql.replace('@example.invalid', '+' + suffix + '@example.invalid')
    sql = sql.replace('provider-fixture-a', 'provider-fixture-' + suffix)
    sql = sql.replace('provider-cap-', 'provider-cap-' + suffix + '-')
    sql = "BEGIN; SET LOCAL statement_timeout='30s';\n" + sql + "\nROLLBACK; SELECT 'passed_and_rolled_back' AS verification;"
    result = module.request('/database/query', {'query': sql, 'read_only': False})
    if result != [{'verification': 'passed_and_rolled_back'}]:
        raise SystemExit('Unexpected verification result; inspect transaction outcome.')
    # This follow-up is independent of the rolled-back transaction.
    cleanup = module.request('/database/query', {'query': f"""
      SELECT (SELECT count(*) FROM auth.users WHERE email LIKE '%+{suffix}@example.invalid') AS users,
             (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE '%_{suffix}') AS functions,
             (SELECT count(*) FROM public.provider_organizations WHERE slug='provider-fixture-{suffix}' OR slug LIKE 'provider-cap-{suffix}-%') AS organizations
    """, 'read_only': True})
    if cleanup != [{'users': 0, 'functions': 0, 'organizations': 0}]:
        raise SystemExit('Fixture cleanup could not be confirmed; inspect before retrying.')
    print(json.dumps({'assertions_passed': assertions, 'transaction': 'rolled back', 'remaining_fixtures': cleanup[0]}))

if __name__ == '__main__':
    main()
