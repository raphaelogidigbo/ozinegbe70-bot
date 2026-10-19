import { Router, static as serveStatic } from 'express';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { store } from './store.js';
import { buildIcs } from './ics.js';
import { sendGuestPack, sendInvitation } from './email.js';
import {
  cleanName,
  looksLikeEmail,
  normalizePhone,
  passUrl,
  inviteUrl,
  flyerUrl,
  buildGuestPack,
} from './guest-pack.js';
import { EVENT } from './templates.js';

// Invitation + request flow — the no-Meta path. Hosts send each guest a
// personal /invite/{invite_id} link from /admin; the invitee confirms here
// (optional photo + email) and gets their card, pass, calendar file and a
// wa.me self-send link on one confirmation page. Strangers who scan the
// flyer QR land on /rsvp, which now only files a 'requested' entry — no
// pass — for a host to approve in /admin.
// Rendered card/pass JPEGs are stored (base64 in guests.card_img/pass_img)
// and served at /media/{pass_id}/… — the raw selfie is still never stored.
//
// Same rule as door.js: all HTML is static, guest data travels as JSON and
// is rendered via textContent — no request-derived value reaches markup.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');

export const rsvpRoutes = Router();

// Same TTFs the card renderer uses — the page's @font-face matches the
// generated card and pass exactly.
rsvpRoutes.use('/fonts', serveStatic(FONT_DIR));

// Static assets — the page background uses the couple's cutout portrait.
rsvpRoutes.use('/assets', serveStatic(path.join(__dirname, '..', 'assets')));

