import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  graphVersion: process.env.GRAPH_VERSION || 'v21.0',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  appSecret: process.env.META_APP_SECRET || '',
  waToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  botNumber: process.env.BOT_NUMBER || '', // e.g. 2348012345678 — used in bot copy
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  // Public URL of this server — baked into every pass QR code and email link,
  // so it must be settled before any pass goes out. Defaults to localhost for
  // dev; set it explicitly in production.
  publicBaseUrl: (
    process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
  ).replace(/\/+$/, ''),
  // Shared staff PIN for the door check-in endpoints.
  doorKey: process.env.DOOR_KEY || '',
  // Host PIN for the admin console (invite list, request approvals).
  adminKey: process.env.ADMIN_KEY || '',
  resendKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  event: {
    summary: 'Ozinegbe 70th Birthday Thanksgiving Celebration',
    description:
      'Private Family Thanksgiving in celebration of the joint 70th Birthday of Elder Harrison & Mrs. Justina Ozinegbe. Strictly by invitation.',
    location:
      'Plot 15 Chief Saula Ndakolo Road, Ilaje Bus Stop, off Mobil Road, Alaguntan, beside Skills Acquisition, Ajah, Lagos',
    // Africa/Lagos is UTC+1 — 11:00 local = 10:00 UTC
    startUtc: '20261010T100000Z',
    endUtc: '20261010T140000Z',
  },
};

export function assertConfig() {
  const required = ['verifyToken', 'appSecret', 'waToken', 'phoneNumberId', 'publicBaseUrl', 'doorKey', 'adminKey'];
  // A 'TODO-' prefix marks a value still waiting on the Meta dashboard —
  // count it as missing so a half-filled .env can't boot silently.
  const missing = required.filter((k) => !config[k] || config[k].startsWith('TODO'));
  if (missing.length) {
    console.warn(`[config] missing env for live mode: ${missing.join(', ')}`);
  }
}
