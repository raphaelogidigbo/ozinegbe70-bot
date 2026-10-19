import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { config } from './config.js';
import {
  SLOTS,
  attendingBaseSvg,
  nameTextSvg,
  initialsAvatarSvg,
  circleMaskSvg,
  passSvg,
} from './templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '..', 'design', 'attending-base.png');
const FACES_PATH = path.join(__dirname, '..', 'design', 'pass-faces.png');

let baseCache = null;
async function attendingBase() {
  if (baseCache) return baseCache;
  try {
    baseCache = await fs.readFile(BASE_PATH);
  } catch {
    // Self-heal: render the base if the design file hasn't been generated yet.
    baseCache = await sharp(Buffer.from(attendingBaseSvg())).png().toBuffer();
  }
  return baseCache;
}

async function guestPhotoLayer(photoBuffer, name) {
  const d = SLOTS.photo.r * 2;
  let prepared;
  if (photoBuffer) {
    prepared = sharp(photoBuffer)
      .rotate() // honour EXIF orientation (iPhone selfies)
      .resize(d, d, { fit: 'cover', position: 'attention' })
      .png();
  } else {
    prepared = sharp(Buffer.from(initialsAvatarSvg(name))).png();
  }
  const masked = await prepared
    .composite([{ input: circleMaskSvg(d), blend: 'dest-in' }])
    .toBuffer();
  return {
    input: masked,
    left: SLOTS.photo.cx - SLOTS.photo.r,
    top: SLOTS.photo.cy - SLOTS.photo.r,
  };
}

export async function makeAttendingCard({ name, photoBuffer }) {
  const base = await attendingBase();
  const layers = [
    await guestPhotoLayer(photoBuffer, name),
    { input: Buffer.from(nameTextSvg(name)), left: 0, top: 0 },
  ];
  return sharp(base)
    .composite(layers)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

// Ghost-faces layer for the pass, rendered by scripts/render-assets.js.
// Missing file is fine — the pass just renders without the backdrop.
let facesCache;
async function passFacesDataUri() {
  if (facesCache !== undefined) return facesCache;
  try {
    facesCache = `data:image/png;base64,${(await fs.readFile(FACES_PATH)).toString('base64')}`;
  } catch {
    facesCache = null;
  }
  return facesCache;
}

// Format a 12-char pass id into XXX-XXX-XXX-XXX groups for print legibility.
const groupCode = (id) => id.replace(/(.{3})(?=.)/g, '$1-');

export async function makeAdmissionPass({ name, photoBuffer, passId }) {
  // The QR is a URL pointing at a live server lookup — never a self-contained
  // ticket — so a screenshot alone can't check anyone in.
  const url = `${config.publicBaseUrl}/checkin/${passId}`;
  const qr = await QRCode.toBuffer(url, {
    width: 680,
    margin: 1,
    errorCorrectionLevel: 'Q',
    color: { dark: '#17130e', light: '#f4ecd8' },
  });
  const qrDataUri = `data:image/png;base64,${qr.toString('base64')}`;

  let photoDataUri = null;
  if (photoBuffer) {
    const p = await sharp(photoBuffer)
      .rotate() // EXIF orientation (iPhone selfies)
      .resize(256, 256, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 85 })
      .toBuffer();
    photoDataUri = `data:image/jpeg;base64,${p.toString('base64')}`;
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const svg = passSvg({
    name,
    code: groupCode(passId),
    qrDataUri,
    photoDataUri,
    initials,
    facesDataUri: await passFacesDataUri(),
  });
  return sharp(Buffer.from(svg)).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
