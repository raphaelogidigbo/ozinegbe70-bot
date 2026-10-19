import './fonts.js';

export const W = 1080;
export const H = 1350;

// Earthy natural tones color palette
const C = {
  // Earthy browns
  earthBrown: '#8B4513',
  deepBrown: '#4A3728',
  warmTan: '#D2B48C',
  // Natural greens
  sageGreen: '#87A96B',
  oliveGreen: '#6B8E23',
  forestGreen: '#2E4A1E',
  // Golden ochre accents
  goldOchre: '#CC9933',
  amber: '#FFBF00',
  warmGold: '#DAA520',
  // Natural background
  cream: '#F5F5DC',
  beige: '#FAF0E6',
  eggshell: '#F0EAD6',
  // Text colors
  textDark: '#3D2914',
  textMedium: '#5C4033',
  textLight: '#8B7355',
};

// Earthy gradients
const earthGradient = `
  <linearGradient id="earthAccent" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.goldOchre}"/>
    <stop offset="0.5" stop-color="${C.warmGold}"/>
    <stop offset="1" stop-color="${C.earthBrown}"/>
  </linearGradient>`;

const sageGradient = `
  <linearGradient id="sageAccent" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.sageGreen}"/>
    <stop offset="1" stop-color="${C.forestGreen}"/>
  </linearGradient>`;

const backgroundDefs = `
  <radialGradient id="bg" cx="0.5" cy="0.38" r="0.95">
    <stop offset="0" stop-color="${C.beige}"/>
    <stop offset="0.62" stop-color="${C.cream}"/>
    <stop offset="1" stop-color="${C.eggshell}"/>
  </radialGradient>
  <radialGradient id="productBg" cx="0.5" cy="0.35" r="0.95">
    <stop offset="0" stop-color="#2D5A3D"/>
    <stop offset="0.55" stop-color="#1E4229"/>
    <stop offset="1" stop-color="#122B18"/>
  </radialGradient>
  <pattern id="adire" width="140" height="140" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="${C.warmGold}" stroke-opacity="0.10" stroke-width="1.5">
      <circle cx="70" cy="70" r="45"/>
      <circle cx="70" cy="70" r="28"/>
      <path d="M70 25 L115 70 L70 115 L25 70 Z"/>
      <circle cx="0" cy="0" r="30"/>
      <circle cx="140" cy="0" r="30"/>
      <circle cx="0" cy="140" r="30"/>
      <circle cx="140" cy="140" r="30"/>
    </g>
  </pattern>
  <pattern id="mudcloth" width="100" height="100" patternUnits="userSpaceOnUse">
    <rect width="100" height="100" fill="${C.eggshell}"/>
    <g fill="none" stroke="${C.warmTan}" stroke-opacity="0.15" stroke-width="2">
      <path d="M0 50 L50 0 L100 50 L50 100 Z"/>
      <circle cx="50" cy="50" r="20"/>
    </g>
  </pattern>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.72" stop-color="${C.deepBrown}" stop-opacity="0"/>
    <stop offset="1" stop-color="${C.deepBrown}" stop-opacity="0.4"/>
  </radialGradient>`;

// Cultural patterns
const mudclothPattern = `
  <pattern id="mudcloth" width="120" height="120" patternUnits="userSpaceOnUse">
    <rect width="120" height="120" fill="${C.eggshell}"/>
    <g fill="none" stroke="${C.warmTan}" stroke-opacity="0.2" stroke-width="2">
      <path d="M0 60 L60 0 L120 60 L60 120 Z"/>
      <circle cx="60" cy="60" r="25"/>
      <line x1="0" y1="0" x2="120" y2="120"/>
      <line x1="120" y1="0" x2="0" y2="120"/>
    </g>
  </pattern>`;

// Cowrie shell pattern
const cowriePattern = `
  <pattern id="cowrie" width="80" height="80" patternUnits="userSpaceOnUse">
    <g fill="${C.warmGold}" fill-opacity="0.15">
      <ellipse cx="40" cy="40" rx="20" ry="12"/>
      <ellipse cx="40" cy="40" rx="15" ry="8" fill="${C.deepBrown}" fill-opacity="0.2"/>
    </g>
  </pattern>`;

// Adinkra-inspired pattern (Gye Nyame symbol)
const adinkraPattern = `
  <pattern id="adinkra" width="100" height="100" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="${C.sageGreen}" stroke-opacity="0.15" stroke-width="2">
      <circle cx="50" cy="50" r="30"/>
      <path d="M50 20 L50 80 M20 50 L80 50"/>
      <circle cx="50" cy="50" r="10" fill="${C.goldOchre}" fill-opacity="0.2"/>
    </g>
  </pattern>`;

const xml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const optical = (x, spacing) => x + spacing / 2;

function smallCaps(text, x, y, size, fill = C.textLight, spacing = 6) {
  return `<text x="${optical(x, spacing)}" y="${y}" text-anchor="middle" font-family="Montserrat" font-weight="500"
    font-size="${size}" fill="${fill}" letter-spacing="${spacing}">${xml(text)}</text>`;
}

function serif(text, x, y, size, fill = C.textDark, spacing = 0) {
  return `<text x="${optical(x, spacing)}" y="${y}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600"
    font-size="${size}" fill="${fill}" letter-spacing="${spacing}">${xml(text)}</text>`;
}

function boldSerif(text, x, y, size, fill = 'url(#earthAccent)', spacing = 0) {
  return `<text x="${optical(x, spacing)}" y="${y}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="700"
    font-size="${size}" fill="${fill}" letter-spacing="${spacing}">${xml(text)}</text>`;
}