// --- tiny in-memory rate limit: 10 submissions per IP per hour --------------
const RATE_LIMIT = Number(process.env.RSVP_RATE_LIMIT || 10);
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3_600_000);
  if (list.length >= RATE_LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  .frame { z-index:1; width:100%; max-width:540px; text-align:center; padding:34px 24px 32px; position:relative;
    background:rgba(23,19,14,.45); backdrop-filter:blur(5px);
    border:1.5px solid rgba(236,217,160,.8); outline:1px solid rgba(236,217,160,.4); outline-offset:9px;
    background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><g fill="none" stroke="%23c6a23b" stroke-opacity="0.05" transform="rotate(45 60 60)"><path d="M60 10 C80 30 80 90 60 110 C40 90 40 30 60 10 Z"/><circle cx="60" cy="60" r="4"/></g></svg>') }
  .mono { font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; font-size:44px; letter-spacing:3px; margin:0;
    background:linear-gradient(#ecd9a0,#c6a23b,#7a5e18); -webkit-background-clip:text; background-clip:text; color:transparent }
  .rule { width:200px; height:1px; margin:10px auto 20px; background:rgba(236,217,160,.6) }
  .caps { font-size:12px; letter-spacing:3px; text-transform:uppercase; margin:6px 0 }
  .dim { color:#c9bfa4 }
  .accent { background:linear-gradient(#ecd9a0,#c6a23b); -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:600 }
  h1.names { font-family:'Cormorant Garamond',Georgia,serif; font-weight:600; font-size:30px; margin:16px 0 6px; line-height:1.25 }
  .date { font-size:13px; letter-spacing:2px; color:#f4ecd8; margin:14px 0 4px }
  .venue { font-family:'Cormorant Garamond',Georgia,serif; font-size:16px; color:#c9bfa4; margin:4px 0 20px; line-height:1.4 }
  label { display:block; text-align:left; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#c9bfa4; margin:16px 0 6px }
  input { width:100%; background:#221c14; color:#f4ecd8; border:1px solid rgba(198,162,59,.8); border-radius:10px;
    font-size:17px; padding:13px; font-family:Montserrat,serif }
  input:focus { outline:none; border-color:#ecd9a0 }
  .hp { position:absolute; left:-9999px; opacity:0; height:0; overflow:hidden }
  .filebtn { display:block; border:1px dashed rgba(236,217,160,.6); border-radius:10px; padding:14px;
    font-size:13px; letter-spacing:1px; color:#c9bfa4; cursor:pointer }
  .filebtn input { display:none }
  #preview { display:none; width:84px; height:84px; border-radius:50%; object-fit:cover; margin:12px auto 0;
    border:3px solid #c6a23b }
  button, .btn { display:block; width:100%; margin-top:20px; background:linear-gradient(#ecd9a0,#9a7a24);
    color:#17130e; border:none; border-radius:12px; font-size:19px; font-weight:600; padding:15px;
    font-family:Montserrat,serif; cursor:pointer; text-decoration:none; text-align:center }
  .btn.ghost, button.ghost { background:none; border:1px solid rgba(236,217,160,.7); color:#ecd9a0; font-size:15px }
  #err { color:#e8b0a0; font-size:14px; min-height:18px; margin:12px 0 0 }
  .seal { display:inline-block; margin:26px auto 0; padding:9px 26px; border:1.4px solid rgba(236,217,160,.7);
    border-radius:23px; font-size:11px; letter-spacing:3px; color:#ecd9a0 }
  .done img { width:100%; border:1px solid rgba(236,217,160,.5); margin-top:14px }
  .plink { font-size:13px; word-break:break-all }
  .plink a { color:#ecd9a0 }
  .note { font-size:13px; color:#c9bfa4; line-height:1.5; margin-top:18px }
  .sorry { font-family:'Cormorant Garamond',Georgia,serif; font-size:24px; color:#f4ecd8; margin:18px 0 6px }
  img.flyer { width:100%; border:1px solid rgba(236,217,160,.5); border-radius:6px; margin:14px 0 4px }
`;

// Event header block shared by the request and invite pages.
const EVENT_HEADER = `
  <p class="mono">H&amp;J</p>
  <div class="rule"></div>
  <p class="caps dim">You are specially invited to</p>
  <p class="caps accent">${esc(EVENT.occasion)}</p>
  <h1 class="names">Elder Harrison &amp;<br>Mrs. Justina Ozinegbe</h1>
  <p class="date">${esc(EVENT.dateLine)}</p>
  <p class="venue">${esc(EVENT.venueLine1)}<br>${esc(EVENT.venueLine2)}</p>`;

// Post-confirmation delivery panel — identical on the invite page and for a
// returning confirmed guest on /rsvp. All links arrive via JSON.
const DONE_PANEL = `
  <div id="done" class="done" hidden>
    <h1 class="names" id="dname"></h1>
    <p class="caps dim">Your card and admission pass are ready</p>
    <img id="dcard" alt="I'm Attending card">
    <img id="dpass" alt="Admission pass">
    <a class="btn ghost" id="dlcard" download="im-attending.jpg">Download card</a>
    <a class="btn ghost" id="dlpass" download="admission-pass.jpg">Download pass</a>
    <a class="btn ghost" href="/invite.ics" download>Add to Calendar</a>
    <a class="btn" id="wa" target="_blank" rel="noopener">Save to my WhatsApp</a>
    <p class="plink">Your pass link: <a id="passlink" target="_blank" rel="noopener"></a></p>
    <p class="note">Screenshot or save your admission pass and show it at the entrance —
      it admits one person. Strictly by invitation.</p>
  </div>`;

// Renders the delivery panel from a confirm/lookup response. Shared.
const DONE_JS = `
  function showDone(data) {
    const done = document.getElementById('done');
    if (data.passId) {
      document.getElementById('dname').textContent = "You're confirmed, " + data.name.split(' ')[0];
      document.getElementById('dcard').src = '/media/' + data.passId + '/card.jpg';
      document.getElementById('dpass').src = '/media/' + data.passId + '/pass.jpg';
      document.getElementById('dlcard').href = '/media/' + data.passId + '/card.jpg';
      document.getElementById('dlpass').href = '/media/' + data.passId + '/pass.jpg';
      const wa = document.getElementById('wa');
      wa.href = 'https://wa.me/' + data.phone + '?text=' + encodeURIComponent(
        'My admission pass for the Ozinegbe 70th Birthday Thanksgiving: ' + data.passUrl);
      const pl = document.getElementById('passlink');
      pl.href = data.passUrl; pl.textContent = data.passUrl;
    } else {
      document.getElementById('dname').textContent = 'Thank you';
    }
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth' });
  }
`;

// Photo picker + canvas downscale — shared by the invite form.
const PHOTO_JS = `
  const photoInput = document.getElementById('photo');
  let photoData = null;
  photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) { photoData = null; return; }
    const img = new Image();
    img.onload = () => {
      const max = 1024, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      photoData = c.toDataURL('image/jpeg', 0.85);
      const p = document.getElementById('preview');
      p.src = photoData; p.style.display = 'block';
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { err.textContent = 'Could not read that photo — try another.'; };
    img.src = URL.createObjectURL(file);
  });
`;

// Open Graph tags make WhatsApp/Telegram render the flyer as a rich preview
// when an invite link is shared — wa.me can't attach files, so this is how
// the image reaches the chat. og:image must be an absolute public URL.
const OG_TAGS = `
<meta property="og:type" content="website">
<meta property="og:title" content="Ozinegbe 70th Birthday Thanksgiving Celebration">
<meta property="og:description" content="${esc(EVENT.dateLine)} · Ajah, Lagos — strictly by invitation">
<meta property="og:image" content="${flyerUrl}">
<meta name="twitter:card" content="summary_large_image">`;

const page = (inner) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">${OG_TAGS}
<title>RSVP · Ozinegbe 70</title>
<style>${PAGE_CSS}</style>
</head><body>
<img class="bg" src="/assets/couple-cutout.png" alt="" aria-hidden="true" onerror="this.remove()">
<div class="frame">${inner}<p class="seal">${esc(EVENT.seal)}</p></div>
</body></html>`;

// --- request page (public — the flyer QR lands here) ------------------------

rsvpRoutes.get('/', (req, res) => res.redirect('/rsvp'));

rsvpRoutes.get('/rsvp', (req, res) => {
  res.type('html').send(page(`
  ${EVENT_HEADER}
  <p class="note" style="margin:0 0 6px">This celebration is strictly by invitation.
    If you haven't received a personal invitation link, you can request one below —
    the family will confirm it.</p>

  <form id="f">
    <label for="name">Your full name</label>
    <input id="name" name="name" autocomplete="name" required maxlength="60">
    <label for="phone">WhatsApp number</label>
    <input id="phone" name="phone" inputmode="tel" autocomplete="tel" required
      placeholder="e.g. 0803 123 4567">
    <label for="email">Email <span style="text-transform:none">(optional)</span></label>
    <input id="email" name="email" type="email" autocomplete="email">
    <div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
    <button id="go" type="submit">Request an invitation</button>
    <p id="err"></p>
  </form>

  <div id="requested" hidden>
    <p class="sorry" id="reqtitle">Request received</p>
    <p class="note" id="reqnote">Thank you — the family will review your request.
      If approved, your personal invitation will reach you on WhatsApp or by email.</p>
  </div>

  ${DONE_PANEL}
<script>
  const f = document.getElementById('f');
  const err = document.getElementById('err');
  const go = document.getElementById('go');
  ${DONE_JS}

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    go.disabled = true;
    go.textContent = 'Sending your request…';
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name.value,
          phone: f.phone.value,
          email: f.email.value,
          website: f.website.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong — try again.');
      f.style.display = 'none';
      if (data.already) {
        showDone(data);
      } else {
        if (data.invited) {
          document.getElementById('reqtitle').textContent = "You're already invited";
          document.getElementById('reqnote').textContent =
            'Your personal invitation is on its way — check WhatsApp or your email.';
        }
        document.getElementById('requested').hidden = false;
      }
    } catch (ex) {
      err.textContent = ex.message;
      go.disabled = false;
      go.textContent = 'Request an invitation';
    }
  });
</script>`));
});

// --- invitation page (personal link) -----------------------------------------

rsvpRoutes.get('/invite/:inviteId', (req, res) => {
  res.type('html').send(page(`
  ${EVENT_HEADER}
  <p id="greeting" class="sorry">…</p>
  <img class="flyer" src="/flyer.png" alt="Invitation" onerror="this.remove()">

  <form id="f" hidden>
    <p id="declinednote" class="note" hidden>You previously declined — changed your mind? Confirm below.</p>
    <label for="email">Email <span style="text-transform:none">(optional — we'll send a copy)</span></label>
    <input id="email" name="email" type="email" autocomplete="email">
    <label for="photo">Your photo <span style="text-transform:none">(optional — goes on your card &amp; pass)</span></label>
    <label class="filebtn">Tap to choose a photo<input id="photo" type="file" accept="image/*"></label>
    <img id="preview" alt="">
    <button id="go" type="submit">Confirm my attendance</button>
    <button id="no" type="button" class="ghost">I can't make it</button>
    <p id="err"></p>
  </form>

  <div id="sorry" hidden>
    <p class="sorry">We'll miss you</p>
    <p class="note">Thank you for letting the family know.</p>
    <p class="note"><a id="reconsider" href="#" style="color:#ecd9a0">Changed your mind? Confirm instead</a></p>
  </div>

  ${DONE_PANEL}
<script>
  const inviteId = decodeURIComponent(location.pathname.split('/').pop());
  const f = document.getElementById('f');
  const err = document.getElementById('err');
  const go = document.getElementById('go');
  ${DONE_JS}
  ${PHOTO_JS}

  fetch('/api/invite/' + encodeURIComponent(inviteId))
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(g => {
      const gr = document.getElementById('greeting');
      if (g.state === 'registered' && g.passId) {
        gr.textContent = 'Dear ' + g.name;
        showDone({ name: g.name, phone: g.phone, passId: g.passId, passUrl: g.passUrl });
        return;
      }
      gr.textContent = 'Dear ' + g.name + ',';
      if (g.email) document.getElementById('email').value = g.email;
      if (g.state === 'declined') document.getElementById('declinednote').hidden = false;
      f.hidden = false;
    })
    .catch(() => {
      const gr = document.getElementById('greeting');
      gr.textContent = 'Not recognised';
      err.textContent = "This invitation link isn't on the guest list — please check with the family.";
      err.style.minHeight = '18px';
    });

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    go.disabled = true;
    go.textContent = 'Creating your card and pass…';
    try {
      const res = await fetch('/api/invite/' + encodeURIComponent(inviteId) + '/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, photo: photoData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong — try again.');
      f.style.display = 'none';
      document.getElementById('sorry').hidden = true;
      showDone(data);
    } catch (ex) {
      err.textContent = ex.message;
      go.disabled = false;
      go.textContent = 'Confirm my attendance';
    }
  });

  document.getElementById('no').addEventListener('click', async () => {
    const r = await fetch('/api/invite/' + encodeURIComponent(inviteId) + '/decline', { method: 'POST' });
    if (r.ok) { f.style.display = 'none'; document.getElementById('sorry').hidden = false; }
    else err.textContent = 'Something went wrong — try again.';
  });
  document.getElementById('reconsider').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('sorry').hidden = true;
    f.style.display = '';
    f.hidden = false;
  });
</script>`));
});

// --- the event flyer (public — og:image target and admin download) -------------

let flyerCache = null;
rsvpRoutes.get('/flyer.png', async (req, res) => {
  try {
    if (!flyerCache) {
      flyerCache = await fs.readFile(
        path.join(__dirname, '..', 'design', 'flyer-1080x1350.png')
      );
    }
    res
      .type('png')
      .set('X-Content-Type-Options', 'nosniff')
      .set('Cache-Control', 'public, max-age=86400')
      .send(flyerCache);
  } catch {
    res.sendStatus(404);
  }
});

// --- request submission (no pass — files a host-visible request) --------------

rsvpRoutes.post('/api/rsvp', express.json({ limit: '1mb' }), async (req, res) => {
  const b = req.body || {};
  // Honeypot: bots fill the hidden field — accept silently, store nothing.
  if (b.website) return res.json({ ok: true });

  const name = cleanName(String(b.name || ''));
  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }
  const phone = normalizePhone(b.phone);
  if (!phone) {
    return res.status(400).json({ error: 'Please enter a valid WhatsApp number.' });
  }
  const email = String(b.email || '').trim().toLowerCase();
  if (email && !looksLikeEmail(email)) {
    return res.status(400).json({ error: "That email doesn't look right — check it or leave it blank." });
  }

  if (limited(req.ip)) {
    return res.status(429).json({ error: 'Too many attempts — please try again later.' });
  }

  try {
    let guest = await store.getGuest(phone);
    if (!guest && email) guest = await store.getGuestByEmail(email);

    // Already confirmed → hand back the existing pass (doubles as recovery —
    // same unguessable-id exposure as the old resubmit path).
    if (guest?.state === 'registered' && guest.pass_id) {
      return res.json({ ok: true, already: true, name: guest.name, phone: guest.phone, passId: guest.pass_id, passUrl: passUrl(guest.pass_id) });
    }

    // Already invited → don't leak the invite URL to whoever knows the
    // number; nudge them and re-send the email invite if we have an address.
    if (guest?.state === 'invited') {
      const to = email || guest.email;
      if (to && guest.invite_id) {
        sendInvitation({ to, name: guest.name || name, inviteUrl: inviteUrl(guest.invite_id) })
          .catch(() => {});
      }
      if (email && !guest.email) await store.upsertGuest(guest.phone, { email });
      return res.json({ ok: true, invited: true });
    }

    // New request, or a declined guest asking again → back to the queue.
    await store.upsertGuest(guest?.phone || phone, {
      name,
      email: email || guest?.email || null,
      state: 'requested',
      requested_at: new Date().toISOString(),
      declined_at: null,
    });
    res.json({ ok: true, requested: true });
  } catch (e) {
    console.error('rsvp request failed', e);
    res.status(400).json({ error: 'Could not send your request — please try again.' });
  }
});

// --- invite lookup + confirm/decline -------------------------------------------

const INVITE_ID = /^[A-Za-z0-9_-]{16}$/;

rsvpRoutes.get('/api/invite/:inviteId', async (req, res) => {
  if (!INVITE_ID.test(req.params.inviteId)) return res.sendStatus(404);
  const g = await store.getGuestByInviteId(req.params.inviteId).catch(() => null);
  if (!g) return res.status(404).json({ error: 'invitation not found' });
  res.json({
    name: g.name,
    phone: g.phone,
    email: g.email,
    state: g.state,
    passId: g.state === 'registered' ? g.pass_id : undefined,
    passUrl: g.state === 'registered' && g.pass_id ? passUrl(g.pass_id) : undefined,
  });
});

rsvpRoutes.post(
  '/api/invite/:inviteId/confirm',
  express.json({ limit: '8mb' }),
  async (req, res) => {
    if (!INVITE_ID.test(req.params.inviteId)) return res.sendStatus(404);
    const guest = await store.getGuestByInviteId(req.params.inviteId).catch(() => null);
    if (!guest) return res.status(404).json({ error: 'invitation not found' });

    const b = req.body || {};
    const email = String(b.email || '').trim().toLowerCase();
    if (email && !looksLikeEmail(email)) {
      return res.status(400).json({ error: "That email doesn't look right — check it or leave it blank." });
    }

    let photoBuffer = null;
    if (b.photo) {
      const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(String(b.photo));
      if (!m || m[1].length > 8_000_000) {
        return res.status(400).json({ error: 'That photo could not be used — try a different one.' });
      }
      photoBuffer = Buffer.from(m[1], 'base64');
    }

    // Limit checked after validation: what it protects is the card render.
    if (limited(req.ip)) {
      return res.status(429).json({ error: 'Too many attempts — please try again later.' });
    }

    try {
      const { passId, cardJpeg, passJpeg } = await buildGuestPack({
        name: guest.name,
        photoBuffer,
        existingPassId: guest.pass_id,
      });

      const saved = await store.upsertGuest(guest.phone, {
        state: 'registered',
        email: email || guest.email || null,
        pass_id: passId,
        card_img: cardJpeg.toString('base64'),
        pass_img: passJpeg.toString('base64'),
        declined_at: null,
      });

      // Email is a bonus channel — a Resend failure must never surface here.
      const to = saved.email;
      if (to) {
        sendGuestPack({ to, name: guest.name, cardJpeg, passJpeg, passUrl: passUrl(passId) })
          .catch((e) => console.error(`email to ${to} failed`, e));
      }

      res.json({ ok: true, name: guest.name, phone: guest.phone, passId, passUrl: passUrl(passId) });
    } catch (e) {
      console.error('invite confirm failed', e);
      res.status(400).json({ error: 'Could not finish your pass — please try again.' });
    }
  }
);

rsvpRoutes.post('/api/invite/:inviteId/decline', async (req, res) => {
  if (!INVITE_ID.test(req.params.inviteId)) return res.sendStatus(404);
  const guest = await store.getGuestByInviteId(req.params.inviteId).catch(() => null);
  if (!guest) return res.status(404).json({ error: 'invitation not found' });
  if (guest.state === 'registered') {
    return res.status(400).json({ error: 'already confirmed' });
  }
  await store.upsertGuest(guest.phone, {
    state: 'declined',
    declined_at: new Date().toISOString(),
  });
  res.json({ ok: true });
});

// --- rendered media (public, unguessable pass_id URLs) ------------------------

rsvpRoutes.get('/media/:passId/:file', async (req, res) => {
  // pass ids are always 12-char base64url — anything else can't be a real
  // pass, so reject before the store lookup.
  if (!/^[A-Za-z0-9_-]{12}$/.test(req.params.passId)) return res.sendStatus(404);
  const g = await store.getGuestByPassId(req.params.passId).catch(() => null);
  const b64 =
    req.params.file === 'card.jpg' ? g?.card_img :
    req.params.file === 'pass.jpg' ? g?.pass_img : null;
  if (!b64) return res.sendStatus(404);
  // Content was generated by sharp and stored by us — verify the JPEG magic
  // anyway so a tampered column can never become an HTML/script response.
  const img = Buffer.from(b64, 'base64');
  if (img.length < 4 || img[0] !== 0xff || img[1] !== 0xd8) return res.sendStatus(404);
  res
    .type('jpeg')
    .set('X-Content-Type-Options', 'nosniff')
    .set('Cache-Control', 'private, max-age=86400')
    .send(img);
});

// --- calendar file (same event for everyone) ----------------------------------

rsvpRoutes.get('/invite.ics', (req, res) => {
  res
    .type('text/calendar')
    .set('Content-Disposition', 'attachment; filename="ozinegbe-70th-thanksgiving.ics"')
    .send(buildIcs());
});
