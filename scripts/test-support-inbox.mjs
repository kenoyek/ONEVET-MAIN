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
    CREATE TABLE profiles(user_id uuid PRIMARY KEY, is_active boolean);
    CREATE FUNCTION has_role(u uuid, r text) RETURNS boolean LANGUAGE sql AS
      $$ SELECT u = '${admin}'::uuid AND r = 'admin' $$;
    INSERT INTO profiles VALUES ('${admin}', true), ('${reader}', true);
    CREATE TABLE contact_messages (
      id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, subject text NOT NULL,
      message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), is_read boolean NOT NULL DEFAULT false
    );
    INSERT INTO contact_messages (id, name, email, subject, message)
    SELECT gen_random_uuid(), 'Test Visitor', 'visitor@example.invalid', 'Question ' || n, 'A fixture message'
    FROM generate_series(1, 28) n;
  `);
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122150000_support_message_inbox.sql', import.meta.url), 'utf8'));
  const list = (unread, cursor = null) =>
    call('SELECT list_support_messages($1,$2,$3) AS result', [unread, cursor?.created_at, cursor?.id]);
  const mark = (id, read) => call('SELECT set_support_message_read($1,$2) AS result', [id, read]);

  await as(null, 'anon');
  await assert.rejects(() => list(true));
  await as(reader);
  await assert.rejects(() => list(false));
  await assert.rejects(() => mark(crypto.randomUUID(), true));
  await as(admin);
  const page = await list(true);
  assert.equal(page.length, 26);
  const next = await list(true, page[24]);
  assert.equal(next.length, 3);
  assert.equal(next[0].id, page[25].id);
  assert.equal(await mark(page[0].id, true), true);
  assert(!(await list(true)).some(message => message.id === page[0].id));
  assert.equal((await list(false))[0].is_read, true);
  assert.equal(await mark(page[0].id, false), true);
  assert.equal((await list(true))[0].id, page[0].id);
  assert.equal(await mark(crypto.randomUUID(), true), false);
  await db.exec('RESET ROLE');
  await db.query('UPDATE profiles SET is_active=false WHERE user_id=$1', [admin]);
  await as(admin);
  await assert.rejects(() => list(false));
  await assert.rejects(() => mark(page[0].id, true));
  console.log('PASS: support inbox privileges, pagination, unread filtering, and shared read status.');
} finally {
  await db.close();
}
