// Simulates the full guest journey without Meta credentials.
// Stubs global fetch so src/whatsapp.js records instead of sending.
//
//   node scripts/simulate-flow.js
//
// Writes design/sample-card.jpg so you can eyeball the generated card.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const sent = [];
const selfie = await fs.readFile(path.join(ROOT, 'assets', 'couple.jpg'));

globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  sent.push({ url, method: opts.method || 'GET' });

  if (url.endsWith('/media')) {
    // upload → return a fake media id
    return jsonRes({ id: 'media-123' });
  }
  if (url.endsWith('/messages')) {
    return jsonRes({ messages: [{ id: `wamid.${sent.length}` }] });
  }
  if (url.includes('lookaside.fbsbx.com')) {
    // media download → hand back a real image
    return new Response(selfie, { status: 200 });
  }
  // media id lookup → download URL
  return jsonRes({ url: 'https://lookaside.fbsbx.com/fake' });
};

const jsonRes = (body) => new Response(JSON.stringify(body), { status: 200 });

const { handleMessages } = await import('../src/bot.js');
const { makeAttendingCard, makeAdmissionPass } = await import('../src/card.js');

const msg = (id, type, extra, from = '2348011111111') => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      changes: [
        {
          value: {
            messages: [
              { id: `wam${id}`, from, timestamp: '1700000000', type, ...extra },
            ],
          },
        },
      ],
    },
  ],
});

const run = async (label, payload) => {
  sent.length = 0;
  await handleMessages(payload);
  const kinds = sent.map((s) => s.url.split('/').pop() + ':' + s.method).join('  ');
  console.log(`${label.padEnd(22)} → ${kinds || '(nothing sent)'}`);
};

console.log('--- journey ---');
await run('1. hi', msg(1, 'text', { text: { body: 'Hi' } }));
await run('2. name', msg(2, 'text', { text: { body: 'Adaeze Okonkwo-Bello' } }));
await run('3. email', msg(3, 'text', { text: { body: 'adaeze@example.com' } }));
await run('4. photo', msg(4, 'image', { image: { id: 'm123', mime_type: 'image/jpeg' } }));
await run('5. card again', msg(5, 'text', { text: { body: 'CARD' } }));
await run('6. pass again', msg(6, 'text', { text: { body: 'PASS' } }));
await run('7. retry dup', msg(4, 'image', { image: { id: 'm123', mime_type: 'image/jpeg' } }));

console.log('\n--- edge cases ---');
await run('8. guest2 hi',
  msg(7, 'text', { text: { body: 'Hello' } }, '2348022222222'));
await run('9. guest2 long name',
  msg(8, 'text', { text: { body: 'Chief Barr. Oluwagbemiro Adebambo-Chukwuemeka' } }, '2348022222222'));
await run('10. guest2 bad email',
  msg(9, 'text', { text: { body: 'not-an-email' } }, '2348022222222'));
await run('11. guest2 skip email',
  msg(10, 'text', { text: { body: 'SKIP' } }, '2348022222222'));
await run('12. guest2 skip photo',
  msg(11, 'text', { text: { body: 'SKIP' } }, '2348022222222'));

// Save real generated assets for visual inspection
const card = await makeAttendingCard({
  name: 'Adaeze Okonkwo-Bello',
  photoBuffer: selfie,
});
await fs.writeFile(path.join(ROOT, 'design', 'sample-card.jpg'), card);
const cardNoPhoto = await makeAttendingCard({ name: 'Emeka Nwosu', photoBuffer: null });
await fs.writeFile(path.join(ROOT, 'design', 'sample-card-nophoto.jpg'), cardNoPhoto);
const pass = await makeAdmissionPass({
  name: 'Adaeze Okonkwo-Bello',
  photoBuffer: selfie,
  passId: 'x7Kp2Qw9AbC4',
});
await fs.writeFile(path.join(ROOT, 'design', 'sample-pass.jpg'), pass);
const passNoPhoto = await makeAdmissionPass({
  name: 'Emeka Nwosu',
  photoBuffer: null,
  passId: 'mQ3vR8tZxK2n',
});
await fs.writeFile(path.join(ROOT, 'design', 'sample-pass-nophoto.jpg'), passNoPhoto);
console.log('\nwrote design/sample-card*.jpg and sample-pass*.jpg');
