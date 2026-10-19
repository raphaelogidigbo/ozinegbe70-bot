import { config } from './config.js';

const base = () => `https://graph.facebook.com/${config.graphVersion}`;

async function api(path, options = {}) {
  const res = await fetch(`${base()}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.waToken}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`WhatsApp API ${res.status}: ${JSON.stringify(body)}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

function messagePayload(to, type, payload) {
  return api(`${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      [type]: payload,
    }),
  });
}

export const wa = {
  sendText: (to, body) =>
    messagePayload(to, 'text', { preview_url: true, body }),

  sendImage: (to, mediaId, caption) =>
    messagePayload(to, 'image', { id: mediaId, caption }),

  sendDocument: (to, mediaId, filename, caption) =>
    messagePayload(to, 'document', { id: mediaId, filename, caption }),

  markRead: (messageId) =>
    api(`${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    }).catch(() => {}),

  // Media returned by Meta expires after 5 minutes — download immediately.
  async downloadMedia(mediaId) {
    const { url } = await api(mediaId);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.waToken}` },
    });
    if (!res.ok) throw new Error(`media download ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  },

  // Upload a finished asset (PNG card, .ics) so it can be sent by media_id.
  async uploadMedia(buffer, mimeType, filename) {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([buffer], { type: mimeType }), filename);
    const { id } = await api(`${config.phoneNumberId}/media`, {
      method: 'POST',
      body: form,
    });
    return id;
  },
};
