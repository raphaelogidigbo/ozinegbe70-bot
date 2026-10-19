import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import QRCode from 'qrcode';
import {
  W,
  H,
  attendingFrameSvg,
  flyerBackdropSvg,
  flyerFrameSvg,
  flyerFrontSvg,
  flyerSquareFrameSvg,
  flyerSquareFrontSvg,
  haloSvg,
} from '../src/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DESIGN = path.join(ROOT, 'design');
const CUTOUT = path.join(ROOT, 'assets', 'couple-cutout.png');

const BOT_NUMBER = process.env.BOT_NUMBER || '2340000000000';
// The flyer QR lands on the web RSVP form when RSVP_URL is set (e.g.
// https://yourapp.onrender.com/rsvp); otherwise it falls back to the wa.me
// chat link for the WhatsApp-first variant.
const RSVP_URL =
  process.env.RSVP_URL ||
  `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent(
    'Hi! I received an invitation to the Ozinegbe 70th Birthday Thanksgiving Celebration.'
  )}`;

const svgPng = (svg) => sharp(Buffer.from(svg)).png().toBuffer();

async function cutoutLayer(targetHeight) {
  try {
    const src = await fs.readFile(CUTOUT);
    const buf = await sharp(src).resize({ height: targetHeight }).png().toBuffer();
    const meta = await sharp(buf).metadata();
    return { buf, w: meta.width, h: meta.height };
  } catch {
    console.warn('[assets] no assets/couple-cutout.png — flyers render without portrait');
    return null;
  }
}

async function qrLayer(size) {
  const buf = await QRCode.toBuffer(RSVP_URL, {
    width: size,
    margin: 1,
    // Dimmed from bright cream so it stops out-shouting the monogram, while
    // keeping enough light/dark separation for reliable scanning.
    color: { dark: '#17130e', light: '#d8c8bb' },
  });
  return buf;
}

// A boldly over-scaled, heavily faded crop of the couple's faces, sitting
// behind everything so the flyer has depth instead of flat ink. Built from
// the cutout rather than couple.jpg: the cutout carries no olive studio wall,
// so nothing fights the warm palette, and the ghost is face-shaped rather
// than a rectangle.
async function facesBackdrop(canvasW, canvasH, topFraction, widthFraction = 0.88, peak = 0.2) {
  let src;
  try {
    src = await fs.readFile(CUTOUT);
  } catch {
    return null;
  }
  const meta = await sharp(src).metadata();

  // Head-and-shoulders region of both faces, as a fraction of the portrait.
  const crop = {
    left: Math.round(meta.width * 0.28),
    top: Math.round(meta.height * 0.07),
    width: Math.round(meta.width * 0.44),
    height: Math.round(meta.height * 0.26),
  };

  // Kept narrower than the canvas so both ghost faces stay inside the accent
  // frame — clipped at the border they read as an accident, not a design.
  const targetW = Math.round(canvasW * widthFraction);

  let faces = await sharp(src)
    .extract(crop)
    .resize({ width: targetW })
    .greyscale()
    .tint('#7a6234') // warm the monochrome onto the ink→accent ramp
    .blur(7) // soft enough not to compete with the sharp cutout for focus
    .ensureAlpha()
    .png()
    .toBuffer();

  const fm = await sharp(faces).metadata();
  const top = Math.round(canvasH * topFraction);
  const height = Math.min(fm.height, canvasH - top);
  if (height <= 0) return null;
  if (height < fm.height) {
    faces = await sharp(faces)
      .extract({ left: 0, top: 0, width: targetW, height })
      .png()
      .toBuffer();
  }

  // Radial feather doubling as the opacity control — dest-in multiplies the
  // layer's alpha, so the ghost dissolves to nothing before the accent frame.
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${height}">
      <defs>
        <radialGradient id="feather" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stop-color="#fff" stop-opacity="${peak}"/>
          <stop offset="0.5" stop-color="#fff" stop-opacity="${(peak * 0.7).toFixed(3)}"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#feather)"/>
    </svg>`
  );

  const faded = await sharp(faces)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return { input: faded, left: Math.round((canvasW - targetW) / 2), top };
}

async function renderFlyer() {
  const cutout = await cutoutLayer(800);
  const backdrop = await svgPng(flyerBackdropSvg());
  const faces = await facesBackdrop(W, H, 0.1);
  const frame = await svgPng(flyerFrameSvg());
  const halo = await svgPng(haloSvg(540, 660, 430, 480));
  const front = await svgPng(flyerFrontSvg());
  const qr = await qrLayer(70);

  const layers = [];
  if (faces) layers.push(faces);
  layers.push({ input: frame, left: 0, top: 0 });
  layers.push({ input: halo, left: 0, top: 0 });
  if (cutout) {
    layers.push({ input: cutout.buf, left: Math.round((W - cutout.w) / 2), top: 250 });
  }
  layers.push({ input: qr, left: 790, top: 1230 });
  layers.push({ input: front, left: 0, top: 0 });

  await sharp(backdrop)
    .composite(layers)
    .png()
    .toFile(path.join(DESIGN, 'flyer-1080x1350.png'));
}

async function renderSquareFlyer() {
  const S = 1080;
  const cutout = await cutoutLayer(600);
  const backdrop = await svgPng(flyerBackdropSvg(S, S));
  const faces = await facesBackdrop(S, S, 0.08);
  const frame = await svgPng(flyerSquareFrameSvg());
  const halo = await svgPng(haloSvg(540, 560, 370, 390, S, S));
  const front = await svgPng(flyerSquareFrontSvg());
  const qr = await qrLayer(62);

  const layers = [];
  if (faces) layers.push(faces);
  layers.push({ input: frame, left: 0, top: 0 });
  layers.push({ input: halo, left: 0, top: 0 });
  if (cutout) {
    layers.push({ input: cutout.buf, left: Math.round((S - cutout.w) / 2), top: 250 });
  }
  layers.push({ input: qr, left: 790, top: 964 });
  layers.push({ input: front, left: 0, top: 0 });

  await sharp(backdrop)
    .composite(layers)
    .png()
    .toFile(path.join(DESIGN, 'flyer-1080x1080.png'));
}

async function renderAttendingBase() {
  const backdrop = await svgPng(flyerBackdropSvg());
  // Fainter than the flyers': the card already carries a large circular guest
  // photo and oversized accent type, so the ghost has to stay further back.
  const faces = await facesBackdrop(W, H, 0.1, 0.88, 0.17);
  const frame = await svgPng(attendingFrameSvg());

  const layers = [];
  if (faces) layers.push(faces);
  layers.push({ input: frame, left: 0, top: 0 });

  await sharp(backdrop)
    .composite(layers)
    .png()
    .toFile(path.join(DESIGN, 'attending-base.png'));
}

// The pass is a single self-contained SVG (card.js renders it in one shot),
// so its ghost faces ship as a standalone transparent layer that passSvg
// embeds as a data URI between the damask and the vignette.
async function renderPassFaces() {
  const faces = await facesBackdrop(W, H, 0.1, 0.88, 0.15);
  if (!faces) {
    console.warn('[assets] no couple cutout — pass-faces.png not written');
    return;
  }
  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([faces])
    .png()
    .toFile(path.join(DESIGN, 'pass-faces.png'));
}

async function main() {
  await fs.mkdir(DESIGN, { recursive: true });
  await renderAttendingBase();
  await renderFlyer();
  await renderSquareFlyer();
  await renderPassFaces();
  console.log('Rendered: attending-base.png, flyer-1080x1350.png, flyer-1080x1080.png, pass-faces.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
