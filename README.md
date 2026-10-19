# Ozinegbe 70 — Invitation Bot + Door Check-in

Strictly by invitation, enforced by the software: hosts add guests in the
**admin console** (`/admin`, PIN-gated) and send each a personal `/invite/…`
link — via a **wa.me tap-to-send button** from the host's own WhatsApp (free,
no API) or by email via Resend. The invitee opens their link, confirms
(optional photo), and receives a personalised "I'm Attending" card, a
scannable **admission pass**, and an `.ics` calendar file. Strangers who
scan the flyer QR land on `/rsvp`, which only files a **request** — a host
approves or declines it in `/admin`. Staff scan the pass QR at the door; a
live lookup marks them checked in, and a re-scan shows "already checked in".
Running cost is **$0**.

## Repo layout

| Path | Purpose |
|---|---|
| `src/server.js` | Express app — webhook verify + inbound messages + door + RSVP + admin routes |
| `src/admin.js` | Host console — invitees, wa.me/email send, request approvals (`ADMIN_KEY`) |
| `src/rsvp.js` | Invite page (`/invite/:id`), request form (`/rsvp`), media + `.ics` endpoints |
| `src/bot.js` | WhatsApp conversation state machine (name → email → photo → card + pass) |
| `src/guest-pack.js` | Shared card/pass/calendar generation for web + WhatsApp |
| `src/door.js` | Check-in pages + PIN-gated staff endpoints |
| `src/whatsapp.js` | Cloud API client (send, upload, download media) |
| `src/email.js` | Resend client (card + pass attachments) |
| `src/card.js` + `src/templates.js` | sharp/SVG card + pass engine |
| `design/` | Rendered flyer + card-base PNGs |
| `tools/cutout.py` | One-time background removal for the couple's portrait |
| `scripts/render-assets.js` | Rebuild all design PNGs |
| `scripts/simulate-flow.js` | End-to-end test without Meta credentials |
| `scripts/test-door.js` | Door check-in endpoint tests (in-process server) |
| `scripts/seed.sql` + `scripts/migration-checkin.sql` + `scripts/migration-web.sql` + `scripts/migration-invites.sql` | Supabase tables |

## Local dev

```bash
npm install
npm run cutout        # needs: pip install "rembg[cpu]"  (one-time)
npm run assets        # render flyer + card base PNGs
npm run test:flow     # simulated guest journey, no Meta needed
npm run test:webhook  # signed-webhook preflight against a running server
npm run test:door     # door check-in endpoint tests
npm run test:rsvp     # request-to-attend tests
npm run test:invite   # admin → invite → confirm → door end-to-end
npm run dev           # boot server on :3000
```

## Invitation flow (no Meta account needed)

- **`GET /admin`** is the host console, gated by `ADMIN_KEY` (sent as the
  `X-Admin-Key` header, stored per-device after one prompt). Add an invitee
  with name + WhatsApp number (+ optional email) → the guest row is created
  with `state: 'invited'` and a personal `/invite/{invite_id}` link.
- **Sending the invite**: each guest row has a **WhatsApp** button — a
  `wa.me/{phone}?text=…` link that opens a prefilled chat *from the host's
  own WhatsApp* (free, no API, one tap per guest), a **Link** copy button,
  and an **Email** button (Resend — sends the invite link, not the pack).
