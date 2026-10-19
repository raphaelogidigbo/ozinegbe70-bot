import { Router } from 'express';
import express from 'express';
import { config } from './config.js';
import { store } from './store.js';
import { sendInvitation } from './email.js';
import {
  cleanName,
  looksLikeEmail,
  normalizePhone,
  newInviteId,
  inviteUrl,
} from './guest-pack.js';

// Host admin console. The family adds invitees here; each gets a personal
// /invite/{invite_id} link. Delivery is tap-to-send: a wa.me button opens a
// prefilled chat from the host's own WhatsApp (zero API), and Resend covers
// email when the guest has an address. Self-serve /rsvp submissions land as
// 'requested' and are approved/declined from the same page.
//
// Same rule as door.js/rsvp.js: all HTML is static, guest data travels as
// JSON and is rendered via textContent — nothing request-derived reaches a
// markup sink. Every endpoint requires ADMIN_KEY as the X-Admin-Key header,
// entered once per device and kept in localStorage.

export const adminRoutes = Router();

function requireAdminKey(req, res, next) {
  const configured = config.adminKey && !config.adminKey.startsWith('TODO');
  if (!configured) return res.status(503).json({ error: 'admin key not configured' });
  if (req.get('x-admin-key') !== config.adminKey) return res.sendStatus(403);
  next();
}

