<template>

  <div class="app">

    <div class="column left">

      <h1>BitMapper</h1>

      <div>

        <label>

          Resolution:

          <select v-model="xRes">

            <option v-for="r in resolutions" :key="r" :value="r">

              {{ r }}

            </option>

          </select>

        </label>

        <label>

          x

          <select v-model="yRes">

            <option v-for="r in resolutions" :key="r" :value="r">

              {{ r }}

            </option>

          </select>

        </label>

      </div>

      <label v-show="!enableHidden">

        Colour Depth:

        <select v-model="colourDepth" @change="sliceData">

          <option v-for="c in maxColourDepth" :key="c" :value="c">

            {{ c }}

          </option>

        </select>

      </label>

      <span v-show="enableHidden">Colour Depth: 3</span>

      <label v-show="enableHidden">

        Colour pallet:

        <select v-model="palletChoice" @change="sliceData">

          <option value="default">Rainbow</option>

          <option value="rgb">3bit RGB</option>

          <option value="custom">Custom</option>

        </select>

      </label>

      <div class="pallet" v-show="colourDepth === 1">

        <Pixel

          v-for="(col, index) in colours2"

          :key="index"

          :pixColour="col"

          :bitPattern="patterns[index]"

          :showLabel="true"

        />

      </div>

      <div class="pallet" v-show="colourDepth === 2">

        <Pixel

          v-for="(col, index) in colours4"

          :key="index"

          :pixColour="col"

          :bitPattern="patterns[index]"

          :showLabel="true"

        />

      </div>

      <div class="pallet" v-show="colourDepth === 3 && palletChoice === 'default'">

        <Pixel

          v-for="(col, index) in colours8"

          :key="index"

          :pixColour="col"

          :bitPattern="patterns[index]"

          :showLabel="true"

        />

      </div>

      <div class="pallet" v-show="colourDepth === 3 && palletChoice === 'rgb'">

        <Pixel

          v-for="(col, index) in coloursRGB"

          :key="index"

          :pixColour="col"

          :bitPattern="patterns[index]"

          :showLabel="true"

        />

      </div>

      <div class="pallet" v-show="colourDepth === 3 && palletChoice === 'custom'">

        <Picker

          v-for="(col, index) in coloursCustom"

          :key="index"

          :startColour="col"

          :label="patterns[index]"

          v-model="coloursCustom[index]"

        />

      </div>

      <div class="data">

        Data:<span style="color: red" v-show="showWarning">{{ showWarning }}</span><br />

        <textarea

          rows="5"

          cols="35"

          v-model="data"

          placeholder="Type binary data here"

          @keypress="checkBinary"

          @change="sliceData"

          @keyup="sliceData"

        ></textarea>

      </div>

    </div>

    <div class="column right">

      <div>

        <ToggleSwitch

          v-show="!enableHidden"

          labelText="Labels"

          leftText="Show"

          rightText="Hide"

          v-model:state="showLabels"

        />

        <ToggleSwitch

          labelText="Grid Lines"

          leftText="Show"

          rightText="Hide"

          v-model:state="showGridlines"

        />

      </div>

      <div class="center">

        <div class="bitmap" :style="{ gridTemplateColumns: 'repeat(' + xRes + ', 1fr)' }">

          <Pixel

            v-for="(n, index) in xRes * yRes"

            :key="index"

            :bitPattern="bitsToMap[index]"

            :showLabel="showLabels"

            :showBorder="showGridlines"

            :pixColour="getBackgroundColour(bitsToMap[index])"

            :enableHidden="enableHidden"

          />

        </div>

      </div>

      <p class="signiture" @click.alt="ActivateHidden">Version 1.1 By Mr C</p>

    </div>

  </div>

</template>



<script>

import ToggleSwitch from "./components/ToggleSwitch.vue";

import Pixel from "./components/Pixel.vue";

import Picker from "./components/Picker.vue";



