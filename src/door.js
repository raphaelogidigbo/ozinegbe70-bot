import { Router } from 'express';
import { config } from './config.js';
import { store } from './store.js';

// Door check-in. Guests hold passes whose QR encodes /checkin/{pass_id} —
// that page is public and READ-ONLY so a guest opening their own link can't
// burn the pass. Only POST /api/door/checkin and GET /api/door/guests require
// the staff PIN (DOOR_KEY), sent as the X-Door-Key header and entered once
// per device.
//
// All HTML is static: guest data travels as JSON and is rendered via
// textContent, so no request-derived value ever reaches a markup sink.

export const doorRoutes = Router();

function requireDoorKey(req, res, next) {
  const configured = config.doorKey && !config.doorKey.startsWith('TODO');
  if (!configured) return res.status(503).json({ error: 'door key not configured' });
  if (req.get('x-door-key') !== config.doorKey) return res.sendStatus(403);
  next();
}

const PAGE_CSS = `
  body { background:#17130e; color:#f4ecd8; font-family:Georgia,serif; margin:0;
         min-height:100vh; display:flex; flex-direction:column; align-items:center; padding:24px; box-sizing:border-box }
  .card { width:100%; max-width:480px; text-align:center }
  h1 { font-size:34px; font-weight:600; margin:16px 0 4px }
  .sub { color:#c9bfa4; font-size:15px; letter-spacing:2px; text-transform:uppercase }
  .code { color:#ecd9a0; font-family:monospace; font-size:20px; letter-spacing:3px; margin:10px 0 }
  .status { font-size:16px; margin:14px 0; padding:10px; border-radius:10px }
  .open { color:#a8d8a8; border:1px solid #3d5c3d }
  .used { color:#e8b0a0; border:1px solid #6b3d33 }
  button { background:linear-gradient(#ecd9a0,#9a7a24); color:#17130e; border:none; border-radius:12px;
           font-size:22px; font-weight:700; padding:16px; width:100%; cursor:pointer; margin-top:12px }
  input { background:#221c14; color:#f4ecd8; border:1px solid #c6a23b; border-radius:10px;
          font-size:18px; padding:12px; width:100%; box-sizing:border-box; margin-top:12px }
  .row { display:flex; justify-content:space-between; align-items:center; gap:10px;
         border-bottom:1px solid #3a3226; padding:10px 4px; text-align:left }
  .row small { color:#c9bfa4 }
  .mini { font-size:14px; padding:8px 14px; width:auto; margin:0 }
`;

// Shared JS: the staff PIN lives in localStorage after first entry.
const KEY_JS = `
  function doorKey() {
    let k = localStorage.getItem('doorKey');
    if (!k) { k = prompt('Staff PIN'); if (k) localStorage.setItem('doorKey', k); }
    return k || '';
  }
`;

// --- pages (static — no server-side data interpolation) ----------------------

doorRoutes.get('/checkin/:passId', (req, res) => {
  res.type('html').send(page('Admission pass', `
      <p class="sub">Ozinegbe 70 · Admission Pass</p>
      <h1 id="name">…</h1>
      <p class="code" id="code"></p>
      <p class="status" id="status"></p>
      <button id="btn" onclick="checkIn()">Check in</button>
      <script>${KEY_JS}
        const passId = decodeURIComponent(location.pathname.split('/').pop());
        fetch('/api/checkin/' + encodeURIComponent(passId))
          .then(r => r.ok ? r.json() : Promise.reject(r.status))
          .then(g => {
            document.getElementById('name').textContent = g.name;
            document.getElementById('code').textContent = g.code;
            const s = document.getElementById('status');
            if (g.checked_in_at) {
              s.textContent = 'ALREADY CHECKED IN — ' + new Date(g.checked_in_at).toLocaleString('en-GB');
              s.className = 'status used';
            } else {
              s.textContent = 'Valid — not yet checked in';
              s.className = 'status open';
            }
          })
          .catch(() => {
            document.getElementById('name').textContent = 'Not recognised';
            const s = document.getElementById('status');
            s.textContent = 'This pass is not on the guest list.';
            s.className = 'status used';
            document.getElementById('btn').style.display = 'none';
          });
        async function checkIn() {
          const btn = document.getElementById('btn');
          btn.disabled = true;
          const r = await fetch('/api/door/checkin/' + encodeURIComponent(passId), {
            method: 'POST', headers: { 'X-Door-Key': doorKey() }
          });
          if (r.status === 403) { localStorage.removeItem('doorKey'); btn.disabled = false; return checkIn(); }
          location.reload();
        }
      </script>`));
});