// Same visual language as the invite/request pages: fonts, framed card,
// damask, antique-gold accents — plus list/table styles and a mobile breakpoint
// that stacks guest rows and gives action buttons the full row width.
const PAGE_CSS = `
  @font-face { font-family:'Cormorant Garamond'; src:url('/fonts/CormorantGaramond-600.ttf'); font-weight:600 }
  @font-face { font-family:'Cormorant Garamond'; src:url('/fonts/CormorantGaramond-700.ttf'); font-weight:700 }
  @font-face { font-family:'Montserrat'; src:url('/fonts/Montserrat-500.ttf'); font-weight:500 }
  @font-face { font-family:'Montserrat'; src:url('/fonts/Montserrat-600.ttf'); font-weight:600 }
  * { box-sizing:border-box }
  body { margin:0; min-height:100vh; padding:30px 14px; display:flex; justify-content:center;
    background: radial-gradient(ellipse at 50% 30%, #221c14, #17130e 60%, #0c0a07);
    color:#f4ecd8; font-family:Montserrat,Georgia,serif }
  img.bg { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%);
    width:min(1400px,190vw); opacity:0.4;
    filter:sepia(0.3) saturate(0.7) brightness(0.9);
    pointer-events:none; z-index:0 }
  .frame { z-index:1; width:100%; max-width:640px; text-align:center; padding:34px 24px 32px; position:relative;
    background:rgba(23,19,14,.45); backdrop-filter:blur(5px);
    border:1.5px solid rgba(236,217,160,.8); outline:1px solid rgba(236,217,160,.4); outline-offset:9px;
    background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><g fill="none" stroke="%23c6a23b" stroke-opacity="0.05" transform="rotate(45 60 60)"><path d="M60 10 C80 30 80 90 60 110 C40 90 40 30 60 10 Z"/><circle cx="60" cy="60" r="4"/></g></svg>') }
  .mono { font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; font-size:44px; letter-spacing:3px; margin:0;
    background:linear-gradient(#ecd9a0,#c6a23b,#7a5e18); -webkit-background-clip:text; background-clip:text; color:transparent }
  .rule { width:200px; height:1px; margin:10px auto 16px; background:rgba(236,217,160,.6) }
  .caps { font-size:12px; letter-spacing:3px; text-transform:uppercase; margin:6px 0 }
  .dim { color:#c9bfa4 }
  h1 { font-family:'Cormorant Garamond',Georgia,serif; font-weight:600; font-size:34px; margin:14px 0 4px }
  h2 { font-size:13px; letter-spacing:3px; text-transform:uppercase; color:#c9bfa4;
       margin:30px 0 10px; border-bottom:1px solid #3a3226; padding-bottom:9px; text-align:left }
  .stats { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin:16px 0 4px }
  .stat { border:1px solid rgba(236,217,160,.4); border-radius:10px; padding:7px 14px; min-width:74px;
    background:rgba(34,28,20,.5) }
  .stat b { display:block; font-size:20px; font-weight:600; color:#f4ecd8 }
  .stat span { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#c9bfa4 }
  input { width:100%; background:#221c14; color:#f4ecd8; border:1px solid rgba(198,162,59,.8); border-radius:10px;
    font-size:17px; padding:13px; font-family:Montserrat,serif; margin-top:10px }
  input:focus { outline:none; border-color:#ecd9a0 }
  .search { margin-top:0 }
  button, .btn { display:block; width:100%; margin-top:16px; background:linear-gradient(#ecd9a0,#9a7a24);
    color:#17130e; border:none; border-radius:12px; font-size:18px; font-weight:600; padding:14px;
    font-family:Montserrat,serif; cursor:pointer; text-decoration:none; text-align:center }
  .row { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;
         border-bottom:1px solid #3a3226; padding:12px 2px; text-align:left }
  .row .info { flex:1 1 170px; min-width:0 }
  .row .nm { font-weight:600; font-size:15px }
  .row small { color:#c9bfa4; word-break:break-all }
  .actions { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; flex:0 1 auto }
  .mini { font-size:13px; font-weight:600; padding:9px 13px; width:auto; margin:0; border-radius:8px;
    display:inline-block; font-family:Montserrat,serif }
  a.mini { text-decoration:none }
  .ghost { background:none; border:1px solid rgba(236,217,160,.7); color:#ecd9a0 }
  .danger { background:none; border:1px solid #6b3d33; color:#e8b0a0 }
  .badge { display:inline-block; font-size:10px; letter-spacing:1px; text-transform:uppercase;
           padding:2px 8px; border-radius:9px; border:1px solid #3a3226; color:#c9bfa4; margin-top:4px }
  .b-invited { color:#ecd9a0; border-color:#6b5a33 }
  .b-registered { color:#a8d8a8; border-color:#3d5c3d }
  .b-declined { color:#e8b0a0; border-color:#6b3d33 }
  .b-requested { color:#f4ecd8; border-color:#8a6d3b }
  #msg { color:#e8b0a0; font-size:14px; min-height:18px; margin:10px 0 0 }
  .newinvite { font-size:13px; word-break:break-all; color:#c9bfa4; margin-top:10px }
  .newinvite a { color:#ecd9a0 }
  .hint { font-size:12px; color:#c9bfa4; line-height:1.5; margin:12px 0 0 }
  .hint a { color:#ecd9a0 }
  .empty { font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#c9bfa4; padding:14px 0 }
  .seal { display:inline-block; margin:26px auto 0; padding:9px 26px; border:1.4px solid rgba(236,217,160,.7);
    border-radius:23px; font-size:11px; letter-spacing:3px; color:#ecd9a0 }
  @media (max-width:560px) {
    .row { flex-direction:column; align-items:stretch }
    .actions { width:100%; justify-content:stretch }
    .actions .mini { flex:1; text-align:center }
    .frame { padding:26px 16px }
  }
`;

const KEY_JS = `
  function adminKey() {
    let k = localStorage.getItem('adminKey');
    if (!k) { k = prompt('Admin PIN'); if (k) localStorage.setItem('adminKey', k); }
    return k || '';
  }
  async function api(path, opts) {
    const r = await fetch(path, {
      method: (opts && opts.method) || 'GET',
      headers: { 'X-Admin-Key': adminKey(), 'Content-Type': 'application/json' },
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (r.status === 403) { localStorage.removeItem('adminKey'); throw new Error('Wrong PIN — try again.'); }
    if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.error || ('Error ' + r.status)); }
    return r.json();
  }
`;

