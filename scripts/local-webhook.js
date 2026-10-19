// Preflight check against a locally running server (npm run dev first).
//
//   node scripts/local-webhook.js ["message text"] [--from 23480...]
//
// Step 1 replays the exact GET handshake Meta performs when you save the
// callback URL, using WHATSAPP_VERIFY_TOKEN from .env.
// Step 2 POSTs a fake inbound message with a correctly computed
// X-Hub-Signature-256, using META_APP_SECRET.
//
// What this proves: the server boots, .env is wired, the verify token
// matches, and signature verification accepts a correctly signed body.
// What it does not prove: message delivery. Past the signature check the
// bot calls the real Graph API — with placeholder credentials you will see
// "WhatsApp API 401" in the server log, which is a PASS for everything up
// to the Graph boundary.

import crypto from 'node:crypto';
import 'dotenv/config';

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

// --from flag, then the first non-flag arg is the message text.
const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const from = fromIdx >= 0 ? args[fromIdx + 1] : '2348000000000';
const text = args.filter((a, i) => i !== fromIdx && i !== fromIdx + 1 && !a.startsWith('--'))[0] || 'Hi';

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`PASS  ${msg}`);
}

// --- Step 1: GET handshake -------------------------------------------------

async function checkHandshake() {
  const challenge = `local-${Date.now()}`;
  const url =
    `${BASE}/webhook?hub.mode=subscribe` +
    `&hub.verify_token=${encodeURIComponent(process.env.WHATSAPP_VERIFY_TOKEN || '')}` +
    `&hub.challenge=${challenge}`;
  const res = await fetch(url);
  const body = await res.text();
  if (res.status === 200 && body === challenge) {
    pass(`GET /webhook handshake echoed challenge`);
  } else {
    fail(`GET /webhook returned ${res.status} "${body}" — is the server running, and does WHATSAPP_VERIFY_TOKEN match?`);
  }
}

// --- Step 2: signed POST ---------------------------------------------------

async function checkSignedPost() {
  // The signature is computed over the exact bytes sent — build the string
  // once and reuse it for both the HMAC and the request body.
  const body = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  id: `wamid.local-${Date.now()}`,
                  from,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  });

  const secret = process.env.META_APP_SECRET || '';
  if (!secret || secret.startsWith('TODO')) {
    console.log('SKIP  signed POST — META_APP_SECRET is unset or a placeholder (POST would 401 by design)');
    return;
  }

  const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

  const res = await fetch(`${BASE}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig },
    body,
  });

  if (res.status === 200) {
    pass(`POST /webhook accepted signed payload (${res.status})`);
    console.log('      Watch the server log: expect "WhatsApp API 401" while credentials are placeholders — that is normal.');
  } else {
    fail(`POST /webhook returned ${res.status} — expected 200`);
  }
}

try {
  await checkHandshake();
  await checkSignedPost();
} catch (e) {
  fail(`could not reach ${BASE} — is 'npm run dev' running? (${e.message})`);
}
