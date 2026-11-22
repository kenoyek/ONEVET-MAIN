import assert from 'node:assert/strict';
import fs from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');

const db = new PGlite();
const admin = crypto.randomUUID();
const reader = crypto.randomUUID();
async function as(id, role = 'authenticated') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id ?? '']);
  await db.exec('SET ROLE ' + role);
}
async function call(sql, args = []) {
  return (await db.query(sql, args)).rows[0].result;
}

try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE profiles(user_id uuid PRIMARY KEY, is_active boolean, first_name text, last_name text);
    CREATE FUNCTION has_role(u uuid, r text) RETURNS boolean LANGUAGE sql AS
      $$ SELECT u = '${admin}'::uuid AND r = 'admin' $$;
    INSERT INTO profiles VALUES ('${admin}', true, 'Ada', 'Admin'), ('${reader}', true, 'Other', 'Reader');
    CREATE TABLE contact_messages (
      id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, subject text NOT NULL,
      message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), is_read boolean NOT NULL DEFAULT false
    );
    INSERT INTO contact_messages (id, name, email, subject, message)
    SELECT gen_random_uuid(), 'Test Visitor', 'visitor@example.invalid', 'Question ' || lpad(n::text, 2, '0'), 'A fixture message'
    FROM generate_series(1, 28) n;
  `);
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122150000_support_message_inbox.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122160000_support_message_resolution.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122170000_support_message_notes.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122180000_support_message_search.sql', import.meta.url), 'utf8'));
  const search = (filter, text, cursor = null) => call(
    'SELECT list_support_messages($1::text,$2,$3,$4) AS result', [filter, cursor?.created_at, cursor?.id, text],
  );
  const notes = (id, cursor = null) => call('SELECT list_support_message_notes($1,$2) AS result', [id, cursor]);
  const addNote = (id, request, body) => call('SELECT add_support_message_note($1,$2,$3) AS result', [id, request, body]);
  const filtered = filter => call('SELECT list_support_messages($1::text,NULL,NULL) AS result', [filter]);
  const resolve = (id, state) => call('SELECT set_support_message_resolved($1,$2) AS result', [id, state]);
  const list = (unread, cursor = null) =>
    call('SELECT list_support_messages($1::boolean,$2,$3) AS result', [unread, cursor?.created_at, cursor?.id]);
  const mark = (id, read) => call('SELECT set_support_message_read($1,$2) AS result', [id, read]);

  await as(null, 'anon');
  await assert.rejects(() => list(true));
  await assert.rejects(() => notes(crypto.randomUUID()));
  await assert.rejects(() => search('all', 'visitor'));
  await assert.rejects(() => resolve(crypto.randomUUID(), true));
  await as(reader);
  await assert.rejects(() => list(false));
  await assert.rejects(() => addNote(crypto.randomUUID(), crypto.randomUUID(), 'Denied'));
  await assert.rejects(() => mark(crypto.randomUUID(), true));
  await assert.rejects(() => resolve(crypto.randomUUID(), true));
  await as(admin);
  const page = await list(true);
  assert.equal(page.length, 26);
  const next = await list(true, page[24]);
  assert.equal(next.length, 3);
  assert.equal(next[0].id, page[25].id);
  assert.equal((await search('all', '  ' + next[0].subject.toUpperCase() + '  '))[0].id, next[0].id);
  assert.equal((await search('all', 'VISITOR@EXAMPLE.INVALID', page[24]))[0].id, next[0].id);
  assert.equal((await search('all', 'Test Visitor'))[0].name, 'Test Visitor');
  assert.deepEqual(await search('all', '%'), []);
  assert.deepEqual(await search('all', 'fixture message'), []);
  await assert.rejects(() => search('all', 'x'.repeat(255)));
  assert.equal(await mark(page[0].id, true), true);
  assert(!(await list(true)).some(message => message.id === page[0].id));
  assert.equal((await list(false))[0].is_read, true);
  assert.equal(await mark(page[0].id, false), true);
  assert.equal((await list(true))[0].id, page[0].id);
  assert.equal(await mark(crypto.randomUUID(), true), false);
  const resolvedAt = await resolve(page[0].id, true);
  assert(resolvedAt);
  assert.deepEqual(await resolve(page[0].id, true), resolvedAt);
  assert.equal((await filtered('resolved'))[0].id, page[0].id);
  assert.deepEqual((await search('resolved', 'visitor@example.invalid')).map(message => message.id), [page[0].id]);
  assert(!(await filtered('open')).some(message => message.id === page[0].id));
  assert.equal((await filtered('unread'))[0].id, page[0].id);
  assert.equal(await resolve(page[0].id, false), null);
  assert.equal((await filtered('open'))[0].id, page[0].id);
  assert.deepEqual(await filtered('resolved'), []);
  const target = page[0].id;
  const request = crypto.randomUUID();
  await assert.rejects(() => addNote(target, request, 'x'.repeat(1001)));
  await addNote(target, request, '  Contacted Support  ');
  await addNote(target, request, 'Contacted Support');
  await assert.rejects(() => addNote(target, request, 'Different body'));
  const [note] = await notes(target);
  assert.equal(note.author_name, 'Ada Admin');
  assert.equal(note.body, 'Contacted Support');
  assert.equal((await notes(target)).length, 1);
  assert.deepEqual(await notes(target, note.id), []);
  assert.deepEqual(await notes(page[1].id), []);
  await assert.rejects(() => db.query('SELECT * FROM support_message_notes'));
  await db.exec('RESET ROLE');
  await db.query('UPDATE profiles SET is_active=false WHERE user_id=$1', [admin]);
  await as(admin);
  await assert.rejects(() => list(false));
  await assert.rejects(() => mark(page[0].id, true));
  await assert.rejects(() => resolve(page[0].id, true));
  await assert.rejects(() => notes(target));
  console.log('PASS: support inbox privileges, pagination, unread filtering, shared read status, resolution, private notes, and filtered search.');
} finally {
  await db.close();
}