// Ornamental heading divider: twin rules with a centred diamond rosette and
// small flanking diamonds — replaces a plain hairline. `half` is the
// half-width of the whole ornament.
function ornateRule(cx, y, half, s = 1) {
  const d = 8 * s, g = 30 * s;
  const side = (dir) => `
    <line x1="${f1(cx + dir * g)}" y1="${f1(y)}" x2="${f1(cx + dir * half)}" y2="${f1(y)}"
      stroke="${C.goldOchre}" stroke-width="${f1(2 * s)}" stroke-opacity="0.85"/>
    <line x1="${f1(cx + dir * g)}" y1="${f1(y + 5 * s)}" x2="${f1(cx + dir * half * 0.7)}" y2="${f1(y + 5 * s)}"
      stroke="${C.warmGold}" stroke-width="${f1(0.9 * s)}" stroke-opacity="0.6"/>
    <path d="M0 ${f1(-d * 0.6)} L${f1(d * 0.6)} 0 L0 ${f1(d * 0.6)} L${f1(-d * 0.6)} 0 Z"
      transform="translate(${f1(cx + dir * (g + 16 * s))} ${f1(y)})" fill="${C.warmGold}" fill-opacity="0.9"/>`;
  return `
    ${side(-1)}${side(1)}
    <path d="M0 ${f1(-d)} L${f1(d)} 0 L0 ${f1(d)} L${f1(-d)} 0 Z"
      transform="translate(${f1(cx)} ${f1(y)})" fill="url(#earthAccent)"/>
    <path d="M0 ${f1(-d * 1.7)} L${f1(d * 1.7)} 0 L0 ${f1(d * 1.7)} L${f1(-d * 1.7)} 0 Z"
      transform="translate(${f1(cx)} ${f1(y)})" fill="none" stroke="${C.warmGold}"
      stroke-width="${f1(0.9 * s)}" stroke-opacity="0.7"/>`;
}

// Store heading block: tagline and subtitle flanked by dash–diamond
// ornaments, a bigger store name with a soft drop shadow for depth, and the
// ornate divider — all over a dark glow so it reads over the market photo.
function storeHeader(store, L) {
  const cx = L.w / 2;
  const [tagY, tagSize] = L.tagline;
  const [nameY, nameSize] = L.name;
  const [ruleY, rx1, rx2] = L.rule;
  const [subY, subSize] = L.sub;
  const tag = store.tagline.toUpperCase();
  const name = store.name.toUpperCase();
  const sub = 'AUTHENTIC NIGERIAN FOODSTUFFS · ASABA';
  const flank = (text, y, size, spacing) => {
    const half = (text.length * (size * 0.62 + spacing)) / 2;
    return [-1, 1].map((d) => `
      <line x1="${f1(cx + d * (half + 24 * L.s))}" y1="${f1(y)}" x2="${f1(cx + d * (half + 66 * L.s))}" y2="${f1(y)}"
        stroke="${C.goldOchre}" stroke-width="${f1(1.2 * L.s)}" stroke-opacity="0.8"/>
      <path d="M0 ${f1(-4.5 * L.s)} L${f1(4.5 * L.s)} 0 L0 ${f1(4.5 * L.s)} L${f1(-4.5 * L.s)} 0 Z"
        transform="translate(${f1(cx + d * (half + 14 * L.s))} ${f1(y)})" fill="${C.warmGold}"/>`).join('');
  };
  return `
    <rect x="0" y="${L.kente}" width="${L.w}" height="${f1(subY + 40 - L.kente)}" fill="url(#headScrim)"/>
    ${flank(tag, tagY - tagSize * 0.35, tagSize, 5)}
    ${smallCaps(tag, cx, tagY, tagSize, C.warmGold, 5)}
    <text x="${optical(cx, 3)}" y="${f1(nameY)}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="700"
      font-size="${nameSize}" fill="#0C2013" stroke="#0C2013" stroke-width="${f1(7 * L.s)}" stroke-linejoin="round"
      letter-spacing="3">${xml(name)}</text>
    ${boldSerif(name, cx, nameY, nameSize, 'url(#earthAccent)', 3)}
    ${ornateRule(cx, ruleY, (rx2 - rx1) / 2, L.s)}
    ${smallCaps(sub, cx, subY, subSize, '#F2E8CF', 6)}
    ${flank(sub, subY - subSize * 0.35, subSize, 6)}`;
}

// Cultural frame with earthy tones
function frame(insetOuter = 34, insetInner = 50, w = W, h = H) {
  const corner = (x, y, sx, sy) =>
    `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" stroke="url(#earthAccent)" fill="none" stroke-width="2">
       <path d="M0 26 Q0 0 26 0" />
       <path d="M8 26 Q8 8 26 8" stroke-opacity="0.5"/>
     </g>`;
  return `
    <rect x="${insetOuter}" y="${insetOuter}" width="${w - insetOuter * 2}" height="${h - insetOuter * 2}"
      fill="none" stroke="url(#earthAccent)" stroke-width="1.5" stroke-opacity="0.9"/>
    <rect x="${insetInner}" y="${insetInner}" width="${w - insetInner * 2}" height="${h - insetInner * 2}"
      fill="none" stroke="url(#earthAccent)" stroke-width="0.8" stroke-opacity="0.55"/>
    ${corner(insetOuter, insetOuter, 1, 1)}
    ${corner(w - insetOuter, insetOuter, -1, 1)}
    ${corner(insetOuter, h - insetOuter, 1, -1)}
    ${corner(w - insetOuter, h - insetOuter, -1, -1)}`;
}

// Calabash bowl shape (traditional serving vessel)
function calabashShape(cx, cy, width, height) {
  return `
    <g transform="translate(${cx} ${cy})">
      <ellipse cx="0" cy="0" rx="${width/2}" ry="${height/2}"
        fill="none" stroke="${C.earthBrown}" stroke-width="4" stroke-opacity="0.8"/>
      <ellipse cx="0" cy="0" rx="${width/2 - 8}" ry="${height/2 - 8}"
        fill="none" stroke="${C.goldOchre}" stroke-width="2" stroke-opacity="0.6"/>
      <!-- Rim detail -->
      <path d="M-${width/2} 0 Q0 15 ${width/2} 0" fill="none" stroke="${C.warmTan}" stroke-width="2" stroke-opacity="0.5"/>
    </g>`;
}

