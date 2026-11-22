import assert from 'node:assert/strict';
import fs from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');

const db = new PGlite();
const admin = crypto.randomUUID();
const secondAdmin = crypto.randomUUID();
const reader = crypto.randomUUID();
const guest = crypto.randomUUID();
const stranger = crypto.randomUUID();

async function as(id, role = 'authenticated') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
  await db.exec('SET ROLE ' + role);
}

async function get(sql, args = []) {
  return (await db.query(sql, args)).rows[0].result;
}

try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    INSERT INTO auth.users VALUES ('${admin}'), ('${secondAdmin}'), ('${reader}');
    CREATE TABLE public.profiles(user_id uuid PRIMARY KEY, is_active boolean);
    CREATE FUNCTION public.has_role(u uuid, r text) RETURNS boolean LANGUAGE sql AS
      $$ SELECT u IN ('${admin}'::uuid, '${secondAdmin}'::uuid) AND r = 'admin' $$;
    INSERT INTO profiles VALUES ('${admin}', true), ('${secondAdmin}', true), ('${reader}', true);
  `);
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122050000_care_chat.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122070000_care_chat_waiting_count.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122080000_care_chat_booking_links.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122090000_care_chat_guest_reply_alert.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122100000_care_chat_inbox_filters.sql', import.meta.url), 'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122110000_care_chat_ownership.sql', import.meta.url), 'utf8'));
  const changeOwner = (id, expected, release = false) =>
    get('SELECT care_chat_assign($1,$2,$3) AS result', [id, expected, release]);
  const inboxPage = (status, updatedAt = null, id = null) =>
    get('SELECT care_chat_inbox_page($1,$2,$3) AS result', [status, updatedAt, id]);
  const replyPending = (key, after) => get('SELECT care_chat_reply_pending($1,$2) AS result', [key, after]);
  const waitingCount = () => get('SELECT care_chat_waiting_count() AS result');
  await as(null, 'anon');
  await assert.rejects(() => waitingCount());
  await assert.rejects(() => inboxPage('waiting'));
  const guestRead = key => get('SELECT care_chat_visitor($1) AS result', [key]);
  const guestSend = (key, id, body) =>
    get('SELECT care_chat_visitor($1,$2,$3) AS result', [key, id, body]);
  assert.equal(await guestRead(guest), null);
  const request = crypto.randomUUID();
  await assert.rejects(() => guestSend(guest, request, ' '));
  assert.equal(await guestRead(guest), null);
  const started = await guestSend(guest, request, ' Which service should I book? ');
  assert.equal(started.messages[0].body, 'Which service should I book?');
  assert.equal(await replyPending(guest, 0), false);
  assert.deepEqual(await guestSend(guest, request, 'Which service should I book?'), started);
  await assert.rejects(() => guestSend(guest, request, 'A different message'));
  assert.equal(await guestRead(stranger), null);
  await assert.rejects(() => db.query('SELECT * FROM care_chat_messages'));
  await assert.rejects(() => db.query('SELECT care_chat_inbox()'));
  for (let i = 0; i < 4; i++) await guestSend(guest, crypto.randomUUID(), 'Follow-up ' + i);
  await assert.rejects(() => guestSend(guest, crypto.randomUUID(), 'Sixth message'));

  await as(reader);
  await assert.rejects(() => waitingCount());
  await assert.rejects(() => inboxPage('waiting'));
  await assert.rejects(() => db.query('SELECT care_chat_inbox()'));
  await assert.rejects(() => db.query("SELECT care_chat_staff('any')"));
  await as(admin);
  assert.equal(await waitingCount(), 1);
  const [thread] = await get('SELECT care_chat_inbox() AS result');
  assert.deepEqual(await inboxPage('waiting'), [thread]);
  assert.equal(thread.awaiting_reply, true);
  assert.notEqual(thread.id, guest);
  assert.equal((await get('SELECT care_chat_staff($1) AS result', [thread.id])).owner_id, null);
  const replyId = crypto.randomUUID();
  const staffReply = category => get('SELECT care_chat_staff($1,$2,$3,false,$4) AS result',
    [thread.id, replyId, 'Browse grooming services here.', category]);
  await assert.rejects(() => staffReply('https://example.com'));
  const replied = await staffReply('grooming');
  assert.equal(replied.messages.at(-1).sender, 'team');
  assert.equal(replied.owner_id, admin);
  assert.equal(replied.owned_by_me, true);
  assert.equal(replied.messages.at(-1).booking_category, 'grooming');
  assert.deepEqual(await staffReply('grooming'), replied);
  await assert.rejects(() => staffReply('training'));
  assert.equal(await waitingCount(), 0);
  assert.deepEqual(await inboxPage('waiting'), []);
  assert.equal((await inboxPage('replied'))[0].id, thread.id);
  await assert.rejects(() => inboxPage('invalid'));
  await assert.rejects(() => inboxPage('waiting', null, thread.id));
  assert.equal((await get('SELECT care_chat_inbox() AS result'))[0].awaiting_reply, false);

  await as(secondAdmin);
  assert.equal((await get('SELECT care_chat_staff($1) AS result', [thread.id])).owned_by_me, false);
  await assert.rejects(() => get('SELECT care_chat_staff($1,$2,$3) AS result', [thread.id, crypto.randomUUID(), 'Duplicate staff reply']));
  await assert.rejects(() => get('SELECT care_chat_staff($1,close_chat=>true) AS result', [thread.id]));
  await assert.rejects(() => changeOwner(thread.id, null));
  assert.equal((await changeOwner(thread.id, admin)).owner_id, secondAdmin);
  await as(admin);
  await assert.rejects(() => changeOwner(thread.id, secondAdmin, true));
  await as(secondAdmin);
  assert.equal((await changeOwner(thread.id, secondAdmin, true)).owner_id, null);
  await as(null, 'anon');
  assert.deepEqual(await guestRead(guest), { closed: replied.closed, messages: replied.messages });
  await assert.rejects(() => changeOwner(thread.id, null));
  const lastReply = replied.messages.at(-1).id;
  assert.equal(await replyPending(guest, 0), true);
  assert.equal(await replyPending(guest, lastReply), false);
  assert.equal(await replyPending(stranger, 0), false);
  await assert.rejects(() => staffReply('grooming'));
  await assert.rejects(() => db.query('SELECT care_chat_visitor($1,$2,$3,$4)', [guest, crypto.randomUUID(), 'Text', 'grooming']));
  await guestSend(stranger, crypto.randomUUID(), 'A new visitor');
  await as(admin);
  assert.equal(await waitingCount(), 1);
  const open = (await get('SELECT care_chat_inbox() AS result')).find(item => item.awaiting_reply);
  await get('SELECT care_chat_staff($1,close_chat=>true) AS result', [open.id]);
  assert.equal((await inboxPage('closed'))[0].id, open.id);
  assert.equal(await waitingCount(), 0);
  await get('SELECT care_chat_staff($1,close_chat=>true) AS result', [thread.id]);
  await as(null, 'anon');
  assert.equal((await guestRead(guest)).closed, true);
  await assert.rejects(() => guestSend(guest, crypto.randomUUID(), 'After closure'));
  await db.exec('RESET ROLE');
  await db.query("UPDATE care_chat_threads SET created_at=now()-interval '8 days' WHERE id=$1", [thread.id]);
  await as(null, 'anon');
  assert.deepEqual(await guestRead(guest), { closed: true, messages: [] });
  assert.equal(await replyPending(guest, 0), false);
  await db.exec('RESET ROLE');
  await db.exec(`
    INSERT INTO care_chat_threads (id, updated_at)
    SELECT 'fixture-' || lpad(n::text, 3, '0'), now() - interval '10 minutes'
    FROM generate_series(1, 27) n;
    INSERT INTO care_chat_messages (thread_id, request_id, sender, body)
    SELECT id, '00000000-0000-0000-0000-000000000001', 'visitor', 'Waiting'
    FROM care_chat_threads WHERE id LIKE 'fixture-%';
  `);
  await as(admin);
  const firstPage = await inboxPage('waiting');
  assert.equal(firstPage.length, 26);
  assert.equal(firstPage[0].id, 'fixture-001');
  const boundary = firstPage[24];
  assert.deepEqual((await inboxPage('waiting', boundary.updated_at, boundary.id)).map(item => item.id),
    ['fixture-026', 'fixture-027']);
  await db.exec('RESET ROLE');
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261122060000_care_chat_availability.sql', import.meta.url), 'utf8'));
  const available = () => get('SELECT care_chat_is_available() AS result');
  const setAvailability = accepting => get('SELECT care_chat_staff_availability($1) AS result', [accepting]);
  await as(null, 'anon');
  assert.equal(await available(), false);
  await assert.rejects(() => setAvailability(true));
  await assert.rejects(() => db.query('SELECT * FROM care_chat_availability'));
  await as(reader);
  await assert.rejects(() => setAvailability(true));
  await as(admin);
  assert(await setAvailability(true));
  assert(await get('SELECT care_chat_staff_availability() AS result'));
  await as(secondAdmin);
  assert.equal(await get('SELECT care_chat_staff_availability() AS result'), null);
  await setAvailability(true);
  await as(admin);
  assert.equal(await setAvailability(false), null);
  await as(null, 'anon');
  assert.equal(await available(), true);
  await db.exec('RESET ROLE');
  await db.query('UPDATE profiles SET is_active=false WHERE user_id=$1', [secondAdmin]);
  await as(null, 'anon');
  assert.equal(await available(), false);
  await db.exec('RESET ROLE');
  await db.query('UPDATE profiles SET is_active=true WHERE user_id=$1', [secondAdmin]);
  await db.query("UPDATE care_chat_availability SET available_until=now()-interval '1 second' WHERE staff_id=$1", [secondAdmin]);
  await as(null, 'anon');
  assert.equal(await available(), false);
  console.log('PASS: staff opt-in, independent shifts, expiry, and visitor visibility.');
  console.log('PASS: guest isolation, permissions, retry keys, rate limits, two-way chat, closure, and expiration.');
} finally {
  await db.close();
}
