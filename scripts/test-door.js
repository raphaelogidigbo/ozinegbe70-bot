// Tests the door check-in endpoints against a live in-process server.
// Same process = same in-memory store, so a seeded guest is visible to the
// routes without needing Supabase.
//
//   node scripts/test-door.js
//
// Asserts the full matrix: public pass view, 403 without/with wrong key,
// 200 with the right key, and already:true on a second scan.

// Set before importing config — dotenv does not override existing vars.
process.env.PORT = '3100';
process.env.DOOR_KEY = 'test-door-key';

await import('../src/server.js');
const { store } = await import('../src/store.js');

const BASE = `http://localhost:${process.env.PORT}`;
let failures = 0;

const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

await store.upsertGuest('2348099999999', {
  name: 'Test Guest',
  state: 'registered',
  pass_id: 'testpass1234',
});

// Small settle — the listen callback is sync but give the socket a tick.
await new Promise((r) => setTimeout(r, 300));

// 1. Public pass page is static; guest data comes via the JSON API
{
  const res = await fetch(`${BASE}/checkin/testpass1234`);
  const html = await res.text();
  check('GET /checkin/:id serves pass page', res.status === 200 && html.includes('Admission Pass'));

  const api = await fetch(`${BASE}/api/checkin/testpass1234`);
  const guest = await api.json();
  check('GET /api/checkin/:id returns guest', api.status === 200 && guest.name === 'Test Guest' && !guest.checked_in_at);
}

// 2. Unknown pass 404s
{
  const res = await fetch(`${BASE}/api/checkin/nope-nope`);
  check('GET /api/checkin unknown pass → 404', res.status === 404);
}

// 3. Check-in POST without key → 403
{
  const res = await fetch(`${BASE}/api/door/checkin/testpass1234`, { method: 'POST' });
  check('POST without key → 403', res.status === 403);
}

// 4. Check-in POST with wrong key → 403
{
  const res = await fetch(`${BASE}/api/door/checkin/testpass1234`, {
    method: 'POST',
    headers: { 'X-Door-Key': 'wrong' },
  });
  check('POST with wrong key → 403', res.status === 403);
}

// 5. Check-in POST with right key → 200
{
  const res = await fetch(`${BASE}/api/door/checkin/testpass1234`, {
    method: 'POST',
    headers: { 'X-Door-Key': 'test-door-key' },
  });
  const body = await res.json();
  check('POST with key → 200 checked in', res.status === 200 && body.name === 'Test Guest' && !body.already);
}

// 6. Second scan → already:true (the reuse catch)
{
  const res = await fetch(`${BASE}/api/door/checkin/testpass1234`, {
    method: 'POST',
    headers: { 'X-Door-Key': 'test-door-key' },
  });
  const body = await res.json();
  check('second scan → already:true', res.status === 200 && body.already === true);
}

// 7. Guest list endpoint honours the key
{
  const unauth = await fetch(`${BASE}/api/door/guests`);
  const auth = await fetch(`${BASE}/api/door/guests`, {
    headers: { 'X-Door-Key': 'test-door-key' },
  });
  const list = await auth.json();
  check('GET /api/door/guests without key → 403', unauth.status === 403);
  check('GET /api/door/guests with key → 200 list', auth.status === 200 && list.length === 1);
}

process.exit(failures ? 1 : 0);
