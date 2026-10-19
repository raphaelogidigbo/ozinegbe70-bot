import { store } from './store.js';
import { wa } from './whatsapp.js';
import { sendGuestPack } from './email.js';
import {
  cleanName,
  firstName,
  looksLikeEmail,
  passUrl,
  inviteUrl,
  buildGuestPack,
} from './guest-pack.js';

const S = {
  AWAITING_NAME: 'awaiting_name',
  AWAITING_EMAIL: 'awaiting_email',
  AWAITING_PHOTO: 'awaiting_photo',
  REGISTERED: 'registered',
};

const WELCOME = [
  'Welcome to the Ozinegbe 70th Birthday Thanksgiving Celebration invitation.',
  '',
  'A private Family Thanksgiving in celebration of the joint 70th Birthday of',
  'Elder Harrison & Mrs. Justina Ozinegbe',
  'Saturday, 10th October 2026 · 11:00 AM · Ajah, Lagos',
  '',
  'Reply with your full name to confirm your attendance.',
].join('\n');

const ASK_EMAIL = (name) =>
  `Thank you, ${firstName(name)}. Reply with your email address and we'll also send your card and admission pass by email.\n\nReply SKIP to continue with WhatsApp only.`;

const ASK_PHOTO = (name) =>
  `Almost done, ${firstName(name)}. Now send a photo of yourself — it will appear on your "I'm Attending" card and your admission pass.\n\nReply SKIP if you'd rather not send a photo.`;

const HELP =
  'Send CARD to see your "I\'m Attending" card again, or PASS for your admission pass.';

async function sendConfirmation(to, name, guest, icsBuffer) {
  await wa.sendImage(
    to,
    guest.card_media_id,
    `You're confirmed, ${firstName(name)} — this is your "I'm Attending" card.`
  );

  await wa.sendImage(
    to,
    guest.pass_media_id,
    'And this is your admission pass. Show it at the entrance — it admits one person.'
  );

  // Calendar attachment
  const icsId = await wa.uploadMedia(
    icsBuffer,
    'text/calendar',
    'ozinegbe-70th-thanksgiving.ics'
  );
  await wa.sendDocument(
    to,
    icsId,
    'ozinegbe-70th-thanksgiving.ics',
    'Tap to add the celebration to your calendar.'
  );

  await wa.sendText(
    to,
    `Attendance is strictly by invitation — the pass admits one person.\n\nSend PASS anytime to see it again.`
  );
}

async function generateAndSend(to, name, photoBuffer, email, existingPassId) {
  const { passId, cardJpeg, passJpeg, icsBuffer } = await buildGuestPack({
    name,
    photoBuffer,
    existingPassId,
  });
  const cardMediaId = await wa.uploadMedia(cardJpeg, 'image/jpeg', 'im-attending.jpg');
  const passMediaId = await wa.uploadMedia(passJpeg, 'image/jpeg', 'admission-pass.jpg');
  const guest = await store.upsertGuest(to, {
    state: S.REGISTERED,
    email: email || null,
    pass_id: passId,
    card_media_id: cardMediaId,
    pass_media_id: passMediaId,
  });
  await sendConfirmation(to, name, guest, icsBuffer);

  // Email is a bonus channel — a Resend failure must never surface to the guest.
  if (email) {
    sendGuestPack({
      to: email,
      name,
      cardJpeg,
      passJpeg,
      passUrl: passUrl(passId),
    }).catch((e) => console.error(`email to ${email} failed`, e));
  }
}

