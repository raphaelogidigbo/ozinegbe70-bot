// Tests the invite-first journey against a live in-process server:
// admin adds an invitee → invitee confirms on /invite → card + pass issued →
// pass checks in at the door. Plus the request → approve path, declines,
// idempotent re-confirm, and admin auth. Same process = same in-memory
// store, no Supabase needed.
//
//   node scripts/test-invite.js

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Set before importing config — dotenv does not override existing vars.
process.env.PORT = '3102';
process.env.DOOR_KEY = 'test-door-key';
process.env.ADMIN_KEY = 'test-admin-key';

await import('../src/server.js');
const { store } = await import('../src/store.js');

const BASE = `http://localhost:${process.env.PORT}`;
const ADMIN = { 'X-Admin-Key': 'test-admin-key' };
const selfie = await fs.readFile(path.join(ROOT, 'assets', 'couple.jpg'));
const photo = `data:image/jpeg;base64,${selfie.toString('base64')}`;

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

await new Promise((r) => setTimeout(r, 300));

// 1. Admin auth: 403 without key and with wrong key, 200 with the right one
{
  const unauth = await fetch(`${BASE}/api/admin/guests`);
  const wrong = await fetch(`${BASE}/api/admin/guests`, { headers: { 'X-Admin-Key': 'nope' } });
  const auth = await fetch(`${BASE}/api/admin/guests`, { headers: ADMIN });
  check('admin guests without key → 403', unauth.status === 403);
  check('admin guests wrong key → 403', wrong.status === 403);
  check('admin guests with key → 200', auth.status === 200);
}

// 2. Admin page serves
{
  const res = await fetch(`${BASE}/admin`);
  check('GET /admin serves console', res.status === 200);
}