adminRoutes.get('/admin', (req, res) => {
  res.type('html').send(page('Admin', `
      <img class="bg" src="/assets/couple-cutout.png" alt="" aria-hidden="true" onerror="this.remove()">
      <div class="frame">
      <p class="mono">H&amp;J</p>
      <div class="rule"></div>
      <p class="caps dim">Admin Console · Strictly by invitation</p>
      <h1>Guest list</h1>

      <div class="stats" id="stats"></div>

      <h2>Add invitee</h2>
      <form id="add">
        <input id="aname" placeholder="Full name" maxlength="60" required>
        <input id="aphone" placeholder="WhatsApp number — e.g. 0803 123 4567" inputmode="tel" required>
        <input id="aemail" placeholder="Email (optional)" type="email">
        <button type="submit">Create invitation</button>
      </form>
      <p class="hint"><a href="/flyer.png" download="ozinegbe-70-invitation.png">Download the event flyer</a>
        — attach it manually in the WhatsApp chat, or it previews automatically from the invite link.</p>
      <div id="newinvite" class="newinvite"></div>
      <p id="msg"></p>

      <h2>Requests to attend</h2>
      <div id="requests"></div>

      <h2>Guests</h2>
      <input id="q" class="search" placeholder="Search name or number…" oninput="render()">
      <div id="guests"></div>

      <p class="seal">ADMIN · OZINEGBE 70</p>
      </div>

      <script>${KEY_JS}
        let allGuests = [];
        function inviteText(name, url) {
          return "You're invited — Ozinegbe 70th Birthday Thanksgiving Celebration\\n" +
            'Saturday, 10th October 2026 · 11:00 AM · Ajah, Lagos\\n\\n' +
            'Dear ' + name + ', the family would love to have you. Please confirm your attendance on your personal invitation — your card and admission pass are issued when you confirm:\\n' + url + '\\n\\n' +
            'Strictly by invitation — this link is personal to you.';
        }
        function waLink(g) {
          return 'https://wa.me/' + encodeURIComponent(g.phone) +
            '?text=' + encodeURIComponent(inviteText(g.name || 'there', g.invite_url));
        }
        function el(tag, cls, text) {
          const e = document.createElement(tag);
          if (cls) e.className = cls;
          if (text !== undefined) e.textContent = text;
          return e;
        }
        function btn(label, cls, fn) {
          const b = el('button', 'mini ' + cls, label);
          b.onclick = fn;
          return b;
        }
        function infoBlock(g, extra) {
          const info = el('div', 'info');
          info.append(el('span', 'nm', g.name || '(no name)'));
          info.append(document.createElement('br'));
          const st = el('small');
          st.textContent = g.phone + (extra ? ' · ' + extra : '');
          info.append(st);
          return info;
        }
        function copyLink(url, b) {
          const done = () => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Link', 1500); };
          if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy link', url));
          else prompt('Copy link', url);
        }
        function guestRow(g) {
          const row = el('div', 'row');
          const bits = [];
          if (g.invited_at) bits.push('invited ' + new Date(g.invited_at).toLocaleDateString('en-GB'));
          if (g.checked_in_at) bits.push('checked in');
          const info = infoBlock(g, bits.join(' · '));
          const badge = el('span', 'badge b-' + g.state, g.state);
          info.append(document.createElement('br'), badge);
          const acts = el('div', 'actions');
          if (g.invite_url && (g.state === 'invited' || g.state === 'registered')) {
            const wa = el('a', 'mini ghost', 'WhatsApp');
            wa.href = waLink(g); wa.target = '_blank'; wa.rel = 'noopener';
            acts.append(wa);
            acts.append(btn('Link', 'ghost', (e) => copyLink(g.invite_url, e.target)));
            if (g.email) acts.append(btn('Email', 'ghost', async (e) => {
              e.target.disabled = true;
              try { await api('/api/admin/email/' + encodeURIComponent(g.phone), { method: 'POST' }); e.target.textContent = 'Sent'; }
              catch (ex) { e.target.disabled = false; e.target.textContent = 'Retry'; }
            }));
          }
          if (g.state === 'invited') acts.append(btn('Decline', 'danger', () => act('decline', g)));
          row.append(info, acts);
          return row;
        }
        function requestRow(g) {
          const row = el('div', 'row');
          const info = infoBlock(g, g.requested_at ? 'requested ' + new Date(g.requested_at).toLocaleDateString('en-GB') : '');
          const acts = el('div', 'actions');
          acts.append(btn('Approve', '', () => act('approve', g)));
          acts.append(btn('Decline', 'danger', () => act('decline', g)));
          row.append(info, acts);
          return row;
        }
        async function act(what, g) {
          try {
            const r = await api('/api/admin/' + what + '/' + encodeURIComponent(g.phone), { method: 'POST' });
            if (r.inviteUrl) flashInvite(r.inviteUrl, g);
            load();
          } catch (ex) { document.getElementById('msg').textContent = ex.message; }
        }
        function flashInvite(url, g) {
          const box = document.getElementById('newinvite');
          box.textContent = '';
          const span = el('span', '', 'Invite link for ' + (g.name || g.phone) + ': ');
          const a = el('a', '', url); a.href = url; a.target = '_blank'; a.rel = 'noopener';
          const wa = el('a', '', ' — send via WhatsApp');
          wa.href = 'https://wa.me/' + encodeURIComponent(g.phone) + '?text=' + encodeURIComponent(inviteText(g.name || 'there', url));
          wa.target = '_blank'; wa.rel = 'noopener';
          box.append(span, a, wa);
        }
        function renderStats() {
          const s = document.getElementById('stats');
          s.textContent = '';
          const count = (st) => allGuests.filter(g => g.state === st).length;
          const stats = [
            ['Invited', count('invited')],
            ['Confirmed', count('registered')],
            ['Declined', count('declined')],
            ['Requests', count('requested')],
            ['Checked in', allGuests.filter(g => g.checked_in_at).length],
          ];
          for (const [label, n] of stats) {
            const chip = el('div', 'stat');
            chip.append(el('b', '', String(n)), el('span', '', label));
            s.append(chip);
          }
        }
        function render() {
          const q = (document.getElementById('q').value || '').toLowerCase();
          const reqs = allGuests.filter(g => g.state === 'requested');
          const rest = allGuests.filter(g => g.state !== 'requested' &&
            ((g.name || '') + ' ' + (g.phone || '')).toLowerCase().includes(q));
          const rd = document.getElementById('requests');
          rd.textContent = '';
          if (!reqs.length) rd.append(el('p', 'empty', 'No pending requests'));
          for (const g of reqs) rd.append(requestRow(g));
          const gd = document.getElementById('guests');
          gd.textContent = '';
          if (!rest.length) gd.append(el('p', 'empty', q ? 'No matches' : 'No invitees yet'));
          for (const g of rest) gd.append(guestRow(g));
        }
        async function load() {
          try {
            allGuests = await api('/api/admin/guests');
            renderStats();
            render();
          } catch (ex) {
            document.getElementById('msg').textContent = ex.message;
          }
        }
        document.getElementById('add').addEventListener('submit', async (e) => {
          e.preventDefault();
          const msg = document.getElementById('msg');
          msg.textContent = '';
          const name = document.getElementById('aname').value;
          const phone = document.getElementById('aphone').value;
          const email = document.getElementById('aemail').value;
          try {
            const r = await api('/api/admin/invite', { method: 'POST', body: { name, phone, email } });
            msg.textContent = r.existing ? 'Already on the list (' + r.state + ').' : 'Invitation created.';
            flashInvite(r.inviteUrl, { name: r.name, phone: r.phone });
            document.getElementById('add').reset();
            load();
          } catch (ex) { msg.textContent = ex.message; }
        });
        load();
      </script>`));
});

