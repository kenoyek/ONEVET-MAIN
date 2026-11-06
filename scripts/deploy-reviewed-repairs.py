#!/usr/bin/env python3
"""Apply only the reviewed repair set; never replay the untracked historical baseline."""
import argparse, hashlib, json, os, pathlib, urllib.error, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
REF='fxvctkfhitpgfyaztqor'
FILES=['20261106010000_live_security_repairs.sql','20261106020000_payment_receipt_ledger.sql','20261106030000_bootstrap_customer_farms.sql','20261106040000_public_read_boundaries.sql','20261106050000_provider_draft_registration.sql','20261106060000_provider_verification_workflow.sql','20261106070000_verification_evidence_history.sql','20261106080000_provider_service_publication.sql']
def request(path,body=None,key=None):
 headers={'Authorization':'Bearer '+os.environ['SUPABASE_ACCESS_TOKEN'],'Content-Type':'application/json'}
 if key:headers['Idempotency-Key']=key
 req=urllib.request.Request('https://api.supabase.com/v1/projects/'+REF+path,headers=headers,data=None if body is None else json.dumps(body).encode())
 try:
  with urllib.request.urlopen(req,timeout=60) as r:
   data=r.read();return json.loads(data) if data else None
 except urllib.error.HTTPError as e:
  # Do not dump response bodies or credentials to logs.
  raise SystemExit('Supabase request failed: HTTP '+str(e.code)+' '+path) from None
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
 if not os.environ.get('SUPABASE_ACCESS_TOKEN'):raise SystemExit('SUPABASE_ACCESS_TOKEN is required')
 history=request('/database/migrations')
 if not isinstance(history,list):raise SystemExit('Unexpected migration history format')
 for filename in FILES:
  source=(ROOT/'supabase/migrations'/filename).read_text();digest=hashlib.sha256(source.encode()).hexdigest();prefix='onevet_'+filename.removesuffix('.sql')+'_';name=prefix+digest[:12]
  existing=[x for x in history if (x.get('name') or '').startswith(prefix)]
  if existing:
   if not any(x.get('name')==name for x in existing):raise SystemExit('Applied migration differs from local source: '+filename)
   print('Already applied:',filename);continue
  if not args.apply:print('Pending:',filename,digest[:12]);continue
  request('/database/migrations',{'query':source,'name':name},key=name)
  history=request('/database/migrations')
  if not any(x.get('name')==name for x in history):raise SystemExit('Apply outcome not confirmed; inspect history before retrying: '+filename)
  print('Applied and tracked:',filename)
