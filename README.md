# BitMapper

BitMapper is a small Vue app for visualizing binary data as a pixel grid. Choose a grid resolution and color depth, enter a binary string, and see each bit or bit group rendered as a colored pixel.

## Features

- Grid resolutions from `4x4` through `8x8`
- 1-bit, 2-bit, and 3-bit color depths
- Rainbow, 3-bit RGB, and custom palettes
- Optional pixel labels and grid lines
- Custom colors for every 3-bit palette entry
- Hidden `16x16` mode, activated with `Alt`-click on the version label

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
- **3-bit RGB:** the eight combinations of red, green, and blue
- **3-bit Custom:** choose each palette color with the color pickers

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
