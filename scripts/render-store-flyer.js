import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  W,
  H,
  storeBackdropSvg,
  storeFrameSvg,
  storeFrontSvg,
  storeSquareFrameSvg,
  storeSquareFrontSvg,
  featuredItemTextSvg,
  foodItemLabelSvg,
  singleItemBaseSvg,
  singleItemSceneSvg,
  singleItemFrontSvg,
  singleItemSquareFrontSvg,
  SINGLE_LAYOUTS,
  GENERAL_LAYOUTS,
  generalStoreSceneSvg,
  generalStoreFrontSvg,
  generalGridSlots,
  culturalDecorationsSvg,
} from '../src/store-templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DESIGN = path.join(ROOT, 'design');
const FOOD_DIR = path.join(ROOT, 'assets', 'food');
const CUTOUT_DIR = path.join(FOOD_DIR, 'cutouts');
const NAFDAC_LOGO = path.join(ROOT, 'assets', 'nafdac-logo.png');
const MARKET_IMAGE = path.join(ROOT, 'assets', 'market.jpg');
const ADIRE_FABRIC = path.join(ROOT, 'assets', 'adire.jpg');

const slug = (name) => name.toLowerCase().replace(/\s+/g, '-');

// Deterministic per-item best-before: FNV-hashed from the item name so each
// flyer is stable across re-renders while the set varies — day 1-28, any
// month, always 2028.
function randomBestBefore(name) {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  let h = 2166136261;
  for (const ch of String(name).toLowerCase()) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const day = (h % 28) + 1;
  const month = (h >>> 7) % 12;
  return `${day} ${MONTHS[month]} 2028`;
}

const svgPng = (svg) => sharp(Buffer.from(svg)).png().toBuffer();

// Load configuration
async function loadConfig() {
  const configPath = path.join(ROOT, 'store-config.json');
  const configData = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configData);
}

// Parse command line arguments for item selection
function parseItems(args) {
  const itemIndex = args.indexOf('--item');
  const itemsIndex = args.indexOf('--items');

  if (itemIndex !== -1 && args[itemIndex + 1]) {
    return [args[itemIndex + 1]];
  }

  if (itemsIndex !== -1 && args[itemsIndex + 1]) {
    return args[itemsIndex + 1].split(',').map(s => s.trim());
  }

  return null; // Generate all items
}

// Load and resize a food item image
async function foodItemLayer(imagePath, targetSize = 250) {
  try {
    const fullPath = path.join(ROOT, imagePath);
    const src = await fs.readFile(fullPath);
    const buf = await sharp(src)
      .resize({ width: targetSize, height: targetSize, fit: 'cover' })
      .png()
      .toBuffer();
    return buf;
  } catch (e) {
    console.warn(`[store-flyer] Could not load ${imagePath}: ${e.message}`);
    return null;
  }
}