// 3. Add an invitee → invite URL
let inviteId;
{
  const res = await fetch(`${BASE}/api/admin/invite`, {
    method: 'POST',
    headers: { ...ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Invite', phone: '0803 111 2222', email: 'ada@example.com' }),
  });
  const body = await res.json();
  inviteId = body.inviteUrl && body.inviteUrl.split('/').pop();
  const g = await store.getGuest('2348031112222');
  check(
    'POST /api/admin/invite → inviteUrl, guest invited',
    res.status === 200 && !!inviteId && g?.state === 'invited',
    JSON.stringify(body.error || '')
  );
}

// 4. Invite lookup returns name + state (page is static, data via JSON)
{
  const res = await fetch(`${BASE}/api/invite/${inviteId}`);
  const body = await res.json();
  check(
    'GET /api/invite/:id → invited guest',
    res.status === 200 && body.name === 'Ada Invite' && body.state === 'invited' && !body.passId
  );
}

// 5. Invite page serves
{
  const res = await fetch(`${BASE}/invite/${inviteId}`);
  const html = await res.text();
  check('GET /invite/:id serves page', res.status === 200 && html.includes('Confirm my attendance'));
}

// 5b. Flyer endpoint + og:image meta (the WhatsApp link-preview mechanism)
{
  const flyer = await fetch(`${BASE}/flyer.png`);
  check(
    'GET /flyer.png → png',
    flyer.status === 200 && (flyer.headers.get('content-type') || '').includes('png')
  );

  const inv = await fetch(`${BASE}/invite/${inviteId}`);
  const invHtml = await inv.text();
  const rsvp = await fetch(`${BASE}/rsvp`);
  const rsvpHtml = await rsvp.text();
  check('invite page carries og:image flyer', invHtml.includes('og:image') && invHtml.includes('flyer.png'));
  check('rsvp page carries og:image flyer', rsvpHtml.includes('og:image') && rsvpHtml.includes('flyer.png'));
}

// 6. Confirm with photo → pass issued, guest registered
let passId;
{
  const res = await fetch(`${BASE}/api/invite/${inviteId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', photo }),
  });
  const body = await res.json();
  passId = body.passId;
  const g = await store.getGuest('2348031112222');
  check(
    'confirm → 200 + passId, state registered',
    res.status === 200 && !!passId && g?.state === 'registered' && !!g.pass_img,
    JSON.stringify(body.error || '')
  );
}

// 7. Media endpoints serve the rendered JPEGs
{
  const pass = await fetch(`${BASE}/media/${passId}/pass.jpg`);
  const card = await fetch(`${BASE}/media/${passId}/card.jpg`);
  check('GET /media/:id/pass.jpg → jpeg', pass.status === 200 && pass.headers.get('content-type').includes('jpeg'));
  check('GET /media/:id/card.jpg → jpeg', card.status === 200);
}

// 8. Lookup now reports registered + pass for the returning guest
{
  const res = await fetch(`${BASE}/api/invite/${inviteId}`);
  const body = await res.json();
  check('GET /api/invite/:id → registered + passId', body.state === 'registered' && body.passId === passId);
}

// 9. Re-confirm reuses the same pass id (idempotent)
{
  const res = await fetch(`${BASE}/api/invite/${inviteId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  check('re-confirm reuses pass_id', res.status === 200 && body.passId === passId);
}

// 10. Decline after registering is refused
{
  const res = await fetch(`${BASE}/api/invite/${inviteId}/decline`, { method: 'POST' });
  check('decline after confirm → 400', res.status === 400);
}

// 11. Issued pass checks in at the door end-to-end
{
  const api = await fetch(`${BASE}/api/checkin/${passId}`);
  const guest = await api.json();
  const res = await fetch(`${BASE}/api/door/checkin/${passId}`, {
    method: 'POST',
    headers: { 'X-Door-Key': 'test-door-key' },
  });
  const body = await res.json();
  check(
    'door check-in on invite pass → 200',
    api.status === 200 && guest.name === 'Ada Invite' && res.status === 200 && !body.already
  );
}

// 12. Request → approve → invitee confirms
{
  const req = await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Walk In', phone: '0804 444 5555' }),
  });
  const rbody = await req.json();

  const approve = await fetch(`${BASE}/api/admin/approve/2348044445555`, {
    method: 'POST',
    headers: ADMIN,
  });
  const abody = await approve.json();
  const iid = abody.inviteUrl && abody.inviteUrl.split('/').pop();

  const confirm = await fetch(`${BASE}/api/invite/${iid}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const cbody = await confirm.json();
  const g = await store.getGuest('2348044445555');
  check(
    'request → approve → confirm issues pass',
    rbody.requested === true && g?.state === 'registered' && confirm.status === 200 && !!cbody.passId,
    JSON.stringify(cbody.error || '')
  );
}

// 13. Decline a pending request
{
  await fetch(`${BASE}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Thanks', phone: '0806 666 7777' }),
  });
  const res = await fetch(`${BASE}/api/admin/decline/2348066667777`, {
    method: 'POST',
    headers: ADMIN,
  });
  const g = await store.getGuest('2348066667777');
  check('decline request → state declined', res.status === 200 && g?.state === 'declined');
}

// 14. Invitee declines via their own link
{
  const inv = await fetch(`${BASE}/api/admin/invite`, {
    method: 'POST',
    headers: { ...ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Decline Dan', phone: '0807 777 8888' }),
  });
  const { inviteUrl } = await inv.json();
  const iid = inviteUrl.split('/').pop();
  const res = await fetch(`${BASE}/api/invite/${iid}/decline`, { method: 'POST' });
  const g = await store.getGuest('2348077778888');
  check('invitee decline → state declined', res.status === 200 && g?.state === 'declined');
}

// 15. Bad invite ids → 404 (format rejection and unknown token)
{
  const bad = await fetch(`${BASE}/api/invite/not-a-token!!`);
  const unknown = await fetch(`${BASE}/api/invite/aaaa0000bbbb1111`);
  check('GET /api/invite bad id → 404', bad.status === 404 && unknown.status === 404);
}

// 16. Re-inviting a confirmed guest keeps them registered
{
  const res = await fetch(`${BASE}/api/admin/invite`, {
    method: 'POST',
    headers: { ...ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Invite', phone: '2348031112222' }),
  });
  const body = await res.json();
  const g = await store.getGuest('2348031112222');
  check(
    're-invite registered guest → existing, still registered',
    res.status === 200 && body.existing === true && g?.state === 'registered'
  );
}

// 17. Email endpoint guards: no email → 400
{
  const res = await fetch(`${BASE}/api/admin/email/2348077778888`, {
    method: 'POST',
    headers: ADMIN,
  });
  check('email invitee without email → 400', res.status === 400);
}

process.exit(failures ? 1 : 0);
