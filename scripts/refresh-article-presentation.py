#!/usr/bin/env python3
"""Update only the two requested article bodies/covers, preserving dates and counters."""
import argparse
import json
import pathlib
from importlib.machinery import SourceFileLoader

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
articles = json.loads((ROOT / 'content/articles/november-2026.json').read_text())
guards = {g['slug']: g['previous_content_md5'] for g in json.loads((ROOT / 'content/articles/presentation-guards.json').read_text())}
assert len(articles) == 2 and {a['slug'] for a in articles} == set(guards)
for article in articles:
    assert article['content'].count('## ') >= 7
    cover = article['image_url'].removeprefix('https://1vet.store/')
    assert (ROOT / 'public' / cover).is_file()
    article['previous_content_md5'] = guards[article['slug']]
if not args.apply:
    print('Ready to update article headings, emphasis, callouts and covers for exactly two existing slugs.')
    raise SystemExit(0)

m = SourceFileLoader('deployment', str(ROOT / 'scripts/deploy-reviewed-repairs.py')).load_module()
payload = json.dumps(articles, ensure_ascii=False).replace("'", "''")
# A single DO statement is atomic. Refuse unknown editorial changes rather than overwrite them.
query = """do $presentation$
declare payload jsonb := '%s'::jsonb;
begin
  if (select count(*) from public.articles a join jsonb_to_recordset(payload) as p
      (slug text,content text,previous_content_md5 text,image_url text) on a.slug=p.slug
      where a.is_published and (md5(a.content)=p.previous_content_md5 or a.content=p.content)
      and (a.image_url is null or a.image_url=p.image_url)) <> 2 then
    raise exception 'Article missing, unpublished or edited since the reviewed version';
  end if;
  update public.articles a set content=p.content,image_url=p.image_url
    from jsonb_to_recordset(payload) as p(slug text,content text,image_url text)
    where a.slug=p.slug;
end $presentation$;""" % payload
m.request('/database/query', {'query': query})
slugs = ','.join("'" + a['slug'].replace("'", "''") + "'" for a in articles)
rows = m.request('/database/query', {'query': 'begin; set local role anon; '
    'select slug,content,image_url,is_published,published_at from public.articles where slug in (' + slugs + '); rollback;'})
assert len(rows) == 2
for article in articles:
    row = next(r for r in rows if r['slug'] == article['slug'])
    assert row['content'] == article['content'] and row['image_url'] == article['image_url']
    assert row['is_published'] and row['published_at']
    print('Verified public article content and cover: ' + article['slug'])
