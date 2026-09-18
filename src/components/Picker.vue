<template>

  <label class="picker" :style="{ color: fontColour }">

    <div :style="{ backgroundColor: localColour }">

      <span>{{ label }}</span>

      <input type="color" :value="localColour" @input="updateColour" @change="updateColour" />

    </div>

  </label>

</template>



<script>

export default {

  name: "Picker",

  props: {

    startColour: { type: String, default: "#00dd00" },

    label: { type: String, default: "" },

    modelValue: { type: String, default: "#00dd00" },

  },

  emits: ["update:modelValue"],

  data() {

    return {

      localColour: this.modelValue || this.startColour,

    };

  },

  computed: {

    fontColour() {

      const hex = this.localColour || "#000000";

      const safeHex = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

      const r = Number.parseInt(safeHex.slice(1, 3), 16);

      const g = Number.parseInt(safeHex.slice(3, 5), 16);

      const b = Number.parseInt(safeHex.slice(5, 7), 16);

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      return luminance < 170 ? "#fff" : "#000";

    },

  },

  watch: {

    modelValue: {

      immediate: true,

      handler(value) {

        this.localColour = value || this.startColour;

      },

    },

  },

  methods: {

    updateColour(event) {

      const value = event.target.value;

      this.localColour = value;

      this.$emit("update:modelValue", value);

    },

  },

};

</script>



<style scoped>

.picker {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-width: 60px;

  min-height: 50px;

}

.picker > div {

  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 0.25rem;

  padding: 0.35rem;

  border-radius: 7px;

  width: 100%;

  height: 100%;

}

input[type="color"] {

  width: 2rem;

  height: 2rem;

  border: none;

  background: transparent;

  padding: 0;

}

</style>

