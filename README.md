# BitMapper

BitMapper is a small Vue app for visualizing binary data as a pixel grid. Choose a grid resolution and color depth, enter a binary string, and see each bit or bit group rendered as a colored pixel.

## Features

- Full RGB mode: 24-bit pixels with 8 bits each for red, green and blue, a colour picker, and an eyedropper
- Full RGB imports preserve sampled image colours; PNG/BMP exports and editable projects support full colour
- Switching from indexed to Full RGB preserves colours; switching back matches the nearest palette colour after confirmation

- Independent width and height: 4, 5, 6, 7, 8, 16, 32, 64, or 128 pixels
- 1-bit through 6-bit color depths (2 to 64 palette entries)
- Rainbow, grayscale, RGB, and custom palettes
- Optional pixel labels and grid lines
- Custom colors for every palette entry, including 16-, 32-, and 64-colour modes
- Click or drag to paint with any palette colour; binary data stays in sync
- Fit view and 2×, 4×, and 8× zoom with scrolling for detailed editing
- Keyboard editing: arrow keys move the cursor; Space or Enter paints

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Use BitMapper

1. Choose the horizontal and vertical resolution.
2. Select a color depth.
3. Enter a string containing only `0` and `1` in the data field.
4. The input is grouped according to the selected color depth and mapped from left to right, then top to bottom.
5. Use the Labels and Grid Lines switches to adjust the display.

The maximum input length is:

```text
horizontal resolution x vertical resolution x color depth
```

For example, a `4x4` grid at 2-bit color depth accepts up to 32 bits.

### Color modes

- **1-bit:** black and white
- **2-bit:** black, red, gold, and white
- **3-bit Rainbow:** eight colors arranged from black through the spectrum to white
- **RGB:** indexed red, green, and blue palettes at 3, 4, 5, and 6 bits (8, 16, 32, or 64 colours)
- **4-bit and 5-bit Rainbow:** 16 or 32 evenly spaced spectrum colours
- **Grayscale:** evenly spaced black-to-white entries at any depth
- **Custom:** choose each palette colour with the colour pickers

## Production build

```bash
npm run build
```

The generated files are written to `dist/`.

## Project structure

```text
src/
  App.vue
  main.js
  components/
    Picker.vue
    Pixel.vue
    ToggleSwitch.vue
```

## License

No license has been specified yet.

## GitHub Pages

Live app: https://michael201110.github.io/BitMapper/

Pushes to `main` automatically build and deploy through `.github/workflows/pages.yml`.
The Vite base path is `/BitMapper/`, matching the repository URL.
To reproduce the deployment locally, run `npm ci` followed by `npm run build`.

## Pixel editing

Select a paint colour by its bit pattern, then click or drag on the grid. Custom palette colour pickers change the colour for that bit pattern everywhere. Empty pixels are zero; painting beyond the current input fills the gap with zeros. Incomplete bit groups are padded on the right in the preview. Changing dimensions or colour depth reinterprets the row-major bit stream and truncates it if the new capacity is smaller. Labels appear only when cells are large enough; zoom in to read them.

### Sharing and image conversion

Save a .bitmapper project to reopen it with its exact grid, depth, palette, and data. PNG and BMP exports can be imported again. The image importer also accepts other browser-readable formats such as JPEG and WebP; it scales them to the selected grid and maps each pixel to the nearest active palette colour. Transparent areas are composited onto white.