// Cowrie shell decoration
function cowrieShell(x, y, size = 30, rotation = 0) {
  return `
    <g transform="translate(${x} ${y}) rotate(${rotation}) scale(${size/30})">
      <ellipse cx="0" cy="0" rx="20" ry="12" fill="${C.warmGold}" fill-opacity="0.8"/>
      <ellipse cx="0" cy="0" rx="15" ry="8" fill="${C.deepBrown}" fill-opacity="0.6"/>
      <ellipse cx="0" cy="0" rx="8" ry="4" fill="${C.goldOchre}" fill-opacity="0.4"/>
    </g>`;
}

// Palm leaf corner decoration (earthy version)
function palmLeafCorner(x, y, scale = 1, rotation = 0) {
  return `
    <g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})" fill="none" stroke="${C.sageGreen}" stroke-width="2" stroke-opacity="0.5">
      <path d="M0 0 Q-20 -30 -40 -10"/>
      <path d="M0 0 Q-10 -40 -30 -25"/>
      <path d="M0 0 Q0 -45 -15 -35"/>
      <path d="M0 0 Q10 -45 0 -40"/>
      <path d="M0 0 Q20 -40 15 -30"/>
      <path d="M0 0 Q30 -35 25 -20"/>
      <path d="M0 0 Q40 -25 40 -10"/>
    </g>`;
}

// NAFDAC badge placeholder - will be composited as image
function nafdacPlaceholder(x, y, w = 100, h = 40) {
  return `
    <rect x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" rx="4"
      fill="none" stroke="${C.goldOchre}" stroke-width="1.5" stroke-opacity="0.7"/>
    <text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="12" fill="${C.textDark}" letter-spacing="1">NAFDAC</text>`;
}

const svgWrap = (inner, w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${earthGradient}${sageGradient}${backgroundDefs}${mudclothPattern}${cowriePattern}${adinkraPattern}</defs>
    ${inner}
  </svg>`;

// Layer 1: base gradient + cultural patterns
export function storeBackdropSvg(w = W, h = H) {
  return svgWrap(
    `<rect width="${w}" height="${h}" fill="url(#bg)"/>
     <rect width="${w}" height="${h}" fill="url(#mudcloth)"/>
     <rect width="${w}" height="${h}" fill="url(#cowrie)"/>
     <rect width="${w}" height="${h}" fill="url(#adinkra)"/>`,
    w,
    h
  );
}

// Frame with header text and cultural decorations
export function storeFrameSvg(config) {
  const { store } = config;
  return svgWrap(`
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${frame()}
    ${palmLeafCorner(70, 70, 0.8, 45)}
    ${palmLeafCorner(W - 70, 70, 0.8, -45)}
    ${palmLeafCorner(70, H - 70, 0.8, -45)}
    ${palmLeafCorner(W - 70, H - 70, 0.8, 45)}
    ${smallCaps(store.tagline.toUpperCase(), 540, 100, 16, C.textLight, 4)}
    ${boldSerif(store.name.toUpperCase(), 540, 145, 52, 'url(#earthAccent)', 3)}
    <line x1="200" y1="165" x2="840" y2="165" stroke="${C.goldOchre}" stroke-width="1.5" stroke-opacity="0.6"/>
  `);
}

// Square version frame
export function storeSquareFrameSvg(config) {
  const { store } = config;
  return svgWrap(`
    <rect width="1080" height="1080" fill="url(#vignette)"/>
    ${frame(34, 50, 1080, 1080)}
    ${palmLeafCorner(70, 70, 0.7, 45)}
    ${palmLeafCorner(1010, 70, 0.7, -45)}
    ${palmLeafCorner(70, 1010, 0.7, -45)}
    ${palmLeafCorner(1010, 1010, 0.7, 45)}
    ${smallCaps(store.tagline.toUpperCase(), 540, 95, 14, C.textLight, 3)}
    ${boldSerif(store.name.toUpperCase(), 540, 135, 44, 'url(#earthAccent)', 3)}
    <line x1="220" y1="152" x2="860" y2="152" stroke="${C.goldOchre}" stroke-width="1.5" stroke-opacity="0.6"/>
  `, 1080, 1080);
}

// Front text overlay with contact info and NAFDAC
export function storeFrontSvg(config) {
  const { store, badges } = config;
  return svgWrap(`
    <defs>
      <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.deepBrown}" stop-opacity="0"/>
        <stop offset="0.4" stop-color="${C.deepBrown}" stop-opacity="0.5"/>
        <stop offset="1" stop-color="${C.deepBrown}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect x="0" y="900" width="${W}" height="450" fill="url(#fadeBottom)"/>
    ${smallCaps('AUTHENTIC NIGERIAN FOODSTUFFS', 540, 940, 18, C.textLight, 5)}
    <line x1="280" y1="960" x2="800" y2="960" stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.5"/>
    ${serif(store.address, 540, 1000, 24, C.textMedium)}
    ${smallCaps('Tel: ' + store.phone, 540, 1040, 20, C.textDark, 4)}
    ${smallCaps('WhatsApp: ' + store.whatsapp, 540, 1070, 20, C.textDark, 4)}
    ${smallCaps('Prod: ' + store.productionDate + '  ·  Exp: ' + store.expiryDate, 540, 1120, 16, C.textLight, 3)}
    ${smallCaps(badges.quality, 540, 1160, 18, 'url(#sageAccent)', 4)}
    ${smallCaps(badges.origin, 540, 1190, 16, C.textLight, 3)}
    ${nafdacPlaceholder(540, 1270, 120, 50)}
  `);
}

// Square version front text
export function storeSquareFrontSvg(config) {
  const { store, badges } = config;
  return svgWrap(`
    <defs>
      <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.deepBrown}" stop-opacity="0"/>
        <stop offset="0.4" stop-color="${C.deepBrown}" stop-opacity="0.5"/>
        <stop offset="1" stop-color="${C.deepBrown}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect x="0" y="720" width="1080" height="360" fill="url(#fadeBottom)"/>
    ${smallCaps('AUTHENTIC NIGERIAN FOODSTUFFS', 540, 760, 16, C.textLight, 4)}
    <line x1="300" y1="778" x2="780" y2="778" stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.5"/>
    ${serif(store.address, 540, 810, 22, C.textMedium)}
    ${smallCaps('Tel: ' + store.phone, 540, 845, 18, C.textDark, 3)}
    ${smallCaps('WhatsApp: ' + store.whatsapp, 540, 870, 18, C.textDark, 3)}
    ${smallCaps('Prod: ' + store.productionDate + '  ·  Exp: ' + store.expiryDate, 540, 910, 14, C.textLight, 2)}
    ${smallCaps(badges.quality, 540, 945, 16, 'url(#sageAccent)', 3)}
    ${smallCaps(badges.origin, 540, 970, 14, C.textLight, 2)}
    ${nafdacPlaceholder(540, 1030, 100, 40)}
  `, 1080, 1080);
}

// Featured item text overlay (for Garri)
export function featuredItemTextSvg(item) {
  return svgWrap(`
    ${boldSerif(item.name, 540, 320, 140, 'url(#earthAccent)', 8)}
    ${smallCaps(item.subtitle, 540, 375, 24, C.textLight, 5)}
    ${smallCaps(item.badge, 540, 405, 16, 'url(#sageAccent)', 4)}
  `);
}

// Kente-inspired border strip
function kenteStrip(w, y, height = 26) {
  return `
    <g>
      <rect x="0" y="${y}" width="${w}" height="${height}" fill="${C.forestGreen}"/>
      <rect x="0" y="${y}" width="${w}" height="4" fill="${C.goldOchre}"/>
      <rect x="0" y="${y + height - 4}" width="${w}" height="4" fill="${C.goldOchre}"/>
      <g fill="${C.warmGold}">
        ${Array.from({ length: Math.floor(w / 54) }, (_, i) =>
          `<rect x="${i * 54 + 12}" y="${y + 8}" width="30" height="${height - 16}" rx="2"
            fill="${i % 3 === 0 ? C.goldOchre : i % 3 === 1 ? '#B7410E' : C.sageGreen}"/>`
        ).join('')}
      </g>
    </g>`;
}

// Product card frame (white rounded rectangle with gold border)
function productCard(x, y, w, h) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#FFFFFF"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="none"
      stroke="${C.goldOchre}" stroke-width="5"/>
    <rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="16" fill="none"
      stroke="${C.warmGold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
}

// Info field cell for the information panel
function infoCell(label, value, x, y, width) {
  return `
    <text x="${x}" y="${y}" text-anchor="middle" font-family="Montserrat" font-weight="500"
      font-size="15" fill="${C.warmGold}" letter-spacing="2">${xml(label)}</text>
    <text x="${x}" y="${y + 34}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="22" fill="#FFFFFF" letter-spacing="1">${xml(value)}</text>
    <line x1="${x - width / 2}" y1="${y + 48}" x2="${x + width / 2}" y2="${y + 48}"
      stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.45"/>`;
}

