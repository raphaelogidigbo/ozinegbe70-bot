import express from 'express';
import { config, assertConfig } from './config.js';
import { verifySignature } from './verify.js';
import { handleMessages } from './bot.js';
import { doorRoutes } from './door.js';
import { rsvpRoutes } from './rsvp.js';
import { adminRoutes } from './admin.js';

const app = express();
app.disable('x-powered-by');
// Render sits behind one proxy hop — trust it so req.ip is the guest's, not
// the load balancer's (the RSVP rate limit keys on it).
app.set('trust proxy', 1);

// Web RSVP mounts before the global JSON parser: POST /api/rsvp carries
// base64 photos that would exceed the parser's default 100kb limit — the
// route installs its own 8mb parser. Its other routes are GETs.
app.use(rsvpRoutes);
app.use(adminRoutes);

// Capture the raw body for X-Hub-Signature-256 verification.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Free cron pings this to keep the Render service warm.
app.get('/health', (req, res) => res.json({ ok: true }));

// Door check-in: public pass view + PIN-gated staff endpoints.
app.use(doorRoutes);

// Meta webhook verification handshake.
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } =
    req.query;
  if (mode === 'subscribe' && token === config.verifyToken) {
    // Meta's challenge is a numeric token — sanitize anyway and serve as
    // plain text so nothing in it can be interpreted as markup.
    const safe = String(challenge || '').replace(/[^a-zA-Z0-9_-]/g, '');
    return res.status(200).type('text/plain').send(safe);
  }
  res.sendStatus(403);
});

// Inbound messages. Ack 200 immediately — Meta retries on timeout, and slow
// card generation must never block the ack.
app.post('/webhook', verifySignature(config.appSecret), (req, res) => {
  res.sendStatus(200);
  setImmediate(() => {
    handleMessages(req.body).catch((e) => console.error('webhook processing', e));
  });
});

app.listen(config.port, () => {
  assertConfig();
  console.log(`Ozinegbe70 bot listening on :${config.port}`);
});