// Create a circular mask for food items
async function circularMask(diameter) {
  const r = diameter / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>
    </svg>`
  );
}

// Load NAFDAC logo
async function nafdacLayer(width = 120) {
  try {
    const src = await fs.readFile(NAFDAC_LOGO);
    const buf = await sharp(src)
      .resize({ width, height: null, fit: 'inside' })
      .png()
      .toBuffer();
    return buf;
  } catch (e) {
    console.warn('[store-flyer] Could not load NAFDAC logo:', e.message);
    return null;
  }
}

// Position food items in a 3x3 grid
function getGridPositions(startX, startY, itemSize, gap, cols = 3) {
  const positions = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: startX + col * (itemSize + gap),
        y: startY + row * (itemSize + gap),
      });
    }
  }
  return positions;
}

// Render portrait flyer (1080x1350)
async function renderStoreFlyer(config) {
  const { featuredItem, foodItems } = config;

  // Base layers
  const backdrop = await svgPng(storeBackdropSvg());
  const frame = await svgPng(storeFrameSvg(config));
  const front = await svgPng(storeFrontSvg(config));

  // Featured item (Garri) - large at top
  const featuredImg = await foodItemLayer(featuredItem.image, 450);
  const featuredMask = await circularMask(450);
  const featuredCropped = featuredImg
    ? await sharp(featuredImg).composite([{ input: featuredMask, blend: 'dest-in' }]).png().toBuffer()
    : null;

  // Skip if no featured image
  if (!featuredCropped) {
    console.warn('[store-flyer] Skipping portrait flyer - no featured image available');
    return;
  }

  const featuredText = await svgPng(featuredItemTextSvg(featuredItem));

  // Load food items for grid
  const gridPositions = getGridPositions(90, 500, 250, 45);
  const foodLayers = [];

  for (let i = 0; i < Math.min(foodItems.length, 9); i++) {
    const item = foodItems[i];
    const pos = gridPositions[i];
    const img = await foodItemLayer(item.image, 250);

    if (img) {
      const mask = await circularMask(250);
      const cropped = await sharp(img)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();

      // Add gold ring around each item
      const ring = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250">
          <circle cx="125" cy="125" r="122" fill="none" stroke="#c6a23b" stroke-width="3" stroke-opacity="0.8"/>
        </svg>`
      );
      const withRing = await sharp(cropped).composite([{ input: ring }]).png().toBuffer();

      foodLayers.push({ input: withRing, left: pos.x, top: pos.y });
    }
  }

  // Load NAFDAC logo
  const nafdac = await nafdacLayer(120);

  // Composite all layers
  const layers = [];
  layers.push({ input: frame, left: 0, top: 0 });

  // Add gold ring around featured item
  const featuredRing = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450">
      <circle cx="225" cy="225" r="220" fill="none" stroke="#c6a23b" stroke-width="5" stroke-opacity="0.9"/>
    </svg>`
  );
  const featuredWithRing = await sharp(featuredCropped)
    .composite([{ input: featuredRing }])
    .png()
    .toBuffer();
  layers.push({ input: featuredWithRing, left: 315, top: 200 });

  // Add food item grid
  foodLayers.forEach(layer => layers.push(layer));

  // Add featured text
  layers.push({ input: featuredText, left: 0, top: 0 });

  // Add NAFDAC logo (if available)
  if (nafdac) {
    layers.push({ input: nafdac, left: 480, top: 1250 });
  }

  // Add front overlay (contact info, dates)
  layers.push({ input: front, left: 0, top: 0 });

  await sharp(backdrop)
    .composite(layers)
    .png()
    .toFile(path.join(DESIGN, 'store-flyer-1080x1350.png'));
}

// Render square flyer (1080x1080)
async function renderStoreSquareFlyer(config) {
  const { featuredItem, foodItems } = config;

  // Base layers
  const backdrop = await svgPng(storeBackdropSvg(1080, 1080));
  const frame = await svgPng(storeSquareFrameSvg(config));
  const front = await svgPng(storeSquareFrontSvg(config));

  // Featured item (Garri) - medium size
  const featuredImg = await foodItemLayer(featuredItem.image, 350);
  const featuredMask = await circularMask(350);
  const featuredCropped = featuredImg
    ? await sharp(featuredImg).composite([{ input: featuredMask, blend: 'dest-in' }]).png().toBuffer()
    : null;

  // Skip if no featured image
  if (!featuredCropped) {
    console.warn('[store-flyer] Skipping square flyer - no featured image available');
    return;
  }

  const featuredText = await svgPng(featuredItemTextSvg(featuredItem));

  // Load food items for circular arrangement
  const centerX = 540;
  const centerY = 580;
  const radius = 240; // Reduced to ensure items stay within bounds
  const foodLayers = [];

  for (let i = 0; i < Math.min(foodItems.length, 9); i++) {
    const item = foodItems[i];
    const angle = (i * 40) * (Math.PI / 180) - Math.PI / 2; // Start from top
    const x = Math.round(centerX + radius * Math.cos(angle) - 90);
    const y = Math.round(centerY + radius * Math.sin(angle) - 90);

    // Skip if position is out of bounds
    if (x < 0 || y < 0 || x > 900 || y > 900) {
      console.warn(`[store-flyer] Skipping item ${i} - position out of bounds: ${x}, ${y}`);
      continue;
    }

    const img = await foodItemLayer(item.image, 180);

    if (img) {
      const mask = await circularMask(180);
      const cropped = await sharp(img)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();

      // Add gold ring
      const ring = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
          <circle cx="90" cy="90" r="87" fill="none" stroke="#c6a23b" stroke-width="2.5" stroke-opacity="0.8"/>
        </svg>`
      );
      const withRing = await sharp(cropped).composite([{ input: ring }]).png().toBuffer();

      foodLayers.push({ input: withRing, left: x, top: y });
    }
  }

  // Load NAFDAC logo
  const nafdac = await nafdacLayer(100);

  // Composite all layers
  const layers = [];
  layers.push({ input: frame, left: 0, top: 0 });

  const featuredRing = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">
      <circle cx="175" cy="175" r="170" fill="none" stroke="#c6a23b" stroke-width="4" stroke-opacity="0.9"/>
    </svg>`
  );
  const featuredWithRing = await sharp(featuredCropped)
    .composite([{ input: featuredRing }])
    .png()
    .toBuffer();
  layers.push({ input: featuredWithRing, left: 365, top: 185 });

  // Add food items in circle
  foodLayers.forEach(layer => layers.push(layer));

  // Add featured text
  layers.push({ input: featuredText, left: 0, top: 0 });

  // Add NAFDAC logo
  if (nafdac) {
    const nafdacMeta = await sharp(nafdac).metadata();
    if (nafdacMeta.width > 1080 || nafdacMeta.height > 1080) {
      console.warn('[store-flyer] NAFDAC logo too large, skipping');
    } else {
      layers.push({ input: nafdac, left: 490, top: 1010 });
    }
  }

  // Add front overlay
  layers.push({ input: front, left: 0, top: 0 });

  // Validate all layers before compositing
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer.input) {
      const meta = await sharp(layer.input).metadata();
      const rightEdge = (layer.left || 0) + meta.width;
      const bottomEdge = (layer.top || 0) + meta.height;
      if (rightEdge > 1080 || bottomEdge > 1080) {
        console.warn(`[store-flyer] Layer ${i} exceeds canvas bounds, skipping`);
        layers.splice(i, 1);
        i--;
      }
    }
  }

  await sharp(backdrop)
    .composite(layers)
    .png()
    .toFile(path.join(DESIGN, 'store-flyer-1080x1080.png'));
}

// Load a food image resized to exact dimensions. An optional `crop`
// ({top, bottom, left, right} fractions) trims clutter off the source first.
async function foodImageExact(imagePath, w, h, crop) {
  try {
    const fullPath = path.join(ROOT, imagePath);
    const src = await fs.readFile(fullPath);
    let img = sharp(src);
    if (crop) {
      const meta = await img.metadata();
      const l = Math.round(meta.width * (crop.left || 0));
      const t = Math.round(meta.height * (crop.top || 0));
      img = img.extract({
        left: l,
        top: t,
        width: Math.round(meta.width * (1 - (crop.left || 0) - (crop.right || 0))),
        height: Math.round(meta.height * (1 - (crop.top || 0) - (crop.bottom || 0))),
      });
    }
    return await img
      .resize({ width: w, height: h, fit: 'cover' })
      .png()
      .toBuffer();
  } catch (e) {
    console.warn(`[store-flyer] Could not load ${imagePath}: ${e.message}`);
    return null;
  }
}

// Arch-shaped mask (matches the arch in the frame SVG) for the photo fallback
function archMask(w, h) {
  const r = w / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <path d="M0 ${h} V${r} A${r} ${r} 0 0 1 ${w} ${r} V${h} Z" fill="#fff"/>
    </svg>`
  );
}

