import './fonts.js';

export const W = 1080;
export const H = 1350;

// Measured slots on the attending card — the guest photo circle and the
// name baseline. card.js composites into these exact coordinates.
export const SLOTS = {
  photo: { cx: 540, cy: 600, r: 215, ringWidth: 7 },
  name: { x: 540, y: 960, maxWidth: 900 },
};

export const EVENT = {
  inviteLine: 'YOU ARE SPECIALLY INVITED TO',
  names: 'Elder Harrison & Mrs. Justina Ozinegbe',
  occasion: 'A PRIVATE FAMILY GET-TOGETHER',
  // Split across two lines — the full phrase overruns the safe width inside
  // the frame at display size.
  headline: '70TH BIRTHDAY',
  headline2: 'THANKSGIVING CELEBRATION',
  dateLine: 'SATURDAY, 10TH OCTOBER 2026  ·  11:00 AM',
  venueLine1: 'Plot 15 Chief Saula Ndakolo Road, Ilaje Bus Stop,',
  venueLine2: 'off Mobil Road, Alaguntan, Ajah, Lagos',
  rsvpLine: 'RSVP: ' + (process.env.RSVP_NAMES || 'the family'),
  seal: 'STRICTLY BY INVITATION',
};

const C = {
  ink: '#17130e',
  ink2: '#221c14',
  accent: '#c6a23b',
  accentLight: '#ecd9a0',
  accentDeep: '#7a5e18',
  ivory: '#f4ecd8',
  ivoryDim: '#c9bfa4',
};

// --- shared ornaments ----------------------------------------------------

const accentGradient = `
  <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.accentLight}"/>
    <stop offset="0.5" stop-color="${C.accent}"/>
    <stop offset="1" stop-color="${C.accentDeep}"/>
  </linearGradient>`;

const backgroundDefs = `
  <radialGradient id="bg" cx="0.5" cy="0.38" r="0.95">
    <stop offset="0" stop-color="${C.ink2}"/>
    <stop offset="0.62" stop-color="${C.ink}"/>
    <stop offset="1" stop-color="#0c0a07"/>
  </radialGradient>
  <pattern id="damask" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <g fill="none" stroke="${C.accent}" stroke-opacity="0.05" stroke-width="1">
      <path d="M60 10 C80 30 80 90 60 110 C40 90 40 30 60 10 Z"/>
      <circle cx="60" cy="60" r="4"/>
    </g>
  </pattern>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.72" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>`;

function frame(insetOuter = 34, insetInner = 50, w = W, h = H) {
  const corner = (x, y, sx, sy) =>
    `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" stroke="url(#accent)" fill="none" stroke-width="2">
       <path d="M0 26 Q0 0 26 0" />
       <path d="M8 26 Q8 8 26 8" stroke-opacity="0.5"/>
     </g>`;
  return `
    <rect x="${insetOuter}" y="${insetOuter}" width="${w - insetOuter * 2}" height="${h - insetOuter * 2}"
      fill="none" stroke="url(#accent)" stroke-width="1.5" stroke-opacity="0.9"/>
    <rect x="${insetInner}" y="${insetInner}" width="${w - insetInner * 2}" height="${h - insetInner * 2}"
      fill="none" stroke="url(#accent)" stroke-width="0.8" stroke-opacity="0.55"/>
    ${corner(insetOuter, insetOuter, 1, 1)}
    ${corner(w - insetOuter, insetOuter, -1, 1)}
    ${corner(insetOuter, h - insetOuter, 1, -1)}
    ${corner(w - insetOuter, h - insetOuter, -1, -1)}`;
}