const f1 = (n) => Math.round(n * 10) / 10;

// Palm frond: a drooping rachis with tapering leaflets on both sides, drawn
// along +x from the origin and then rotated/placed. Deterministic, no assets.
function palmFrond(x, y, length, rotation, flip = false, opacity = 0.85) {
  const k = 0.22; // droop
  const stemY = (t) => k * length * t * t;
  const leaflets = [];
  for (let t = 0.1; t <= 0.98; t += 0.04) {
    const px = t * length, py = stemY(t);
    const stemAngle = Math.atan(2 * k * t);
    const len = length * 0.42 * Math.sin(Math.PI * (0.12 + t * 0.82));
    const wid = len * 0.09;
    for (const side of [-1, 1]) {
      const a = stemAngle + side * (Math.PI / 3.2) + 0.25; // lean toward tip, sag
      const tx = px + Math.cos(a) * len, ty = py + Math.sin(a) * len;
      const mx = (px + tx) / 2, my = (py + ty) / 2;
      const nx = -Math.sin(a) * wid, ny = Math.cos(a) * wid;
      leaflets.push(
        `<path d="M${f1(px)} ${f1(py)} Q${f1(mx + nx)} ${f1(my + ny)} ${f1(tx)} ${f1(ty)} Q${f1(mx - nx)} ${f1(my - ny)} ${f1(px)} ${f1(py)}Z" fill="url(#${side < 0 ? 'frondA' : 'frondB'})"/>`
      );
    }
  }
  return `
    <g transform="translate(${x} ${y}) rotate(${rotation}) scale(1 ${flip ? -1 : 1})" opacity="${opacity}">
      ${leaflets.join('')}
      <path d="M0 0 Q${f1(length * 0.5)} 0 ${f1(length)} ${f1(stemY(1))}" fill="none" stroke="#9BC266" stroke-width="${f1(length * 0.012)}" stroke-linecap="round"/>
    </g>`;
}

// Cream arch spotlight the product cutout stands in front of.
function archPath(x, y, w, h) {
  const r = w / 2;
  return `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`;
}