// Product cutout (tools/food-cutout.py output): trimmed, fitted inside the
// layout's product box, bottom-aligned so it reads as standing on the arch
// floor. Returns a shadow layer + the cutout layer, or null when missing.
async function productCutoutLayer(item, L) {
  const box = L.product;
  try {
    const src = await fs.readFile(path.join(CUTOUT_DIR, `${slug(item.name)}.png`));
    const buf = await sharp(src)
      .ensureAlpha()
      .trim({ threshold: 10 })
      .resize({ width: box.w, height: box.h, fit: 'inside' })
      .png()
      .toBuffer();
    const m = await sharp(buf).metadata();
    const left = Math.round(box.x + (box.w - m.width) / 2);
    const top = Math.round(box.y + box.h - m.height);

    // Soft elliptical contact shadow hugging the product's base
    const shW = Math.round(m.width * 0.92), shH = Math.round(m.width * 0.13);
    const shadow = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${shW}" height="${shH}">
        <defs><radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity="0.5"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="${shW / 2}" cy="${shH / 2}" rx="${shW / 2}" ry="${shH / 2}" fill="url(#sh)"/>
      </svg>`
    );
    return [
      { input: shadow, left: Math.round(box.x + (box.w - shW) / 2), top: box.y + box.h - Math.round(shH / 2) },
      { input: buf, left, top },
    ];
  } catch {
    return null;
  }
}

// Fallback when no cutout exists: the original photo clipped to the arch.
// Honours the item's `crop` so foreground clutter (e.g. a bag) is excluded.
async function archPhotoLayer(item, L) {
  const a = L.arch;
  const w = a.w - 24, h = a.h - 24;
  const img = await foodImageExact(item.image, w, h, item.crop);
  if (!img) return null;
  const clipped = await sharp(img)
    .composite([{ input: await archMask(w, h), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return { input: clipped, left: a.x + 12, top: a.y + 12 };
}

// Faded Nigerian-market photo sandwiched between the opaque base and the
// transparent scene. Blurred, darkened and mostly desaturated so it reads as
// a ghost of a marketplace behind the design, not a competing photo.
async function marketGhostLayer(L) {
  try {
    const src = await fs.readFile(MARKET_IMAGE);
    const buf = await sharp(src)
      .resize({ width: L.w, height: L.h, fit: 'cover' })
      .blur(2)
      .modulate({ brightness: 0.62, saturation: 0.6 })
      .ensureAlpha(0.32)
      .png()
      .toBuffer();
    return { input: buf, left: 0, top: 0 };
  } catch {
    return null;
  }
}

// The real adire fabric photo, softened and encoded as a data URI so the
// scene SVG can embed it inside the arch behind the product cutout. Falls
// back to the vector adire wash in the template when the file is missing.
async function adireFabricDataUri(L) {
  try {
    const a = L.arch;
    const buf = await sharp(ADIRE_FABRIC)
      .resize({ width: a.w, height: a.h, fit: 'cover' })
      .blur(1)
      .modulate({ brightness: 1.45, saturation: 0.9 })
      .jpeg({ quality: 82 })
      .toBuffer();
    return 'data:image/jpeg;base64,' + buf.toString('base64');
  } catch {
    return null;
  }
}

// Render one single-item flyer in a given layout (portrait / square)
async function renderSingleItem(config, item, layout, file) {
  const L = SINGLE_LAYOUTS[layout];
  const base = await svgPng(singleItemBaseSvg(L));
  const adireUri = await adireFabricDataUri(L);
  const scene = await svgPng(singleItemSceneSvg(config, L, adireUri, randomBestBefore(item.name)));
  const front = await svgPng(
    (layout === 'portrait' ? singleItemFrontSvg : singleItemSquareFrontSvg)(item.name)
  );

  const layers = [];
  const ghost = await marketGhostLayer(L);
  if (ghost) layers.push(ghost);
  layers.push({ input: scene, left: 0, top: 0 });
  const cutout = await productCutoutLayer(item, L);
  if (cutout) {
    layers.push(...cutout);
  } else {
    const photo = await archPhotoLayer(item, L);
    if (!photo) {
      console.warn(`[store-flyer] Skipping ${item.name} - no image available`);
      return;
    }
    layers.push(photo);
  }
  layers.push({ input: front, left: 0, top: 0 });

  await sharp(base).composite(layers).png().toFile(path.join(DESIGN, file));
}

const renderSingleItemFlyer = (config, item) =>
  renderSingleItem(config, item, 'portrait', `${slug(item.name)}-flyer.png`);

const renderSingleItemSquareFlyer = (config, item) =>
  renderSingleItem(config, item, 'square', `${slug(item.name)}-flyer-square.png`);

// Grid photo honouring the item's `crop` fractions (same math as the cutout
// tool) so cluttered source frames don't leak into the range grid.
async function gridPhotoLayer(item, size) {
  try {
    const src = await fs.readFile(path.join(ROOT, item.image));
    let img = sharp(src);
    if (item.crop) {
      const m = await img.metadata();
      const c = item.crop;
      img = img.extract({
        left: Math.round(m.width * (c.left || 0)),
        top: Math.round(m.height * (c.top || 0)),
        width: Math.round(m.width * (1 - (c.left || 0) - (c.right || 0))),
        height: Math.round(m.height * (1 - (c.top || 0) - (c.bottom || 0))),
      });
    }
    return img.resize({ width: size, height: size, fit: 'cover' }).png().toBuffer();
  } catch {
    return null;
  }
}

// General store flyer: featured item in the arch, the rest of the range as a
// ringed grid, store-level brush banner. Same layer stack as the single-item
// flyers: base → market ghost → scene → cutout/photos → banner.
async function renderGeneralFlyer(config, layout, file) {
  const L = GENERAL_LAYOUTS[layout];
  const base = await svgPng(singleItemBaseSvg(L));
  const adireUri = await adireFabricDataUri(L);
  const scene = await svgPng(generalStoreSceneSvg(config, L, adireUri, randomBestBefore(config.featuredItem.name)));
  const front = await svgPng(generalStoreFrontSvg(L));

  const layers = [];
  const ghost = await marketGhostLayer(L);
  if (ghost) layers.push(ghost);
  layers.push({ input: scene, left: 0, top: 0 });

  const cutout = await productCutoutLayer(config.featuredItem, L);
  if (cutout) {
    layers.push(...cutout);
  } else {
    const photo = await archPhotoLayer(config.featuredItem, L);
    if (photo) layers.push(photo);
  }

  const slots = generalGridSlots(L);
  const featured = String(config.featuredItem.name || '').toLowerCase();
  const gridItems = config.foodItems
    .filter((i) => i.name.toLowerCase() !== featured)
    .slice(0, slots.length);
  for (let i = 0; i < gridItems.length; i++) {
    const img = await gridPhotoLayer(gridItems[i], slots[i].size);
    if (!img) continue;
    const masked = await sharp(img)
      .composite([{ input: await circularMask(slots[i].size), blend: 'dest-in' }])
      .png()
      .toBuffer();
    const ring = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${slots[i].size}" height="${slots[i].size}">
        <circle cx="${slots[i].size / 2}" cy="${slots[i].size / 2}" r="${slots[i].size / 2 - 3}"
          fill="none" stroke="#c6a23b" stroke-width="3" stroke-opacity="0.85"/>
      </svg>`
    );
    layers.push({
      input: await sharp(masked).composite([{ input: ring }]).png().toBuffer(),
      left: slots[i].x,
      top: slots[i].y,
    });
  }

  layers.push({ input: front, left: 0, top: 0 });
  await sharp(base).composite(layers).png().toFile(path.join(DESIGN, file));
}