// --- endpoints ---------------------------------------------------------------

adminRoutes.get('/api/admin/guests', requireAdminKey, async (req, res) => {
  const guests = await store.listGuests();
  res.json(
    guests.map((g) => ({
      name: g.name,
      phone: g.phone,
      email: g.email,
      state: g.state,
      invite_url: g.invite_id ? inviteUrl(g.invite_id) : null,
      invited_at: g.invited_at,
      requested_at: g.requested_at,
      checked_in_at: g.checked_in_at,
    }))
  );
});

adminRoutes.post('/api/admin/invite', requireAdminKey, express.json(), async (req, res) => {
  const b = req.body || {};
  const name = cleanName(String(b.name || ''));
  if (name.length < 2) return res.status(400).json({ error: 'name required' });
  const phone = normalizePhone(b.phone);
  if (!phone) return res.status(400).json({ error: 'valid WhatsApp number required' });
  const email = String(b.email || '').trim().toLowerCase();
  if (email && !looksLikeEmail(email)) return res.status(400).json({ error: 'bad email' });

  const existing = await store.getGuest(phone);
  if (existing && (existing.state === 'registered' || existing.state === 'invited')) {
    const inviteId = existing.invite_id || newInviteId();
    if (!existing.invite_id) {
      await store.upsertGuest(phone, { invite_id: inviteId });
    }
    return res.json({
      existing: true, state: existing.state, name: existing.name, phone, inviteUrl: inviteUrl(inviteId),
    });
  }

  const inviteId = existing?.invite_id || newInviteId();
  const guest = await store.upsertGuest(phone, {
    name,
    email: email || existing?.email || null,
    state: 'invited',
    invite_id: inviteId,
    invited_at: new Date().toISOString(),
    declined_at: null,
    requested_at: null,
  });
  res.json({ ok: true, name: guest.name, phone, inviteUrl: inviteUrl(inviteId) });
});