function arch(x, y, w, h, adireDataUri) {
  const inset = 12;
  const cx = x + w / 2;
  const cy = y + h * 0.52;
  const ray = (i) => {
    const len = h * (i % 2 ? 0.42 : 0.55);
    return `<path d="M0 0 L${f1(-w * 0.042)} ${f1(-len)} L${f1(w * 0.042)} ${f1(-len)} Z"
      transform="translate(${f1(cx)} ${f1(cy)}) rotate(${i * 30})"
      fill="${C.warmGold}" fill-opacity="${i % 2 ? 0.09 : 0.13}"/>`;
  };
  return `
    <clipPath id="archClip"><path d="${archPath(x, y, w, h)}"/></clipPath>
    <path d="${archPath(x - 6, y - 6, w + 12, h + 12)}" fill="#0E2414" opacity="0.45"/>
    <path d="${archPath(x, y, w, h)}" fill="url(#archFill)"/>
    <g clip-path="url(#archClip)">
      ${adireDataUri
        ? `<image href="${adireDataUri}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}"
             preserveAspectRatio="xMidYMid slice" opacity="0.9"/>`
        : `<path d="${archPath(x, y, w, h)}" fill="url(#adireCream)"/>`}
      ${Array.from({ length: 12 }, (_, i) => ray(i)).join('')}
    </g>
    <path d="${archPath(x, y, w, h)}" fill="url(#archGlow)"/>
    <path d="${archPath(x, y, w, h)}" fill="none" stroke="${C.goldOchre}" stroke-width="6"/>
    <path d="${archPath(x + inset, y + inset, w - inset * 2, h - inset)}" fill="none"
      stroke="${C.warmGold}" stroke-width="1.5" stroke-opacity="0.7"/>`;
}

// Scalloped rosette seal with two lines of text.
function seal(cx, cy, r, line1, line2, nigeria = false) {
  const n = 28;
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.9 : r;
    return `${f1(cx + Math.cos(a) * rr)},${f1(cy + Math.sin(a) * rr)}`;
  }).join(' ');
  const flag = nigeria
    ? `<g transform="translate(${cx - r * 0.3} ${cy - r * 0.62})">
         <rect width="${f1(r * 0.2)}" height="${f1(r * 0.26)}" fill="#008751"/>
         <rect x="${f1(r * 0.2)}" width="${f1(r * 0.2)}" height="${f1(r * 0.26)}" fill="#FFFFFF"/>
         <rect x="${f1(r * 0.4)}" width="${f1(r * 0.2)}" height="${f1(r * 0.26)}" fill="#008751"/>
       </g>`
    : `<path transform="translate(${cx} ${cy - r * 0.5}) scale(${f1(r / 60)})" d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.6 7.6 L0 3.8 L-5.6 7.6 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8Z" fill="${C.amber}"/>`;
  return `
    <g filter="url(#softShadow)">
      <polygon points="${pts}" fill="url(#earthAccent)"/>
      <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.78)}" fill="#1E3B22" stroke="${C.amber}" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="${f1(r * 0.7)}" fill="none" stroke="${C.warmGold}" stroke-width="1" stroke-dasharray="3 3"/>
    </g>
    ${flag}
    <text x="${cx}" y="${f1(cy + r * 0.08)}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="${f1(r * 0.3)}" fill="#FFFFFF" letter-spacing="1">${xml(line1)}</text>
    <text x="${cx}" y="${f1(cy + r * 0.38)}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="${f1(r * 0.2)}" fill="${C.amber}" letter-spacing="1">${xml(line2)}</text>`;
}

