<template>
  <main class="app">
    <section class="controls">
      <h1>BitMapper</h1>
      <div class="settings">
        <label>Width <select v-model.number="xRes"><option v-for="r in resolutions" :key="r">{{ r }}</option></select></label>
        <label>Height <select v-model.number="yRes"><option v-for="r in resolutions" :key="r">{{ r }}</option></select></label>
        <label>Colour Depth <select v-model.number="colourDepth"><option v-for="n in 3" :key="n">{{ n }}</option></select></label>
        <label v-if="colourDepth === 3">Colour palette <select v-model="paletteChoice"><option value="default">Rainbow</option><option value="rgb">3bit RGB</option><option value="custom">Custom</option></select></label>
      </div>
      <h2>Paint colour</h2>
      <p class="hint">Choose a colour, then click or drag across the pixels.</p>
      <div class="palette">
        <div v-for="(colour, i) in palette" :key="i" class="palette-entry">
          <button class="swatch" :class="{selected: selected === i}" :aria-label="'Paint ' + pattern(i)" :aria-pressed="selected === i" :style="{background: colour, color: contrast(colour)}" @click="selected = i">{{ pattern(i) }}</button>
          <input v-if="colourDepth === 3 && paletteChoice === 'custom'" type="color" :aria-label="'Colour for ' + pattern(i)" v-model="custom[i]" />
        </div>
      </div>
      <p>Selected: <strong>{{ pattern(selected) }}</strong></p>
      <label class="data-label" for="binary">Binary data</label>
      <textarea id="binary" aria-label="Binary data" rows="8" :value="data" @input="updateData" spellcheck="false" placeholder="Type or paste bits, or paint on the grid"></textarea>
      <p class="hint">{{ data.length.toLocaleString() }} / {{ capacity.toLocaleString() }} bits · {{ colourDepth }} bits per pixel</p>
      <p class="warning" role="status">{{ warning }}</p>
      <p class="hint">Empty pixels use {{ pattern(0) }}. Incomplete bit groups are padded with zeros in the preview. Painting fills preceding empty pixels with zeros.</p>
    </section>
    <section ref="editor" class="editor">
      <div class="display-controls">
        <ToggleSwitch labelText="Labels" leftText="Show" rightText="Hide" v-model:state="showLabels" />
        <ToggleSwitch labelText="Grid Lines" leftText="Show" rightText="Hide" v-model:state="showGridlines" />
        <label>Zoom <select v-model.number="zoom"><option :value="1">Fit</option><option :value="2">2×</option><option :value="4">4×</option><option :value="8">8×</option></select></label>
      </div>
      <div class="viewport" :style="{ width: canvasWidth + 'px' }">
        <canvas ref="canvas" :style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}" tabindex="0" role="img" :aria-label="'Editable ' + xRes + ' by ' + yRes + ' pixel grid. Arrow keys move; Space or Enter paints.'" @pointerdown="startPaint" @pointermove="movePaint" @pointerup="stopPaint" @pointercancel="stopPaint" @lostpointercapture="stopPaint" @keydown="keyPaint" @focus="focused = true; draw()" @blur="focused = false; draw()"></canvas>
      </div>
      <p class="hint">{{ xRes }} × {{ yRes }} pixels · Zoom in for precise editing. Labels appear when pixels are large enough.</p>
      <p class="hint">Keyboard: arrow keys move; Space or Enter paints. Current pixel: {{ cursor % xRes + 1 }}, {{ Math.floor(cursor / xRes) + 1 }} · {{ pattern(valueAt(cursor)) }}</p>
      <p class="signature">Version 2.1 by michael201110</p>
    </section>
  </main>
</template>

