# Nigerian Store Flyer Generator

An editable flyer system for Nigerian food stores with authentic cultural design patterns, earthy natural tones, and support for generating individual flyers for each food item.

## Features

- **One Food Item Per Flyer**: Generate separate flyers for each Nigerian food item
- **Selective Generation**: Generate all items, one item, or specific items
- **Earthy Natural Tones**: Warm terracotta, sage green, golden ochre color palette
- **Cultural Symbols**: Calabash bowl frames, cowrie shell decorations, adinkra patterns
- **Central Focus Layout**: Food item prominently centered with cultural decorations
- **Two Sizes**: Generates both portrait (1080x1350) and square (1080x1080) flyers
- **Editable Configuration**: All store details and food items in `store-config.json`

## Quick Start

1. **Download Food Images** (Recommended):
   ```bash
   node scripts/download-food-images.js
   ```
   This downloads high-quality food images from Unsplash and other free sources.

   Or manually add your own images to `assets/food/` folder:
   - garri.jpg
   - egusi.jpg
   - ogbono.jpg
   - dry-fish.jpg
   - kpomo.jpg
   - otazi.jpg
   - scent-leaf.jpg
   - negro-pepper.jpg
   - stockfish.jpg
   - dried-bitterleaf.jpg

2. **Edit Configuration**: Open `store-config.json` and customize store details

3. **Generate Flyers**:
   ```bash
   # Generate all food item flyers
   npm run store-flyer

   # Generate one specific item
   node scripts/render-store-flyer.js --item garri

   # Generate specific items
   node scripts/render-store-flyer.js --items garri,egusi,ogbono
   ```

4. **Find Output**: Flyers are generated in the `design/` folder:
   - `garri-flyer.png` (portrait)
   - `garri-flyer-square.png` (square)
   - And so on for each item...

## Configuration File Structure

```json
{
  "store": {
    "name": "Amaka Grocery Village",
    "tagline": "One Stop Shop for All",
    "address": "No. 15 Okpanam Road, Asaba",
    "phone": "08031456678",
    "whatsapp": "08031456678",
    "productionDate": "16 August 2026",
    "expiryDate": "31 December 2027",
    "nafdacNo": "A1-0000",
    "netWeight": "1kg"
  },
  "foodItems": [
    { "name": "garri", "image": "assets/food/garri.jpg" },
    { "name": "egusi", "image": "assets/food/egusi.jpg" },
    // ... more items
  ],
  "badges": {
    "nafdac": true,
    "quality": "100% Natural",
    "origin": "Made in Nigeria"
  }
}
```

## Design Elements

### Color Palette - Nigerian Product Label
- **Deep Forest Green** (`#1E4229`): Nigerian flag green, rich background
- **Golden Ochre** (`#CC9933`): Headings and borders
- **Warm Gold** (`#DAA520`): Accents and kente strips
- **Ivory/White** (`#FFFFFF`): Info text and product card
- **Kente accents**: Gold, rust red, sage green blocks

### Cultural Symbols
- **Kente Border Strips**: West African textile-inspired bands
- **Adire Pattern**: Circular tie-dye-inspired background motif
- **Cowrie Shells**: Decorative accents around the product card

### Layout - Product Label Style

**Portrait Flyer (1080x1350):**
- Kente-style border strips (top and bottom)
- Header: Store name + tagline + product name in gold
- Center: Food image inside a white product card with gold border
- Info panel (dark green rectangle): Production date, Best before, Net weight, NAFDAC Reg. No.
- Footer: Address + phone/WhatsApp

**Square Flyer (1080x1080):**
- Same layout, compressed for social media

## Command Usage

### Generate All Items
```bash
npm run store-flyer
```
Generates flyers for all 10 food items in `store-config.json`

### Generate One Item
```bash
node scripts/render-store-flyer.js --item garri
```
Generates only the garri flyer (both portrait and square)

### Generate Specific Items
```bash
node scripts/render-store-flyer.js --items garri,egusi,ogbono
```
Generates flyers for the specified items (comma-separated)

## Customization

### Adding/Removing Food Items

1. Add or remove items in the `foodItems` array in `store-config.json`
2. Add corresponding images to `assets/food/` folder
3. Run the appropriate command to regenerate

### Modifying Store Details

Edit the `store` section in `store-config.json`:
- `name`: Store name
- `tagline`: Store slogan
- `address`: Physical address
- `phone`: Phone number
- `whatsapp`: WhatsApp number
- `productionDate`: Production date
- `expiryDate`: Expiry date

## File Structure

```
ozinegbe70-bot/
├── store-config.json           # Configuration file
├── src/
│   └── store-templates.js      # SVG templates with cultural patterns
├── scripts/
│   └── render-store-flyer.js   # Render script with item selection
├── assets/
│   ├── food/                   # Food item images
│   │   ├── garri.jpg
│   │   ├── egusi.jpg
│   │   └── ...
│   └── nafdac-logo.png         # NAFDAC logo
└── design/
    ├── garri-flyer.png         # Individual item flyers
    ├── garri-flyer-square.png
    ├── egusi-flyer.png
    ├── egusi-flyer-square.png
    └── ...
```

## Troubleshooting

**Flyer doesn't show food image:**
- Ensure image is in `assets/food/` folder
- Check that image filename matches configuration (lowercase)
- Images should be .jpg or .png format

**Item not found error:**
- Item names in command must match exactly (lowercase)
- Check available items: `node scripts/render-store-flyer.js --item invalid`

**Compositing errors:**
- Check that all images are valid image files
- Ensure image dimensions are reasonable (recommended: 400x400 to 600x600)

## Image Sources & Downloading

### Automatic Download (Recommended)

The system includes a script to download high-quality food images:

```bash
node scripts/download-food-images.js
```

This script:
- Downloads images from Unsplash and other free stock photo sites
- Validates image quality and file size
- Saves to `assets/food/` with correct naming
- Uses rate limiting to be respectful to image hosts

### Manual Image Addition

You can also add your own food images:

1. Take photos of the actual food items
2. Save them as JPG files in `assets/food/` folder
3. Name them exactly as shown in `store-config.json` (lowercase)
4. Recommended size: 400x400 to 600x600 pixels

### Image Sources

The download script tries multiple sources:
- **Unsplash**: High-quality free stock photos
- **Wikimedia Commons**: Free images with Creative Commons licenses
- **Pexels**: Free stock photos

### Troubleshooting Downloads

If downloads fail:
- Check your internet connection
- Try again later (rate limiting)
- Manually download images and place them in `assets/food/`
- Use placeholder images generated by the script

## Image Recommendations

- **Food Images**: Square images (400x400 to 600x600 pixels) work best
- **Format**: JPG or PNG with transparent backgrounds work well
- **Quality**: High-resolution images for crisp appearance
- **Background**: Transparent or solid color backgrounds (no complex backgrounds)

## Notes

- The system gracefully handles missing images - skips those items
- Each food item gets its own individual flyer
- Both portrait and square versions are generated for each item
- Cultural symbols are automatically placed around the central food item
- Earthy color palette creates a natural, organic feel
