#!/usr/bin/env python3
"""Generate compile-only contracts from a validated local blueprint catalog, never main."""
import json,re,sys
from collections import defaultdict
from pathlib import Path
catalog=json.load(open(sys.argv[1]));enums=catalog['enums'] or {}
def ts(pg):
 pg=re.sub(r'\([^)]*\)','',pg).strip()
 if pg.endswith('[]'):return '('+ts(pg[:-2])+')[]'
 if pg in enums:return ' | '.join(json.dumps(v) for v in enums[pg])
 if pg in ('json','jsonb'):return 'Json'
 if pg in ('smallint','integer','bigint','numeric','real','double precision','oid'):return 'number'
 if pg=='boolean':return 'boolean'
 if pg=='void':return 'undefined'
 if pg in ('uuid','text','character varying','character','date','timestamp with time zone','timestamp without time zone','time without time zone','time with time zone','inet','name','cstring','interval'):return 'string'
 if pg=='record':return 'Record<string, unknown>'
 raise ValueError('Unsupported blueprint type: '+pg)
cols=defaultdict(list)
for c in catalog['columns']:cols[c['table']].append(c)
rels=defaultdict(list)
for r in catalog['relationships'] or []:rels[r['table']].append({'foreignKeyName':r['name'],'columns':r['columns'],'isOneToOne':False,'referencedRelation':r['target'],'referencedColumns':r['target_columns']})
lines=['// Generated from local historical migrations + supabase/planned/module-foundations.sql.', '// UNRELEASED: these types do not describe the deployed main project.', "import type { Json, Database } from './types';",'export type PlannedRows = {']
for name,fields in sorted(cols.items()):
 lines+=['  '+json.dumps(name)+': {']
 for c in fields:lines+=['    '+json.dumps(c['name'])+': '+ts(c['type'])+(' | null' if not c['not_null'] else '')+';']
 lines+=['  };']
lines+=['};','type Table<Row, Required extends keyof Row, Relations> = {Row:Row;Insert:Partial<Row> & Pick<Row, Required>;Update:Partial<Row>;Relationships:Relations};',"export type PlannedDatabase = {__InternalSupabase: Database['__InternalSupabase'];public:{Tables:{"]
for name,fields in sorted(cols.items()):
 if fields[0]['kind']!='r':continue
 required=' | '.join(json.dumps(c['name']) for c in fields if c['not_null'] and not c['has_default']) or 'never'
 lines+=['  '+json.dumps(name)+': Table<PlannedRows['+json.dumps(name)+'], '+required+', '+json.dumps(rels[name])+'>;']
lines+=['};Views:{']
for name,fields in sorted(cols.items()):
 if fields[0]['kind']=='v':lines+=['  '+json.dumps(name)+': {Row: PlannedRows['+json.dumps(name)+'];Relationships:[]};']
lines+=['};Functions:{']
for f in catalog['functions'] or []:
 args=[]
 for i,a in enumerate(f['args'] or []):args +=[json.dumps(a['name'] or 'arg'+str(i))+('?' if a['optional'] else '')+':'+ts(a['type'])]
 arg_type = '{'+';'.join(args)+'}' if args else 'Record<string, never>'
 lines+=['  '+json.dumps(f['name'])+': {Args:'+arg_type+';Returns:'+ts(f['return'])+'};']
lines+=['};Enums:{'+''.join(json.dumps(name)+':'+ts(name)+';' for name in enums)+'};CompositeTypes:Record<string,never>}};','']
Path(sys.argv[2]).write_text('\n'.join(lines))
