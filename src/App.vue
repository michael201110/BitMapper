<template>
  <main class="app">
    <section class="controls">
      <h1>BitMapper</h1>
      <div class="toolbar">
        <fieldset class="control-group"><legend>Edit</legend><div class="group-actions"><button @click="undo" :disabled="!past.length">Undo</button><button @click="redo" :disabled="!future.length">Redo</button><button @click="clearGrid">Clear</button></div></fieldset>
        <fieldset class="control-group file-group"><legend>Files</legend><div class="group-actions">
          <button @click="saveProject">Save project</button><button @click="$refs.importFile.click()">Import</button>
          <details class="export-menu"><summary>Export</summary><div class="export-options"><button @click="exportPNG">PNG</button><button @click="exportBMP">BMP</button></div></details>
        </div></fieldset>
        <input ref="importFile" type="file" accept=".bitmapper,.json,image/*" hidden @change="handleImport" />
      </div>
      <fieldset class="settings"><legend>Grid</legend>
        <label>Width <select :value="xRes" @change="resize($event, 'width')"><option v-for="r in resolutions" :key="r">{{ r }}</option></select></label>
        <label>Height <select :value="yRes" @change="resize($event, 'height')"><option v-for="r in resolutions" :key="r">{{ r }}</option></select></label>
        <label>Colour Depth <select :value="colourDepth" @change="changeDepth"><option v-for="n in 6" :key="n" :value="n">{{ n }}-bit indexed</option><option :value="24">Full RGB (24-bit)</option></select></label>
        <label v-if="colourDepth >= 3 && colourDepth !== 24">Colour palette <select :value="paletteChoice" @change="checkpoint(); paletteChoice = $event.target.value"><option value="default">Rainbow</option><option value="grayscale">Grayscale</option><option value="rgb">RGB</option><option value="custom">Custom</option></select></label>
      </fieldset>
      <fieldset v-if="colourDepth === 24" class="palette-group"><legend>Paint colour</legend><input aria-label="Paint colour" type="color" v-model="paintColour" /> <span>{{ paintColour }}</span></fieldset><fieldset v-else class="palette-group"><legend>Palette</legend><div class="palette">
        <div v-for="(colour, i) in palette" :key="i" class="palette-entry">
          <button class="swatch" :class="{selected: selected === i}" :aria-label="'Paint ' + pattern(i)" :aria-pressed="selected === i" :style="{background: colour, color: contrast(colour)}" @click="selected = i">{{ pattern(i) }}</button>
          <input v-if="colourDepth >= 3 && paletteChoice === 'custom'" type="color" :aria-label="'Colour for ' + pattern(i)" :value="custom[i]" @change="checkpoint(); custom[i] = $event.target.value" />
        </div>
      </div></fieldset>
      <label class="data-label" for="binary">Binary data</label>
      <textarea ref="binary" id="binary" aria-label="Binary data" rows="8" :value="data" @input="updateData" @click="selectFromBits" @keyup="selectFromBits" spellcheck="false" placeholder="0101…"></textarea>
      <div v-if="hasSelection" class="inspector">Pixel {{ cursor % xRes + 1 }}, {{ Math.floor(cursor / xRes) + 1 }} · <mark>{{ pattern(valueAt(cursor)) }}</mark> = {{ valueAt(cursor) }} <button @click="highlightBits(true)">Show bits</button></div>
      <p v-if="warning" class="warning" role="status">{{ warning }}</p>
    </section>
    <section ref="editor" class="editor">
      <div class="display-controls">
        <ToggleSwitch labelText="Labels" leftText="Show" rightText="Hide" v-model:state="showLabels" />
        <ToggleSwitch labelText="Grid Lines" leftText="Show" rightText="Hide" v-model:state="showGridlines" />
        <label>Zoom <select v-model.number="zoom"><option :value="1">Fit</option><option :value="2">2×</option><option :value="4">4×</option><option :value="8">8×</option></select></label>
        <label>Tool <select v-model="tool"><option value="paint">Paint</option><option value="inspect">Inspect</option><option value="eyedropper">Eyedropper</option></select></label>
        <label><input type="checkbox" v-model="learn" /> Learn</label>
      </div>
      <div v-if="learn" class="learn-panel">
        <strong>{{ xRes }} × {{ yRes }} = {{ xRes * yRes }} pixels</strong>
        <span v-if="colourDepth === 24">8 bits each for red, green and blue (0–255 per channel)</span><span>{{ colourDepth }} bits/pixel · {{ 2 ** colourDepth }} colours</span>
        <span>{{ xRes * yRes }} × {{ colourDepth }} = {{ capacity.toLocaleString() }} bits = {{ capacity / 8 }} bytes</span>
        <small>Pixel data only; whole-byte storage: {{ Math.ceil(capacity / 8).toLocaleString() }} bytes. File headers and palettes add overhead.</small>
      </div>
      <div class="viewport" :class="{ zoomed: zoom > 1 }" :style="{ width: canvasWidth + 'px' }">
        <canvas ref="canvas" :style="{width: canvasWidth + 'px', height: canvasHeight + 'px'}" tabindex="0" role="img" :aria-label="'Editable ' + xRes + ' by ' + yRes + ' pixel grid. Arrow keys move; Space or Enter paints.'" @pointerdown="startPaint" @pointermove="movePaint" @pointerup="stopPaint" @pointercancel="stopPaint" @lostpointercapture="stopPaint" @keydown="keyPaint" @focus="focused = true; draw()" @blur="focused = false; draw()"></canvas>
      </div>
      <p class="signature">Version 2.2 by michael201110</p>
    </section>
  </main>