adminRoutes.post('/api/admin/approve/:phone', requireAdminKey, async (req, res) => {
  const guest = await store.getGuest(req.params.phone);
  if (!guest) return res.status(404).json({ error: 'guest not found' });
  // A confirmed guest must never be pushed back to 'invited' — just hand the
  // caller their invite link.
  if (guest.state === 'registered') {
    const inviteId = guest.invite_id || newInviteId();
    if (!guest.invite_id) await store.upsertGuest(guest.phone, { invite_id: inviteId });
    return res.json({ ok: true, already: true, inviteUrl: inviteUrl(inviteId) });
  }
  const inviteId = guest.invite_id || newInviteId();
  await store.upsertGuest(guest.phone, {
    state: 'invited',
    invite_id: inviteId,
    invited_at: new Date().toISOString(),
    declined_at: null,
  });
  res.json({ ok: true, inviteUrl: inviteUrl(inviteId) });
});

adminRoutes.post('/api/admin/decline/:phone', requireAdminKey, async (req, res) => {
  const guest = await store.getGuest(req.params.phone);
  if (!guest) return res.status(404).json({ error: 'guest not found' });
  if (guest.state === 'registered') {
    return res.status(400).json({ error: 'already confirmed — cannot decline' });
  }
  await store.upsertGuest(guest.phone, {
    state: 'declined',
    declined_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

adminRoutes.post('/api/admin/email/:phone', requireAdminKey, async (req, res) => {
  const guest = await store.getGuest(req.params.phone);
  if (!guest) return res.status(404).json({ error: 'guest not found' });
  if (!guest.email) return res.status(400).json({ error: 'guest has no email' });
  if (!guest.invite_id) return res.status(400).json({ error: 'guest has no invite link' });
  await sendInvitation({ to: guest.email, name: guest.name, inviteUrl: inviteUrl(guest.invite_id) });
  res.json({ ok: true });
});

const page = (title, inner) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · Ozinegbe 70</title>
<style>${PAGE_CSS}</style>
</head><body>${inner}</body></html>`;
