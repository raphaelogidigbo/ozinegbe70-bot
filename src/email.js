import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

// Resend REST API via raw fetch — same style as whatsapp.js, no dependency.
// The caller treats this as fire-and-forget: email must never block or break
// WhatsApp delivery. Unconfigured RESEND_API_KEY = the step is skipped.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FLYER_PATH = path.join(__dirname, '..', 'design', 'flyer-1080x1350.png');

let warned = false;
let flyerCache;
async function flyerAttachment() {
  try {
    if (!flyerCache) flyerCache = await fs.readFile(FLYER_PATH);
    return { filename: 'ozinegbe-70-invitation.png', content: flyerCache.toString('base64') };
  } catch {
    return null; // assets not rendered yet — send without the image
  }
}

export async function sendGuestPack({ to, name, cardJpeg, passJpeg, passUrl }) {
  if (!config.resendKey || config.resendKey.startsWith('TODO') || !config.emailFrom) {
    if (!warned) {
      console.warn('[email] RESEND_API_KEY/EMAIL_FROM not configured — skipping guest emails');
      warned = true;
    }
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to,
      subject: `You're confirmed — Ozinegbe 70th Birthday Thanksgiving Celebration`,
      html: [
        `<p>Dear ${escapeHtml(name)},</p>`,
        '<p>Your attendance is confirmed. Attached are your "I\'m Attending" card and your <b>Admission Pass</b> — please show the pass at the entrance.</p>',
        `<p>You can also open your pass directly in a browser:<br><a href="${escapeHtml(passUrl)}">${escapeHtml(passUrl)}</a></p>`,
        '<p><b>Saturday, 10th October 2026 · 11:00 AM</b><br>',
        'Plot 15 Chief Saula Ndakolo Road, Ilaje Bus Stop, off Mobil Road, Alaguntan, Ajah, Lagos</p>',
        '<p><i>Strictly by invitation. The pass admits one person.</i></p>',
      ].join('\n'),
      attachments: [
        { filename: 'im-attending.jpg', content: cardJpeg.toString('base64') },
        { filename: 'admission-pass.jpg', content: passJpeg.toString('base64') },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return true;
}

// Pre-confirm invitation: the personal link is the whole payload — card and
// pass only exist after the invitee confirms. The event flyer rides along as
// an attachment and an inline hosted image.
export async function sendInvitation({ to, name, inviteUrl }) {
  if (!config.resendKey || config.resendKey.startsWith('TODO') || !config.emailFrom) {
    if (!warned) {
      console.warn('[email] RESEND_API_KEY/EMAIL_FROM not configured — skipping guest emails');
      warned = true;
    }
    return false;
  }

  const flyer = await flyerAttachment();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to,
      subject: `You're invited — Ozinegbe 70th Birthday Thanksgiving Celebration`,
      html: [
        `<p>Dear ${escapeHtml(name)},</p>`,
        '<p>The Ozinegbe family warmly invites you to a private Family Thanksgiving in celebration of the joint 70th Birthday of Elder Harrison &amp; Mrs. Justina Ozinegbe.</p>',
        `<p><img src="${escapeHtml(config.publicBaseUrl)}/flyer.png" width="480" style="max-width:100%" alt="Invitation"></p>`,
        `<p>Please confirm your attendance — your personal invitation link:<br><a href="${escapeHtml(inviteUrl)}">${escapeHtml(inviteUrl)}</a></p>`,
        '<p>Your "I\'m Attending" card and admission pass are issued when you confirm.</p>',
        '<p><b>Saturday, 10th October 2026 · 11:00 AM</b><br>',
        'Plot 15 Chief Saula Ndakolo Road, Ilaje Bus Stop, off Mobil Road, Alaguntan, Ajah, Lagos</p>',
        '<p><i>Strictly by invitation — this link is personal to you.</i></p>',
      ].join('\n'),
      attachments: flyer ? [flyer] : [],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body}`);
  }
  return true;
}

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
