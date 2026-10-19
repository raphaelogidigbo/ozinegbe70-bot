import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOOD_DIR = path.join(__dirname, '..', 'assets', 'food');
const ATTRIBUTION_FILE = path.join(FOOD_DIR, 'ATTRIBUTION.md');

if (!fs.existsSync(FOOD_DIR)) fs.mkdirSync(FOOD_DIR, { recursive: true });

const UA = 'OzinegbeFlyerBot/1.0 (contact: local dev; image download for flyer)';

// Wikimedia Commons search terms per food item
const SEARCH_TERMS = {
  'garri': 'garri cassava',
  'egusi': 'egusi',
  'ogbono': 'ogbono',
  'dry-fish': 'dried fish market',
  'kpomo': 'ponmo',
  'otazi': 'utazi',
  'scent-leaf': 'Ocimum gratissimum',
  'negro-pepper': 'Xylopia aethiopica',
  'stockfish': 'stockfish',
  'dried-bitterleaf': 'Vernonia amygdalina',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        if (redirects <= 0) return reject(new Error('Too many redirects'));
        return resolve(downloadFile(res.headers.location, dest, redirects - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 8000) return reject(new Error('File too small'));
        fs.writeFileSync(dest, buf);
        resolve(buf.length);
      });
    }).on('error', reject);
  });
}

async function searchCommons(term) {
  const query = encodeURIComponent(term);
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${query}&gsrnamespace=6&gsrlimit=10` +
    `&prop=imageinfo&iiprop=url%7Csize%7Cmime&iiurlwidth=1000&format=json`;
  const json = await fetchJson(url);
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages
    .filter((p) => p.imageinfo?.[0])
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .map((p) => ({
      title: p.title,
      url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
      mime: p.imageinfo[0].mime,
      page: p.imageinfo[0].descriptionurl,
    }))
    .filter((r) => r.mime === 'image/jpeg' || r.mime === 'image/png');
}

const attribution = ['# Image Attribution\n'];

async function downloadFoodImage(key, term) {
  const dest = path.join(FOOD_DIR, `${key}.jpg`);
  console.log(`Searching Commons for "${term}"...`);

  let results;
  try {
    results = await searchCommons(term);
  } catch (e) {
    console.log(`  ✗ Search failed: ${e.message}`);
    return false;
  }

  if (!results.length) {
    console.log(`  ✗ No images found`);
    return false;
  }

  for (const r of results.slice(0, 5)) {
    try {
      const size = await downloadFile(r.url, dest);
      console.log(`  ✓ ${r.title} (${Math.round(size / 1024)}KB)`);
      attribution.push(`- **${key}.jpg** — [${r.title}](${r.page}) (Wikimedia Commons)`);
      return true;
    } catch (e) {
      console.log(`  ✗ ${r.title}: ${e.message}`);
    }
  }
  return false;
}

async function main() {
  console.log('Downloading real Nigerian food images from Wikimedia Commons...\n');
  let ok = 0;
  for (const [key, term] of Object.entries(SEARCH_TERMS)) {
    if (await downloadFoodImage(key, term)) ok++;
    await new Promise((r) => setTimeout(r, 400));
  }
  fs.writeFileSync(ATTRIBUTION_FILE, attribution.join('\n') + '\n');
  console.log(`\n✓ Downloaded ${ok}/${Object.keys(SEARCH_TERMS).length} images`);
  console.log(`Attribution saved to ${ATTRIBUTION_FILE}`);
  console.log('Run "npm run store-flyer" to regenerate the flyers.');
}

main().catch(console.error);