- **The flyer rides along automatically**: `GET /flyer.png` serves the event
  flyer publicly, and every invite/request page carries `og:image` meta
  pointing at it — so a wa.me-sent invite renders the flyer as a rich link
  preview in WhatsApp (wa.me itself can't attach files). The invitation
  email attaches the same PNG. `/admin` also has a **Download flyer** link
  for hosts who want to attach it manually. Requires `PUBLIC_BASE_URL` to
  be the real public URL — localhost links show no preview.
- **`GET /invite/{invite_id}`** is the guest's personalised invitation:
  "Dear {name}", optional photo + email, **Confirm** / **Can't make it**.
  Confirming runs the card+pass render, sets `state: 'registered'`, and
  shows the delivery panel — image downloads, **Add to Calendar**
  (`/invite.ics`), **Save to my WhatsApp** (wa.me self-send), and the live
  pass link. Declining records `state: 'declined'`; the guest can still
  change their mind from the same link.
- **`/rsvp`** (the flyer QR target) is now *request-only*: `POST /api/rsvp`
  validates name + phone (+ optional email) and files `state: 'requested'`
  — **no pass is rendered**. Requests appear in `/admin`; **Approve** mints
  their invite link, **Decline** marks them. If a requester's phone belongs
  to an already-registered guest, they get their existing pass back —
  doubles as pass recovery.
- Rendered media is served at `GET /media/{pass_id}/card.jpg` and
  `/pass.jpg` — public but unguessable. Raw selfies are still never stored.
- Re-confirming reuses the existing `pass_id` — a re-registration never
  orphans a printed pass.
- Submit endpoints are rate-limited per IP (`RSVP_RATE_LIMIT`, default
  10/hour) since each confirm runs the card renderer.
- Guest states: `invited` → `registered` (confirmed), `declined`,
  `requested` (self-serve, awaiting a host).
- Supabase: run `scripts/migration-invites.sql` for the invite columns.
- Collected WhatsApp numbers are what the Meta template-push flow needs
  later — once the account exists, business-initiated template messages can
  deliver invites directly (a third send button in `/admin`).

## Door check-in

- Pass QR encodes `{PUBLIC_BASE_URL}/checkin/{pass_id}` — a live server
  lookup, never a self-contained ticket. The page is public and read-only.
- `POST /api/door/checkin/:id` and `GET /api/door/guests` require the
  `DOOR_KEY` PIN as an `X-Door-Key` header; staff enter it once per device
  (stored in the browser). Without it: 403.
- `GET /door` is the staff list + name-search fallback for guests whose
  phone died or whose QR won't scan.
- Guest selfies are never stored, so the door page shows the name — staff
  match the face on the pass in hand.
- Set `PUBLIC_BASE_URL` **before** any pass goes out — it is baked into
  every QR, and changing it later orphans issued passes.
- Supabase is required in production: the in-memory fallback loses all
  check-in state on restart.

For real webhooks locally: `cloudflared tunnel --url http://localhost:3000`
and point the Meta webhook at the tunnel URL.

## Meta setup runbook (the part only you can do)

1. **Developer account** — developers.facebook.com → create account (free).
2. **Create app** → type "Business" → add the **WhatsApp** product.
3. **Test number first** — API Setup gives you a test `PHONE_NUMBER_ID` and a
   temporary token. Add up to 5 recipient numbers (yours) under "To".
4. **Webhook** — Configuration → set callback URL to
   `https://<your-render-url>/webhook` and `WHATSAPP_VERIFY_TOKEN` (any long
   random string you also put in `.env`). Subscribe to the `messages` field.
5. **Permanent token** — the temp token expires in 24h. Create a
   **System User** in Meta Business Settings → generate token scoped to the
   app with `whatsapp_business_messaging` → use that in prod.
6. **Go live** — WhatsApp → API Setup → "Add phone number": a real SIM that
   can receive SMS/voice OTP and is NOT already on WhatsApp. VoIP numbers get
   rejected.
7. **App secret** — App Settings → Basic → App Secret → `META_APP_SECRET`.
   Used to verify `X-Hub-Signature-256` on every webhook.

## Deploy (Render free)

1. Push repo to GitHub.
2. Render → New → Blueprint → pick repo (reads `render.yaml`).
3. Fill the `sync: false` env vars from `.env`.
4. Supabase → run `scripts/seed.sql`, then `migration-checkin.sql`,
   `migration-web.sql`, `migration-invites.sql` in the SQL editor → copy
   URL + service key into Render env.
5. Set the Meta webhook to `https://<app>.onrender.com/webhook`.
6. cron-job.org → GET `https://<app>.onrender.com/health` every 10 min
   (keeps the free instance warm).

## Flyer regeneration

Drop the real portrait at `assets/couple.jpg`, then:

```bash
python tools/cutout.py   # → assets/couple-cutout.png
BOT_NUMBER=23480... RSVP_NAMES="..." npm run assets
```

Outputs `design/flyer-1080x1350.png` (WhatsApp/IG story) and
`flyer-1080x1080.png` (feed). The QR on the flyer encodes the wa.me link.

## Notes

- Selfies are processed in memory and never stored — the finished card lives
  on Meta's media servers only.
- The bot only ever replies to inbound messages (Meta policy compliant).
- `confirmed_guests` view in Supabase = the hosts' RSVP list.