function monogram(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale})" text-anchor="middle">
      <text x="0" y="14" font-family="Cormorant Garamond" font-weight="700" font-size="72"
        fill="url(#accent)" letter-spacing="2">H&amp;J</text>
      <line x1="-120" y1="34" x2="120" y2="34" stroke="${C.accent}" stroke-width="1"/>
      <path d="M0 26 L7 34 L0 42 L-7 34 Z" fill="url(#accent)"/>
    </g>`;
}

const xml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// letter-spacing is added after the FINAL glyph too, so the advance width
// text-anchor="middle" centres on is one full space wider than the visible
// ink. Nudge right by half a space to centre what the eye actually sees.
const optical = (x, spacing) => x + spacing / 2;

function smallCaps(text, x, y, size, fill = C.ivoryDim, spacing = 6) {
  return `<text x="${optical(x, spacing)}" y="${y}" text-anchor="middle" font-family="Montserrat" font-weight="500"
    font-size="${size}" fill="${fill}" letter-spacing="${spacing}">${xml(text)}</text>`;
}

function serif(text, x, y, size, fill = C.ivory, spacing = 0) {
  return `<text x="${optical(x, spacing)}" y="${y}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600"
    font-size="${size}" fill="${fill}" letter-spacing="${spacing}">${xml(text)}</text>`;
}

// The pill is sized from the text rather than fixed at 340px wide, which the
// 21px/6-spacing seal overflowed at both ends.
function seal(cx, cy, size = 19, spacing = 5, text = EVENT.seal) {
  const ink = text.length * (size * 0.66 + spacing) - spacing;
  const halfW = Math.round(ink / 2) + 36;
  return `
    <g transform="translate(${cx} ${cy})">
      <rect x="${-halfW}" y="-23" width="${halfW * 2}" height="46" rx="23" fill="none" stroke="url(#accent)" stroke-width="1.4"/>
      <text x="${spacing / 2}" y="7" text-anchor="middle" font-family="Montserrat" font-weight="600"
        font-size="${size}" fill="url(#accent)" letter-spacing="${spacing}">${xml(text)}</text>
    </g>`;
}

const svgWrap = (inner, w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${accentGradient}${backgroundDefs}</defs>
    
    ${inner}
  </svg>`;

// --- flyer -----------------------------------------------------------------
//
// The flyer is composited in render-assets.js as:
//   backdrop → faded faces → frame/header → halo → couple cutout → front text
// The faded-faces and halo layers sit between the backdrop and the frame, so
// the background can't be one welded block the way the attending card's is.

// Layer 1: base gradient + damask only.
export function flyerBackdropSvg(w = W, h = H) {
  return svgWrap(
    `<rect width="${w}" height="${h}" fill="url(#bg)"/>
     <rect width="${w}" height="${h}" fill="url(#damask)"/>`,
    w,
    h
  );
}

