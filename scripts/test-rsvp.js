// Tests the public request-to-attend path against a live in-process server:
// the /rsvp page files a 'requested' entry — no pass — and a resubmit from an
// already-registered guest returns their pass (recovery). The invite →
// confirm → door journey lives in test-invite.js.
//
//   node scripts/test-rsvp.js
//
// RSVP_RATE_LIMIT=3 so the 429 case trips on the fourth real submission.

// Set before importing config — dotenv does not override existing vars.
process.env.PORT = '3101';
process.env.DOOR_KEY = 'test-door-key';
process.env.ADMIN_KEY = 'test-admin-key';
process.env.RSVP_RATE_LIMIT = '3';

await import('../src/server.js');
const { store } = await import('../src/store.js');

const BASE = `http://localhost:${process.env.PORT}`;

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

// A confirmed guest seeded directly — used for the pass-recovery branch.
await store.upsertGuest('2348055550001', {
  name: 'Confirmed Guest',
  state: 'registered',
  pass_id: 'existingpass1',
  card_img: null,
  pass_img: null,
});

await new Promise((r) => setTimeout(r, 300));

// 1. Form page
{
  const res = await fetch(`${BASE}/rsvp`);
  const html = await res.text();
  check('GET /rsvp serves request form', res.status === 200 && html.includes('Request an invitation'));
}

// 2. Missing name → 400 (and does not consume a rate-limit slot)
{
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '08031234567' }),
  });
  check('POST without name → 400', res.status === 400);
}

// 3. Valid submission → requested, NO pass issued (slot 1)
{
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hopeful Guest', phone: '0803 123 4567' }),
  });
  const body = await res.json();
  const g = await store.getGuest('2348031234567');
  check(
    'POST /api/rsvp → requested, no passId',
    res.status === 200 && body.requested === true && !body.passId && g?.state === 'requested',
    JSON.stringify(body.error || '')
  );
}

// 4. Resubmit same phone → still requested, no pass minted (slot 2)
{
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hopeful Guest Again', phone: '2348031234567' }),
  });
  const body = await res.json();
  check('resubmit same phone → requested again, no pass', res.status === 200 && body.requested === true && !body.passId);
}

// 5. Registered guest re-submitting gets their pass back (slot 3)
{
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Confirmed Guest', phone: '08055550001' }),
  });
  const body = await res.json();
  check(
    'registered guest → already:true + existing pass',
    res.status === 200 && body.already === true && body.passId === 'existingpass1'
  );
}

// 6. Rate limit → 429 on the fourth real submission
{
  const res = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Fourth Guest', phone: '08099990000' }),
  });
  check('fourth submission → 429', res.status === 429);
}

// 7. Calendar file still public
{
  const res = await fetch(`${BASE}/invite.ics`);
  const text = await res.text();
  check('GET /invite.ics → VEVENT', res.status === 200 && text.includes('BEGIN:VEVENT'));
}

process.exit(failures ? 1 : 0);