export default {

  name: "App",

  components: {

    ToggleSwitch,

    Pixel,

    Picker,

  },

  data() {

    return {

      showLabels: true,

      showGridlines: false,

      colourDepth: 1,

      maxColourDepth: 3,

      resolutions: [4, 5, 6, 7, 8],

      xRes: 4,

      yRes: 4,

      colours2: ["#000000", "#ffffff"],

      colours4: ["#000000", "#ff0000", "#ffd700", "#ffffff"],

      colours8: [

        "#000000",

        "#ff0000",

        "#ff8c00",

        "#ffd700",

        "#00ff00",

        "#0000ff",

        "#4b0082",

        "#ffffff",

      ],

      coloursRGB: [

        "#000000",

        "#0000ff",

        "#00ff00",

        "#00ffff",

        "#ff0000",

        "#ff00ff",

        "#ffff00",

        "#ffffff",

      ],

      coloursCustom: [

        "#000000",

        "#0000ff",

        "#00ff00",

        "#00ffff",

        "#ff0000",

        "#ff00ff",

        "#ffff00",

        "#ffffff",

      ],

      data: "",

      bitsToMap: [],

      showWarning: "",

      enableHidden: false,

      palletChoice: "default",

    };

  },

  methods: {

    checkBinary(e) {

      if (this.data.length >= this.fileSize) {

        this.showWarning = "Max length reached";

        this.data = this.data.slice(0, this.fileSize);

        e.preventDefault();

      } else if (!(e.key === "0" || e.key === "1")) {

        this.showWarning = "Only accepts 0 or 1";

        e.preventDefault();

      } else {

        this.showWarning = "";

      }

    },

    sliceData() {

      if (this.data.length > 0) {

        const arr = [];

        for (let i = 0; i < this.data.length; i += this.colourDepth) {

          arr.push(this.data.slice(i, i + this.colourDepth));

        }

        if (arr[arr.length - 1]?.length !== this.colourDepth) {

          arr.pop();

        }

        this.bitsToMap = arr;

      } else {

        this.bitsToMap = [];

      }

    },

    getBackgroundColour(bits) {

      const index = parseInt(bits || "0", 2);

      if (this.colourDepth === 1) {

        return this.colours2[index];

      }

      if (this.colourDepth === 2) {

        return this.colours4[index];

      }

      if (this.palletChoice === "default") {

        return this.colours8[index];

      }

      if (this.palletChoice === "rgb") {

        return this.coloursRGB[index];

      }

      if (this.palletChoice === "custom") {

        return this.coloursCustom[index];

      }

      return "#000000";

    },

    ActivateHidden() {

      if (!this.enableHidden) {

        this.enableHidden = true;

        if (!this.resolutions.includes(16)) {

          this.resolutions.push(16);

        }

        this.showLabels = false;

        this.colourDepth = 3;

        this.xRes = 16;

        this.yRes = 16;

      }

    },

  },

  watch: {

    data(newVal, oldVal) {

      if (/^$|([01]+$)/.test(newVal) && newVal.length <= this.xRes * this.yRes * this.colourDepth) {

        this.data = newVal;

      } else {

        this.data = oldVal;

      }

    },

  },

  computed: {

    patterns() {

      const p = [];

      for (let i = 0; i < Math.pow(2, this.colourDepth); i++) {

        p.push(i.toString(2).padStart(this.colourDepth, "0"));

      }

      return p;

    },

    fileSize() {

      return this.xRes * this.yRes * this.colourDepth;

    },

  },

};

</script>



<style>

#app {

  display: flex;

  align-items: center;

  justify-content: center;

}

.app {

  font-family: monaco, Consolas, Lucida Console, monospace;

  text-align: center;

  color: #2c3e50;

  margin-top: 60px;

  display: flex;

  width: 800px;

  border-radius: 7px;

  background-color: #e5e5e5;

  box-shadow: rgba(0, 0, 0, 0.25) 0px 14px 28px,

    rgba(0, 0, 0, 0.22) 0px 10px 10px;

}



.column {

  display: flex;

  flex-direction: column;

  justify-content: center;

}

.bitmap {

  display: grid;

}

.left {

  width: 400px;

}

.right {

  width: 400px;

}

.center {

  display: flex;

  justify-content: center;

  align-items: center;

  height: 350px;

}

.pallet {

  display: flex;

  flex-wrap: wrap;

  justify-content: space-around;

  align-items: center;

  height: 150px;

  margin: 0px 40px;

}

.pallet .pixel,

.pallet .picker {

  border-radius: 7px;

  flex-basis: 18%;

  margin: 0 8px;

}

.signiture {

  font-family: Courier New, Courier, Lucida Sans Typewriter, Lucida Typewriter,

    monospace;

  margin: 0;

  text-align: right;

  padding-right: 10px;

  color: rgb(99, 99, 99);

  font-size: 0.8rem;

}

textarea {

  resize: none;

}

</style>