</template>

<script>
import ToggleSwitch from './components/ToggleSwitch.vue';
import { validateProject, resizeBits, bmpBytes } from './project.mjs';
const initialCustom = ['#000000','#0000ff','#00ff00','#00ffff','#ff0000','#ff00ff','#ffff00','#ffffff', ...Array.from({length:56},(_,i)=>{const v=Math.round((i+1)*255/56).toString(16).padStart(2,'0');return `#${v}${v}${v}`;})];
export default {
  components: { ToggleSwitch },
  data() {
    return {
      resolutions: [4, 5, 6, 7, 8, 16, 32, 64, 128], xRes: 4, yRes: 4,
      colourDepth: 1, paletteChoice: 'default', selected: 1, paintColour: '#ffffff', data: '', warning: '',
      custom: [...initialCustom],
      showLabels: true, showGridlines: true, zoom: 1, available: 560,
      painting: false, lastPixel: null, cursor: 0, focused: false,
      past: [], future: [], tool: 'paint', learn: false, hasSelection: false,
    };
  },
  computed: {
    capacity() { return this.xRes * this.yRes * this.colourDepth; },
    palette() {
      if (this.colourDepth === 24) return [];
      if (this.colourDepth === 1) return ['#000000','#ffffff'];
      if (this.colourDepth === 2) return ['#000000','#ff0000','#ffd700','#ffffff'];
      const count = 2 ** this.colourDepth;
      if (this.paletteChoice === 'custom') return Array.from({length:count},(_,i)=>this.custom[i] || this.hslToHex(i / Math.max(1,count - 1) * 300, 0.9, 0.5));
      if (this.paletteChoice === 'grayscale') return Array.from({length:count},(_,i)=>{const v=Math.round(i*255/Math.max(1,count-1)).toString(16).padStart(2,'0'); return `#${v}${v}${v}`;});
      if (this.paletteChoice === 'rgb') return this.rgbPalette(count);
      if (this.colourDepth === 3) return ['#000000','#ff0000','#ff8c00','#ffd700','#00ff00','#0000ff','#4b0082','#ffffff'];
      return Array.from({length:count},(_,i)=>this.hslToHex(i / Math.max(1,count - 1) * 300, 0.9, 0.5));
    },
    cellSize() { return this.available / this.xRes * this.zoom; },
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
    window.addEventListener('keydown', this.historyKey);
    this.observer = new ResizeObserver(([entry]) => { this.available = Math.max(1, entry.contentRect.width); });
    this.observer.observe(this.$refs.editor);
    this.draw();
  },
  beforeUnmount() { this.observer.disconnect(); cancelAnimationFrame(this.frame); window.removeEventListener('keydown', this.historyKey); },
  methods: {
    colourAt(index) { return this.colourDepth === 24 ? '#' + this.valueAt(index).toString(16).padStart(6,'0') : this.palette[this.valueAt(index)]; },
    pickColour(index) { this.cursor=index; this.hasSelection=true; if(this.colourDepth===24) this.paintColour=this.colourAt(index); else this.selected=this.valueAt(index); this.tool='paint'; this.highlightBits(); this.draw(); },
    hslToHex(h, s, l) { const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x]; return `#${[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('')}`; },
    rgbPalette(count) {
      const depth=Math.log2(count), redBits=Math.ceil(depth/3), greenBits=Math.floor((depth+1)/3), blueBits=Math.floor(depth/3);
      const redLevels=2**redBits, greenLevels=2**greenBits, blueLevels=2**blueBits, blueMask=blueLevels-1, greenMask=greenLevels-1;
      return Array.from({length:count},(_,i)=>{
        const b=i&blueMask, g=(i>>blueBits)&greenMask, r=(i>>(blueBits+greenBits))&(redLevels-1);
        return `#${[r/(redLevels-1),g/(greenLevels-1),b/(blueLevels-1)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}`;
      });
    },
    snapshot() { return {format:'BitMapper',version:1,width:this.xRes,height:this.yRes,depth:this.colourDepth,palette:this.paletteChoice,custom:[...this.custom],bits:this.data}; },
    checkpoint() { this.past.push(this.snapshot()); if(this.past.length > 100) this.past.shift(); this.future = []; },
    restore(p) { this.xRes=p.width; this.yRes=p.height; this.colourDepth=p.depth; this.paletteChoice=p.palette; this.custom=[...p.custom]; this.data=p.bits; this.warning=''; this.hasSelection=false; this.draw(); },
    undo() { if(!this.past.length) return; this.future.push(this.snapshot()); this.restore(this.past.pop()); },
    redo() { if(!this.future.length) return; this.past.push(this.snapshot()); this.restore(this.future.pop()); },
    historyKey(e) { if(!(e.ctrlKey || e.metaKey) || !['z','y'].includes(e.key.toLowerCase())) return; e.preventDefault(); if(e.key.toLowerCase()==='y' || e.shiftKey) this.redo(); else this.undo(); },
    clearGrid() { if(!this.data) return; if(!window.confirm('Clear this bitmap? You can undo this.')) return; this.checkpoint(); this.data=''; this.hasSelection=false; },
    resize(event, axis) {
      const width=axis==='width'?Number(event.target.value):this.xRes, height=axis==='height'?Number(event.target.value):this.yRes;
      if((width<this.xRes || height<this.yRes) && !window.confirm('Crop to '+width+' × '+height+'? Pixels outside this area will be removed. You can undo this.')) { event.target.value=axis==='width'?this.xRes:this.yRes; return; }
      const bits=resizeBits(this.data,this.xRes,this.yRes,width,height,this.colourDepth);
      this.checkpoint(); this.xRes=width; this.yRes=height; this.data=bits; this.hasSelection=false;
    },
    changeDepth(event) {
      const depth=Number(event.target.value), limit=2**depth;
      if(depth===24 || this.colourDepth===24) {
        if(depth!==24 && !window.confirm('Convert to an indexed palette? Colours will be matched to the nearest palette entry. You can undo this.')) { event.target.value=this.colourDepth; return; }
        const colours=Array.from({length:this.xRes*this.yRes},(_,i)=>this.colourAt(i));
        this.checkpoint(); this.colourDepth=depth;
        this.data=colours.map(hex=>this.closestPaletteValue(parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)).toString(2).padStart(depth,'0')).join('');
        this.hasSelection=false; return;
      }
      const values=Array.from({length:this.xRes*this.yRes},(_,i)=>this.valueAt(i));
      if(values.some(v=>v>=limit) && !window.confirm('Some colours cannot fit this depth and will become colour 0. Continue? You can undo this.')) { event.target.value=this.colourDepth; return; }
      this.checkpoint(); this.colourDepth=depth; this.data=values.map(v=>(v<limit?v:0).toString(2).padStart(depth,'0')).join(''); this.hasSelection=false;
    },
    highlightBits(focus=false) { this.$nextTick(()=>{ const input=this.$refs.binary; if(focus) input.focus({preventScroll:true}); input.setSelectionRange(this.cursor*this.colourDepth,Math.min(this.data.length,(this.cursor+1)*this.colourDepth)); }); },
    selectFromBits() { this.cursor=Math.min(this.xRes*this.yRes-1,Math.floor(this.$refs.binary.selectionStart/this.colourDepth)); this.hasSelection=true; this.draw(); },
    download(blob, extension) { const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='bitmap-'+this.xRes+'x'+this.yRes+extension; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); },
    saveProject() { this.download(new Blob([JSON.stringify(this.snapshot(),null,2)],{type:'application/json'}),'.bitmapper'); },
    async handleImport(event) {
      const file=event.target.files[0]; if(!file) return;
      const isImage=file.type.startsWith('image/') || /\.(png|bmp|jpe?g|webp|gif|svg)$/i.test(file.name);
      try { if(isImage) await this.importImageFile(file); else await this.openProjectFile(file); }
      catch(error) { this.warning=error.message || 'Could not import that file.'; }
      finally { event.target.value=''; }
    },
    async openProjectFile(file) {
      try { if(file.size>1000000) throw new Error('Project file is too large.'); const p=validateProject(JSON.parse(await file.text())); if(this.data && !window.confirm('Replace this bitmap with the opened project? You can undo this.')) return; this.checkpoint(); this.restore(p); }
      catch(error) { this.warning=error instanceof SyntaxError?'Invalid BitMapper project file.':error.message; }
    },
    async importImageFile(file) {
      try {
        if(file.size>10000000) throw new Error('Image file is too large.');
        if(this.data && !window.confirm('Replace this bitmap with the imported image? You can undo this.')) return;
        const image=await createImageBitmap(file);
        const width=this.resolutions.includes(image.width)?image.width:this.xRes;
        const height=this.resolutions.includes(image.height)?image.height:this.yRes;
        const source=document.createElement('canvas'); source.width=width; source.height=height;
        const context=source.getContext('2d',{willReadFrequently:true}); context.imageSmoothingEnabled=true; context.fillStyle='#ffffff'; context.fillRect(0,0,width,height); context.drawImage(image,0,0,width,height);
        const pixels=context.getImageData(0,0,width,height).data, bits=[];
        for(let i=0;i<width*height;i++) {
          const offset=i*4, value=this.closestPaletteValue(pixels[offset],pixels[offset+1],pixels[offset+2]);
          bits.push(value.toString(2).padStart(this.colourDepth,'0'));
        }
        image.close(); this.checkpoint(); this.xRes=width; this.yRes=height; this.data=bits.join(''); this.hasSelection=false; this.warning='';
      } catch(error) { this.warning=error.message || 'Could not import that image.'; }
    },
    closestPaletteValue(red,green,blue) {
      if(this.colourDepth === 24) return red * 65536 + green * 256 + blue;
      let closest=0, distance=Infinity;
      this.palette.forEach((hex,index)=>{ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); const d=(red-r)**2+(green-g)**2+(blue-b)**2; if(d<distance){distance=d;closest=index;} });
      return closest;
    },
    exportPNG() {
      const canvas=document.createElement('canvas'); canvas.width=this.xRes; canvas.height=this.yRes; const ctx=canvas.getContext('2d');
      for(let i=0;i<this.xRes*this.yRes;i++) { ctx.fillStyle=this.colourAt(i); ctx.fillRect(i%this.xRes,Math.floor(i/this.xRes),1,1); }
      canvas.toBlob(blob=>{ if(blob) this.download(blob,'.png'); },'image/png');
    },
    exportBMP() { const colours=Array.from({length:this.xRes*this.yRes},(_,i)=>this.colourAt(i)); this.download(new Blob([bmpBytes(this.xRes,this.yRes,colours)],{type:'image/bmp'}),'.bmp'); },
    pattern(value) { return value.toString(2).padStart(this.colourDepth, '0'); },
    valueAt(index) { return parseInt(this.data.slice(index * this.colourDepth, (index + 1) * this.colourDepth).padEnd(this.colourDepth, '0'), 2); },
    contrast(hex) { return (parseInt(hex.slice(1,3),16)*299 + parseInt(hex.slice(3,5),16)*587 + parseInt(hex.slice(5,7),16)*114) / 1000 > 150 ? '#17202b' : '#ffffff'; },
    updateData(event) {
      this.checkpoint(); this.hasSelection=false;
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
      this.data = padded.slice(0, start) + this.pattern(this.colourDepth === 24 ? parseInt(this.paintColour.slice(1),16) : this.selected) + padded.slice(start + this.colourDepth);
      this.cursor = index; this.warning = ''; this.draw();
      this.hasSelection=true; this.highlightBits();
    },
    startPaint(event) {
      if (event.button !== 0) return;
      const pixel=this.pixelAt(event); if(pixel===null) return;
      if(this.tool==='eyedropper') { this.pickColour(pixel); return; }
      if(this.tool==='inspect') { this.cursor=pixel; this.hasSelection=true; this.highlightBits(true); this.draw(); return; }
      this.checkpoint();
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
      if (event.key === ' ' || event.key === 'Enter') { if(this.tool==='paint') { this.checkpoint(); this.paint(this.cursor); } else if(this.tool==='eyedropper') this.pickColour(this.cursor); }
      this.hasSelection=true; this.highlightBits();
      this.draw();
    },
    draw() {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.drawFrame());
    },
    drawFrame() {
      const canvas = this.$refs.canvas; if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 8192 / Math.max(this.canvasWidth, this.canvasHeight)), size = this.cellSize;
      canvas.width = Math.round(this.canvasWidth * ratio); canvas.height = Math.round(this.canvasHeight * ratio);
      const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
      for (let i = 0; i < this.xRes * this.yRes; i++) {
        const x = i % this.xRes * size, y = Math.floor(i / this.xRes) * size;
        const value = this.valueAt(i), colour = this.colourAt(i);
        ctx.fillStyle = colour; ctx.fillRect(x, y, size + 0.5, size + 0.5);
        if (this.showLabels && size >= (this.colourDepth === 24 ? 190 : Math.max(22,this.colourDepth * 8))) {
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
      if (this.focused || this.hasSelection) {
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
h1 { margin: 0 0 24px; font-size: 32px; } label { font-size: 14px; } select { padding: 5px; border-radius: 4px; }
.control-group, .settings, .palette-group { min-width: 0; margin: 0 0 14px; padding: 10px; border: 1px solid #b8c1c9; border-radius: 8px; }
.control-group legend, .settings legend, .palette-group legend { padding: 0 6px; font-size: 12px; color: #53616d; }
.group-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.settings { display: flex; flex-wrap: wrap; gap: 12px; }
.hint { font-size: 12px; line-height: 1.6; color: #53616d; } .palette { max-height: 420px; overflow-y: auto; margin-bottom: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 2px; }
.palette-entry { display: grid; gap: 6px; } .swatch { min-height: 46px; border: 2px solid #89929b; border-radius: 7px; cursor: pointer; font-family: inherit; }
.swatch.selected { outline: 3px solid #2469b2; outline-offset: 2px; } .palette input { width: 100%; height: 30px; }
.data-label { display: block; margin-bottom: 8px; } textarea { width: 100%; resize: vertical; font-family: inherit; padding: 10px; overflow-wrap: anywhere; }
.warning { color: #a12c14; font-size: 12px; min-height: 16px; } .editor { min-width: 0; }
.display-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 20px; }
.viewport { max-width: 100%; overflow: auto; background: #cdd2d8; }
.viewport.zoomed { max-height: 75vh; }
canvas { display: block; touch-action: none; cursor: crosshair; } canvas:focus-visible { outline: 2px solid #2469b2; outline-offset: -2px; }
.signature { text-align: right; font-size: 12px; margin-top: 24px; }
.toolbar { margin-bottom: 6px; }
.toolbar button, .inspector button, .export-menu summary { font: inherit; font-size: 12px; border: 1px solid #a3aeb8; background: #fff; border-radius: 5px; padding: 7px 10px; cursor: pointer; white-space: nowrap; }
.export-menu { position: relative; }
.export-menu summary { list-style: none; }
.export-menu summary::-webkit-details-marker { display: none; }
.export-menu summary::after { content: ' ▾'; }
.export-options { position: absolute; z-index: 2; display: grid; gap: 4px; min-width: 100%; padding-top: 4px; }
.export-options button { width: 100%; }
button:disabled { opacity: 0.4; cursor: default; }
.inspector { margin-top: 10px; font-size: 12px; line-height: 2; }
.inspector mark { background: #c7e8ff; padding: 3px; }
.learn-panel { display: grid; gap: 8px; padding: 14px; margin-bottom: 16px; background: #f3f8ff; border-radius: 8px; font-size: 14px; }
.learn-panel small { line-height: 1.5; }
@media (max-width: 760px) { .app { grid-template-columns: 1fr; padding: 18px; margin: 12px; gap: 20px; } .viewport.zoomed { max-height: 65vh; } }
</style>