export async function handleMessage(msg) {
  const from = msg.from;
  const type = msg.type;
  const text = type === 'text' ? msg.text.body.trim() : '';
  const upper = text.toUpperCase();

  await wa.markRead(msg.id);

  let guest = await store.getGuest(from);
  const state = guest?.state || null;

  // --- new guest ----------------------------------------------------------
  if (!state) {
    await store.upsertGuest(from, { state: S.AWAITING_NAME });
    await wa.sendText(from, WELCOME);
    return;
  }

  // --- web-flow states -------------------------------------------------------
  // Guests managed through /admin land in states this machine doesn't drive.
  // Answer with their personal link (or request status) rather than silence.
  if (state === 'invited' || state === 'requested' || state === 'declined') {
    const link = guest.invite_id ? `\n\nYour personal invitation: ${inviteUrl(guest.invite_id)}` : '';
    const msg =
      state === 'invited'
        ? `You're on the guest list — confirm using your personal invitation.${link}`
        : state === 'requested'
          ? 'Your request to attend is with the family — your invitation link will arrive here once approved.'
          : `You've declined this invitation — changed your mind?${link}`;
    await wa.sendText(from, msg);
    return;
  }

  // --- awaiting name -------------------------------------------------------
  if (state === S.AWAITING_NAME) {
    if (type === 'text' && text.length >= 2 && upper !== 'CARD' && upper !== 'PASS') {
      const name = cleanName(text);
      await store.upsertGuest(from, { name, state: S.AWAITING_EMAIL });
      await wa.sendText(from, ASK_EMAIL(name));
    } else {
      await wa.sendText(from, 'Please reply with your full name to continue.');
    }
    return;
  }

  // --- awaiting email ------------------------------------------------------
  // Asked before the photo so the photo buffer never has to be stored —
  // once the photo arrives, card and pass generate in one shot.
  if (state === S.AWAITING_EMAIL) {
    let email = null;
    if (type === 'text' && looksLikeEmail(text)) {
      email = text.toLowerCase();
    } else if (type === 'text' && (upper === 'SKIP' || upper === 'NO')) {
      email = null;
    } else {
      await wa.sendText(
        from,
        "That doesn't look like an email address — try again, or reply SKIP to continue with WhatsApp only."
      );
      return;
    }
    await store.upsertGuest(from, { email, state: S.AWAITING_PHOTO });
    await wa.sendText(from, ASK_PHOTO(guest.name));
    return;
  }

  // --- awaiting photo ------------------------------------------------------
  if (state === S.AWAITING_PHOTO) {
    if (type === 'image' && msg.image?.id) {
      try {
        const photo = await wa.downloadMedia(msg.image.id);
        await wa.sendText(from, 'Creating your card and admission pass…');
        await generateAndSend(from, guest.name, photo, guest.email, guest.pass_id);
      } catch (e) {
        console.error('card generation failed', e);
        await wa.sendText(
          from,
          "I couldn't read that photo. Please send a JPG or PNG — or reply SKIP to continue without one."
        );
      }
    } else if (upper === 'SKIP' || upper === 'NO') {
      await generateAndSend(from, guest.name, null, guest.email, guest.pass_id);
    } else {
      await wa.sendText(
        from,
        'Send a photo for your card and pass, or reply SKIP to continue without one.'
      );
    }
    return;
  }

  // --- registered -----------------------------------------------------------
  if (state === S.REGISTERED) {
    if (type === 'image' && msg.image?.id) {
      // Photo update regenerates both — the pass embeds the photo too.
      try {
        const photo = await wa.downloadMedia(msg.image.id);
        await generateAndSend(from, guest.name, photo, guest.email, guest.pass_id);
      } catch {
        await wa.sendText(from, "I couldn't use that photo — your current card and pass are unchanged.");
      }
    } else if (upper === 'CARD') {
      if (guest.card_media_id) {
        await wa.sendImage(from, guest.card_media_id, 'Here is your card again.');
      } else {
        await generateAndSend(from, guest.name, null, guest.email, guest.pass_id);
      }
    } else if (upper === 'PASS') {
      if (guest.pass_media_id) {
        await wa.sendImage(from, guest.pass_media_id, 'Here is your admission pass again.');
      } else {
        await generateAndSend(from, guest.name, null, guest.email, guest.pass_id);
      }
    } else {
      await wa.sendText(from, HELP);
    }
  }
}

// Walk a webhook payload — entries → changes → messages. Status callbacks
// (delivered/read receipts) carry no `messages` array and are ignored.
export async function handleMessages(body) {
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value;
      for (const msg of value?.messages || []) {
        if (await store.seenMessage(msg.id)) continue;
        try {
          await handleMessage(msg);
        } catch (e) {
          console.error(`message ${msg.id} failed`, e);
        }
      }
    }
  }
}
