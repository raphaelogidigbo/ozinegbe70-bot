import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FOOD_DIR = path.join(ROOT, 'assets', 'food');

// Create realistic food-like images with gradients and textures
async function createFoodImage(name, colors, texture = 'grain') {
  const size = 600;

  let gradient;
  if (texture === 'grain') {
    gradient = `
      <defs>
        <radialGradient id="grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="${colors.light}"/>
          <stop offset="0.5" stop-color="${colors.main}"/>
          <stop offset="1" stop-color="${colors.dark}"/>
        </radialGradient>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="${colors.main}" fill-opacity="0.1"/>
          <circle cx="2" cy="2" r="1" fill="${colors.dark}" fill-opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <rect width="${size}" height="${size}" fill="url(#grain)"/>
    `;
  } else if (texture === 'speckled') {
    gradient = `
      <defs>
        <radialGradient id="grad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="${colors.light}"/>
          <stop offset="0.6" stop-color="${colors.main}"/>
          <stop offset="1" stop-color="${colors.dark}"/>
        </radialGradient>
        <pattern id="speckles" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2" fill="${colors.accent}" fill-opacity="0.4"/>
          <circle cx="15" cy="12" r="1.5" fill="${colors.accent}" fill-opacity="0.3"/>
          <circle cx="10" cy="18" r="2" fill="${colors.accent}" fill-opacity="0.35"/>
        </pattern>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <rect width="${size}" height="${size}" fill="url(#speckles)"/>
    `;
  } else if (texture === 'smooth') {
    gradient = `
      <defs>
        <radialGradient id="grad" cx="0.3" cy="0.3" r="0.7">
          <stop offset="0" stop-color="${colors.light}"/>
          <stop offset="0.5" stop-color="${colors.main}"/>
          <stop offset="1" stop-color="${colors.dark}"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
    `;
  }

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      ${gradient}
    </svg>`
  );

  return await sharp(svg).png().toBuffer();
}

// Food item color schemes
const foodColors = {
  garri: {
    main: '#F4D03F',
    light: '#F9E79F',
    dark: '#D4AC0D',
    accent: '#B7950B',
    texture: 'grain'
  },
  egusi: {
    main: '#E8D8A8',
    light: '#F5E6C4',
    dark: '#C9B274',
    accent: '#8B7355',
    texture: 'speckled'
  },
  ogbono: {
    main: '#8B7355',
    light: '#A69270',
    dark: '#6B5440',
    accent: '#4A3728',
    texture: 'smooth'
  },
  'dry-fish': {
    main: '#C9A882',
    light: '#E0C4A8',
    dark: '#A08060',
    accent: '#8B6914',
    texture: 'grain'
  },
  kpomo: {
    main: '#8B4513',
    light: '#CD853F',
    dark: '#5D2906',
    accent: '#D2691E',
    texture: 'smooth'
  },
  otazi: {
    main: '#6B8E23',
    light: '#9ACD32',
    dark: '#556B2F',
    accent: '#4A5D23',
    texture: 'speckled'
  },
  'scent-leaf': {
    main: '#2E8B57',
    light: '#3CB371',
    dark: '#1E5E39',
    accent: '#228B22',
    texture: 'grain'
  },
  'negro-pepper': {
    main: '#1A1A1A',
    light: '#4A4A4A',
    dark: '#000000',
    accent: '#8B0000',
    texture: 'speckled'
  },
  stockfish: {
    main: '#D2B48C',
    light: '#E8DCC4',
    dark: '#A89070',
    accent: '#8B7355',
    texture: 'grain'
  },
  'dried-bitterleaf': {
    main: '#556B2F',
    light: '#6B8E23',
    dark: '#3A4F20',
    accent: '#4A5D23',
    texture: 'grain'
  }
};

async function main() {
  await fs.mkdir(FOOD_DIR, { recursive: true });

  for (const [name, colors] of Object.entries(foodColors)) {
    console.log(`Creating ${name} image...`);
    const image = await createFoodImage(name, colors, colors.texture);
    await fs.writeFile(path.join(FOOD_DIR, `${name}.jpg`), image);
  }

  console.log('Food images created successfully!');
}

main().catch(console.error);