doorRoutes.get('/door', (req, res) => {
  res.type('html').send(page('Door', `
      <p class="sub">Ozinegbe 70 · Door</p>
      <input id="q" placeholder="Search name…" oninput="render()" autofocus>
      <div id="list" style="width:100%"></div>
      <script>${KEY_JS}
        let guests = [];
        async function load() {
          const r = await fetch('/api/door/guests', { headers: { 'X-Door-Key': doorKey() } });
          if (r.status === 403) { localStorage.removeItem('doorKey'); return load(); }
          guests = await r.json(); render();
        }
        async function checkIn(passId, btn) {
          btn.disabled = true;
          const r = await fetch('/api/door/checkin/' + encodeURIComponent(passId), {
            method: 'POST', headers: { 'X-Door-Key': doorKey() }
          });
          if (r.status === 403) { localStorage.removeItem('doorKey'); btn.disabled = false; return; }
          load();
        }
        function render() {
          const q = document.getElementById('q').value.toLowerCase();
          const list = document.getElementById('list');
          list.textContent = '';
          const rows = guests.filter(g => (g.name || '').toLowerCase().includes(q));
          if (!rows.length) {
            const p = document.createElement('p');
            p.className = 'sub'; p.textContent = 'no matches';
            list.appendChild(p); return;
          }
          for (const g of rows) {
            const row = document.createElement('div'); row.className = 'row';
            const info = document.createElement('div');
            const nm = document.createElement('span'); nm.textContent = g.name;
            const br = document.createElement('br');
            const st = document.createElement('small');
            st.textContent = g.checked_in_at
              ? 'checked in ' + new Date(g.checked_in_at).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'})
              : 'not yet in';
            info.append(nm, br, st);
            const btn = document.createElement('button');
            btn.className = 'mini';
            btn.textContent = g.checked_in_at ? 'In' : 'Check in';
            btn.disabled = !!g.checked_in_at;
            btn.onclick = () => checkIn(g.pass_id, btn);
            row.append(info, btn);
            list.appendChild(row);
          }
        }
        load();
      </script>`));
});

// --- guest pass data (public, read-only) -------------------------------------

doorRoutes.get('/api/checkin/:passId', async (req, res) => {
  const guest = await store.getGuestByPassId(req.params.passId).catch(() => null);
  if (!guest) return res.status(404).json({ error: 'pass not found' });
  res.json({
    name: guest.name,
    code: String(guest.pass_id).replace(/(.{3})(?=.)/g, '$1-'),
    checked_in_at: guest.checked_in_at,
  });
});

// --- staff endpoints ----------------------------------------------------------

doorRoutes.get('/api/door/guests', requireDoorKey, async (req, res) => {
  const guests = await store.listGuests();
  res.json(
    guests
      .filter((g) => g.state === 'registered' && g.pass_id)
      .map((g) => ({
        name: g.name,
        pass_id: g.pass_id,
        checked_in_at: g.checked_in_at,
      }))
  );
});

doorRoutes.post('/api/door/checkin/:passId', requireDoorKey, async (req, res) => {
  // Record who checked the guest in — a staff label if the device sends one,
  // never the PIN itself.
  const { guest, already } = await store.checkIn(
    req.params.passId,
    req.get('x-door-name') || 'door'
  );
  if (!guest) return res.status(404).json({ error: 'pass not found' });
  res.json({ name: guest.name, checked_in_at: guest.checked_in_at, already });
});

const page = (title, inner) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · Ozinegbe 70</title>
<style>${PAGE_CSS}</style>
</head><body><div class="card">${inner}</div></body></html>`;