// A soft warm pool of light so the couple sit in the scene rather than
// floating on flat ink. Drawn under the cutout.
export function haloSvg(cx, cy, rx, ry, w = W, h = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ecd9a0" stop-opacity="0.15"/>
        <stop offset="0.55" stop-color="${C.accent}" stop-opacity="0.06"/>
        <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#halo)"/>
  </svg>`;
}

// Layer 3: vignette + frame + header text, over the faded faces.
export function flyerFrameSvg() {
  return svgWrap(`
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${frame()}
    ${monogram(540, 120, 0.8)}
    ${smallCaps(EVENT.inviteLine, 540, 232, 22, C.ivoryDim, 5)}
    ${smallCaps(EVENT.occasion, 540, 278, 26, 'url(#accent)', 7)}
  `);
}

// Top layer: names, date, venue, seal — drawn over the cutout.
export function flyerFrontSvg() {
  return svgWrap(`
    <defs>
      <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.ink}" stop-opacity="0"/>
        <stop offset="0.55" stop-color="${C.ink}" stop-opacity="0.72"/>
        <stop offset="1" stop-color="${C.ink}" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect x="0" y="640" width="${W}" height="460" fill="url(#fadeBottom)"/>
    ${smallCaps('SCAN TO RSVP', 825, 1218, 12, C.ivoryDim, 2)}
    ${serif('Elder Harrison', 540, 912, 54)}
    ${serif('& Mrs. Justina Ozinegbe', 540, 966, 54)}
    ${smallCaps('ON THEIR', 540, 1000, 16, C.ivoryDim, 8)}
    ${serif(EVENT.headline, 540, 1044, 46, 'url(#accent)', 4)}
    ${serif(EVENT.headline2, 540, 1080, 30, 'url(#accent)', 3)}
    <line x1="380" y1="1102" x2="700" y2="1102" stroke="${C.accent}" stroke-width="1"/>
    ${smallCaps(EVENT.dateLine, 540, 1132, 21, C.ivory, 5)}
    ${serif(EVENT.venueLine1, 540, 1168, 25, C.ivoryDim)}
    ${serif(EVENT.venueLine2, 540, 1198, 25, C.ivoryDim)}
    ${smallCaps(EVENT.rsvpLine.toUpperCase(), 540, 1226, 15, C.ivoryDim, 3)}
    ${seal(540, 1266)}
  `);
}

// --- square flyer (1080x1080) — tighter layout for feeds -----------------

export function flyerSquareFrameSvg() {
  return svgWrap(`
    <rect width="1080" height="1080" fill="url(#vignette)"/>
    ${frame(34, 50, 1080, 1080)}
    ${monogram(540, 110, 0.7)}
    ${smallCaps(EVENT.inviteLine, 540, 198, 18, C.ivoryDim, 4)}
    ${smallCaps(EVENT.occasion, 540, 240, 23, 'url(#accent)', 6)}
  `, 1080, 1080);
}

export function flyerSquareFrontSvg() {
  return svgWrap(`
    <defs>
      <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.ink}" stop-opacity="0"/>
        <stop offset="0.55" stop-color="${C.ink}" stop-opacity="0.72"/>
        <stop offset="1" stop-color="${C.ink}" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect x="0" y="560" width="1080" height="330" fill="url(#fadeBottom)"/>
    ${smallCaps('SCAN TO RSVP', 821, 950, 11, C.ivoryDim, 2)}
    ${serif(EVENT.names, 540, 790, 44)}
    ${smallCaps('ON THEIR', 540, 818, 14, C.ivoryDim, 6)}
    ${serif(EVENT.headline, 540, 854, 38, 'url(#accent)', 4)}
    ${serif(EVENT.headline2, 540, 886, 26, 'url(#accent)', 3)}
    ${smallCaps(EVENT.dateLine, 540, 916, 20, C.ivory, 5)}
    ${serif('Ajah, Lagos', 540, 948, 28, C.ivoryDim)}
    ${seal(540, 995)}
  `, 1080, 1080);
}

// --- attending base -------------------------------------------------------

// Everything above the base gradient: vignette, frame, type and the photo
// ring. Shared so render-assets.js can slide the faded-faces layer underneath
// it, exactly as the flyers do.
function attendingContent() {
  const { photo } = SLOTS;
  return `
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${frame()}
    ${monogram(540, 125, 0.7)}
    ${smallCaps('OZINEGBE  ·  70TH BIRTHDAY THANKSGIVING CELEBRATION', 540, 210, 17, C.ivoryDim, 3)}
    ${serif("I'm Attending", 540, 320, 92, 'url(#accent)')}
    <circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r + photo.ringWidth}"
      fill="none" stroke="url(#accent)" stroke-width="${photo.ringWidth}"/>
    <circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r + photo.ringWidth + 14}"
      fill="none" stroke="url(#accent)" stroke-width="1" stroke-opacity="0.5"/>
    ${smallCaps('SATURDAY, 10TH OCTOBER 2026', 540, 1075, 22, C.ivory)}
    ${serif('Ajah, Lagos', 540, 1120, 34, C.ivoryDim)}
    ${seal(540, 1240)}`;
}

// Layer above the faded faces when the card base is rendered to PNG.
export function attendingFrameSvg() {
  return svgWrap(attendingContent());
}

// Self-contained fallback: card.js renders this directly if
// design/attending-base.png is missing, so it cannot depend on raster layers
// and therefore ships without the faded-faces backdrop.
export function attendingBaseSvg() {
  return svgWrap(`
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#damask)"/>
    ${attendingContent()}
  `);
}

// --- admission pass ---------------------------------------------------------
//
// One self-contained SVG — the QR and the guest photo arrive as base64 data
// URIs, so a single sharp render produces the finished pass. The QR encodes
// {PUBLIC_BASE_URL}/checkin/{pass_id}: a live lookup, never a self-contained
// ticket. Door staff match the face on the pass in hand, so the photo is
// on the pass rather than on the door page (selfies are never stored).

export function passSvg({ name, code, qrDataUri, photoDataUri, initials, facesDataUri }) {
  const safe = xml(name);
  const photo = { cx: 540, cy: 555, r: 128 };
  const qr = { x: 370, y: 830, size: 340 };

  // Shrink long names to fit inside the frame, same estimate as the card.
  let nameSize = 56;
  while (nameSize > 30 && safe.length * nameSize * 0.52 > 900) nameSize -= 2;

  const photoInner = photoDataUri
    ? `<clipPath id="photoclip"><circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r}"/></clipPath>
       <image href="${photoDataUri}" x="${photo.cx - photo.r}" y="${photo.cy - photo.r}"
         width="${photo.r * 2}" height="${photo.r * 2}" preserveAspectRatio="xMidYMid slice"
         clip-path="url(#photoclip)"/>`
    : `<circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r}" fill="${C.ink2}"/>
       <text x="${photo.cx}" y="${photo.cy + 38}" text-anchor="middle"
         font-family="Cormorant Garamond" font-weight="700" font-size="110"
         fill="url(#accent)">${xml(initials)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${accentGradient}${backgroundDefs}</defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#damask)"/>
    ${facesDataUri ? `<image href="${facesDataUri}" x="0" y="0" width="${W}" height="${H}"/>` : ''}
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${frame()}
    ${monogram(540, 118, 0.7)}
    ${smallCaps('OZINEGBE  ·  70TH BIRTHDAY THANKSGIVING CELEBRATION', 540, 200, 16, C.ivoryDim, 3)}
    ${serif('Admission Pass', 540, 295, 76, 'url(#accent)')}
    ${smallCaps('SHOW THIS PASS AT THE ENTRANCE', 540, 335, 17, C.ivoryDim, 5)}
    ${photoInner}
    <circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r + 6}"
      fill="none" stroke="url(#accent)" stroke-width="6"/>
    <circle cx="${photo.cx}" cy="${photo.cy}" r="${photo.r + 18}"
      fill="none" stroke="url(#accent)" stroke-width="1" stroke-opacity="0.5"/>
    ${serif(safe, 540, 762, nameSize)}
    <rect x="${qr.x - 18}" y="${qr.y - 18}" width="${qr.size + 36}" height="${qr.size + 36}"
      rx="18" fill="none" stroke="url(#accent)" stroke-width="1.6"/>
    <image href="${qrDataUri}" x="${qr.x}" y="${qr.y}" width="${qr.size}" height="${qr.size}"/>
    ${smallCaps(code, 540, 1205, 20, C.ivoryDim, 6)}
    ${seal(540, 1270, 16, 4, 'ADMITS ONE · STRICTLY BY INVITATION')}
  </svg>`;
}

// --- dynamic layers --------------------------------------------------------

export function nameTextSvg(name) {
  const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const maxWidth = SLOTS.name.maxWidth;
  let size = 62;
  // rough width estimate: ~0.52em average glyph advance for this serif
  while (size > 30 && safe.length * size * 0.52 > maxWidth) size -= 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${accentGradient}</defs>
    
    ${serif(safe, SLOTS.name.x, SLOTS.name.y, size, C.ivory)}
  </svg>`;
}

export function initialsAvatarSvg(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
  const { photo } = SLOTS;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${photo.r * 2}" height="${photo.r * 2}">
    <defs>${accentGradient}</defs>
    
    <rect width="100%" height="100%" fill="${C.ink2}"/>
    <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
      font-family="Cormorant Garamond" font-weight="700" font-size="150"
      fill="url(#accent)">${initials}</text>
  </svg>`;
}

// Circular alpha mask used to clip the guest photo.
export function circleMaskSvg(diameter) {
  const r = diameter / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>
    </svg>`
  );
}
