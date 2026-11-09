#!/usr/bin/env python3
"""Publish the two approved November articles; never overwrite an existing slug."""
import argparse
import json
import pathlib
from importlib.machinery import SourceFileLoader

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
articles = json.loads((ROOT / 'content/articles/november-2026.json').read_text())
assert len(articles) == 2 and len({a['slug'] for a in articles}) == 2
for article in articles:
    assert article['category'] in ('Livestock', 'Pet Health')
    assert 0 < len(article['excerpt']) <= 300
    assert len(article['content'].split()) >= 500
if not args.apply:
    for article in articles:
        print(article['category'] + ': ' + article['title'])
    raise SystemExit(0)

deployment = SourceFileLoader('deployment', str(ROOT / 'scripts/deploy-reviewed-repairs.py')).load_module()
# JSON is escaped as a SQL string literal; no user-controlled SQL interpolation.
payload = json.dumps(articles, ensure_ascii=False).replace("'", "''")
query = """insert into public.articles
(slug,title,category,excerpt,tags,content,author_id,image_url,is_published,published_at)
select slug,title,category,excerpt,tags,content,null,image_url,true,now()
from jsonb_to_recordset('%s'::jsonb) as a
(slug text,title text,category text,excerpt text,tags text[],content text,author_id text,image_url text)
on conflict (slug) do nothing
returning slug,is_published;""" % payload
print(json.dumps(deployment.request('/database/query', {'query': query}), indent=2))
slugs = ','.join("'" + a['slug'].replace("'", "''") + "'" for a in articles)
# Verify actual public-read visibility through the same anonymous role as the website.
rows = deployment.request('/database/query', {'query':
    'begin; set local role anon; select slug,title,category,excerpt,tags,content,image_url,is_published,published_at '
    'from public.articles where slug in (' + slugs + '); rollback;'})
assert isinstance(rows, list) and len(rows) == 2, 'Both articles must be publicly readable'
for article in articles:
    row = next(r for r in rows if r['slug'] == article['slug'])
    assert row['is_published'] and row['published_at'], 'Publication not confirmed'
    for key in ('title', 'category', 'excerpt', 'tags', 'content', 'image_url'):
        assert row[key] == article[key], 'Existing article differs: ' + article['slug'] + '/' + key
    print('Verified public publication: https://1vet.store/articles/' + article['slug'])