async function main() {
  // Ensure directories exist
  await fs.mkdir(DESIGN, { recursive: true });
  await fs.mkdir(FOOD_DIR, { recursive: true });

  // Load configuration
  const config = await loadConfig();

  // Parse command line arguments
  const selectedItems = parseItems(process.argv.slice(2));

  // Determine which items to render
  let itemsToRender = [];
  if (selectedItems) {
    // Render specific items
    itemsToRender = config.foodItems.filter(item =>
      selectedItems.includes(item.name.toLowerCase())
    );
    if (itemsToRender.length === 0) {
      console.error('[store-flyer] No matching items found. Available items:');
      config.foodItems.forEach(item => console.log(`  - ${item.name.toLowerCase()}`));
      process.exit(1);
    }
  } else {
    // Render all items
    itemsToRender = config.foodItems;
  }

  console.log(`[store-flyer] Rendering ${itemsToRender.length} food item flyers...`);

  // Render each item
  for (const item of itemsToRender) {
    console.log(`[store-flyer] Rendering ${item.name}...`);
    await renderSingleItemFlyer(config, item);
    await renderSingleItemSquareFlyer(config, item);
  }

  console.log('[store-flyer] Rendering general store flyers...');
  await renderGeneralFlyer(config, 'portrait', 'store-flyer-1080x1350.png');
  await renderGeneralFlyer(config, 'square', 'store-flyer-1080x1080.png');

  console.log('[store-flyer] Done! Generated flyers:');
  itemsToRender.forEach(item => {
    const name = item.name.toLowerCase().replace(/\s+/g, '-');
    console.log(`  - design/${name}-flyer.png`);
    console.log(`  - design/${name}-flyer-square.png`);
  });
  console.log('  - design/store-flyer-1080x1350.png');
  console.log('  - design/store-flyer-1080x1080.png');
  console.log('');
  console.log('Usage:');
  console.log('  Generate all items: npm run store-flyer');
  console.log('  Generate one item: npm run store-flyer --item garri');
  console.log('  Generate specific items: npm run store-flyer --items garri,egusi,ogbono');
  console.log('');
  console.log('To edit: Modify store-config.json and run npm run store-flyer');
  console.log('Tip: run `python tools/food-cutout.py` to give products transparent');
  console.log('  backgrounds — flyers use assets/food/cutouts/<item>.png when present.');
}

main().catch((e) => {
  console.error('[store-flyer] Error:', e);
  process.exit(1);
});
