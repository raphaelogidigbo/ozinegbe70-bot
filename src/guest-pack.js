import crypto from 'node:crypto';
import { config } from './config.js';
import { makeAttendingCard, makeAdmissionPass } from './card.js';
import { buildIcs } from './ics.js';

// Shared between the WhatsApp bot (bot.js) and the web RSVP (rsvp.js):
// name/email hygiene, pass ids, and the card+pass+calendar render. Anything
// that talks to Meta stays in whatsapp.js/bot.js.

export const cleanName = (s) => s.trim().replace(/\s+/g, ' ').slice(0, 60);
export const firstName = (s) => s.split(' ')[0];
export const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export const newPassId = () => crypto.randomBytes(9).toString('base64url');
export const passUrl = (id) => `${config.publicBaseUrl}/checkin/${id}`;

// Invite tokens are 16 chars — deliberately longer than the 12-char pass id
// so the /media route regex can never mistake one for a pass.
export const newInviteId = () => crypto.randomBytes(12).toString('base64url');
export const inviteUrl = (id) => `${config.publicBaseUrl}/invite/${id}`;
// The event flyer, served publicly — og:image on the invite pages makes it the
// WhatsApp link preview, and emails embed/attach the same file.
export const flyerUrl = `${config.publicBaseUrl}/flyer.png`;

// Nigerian local numbers (0803…) arrive as 11 digits starting 0 → 234…
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = `234${d.slice(1)}`;
  return d.length >= 10 ? d : null;
}

// Reuse the pass id on regeneration — a guest may hold a printed/emailed
// pass, and a new id would silently orphan it at the door.
export async function buildGuestPack({ name, photoBuffer, existingPassId }) {
  const passId = existingPassId || newPassId();
  const cardJpeg = await makeAttendingCard({ name, photoBuffer });
  const passJpeg = await makeAdmissionPass({ name, photoBuffer, passId });
  return { passId, cardJpeg, passJpeg, icsBuffer: Buffer.from(buildIcs()) };
}