// Info-row icon glyphs, drawn centred on the origin in a ~26px box.
const ICONS = {
  pin: `<path d="M0 -12C-6.6 -12 -11 -7.4 -11 -2C-11 5 0 13 0 13S11 5 11 -2C11 -7.4 6.6 -12 0 -12Z" fill="#1E3B22"/>
        <circle cx="0" cy="-2" r="4" fill="${C.warmGold}"/>`,
  phone: `<path transform="translate(-12 -12)" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#1E3B22"/>`,
  calendar: `<rect x="-11" y="-9" width="22" height="20" rx="3" fill="#1E3B22"/>
        <rect x="-8" y="-2" width="16" height="10" rx="1" fill="${C.warmGold}"/>
        <rect x="-7" y="-13" width="3" height="7" rx="1.5" fill="#1E3B22"/>
        <rect x="4" y="-13" width="3" height="7" rx="1.5" fill="#1E3B22"/>
        <g fill="#1E3B22"><rect x="-6" y="0" width="3" height="2.5"/><rect x="-1.5" y="0" width="3" height="2.5"/><rect x="3" y="0" width="3" height="2.5"/><rect x="-6" y="4" width="3" height="2.5"/><rect x="-1.5" y="4" width="3" height="2.5"/></g>`,
  weight: `<circle cx="0" cy="-8" r="4.5" fill="none" stroke="#1E3B22" stroke-width="3"/>
        <path d="M-8 -3H8L12 12H-12Z" fill="#1E3B22"/>`,
  shield: `<path d="M0 -12L10 -8V0C10 7 5 11 0 13C-5 11 -10 7 -10 0V-8Z" fill="#1E3B22"/>
        <path d="M-4.5 0.5L-1 4L5 -3" fill="none" stroke="${C.warmGold}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function iconRow(icon, label, value, x, y, s) {
  const r = 24 * s;
  return `
    <circle cx="${f1(x + r)}" cy="${y}" r="${f1(r)}" fill="url(#earthAccent)"/>
    <g transform="translate(${f1(x + r)} ${y}) scale(${s})">${ICONS[icon]}</g>
    <text x="${f1(x + r * 2 + 16 * s)}" y="${f1(y - 6 * s)}" font-family="Montserrat" font-weight="500"
      font-size="${f1(13 * s)}" fill="${C.warmGold}" letter-spacing="2">${xml(label)}</text>
    <text x="${f1(x + r * 2 + 16 * s)}" y="${f1(y + 20 * s)}" font-family="Montserrat" font-weight="600"
      font-size="${f1(21 * s)}" fill="#FFFFFF">${xml(value)}</text>`;
}

// Information panel: two columns of icon rows plus a NAFDAC ribbon on top.
// The left column carries two rows (address, phone); the right three
// (production date, best before, NAFDAC number). `expiry` overrides the
// store-wide date so each item flyer can show its own.
function infoPanel(config, x, y, w, h, s, nafdacText, expiry) {
  const { store } = config;
  const colL = x + 32 * s, colR = x + w / 2 + 28 * s;
  const rowH = (h - 30 * s) / 3;
  const row = (i) => f1(y + 22 * s + rowH * (i + 0.5));
  const rowL = (i) => f1(y + 22 * s + ((h - 30 * s) * (i + 0.5)) / 2);
  const phone = store.whatsapp && store.whatsapp !== store.phone
    ? `${store.phone} / ${store.whatsapp}` : store.phone;
  const pillW = 300 * s, pillH = 40 * s;
  const tick = (tx, ty, sx, sy) => `
    <path d="M0 ${f1(18 * s)} L0 0 L${f1(18 * s)} 0" transform="translate(${f1(tx)} ${f1(ty)}) scale(${sx} ${sy})"
      fill="none" stroke="${C.amber}" stroke-width="${f1(3.5 * s)}" stroke-linecap="round"/>`;
  return `
    <rect x="${f1(x + 5 * s)}" y="${f1(y + 8 * s)}" width="${w}" height="${h}" rx="${22 * s}" fill="#000" fill-opacity="0.4"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${20 * s}" fill="#22452B"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${20 * s}" fill="none"
      stroke="${C.goldOchre}" stroke-width="4" stroke-opacity="0.95"/>
    <rect x="${f1(x + 9 * s)}" y="${f1(y + 9 * s)}" width="${f1(w - 18 * s)}" height="${f1(h - 18 * s)}" rx="${f1(13 * s)}" fill="none"
      stroke="${C.warmGold}" stroke-width="1.2" stroke-opacity="0.7"/>
    ${tick(x + 7 * s, y + 7 * s, 1, 1)}${tick(x + w - 7 * s, y + 7 * s, -1, 1)}
    ${tick(x + 7 * s, y + h - 7 * s, 1, -1)}${tick(x + w - 7 * s, y + h - 7 * s, -1, -1)}
    <g transform="translate(${f1(x + 20 * s)} ${f1(y + 10 * s)})">${kenteStrip(f1(w - 40 * s), 0, f1(24 * s))}</g>
    <line x1="${x + w / 2}" y1="${f1(y + 40 * s)}" x2="${x + w / 2}" y2="${f1(y + h - 22 * s)}"
      stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.5"/>
    ${[1, 2].map((i) => `
      <line x1="${f1(x + w / 2 + 24 * s)}" y1="${f1(y + 22 * s + rowH * i)}" x2="${f1(x + w - 30 * s)}" y2="${f1(y + 22 * s + rowH * i)}" stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.35"/>`).join('')}
    <line x1="${f1(x + 30 * s)}" y1="${f1(y + 22 * s + (h - 30 * s) * 0.5)}" x2="${f1(x + w / 2 - 24 * s)}" y2="${f1(y + 22 * s + (h - 30 * s) * 0.5)}" stroke="${C.goldOchre}" stroke-width="1" stroke-opacity="0.35"/>
    ${iconRow('pin', 'VISIT US', store.address, colL, rowL(0), s)}
    ${iconRow('phone', 'CALL / WHATSAPP', phone, colL, rowL(1), s)}
    ${iconRow('calendar', 'PRODUCTION DATE', store.productionDate, colR, row(0), s)}
    ${iconRow('calendar', 'BEST BEFORE', expiry || store.expiryDate, colR, row(1), s)}
    ${iconRow('shield', 'NAFDAC REG. NO.', store.nafdacNo || 'A1-0000', colR, row(2), s)}
    ${nafdacText ? `
    <rect x="${f1(x + w / 2 - pillW / 2)}" y="${f1(y - pillH / 2)}" width="${f1(pillW)}" height="${f1(pillH)}" rx="${f1(pillH / 2)}"
      fill="url(#earthAccent)" stroke="#22452B" stroke-width="2"/>
    <g transform="translate(${f1(x + w / 2 - pillW / 2 + 26 * s)} ${y}) scale(${f1(s * 0.75)})">${ICONS.shield}</g>
    <text x="${f1(x + w / 2 + 12 * s)}" y="${f1(y + 6 * s)}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="${f1(16 * s)}" fill="#1E3B22" letter-spacing="3">${xml(nafdacText)}</text>` : ''}`;
}

// Ragged yellow brush stroke carrying the item name (front layer, drawn
// over the product cutout so it overlaps the bottom of the arch).
function brushBanner(text, cx, cy, w, h) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const steps = 18;
  const top = [], bot = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + w * t;
    top.push(`${f1(x)},${f1(y0 + Math.sin(t * 9.1) * h * 0.05 + (t < 0.08 || t > 0.92 ? h * 0.12 : 0))}`);
    bot.push(`${f1(x)},${f1(y1 + Math.cos(t * 7.3) * h * 0.06 - (t < 0.06 || t > 0.94 ? h * 0.1 : 0))}`);
  }
  const jag = (xe, dir) =>
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return `${f1(xe + dir * (i % 2 ? h * 0.22 : h * 0.02))},${f1(y0 + h * 0.12 + (h * 0.76) * t)}`;
    });
  const body = [...top, ...jag(x1, 1), ...bot.reverse(), ...jag(x0, -1).reverse()].join(' ');
  const streak = (dy, inset, sw) =>
    `<path d="M${f1(x0 + inset)} ${f1(cy + dy)} Q${cx} ${f1(cy + dy - h * 0.06)} ${f1(x1 - inset)} ${f1(cy + dy + h * 0.03)}" fill="none" stroke="#F7D35C" stroke-opacity="0.55" stroke-width="${sw}" stroke-linecap="round"/>`;
  const size = Math.min(h * 0.7, (w * 0.78) / (text.length * 0.66));
  const textHalf = (text.length * size * 0.66) / 2;
  const withSprigs = textHalf < w / 2 - h * 0.75 - 30;
  const sprig = (sx, dir) => `
    <g transform="translate(${f1(sx)} ${cy}) scale(${dir} 1) scale(${f1(h / 110)})" fill="#1E3B22">
      <path d="M0 0 Q-14 -18 -34 -16 Q-18 -4 0 0Z"/>
      <path d="M0 0 Q-18 2 -36 14 Q-14 16 0 0Z"/>
      <path d="M0 0 Q-6 -22 -2 -36 Q8 -18 0 0Z"/>
    </g>`;
  return `
    <g filter="url(#softShadow)">
      <polygon points="${body}" fill="url(#brushGold)"/>
    </g>
    ${streak(-h * 0.22, h * 0.4, h * 0.05)}
    ${streak(h * 0.26, h * 0.6, h * 0.04)}
    ${withSprigs ? sprig(x0 + h * 0.75, 1) : ''}
    ${withSprigs ? sprig(x1 - h * 0.75, -1) : ''}
    <text x="${optical(cx, 3)}" y="${f1(cy + size * 0.34)}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="700"
      font-size="${f1(size)}" fill="#1E3B22" letter-spacing="3">${xml(text)}</text>`;
}

const singleItemDefs = `
  <radialGradient id="archFill" cx="0.5" cy="0.45" r="0.7">
    <stop offset="0" stop-color="#FFF9E8"/>
    <stop offset="0.6" stop-color="#F6EBCB"/>
    <stop offset="1" stop-color="#E4CF97"/>
  </radialGradient>
  <radialGradient id="archGlow" cx="0.5" cy="0.3" r="0.5">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="headScrim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0C2013" stop-opacity="0"/>
    <stop offset="0.14" stop-color="#0C2013" stop-opacity="0.9"/>
    <stop offset="0.5" stop-color="#0C2013" stop-opacity="0.78"/>
    <stop offset="1" stop-color="#0C2013" stop-opacity="0"/>
  </linearGradient>
  <pattern id="adireCream" width="120" height="120" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="${C.goldOchre}" stroke-opacity="0.4" stroke-width="1.8">
      <circle cx="60" cy="60" r="38"/>
      <circle cx="60" cy="60" r="22"/>
      <path d="M60 22 L98 60 L60 98 L22 60 Z"/>
    </g>
  </pattern>
  <linearGradient id="frondA" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7FAF4E"/><stop offset="1" stop-color="#3F6B2A"/>
  </linearGradient>
  <linearGradient id="frondB" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#5E8C3A"/><stop offset="1" stop-color="#2E5420"/>
  </linearGradient>
  <linearGradient id="brushGold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4C842"/><stop offset="0.6" stop-color="#E5AE22"/><stop offset="1" stop-color="#C98F17"/>
  </linearGradient>
  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.4"/>
  </filter>`;

// Geometry for the two single-item formats. `product` is the box the cutout
// is fitted into (bottom-aligned) — render-store-flyer.js reads it.
export const SINGLE_LAYOUTS = {
  portrait: {
    w: W, h: H, s: 1, kente: 26,
    tagline: [70, 15], name: [128, 52], rule: [150, 230, 850], sub: [188, 16],
    arch: { x: 200, y: 215, w: 680, h: 630 },
    product: { x: 240, y: 270, w: 600, h: 540 },
    banner: { cx: 540, cy: 850, w: 640, h: 110 },
    seals: { y: 330, xl: 150, xr: 930, r: 72 },
    info: { x: 60, y: 945, w: W - 120, h: 335 },
  },
  square: {
    w: 1080, h: 1080, s: 0.86, kente: 22,
    tagline: [58, 13], name: [102, 42], rule: [120, 260, 820], sub: [150, 13],
    arch: { x: 290, y: 165, w: 500, h: 470 },
    product: { x: 320, y: 205, w: 440, h: 400 },
    banner: { cx: 540, cy: 645, w: 520, h: 88 },
    seals: { y: 260, xl: 175, xr: 905, r: 62 },
    info: { x: 80, y: 735, w: 920, h: 300 },
  },
};

// Single item flyer, base layer: the opaque dark-green field only. The
// faded market photo is composited between this and the scene.
function singleItemBase(L) {
  return svgWrap(`
    <defs>${singleItemDefs}</defs>
    <rect width="${L.w}" height="${L.h}" fill="url(#productBg)"/>
  `, L.w, L.h);
}

// Single item flyer, scene layer (transparent): everything drawn over the
// market photo ghost — adire texture, fronds, kente strips, heading, arch,
// seals and the info panel.
function singleItemScene(config, L, adireDataUri, expiry) {
  const { store, badges = {}, featuredItem = {} } = config;
  const [q1, ...qRest] = String(badges.quality || '100% Natural').toUpperCase().split(' ');
  const origin = String(badges.origin || 'Made in Nigeria').toUpperCase();
  const originSplit = origin.lastIndexOf(' ');
  const nafdacText = badges.nafdac === false ? '' : (featuredItem.badge || 'NAFDAC APPROVED');
  return svgWrap(`
    <defs>${singleItemDefs}</defs>
    <rect width="${L.w}" height="${L.h}" fill="url(#adire)"/>
    <rect width="${L.w}" height="${L.h}" fill="url(#vignette)"/>
    ${kenteStrip(L.w, 0, L.kente)}
    ${kenteStrip(L.w, L.h - L.kente, L.kente)}
    ${storeHeader(store, L)}
    ${arch(L.arch.x, L.arch.y, L.arch.w, L.arch.h, adireDataUri)}
    ${seal(L.seals.xl, L.seals.y, L.seals.r, origin.slice(0, originSplit), origin.slice(originSplit + 1), true)}
    ${seal(L.seals.xr, L.seals.y, L.seals.r, q1, qRest.join(' '))}
    ${infoPanel(config, L.info.x, L.info.y, L.info.w, L.info.h, L.s, nafdacText, expiry)}
  `, L.w, L.h);
}

// Single item flyer, front layer: the brush-stroke name banner.
function singleItemFront(itemName, L) {
  const b = L.banner;
  return svgWrap(`
    <defs>${singleItemDefs}</defs>
    ${brushBanner(itemName.toUpperCase(), b.cx, b.cy, b.w, b.h)}
  `, L.w, L.h);
}

export const singleItemBaseSvg = (L = SINGLE_LAYOUTS.portrait) => singleItemBase(L);
export const singleItemSceneSvg = (config, L = SINGLE_LAYOUTS.portrait, adireDataUri, expiry) => singleItemScene(config, L, adireDataUri, expiry);
export const singleItemFrontSvg = (itemName) => singleItemFront(itemName, SINGLE_LAYOUTS.portrait);
export const singleItemSquareFrontSvg = (itemName) => singleItemFront(itemName, SINGLE_LAYOUTS.square);

// --- general store flyer -----------------------------------------------------
//
// One flyer for the whole store: the featured item stands in the arch while
// the rest of the range fills a labelled ring grid below. Shares the
// single-item design language — header, arch, seals, info panel — with a
// store-level brush banner.

export const GENERAL_LAYOUTS = {
  portrait: {
    w: W, h: H, s: 1, kente: 26,
    tagline: [70, 15], name: [128, 52], rule: [150, 230, 850], sub: [188, 16],
    arch: { x: 330, y: 218, w: 420, h: 330 },
    product: { x: 360, y: 252, w: 360, h: 268 },
    banner: { cx: 540, cy: 588, w: 500, h: 86 },
    seals: { y: 330, xl: 158, xr: 922, r: 62 },
    grid: { y: 650, size: 160, gapX: 26, rowGap: 22 },
    info: { x: 60, y: 1078, w: W - 120, h: 226 },
  },
  square: {
    w: 1080, h: 1080, s: 0.86, kente: 22,
    tagline: [58, 13], name: [102, 42], rule: [120, 260, 820], sub: [150, 13],
    arch: { x: 390, y: 172, w: 300, h: 240 },
    product: { x: 410, y: 196, w: 260, h: 190 },
    banner: { cx: 540, cy: 448, w: 420, h: 72 },
    seals: { y: 268, xl: 200, xr: 880, r: 52 },
    grid: { y: 506, size: 132, gapX: 20, rowGap: 20 },
    info: { x: 80, y: 862, w: 920, h: 180 },
  },
};

// The nine grid slots (rows of 5 + 4, centred) shared by the scene SVG —
// placeholder rings and labels — and the render script, which composites the
// ringed photos into the same coordinates.
export function generalGridSlots(L) {
  const g = L.grid;
  const rowW = (n) => n * g.size + (n - 1) * g.gapX;
  return [5, 4].flatMap((n, r) => {
    const x0 = (L.w - rowW(n)) / 2;
    const y = g.y + r * (g.size + 22 + g.rowGap);
    return Array.from({ length: n }, (_, i) => ({
      x: Math.round(x0 + i * (g.size + g.gapX)),
      y: Math.round(y),
      size: g.size,
    }));
  });
}

function generalGridSvg(items, L) {
  return generalGridSlots(L).map((slot, i) => {
    const cx = slot.x + slot.size / 2;
    const cy = slot.y + slot.size / 2;
    const name = items[i] ? items[i].name.toUpperCase() : '';
    return `
    <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(slot.size / 2)}" fill="#1B3A24"/>
    <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(slot.size / 2 - 3)}" fill="none"
      stroke="${C.goldOchre}" stroke-width="2" stroke-opacity="0.5"/>
    ${name ? `<text x="${f1(cx)}" y="${f1(slot.y + slot.size + 22)}" text-anchor="middle"
      font-family="Montserrat" font-weight="600" font-size="${f1(15 * L.s)}"
      fill="#F2E8CF" letter-spacing="2">${xml(name)}</text>` : ''}`;
  }).join('');
}

function generalStoreScene(config, L, adireDataUri, expiry) {
  const { store, badges = {}, featuredItem = {} } = config;
  const [q1, ...qRest] = String(badges.quality || '100% Natural').toUpperCase().split(' ');
  const origin = String(badges.origin || 'Made in Nigeria').toUpperCase();
  const originSplit = origin.lastIndexOf(' ');
  const nafdacText = badges.nafdac === false ? '' : (featuredItem.badge || 'NAFDAC APPROVED');
  const featured = String(featuredItem.name || '').toLowerCase();
  const gridItems = config.foodItems.filter((i) => i.name.toLowerCase() !== featured).slice(0, 9);
  return svgWrap(`
    <defs>${singleItemDefs}</defs>
    <rect width="${L.w}" height="${L.h}" fill="url(#adire)"/>
    <rect width="${L.w}" height="${L.h}" fill="url(#vignette)"/>
    ${kenteStrip(L.w, 0, L.kente)}
    ${kenteStrip(L.w, L.h - L.kente, L.kente)}
    ${storeHeader(store, L)}
    ${arch(L.arch.x, L.arch.y, L.arch.w, L.arch.h, adireDataUri)}
    ${seal(L.seals.xl, L.seals.y, L.seals.r, origin.slice(0, originSplit), origin.slice(originSplit + 1), true)}
    ${seal(L.seals.xr, L.seals.y, L.seals.r, q1, qRest.join(' '))}
    ${generalGridSvg(gridItems, L)}
    ${infoPanel(config, L.info.x, L.info.y, L.info.w, L.info.h, L.s, nafdacText, expiry)}
  `, L.w, L.h);
}

export const generalStoreSceneSvg = (config, L = GENERAL_LAYOUTS.portrait, adireDataUri, expiry) =>
  generalStoreScene(config, L, adireDataUri, expiry);

export const generalStoreFrontSvg = (L = GENERAL_LAYOUTS.portrait) =>
  svgWrap(`<defs>${singleItemDefs}</defs>${brushBanner('FRESH STOCK DAILY', L.banner.cx, L.banner.cy, L.banner.w, L.banner.h)}`, L.w, L.h);

// Cultural decorations for single item flyer (kept for compatibility)
export function culturalDecorationsSvg(w = W, h = H) {
  return svgWrap(``, w, h);
}

// Food item label (for grid items)
export function foodItemLabelSvg(name, x, y, size = 18) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40">
    <defs>${earthGradient}</defs>
    <text x="100" y="${y}" text-anchor="middle" font-family="Montserrat" font-weight="600"
      font-size="${size}" fill="${C.textDark}" letter-spacing="1">${xml(name)}</text>
  </svg>`;
}
