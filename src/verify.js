import crypto from 'node:crypto';

// Meta signs every webhook POST with X-Hub-Signature-256 (HMAC-SHA256 of the
// raw body using the app secret). Verify before trusting the payload.
export function verifySignature(appSecret) {
  return (req, res, next) => {
    const sig = req.get('x-hub-signature-256') || '';
    if (!appSecret || !sig.startsWith('sha256=')) return res.sendStatus(401);

    const expected =
      'sha256=' + crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.sendStatus(401);
    }
    next();
  };
}
