// sharp's bundled librsvg renders SVG text through fontconfig — it does NOT
// honour @font-face data URIs. So we ship real TTFs in assets/fonts and point
// fontconfig at them via FONTCONFIG_FILE. Import this module BEFORE sharp is
// first used (fontconfig reads the env var at first text render).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
const CONF_DIR = path.join(ROOT, '.fontconfig');
const CACHE_DIR = path.join(CONF_DIR, 'cache');
const CONF_PATH = path.join(CONF_DIR, 'fonts.conf');

fs.mkdirSync(CACHE_DIR, { recursive: true });

// fontconfig accepts forward-slash paths on Windows; include system dirs so
// fallback fonts still resolve on both Windows and Linux (Render).
const posix = (p) => p.replace(/\\/g, '/');
const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${posix(FONT_DIR)}</dir>
  <dir>C:/Windows/Fonts</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <cachedir>${posix(CACHE_DIR)}</cachedir>
</fontconfig>
`;

fs.writeFileSync(CONF_PATH, conf);
process.env.FONTCONFIG_FILE = CONF_PATH;