<script>
import ToggleSwitch from './components/ToggleSwitch.vue';
export default {
  components: { ToggleSwitch },
  data() {
    return {
      resolutions: [4, 5, 6, 7, 8, 16, 32, 64, 128], xRes: 4, yRes: 4,
      colourDepth: 1, paletteChoice: 'default', selected: 1, data: '', warning: '',
      custom: ['#000000','#0000ff','#00ff00','#00ffff','#ff0000','#ff00ff','#ffff00','#ffffff'],
      showLabels: true, showGridlines: true, zoom: 1, available: 560,
      painting: false, lastPixel: null, cursor: 0, focused: false,
    };
  },
  computed: {
    capacity() { return this.xRes * this.yRes * this.colourDepth; },
    palette() {
      if (this.colourDepth === 1) return ['#000000','#ffffff'];
      if (this.colourDepth === 2) return ['#000000','#ff0000','#ffd700','#ffffff'];
      if (this.paletteChoice === 'custom') return this.custom;
      if (this.paletteChoice === 'rgb') return ['#000000','#0000ff','#00ff00','#00ffff','#ff0000','#ff00ff','#ffff00','#ffffff'];
      return ['#000000','#ff0000','#ff8c00','#ffd700','#00ff00','#0000ff','#4b0082','#ffffff'];
    },
    cellSize() { return Math.min(this.available / this.xRes, 560 / this.yRes) * this.zoom; },
    canvasWidth() { return this.cellSize * this.xRes; },
    canvasHeight() { return this.cellSize * this.yRes; },
  },
  watch: {
    data() { this.draw(); },
    capacity() { this.data = this.data.slice(0, this.capacity); this.cursor = Math.min(this.cursor, this.xRes * this.yRes - 1); this.draw(); },
    colourDepth() { this.selected = Math.min(this.selected, 2 ** this.colourDepth - 1); this.draw(); },
    palette: { deep: true, handler() { this.draw(); } },
    showLabels() { this.draw(); }, showGridlines() { this.draw(); },
    canvasWidth() { this.$nextTick(this.draw); }, canvasHeight() { this.$nextTick(this.draw); },
  },
  mounted() {
    this.observer = new ResizeObserver(([entry]) => { this.available = Math.max(1, entry.contentRect.width); });
    this.observer.observe(this.$refs.editor);
    this.draw();
  },
  beforeUnmount() { this.observer.disconnect(); cancelAnimationFrame(this.frame); },
  methods: {
    pattern(value) { return value.toString(2).padStart(this.colourDepth, '0'); },
    valueAt(index) { return parseInt(this.data.slice(index * this.colourDepth, (index + 1) * this.colourDepth).padEnd(this.colourDepth, '0'), 2); },
    contrast(hex) { return (parseInt(hex.slice(1,3),16)*299 + parseInt(hex.slice(3,5),16)*587 + parseInt(hex.slice(5,7),16)*114) / 1000 > 150 ? '#17202b' : '#ffffff'; },
    updateData(event) {
      const raw = event.target.value, binary = raw.replace(/[^01]/g, '');
      this.warning = raw !== binary ? 'Only 0 and 1 are kept.' : binary.length > this.capacity ? 'Grid capacity reached.' : '';
      this.data = binary.slice(0, this.capacity); event.target.value = this.data;
    },
    pixelAt(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / rect.width * this.xRes);
      const y = Math.floor((event.clientY - rect.top) / rect.height * this.yRes);
      return x < 0 || y < 0 || x >= this.xRes || y >= this.yRes ? null : y * this.xRes + x;
    },
    paint(index) {
      const start = index * this.colourDepth;
      const padded = this.data.padEnd(start + this.colourDepth, '0');
      this.data = padded.slice(0, start) + this.pattern(this.selected) + padded.slice(start + this.colourDepth);
      this.cursor = index; this.warning = ''; this.draw();
    },
    startPaint(event) {
      if (event.button !== 0) return;
      this.$refs.canvas.focus(); this.$refs.canvas.setPointerCapture(event.pointerId);
      this.painting = true; this.lastPixel = this.pixelAt(event);
      if (this.lastPixel !== null) this.paint(this.lastPixel);
    },
    movePaint(event) {
      if (!this.painting) return;
      const next = this.pixelAt(event);
      if (next === null) { this.lastPixel = null; return; }
      const prev = this.lastPixel ?? next;
      const x0 = prev % this.xRes, y0 = Math.floor(prev / this.xRes);
      const dx = next % this.xRes - x0, dy = Math.floor(next / this.xRes) - y0;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let i = 0; i <= steps; i++) this.paint((y0 + Math.round(dy * i / (steps || 1))) * this.xRes + x0 + Math.round(dx * i / (steps || 1)));
      this.lastPixel = next;
    },
    stopPaint() { this.painting = false; this.lastPixel = null; },
    keyPaint(event) {
      const x = this.cursor % this.xRes, y = Math.floor(this.cursor / this.xRes);
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft' && x > 0) this.cursor--;
      if (event.key === 'ArrowRight' && x < this.xRes - 1) this.cursor++;
      if (event.key === 'ArrowUp' && y > 0) this.cursor -= this.xRes;
      if (event.key === 'ArrowDown' && y < this.yRes - 1) this.cursor += this.xRes;
      if (event.key === ' ' || event.key === 'Enter') this.paint(this.cursor);
      this.draw();
    },
    draw() {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.drawFrame());
    },
    drawFrame() {
      const canvas = this.$refs.canvas; if (!canvas) return;
      const ratio = window.devicePixelRatio || 1, size = this.cellSize;
      canvas.width = Math.round(this.canvasWidth * ratio); canvas.height = Math.round(this.canvasHeight * ratio);
      const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
      for (let i = 0; i < this.xRes * this.yRes; i++) {
        const x = i % this.xRes * size, y = Math.floor(i / this.xRes) * size;
        const value = this.valueAt(i), colour = this.palette[value];
        ctx.fillStyle = colour; ctx.fillRect(x, y, size + 0.5, size + 0.5);
        if (this.showLabels && size >= (this.colourDepth === 3 ? 30 : 22)) {
          ctx.fillStyle = this.contrast(colour); ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(this.pattern(value), x + size / 2, y + size / 2);
        }
      }
      if (this.showGridlines && size >= 5) {
        ctx.strokeStyle = '#888888'; ctx.lineWidth = 0.5; ctx.beginPath();
        for (let x = 0; x <= this.xRes; x++) { ctx.moveTo(x * size, 0); ctx.lineTo(x * size, this.canvasHeight); }
        for (let y = 0; y <= this.yRes; y++) { ctx.moveTo(0, y * size); ctx.lineTo(this.canvasWidth, y * size); }
        ctx.stroke();
      }
      if (this.focused) {
        ctx.strokeStyle = '#00bfff'; ctx.lineWidth = 2;
        ctx.strokeRect(this.cursor % this.xRes * size + 1, Math.floor(this.cursor / this.xRes) * size + 1, Math.max(1,size-2), Math.max(1,size-2));
      }
    },
  },
};
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; background: #f5f6f8; color: #25394b; font-family: Consolas, monospace; }
.app { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 28px; max-width: 1100px; margin: 32px auto; padding: 28px; background: #e5e5e5; border-radius: 12px; box-shadow: 0 8px 24px #0002; }
h1 { margin: 0 0 24px; font-size: 32px; } h2 { margin-top: 24px; font-size: 17px; }
.settings { display: flex; flex-wrap: wrap; gap: 14px; } label { font-size: 14px; } select { padding: 5px; border-radius: 4px; }
.hint { font-size: 12px; line-height: 1.6; color: #53616d; } .palette { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.palette-entry { display: grid; gap: 6px; } .swatch { min-height: 46px; border: 2px solid #89929b; border-radius: 7px; cursor: pointer; font-family: inherit; }
.swatch.selected { outline: 3px solid #2469b2; outline-offset: 2px; } .palette input { width: 100%; height: 30px; }
.data-label { display: block; margin-bottom: 8px; } textarea { width: 100%; resize: vertical; font-family: inherit; padding: 10px; overflow-wrap: anywhere; }
.warning { color: #a12c14; font-size: 12px; min-height: 16px; } .editor { min-width: 0; }
.display-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 20px; }
.viewport { max-width: 100%; overflow: auto; max-height: 650px; background: #cdd2d8; }
canvas { display: block; touch-action: none; cursor: crosshair; } canvas:focus-visible { outline: 2px solid #2469b2; outline-offset: -2px; }
.signature { text-align: right; font-size: 12px; margin-top: 24px; }
@media (max-width: 760px) { .app { grid-template-columns: 1fr; padding: 18px; margin: 12px; gap: 20px; } .viewport { max-height: 65vh; } }
</style>
