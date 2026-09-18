<template>
  <div
    class="pixel"
    :style="{
      backgroundColor: pixColour,
      border: getBorder,
      color: getFontColour,
      height: size,
      width: size,
    }"
  >
    <span v-if="showLabel">{{ bitPattern }}</span>
  </div>
</template>

<script>
export default {
  name: "Pixel",
  props: {
    bitPattern: { default: "0" },
    showLabel: { type: Boolean, default: false },
    showBorder: { type: Boolean, default: false },
    pixColour: { type: String, default: "#888888" },
    enableHidden: { type: Boolean, default: false },
  },
  computed: {
    getBorder() {
      return this.showBorder ? "solid #444 2px" : "none";
    },
    getFontColour() {
      const color = this.pixColour || "#000000";
      let r = 0;
      let g = 0;
      let b = 0;

      if (color.length === 4) {
        r = Number.parseInt(color[1] + color[1], 16) / 255;
        g = Number.parseInt(color[2] + color[2], 16) / 255;
        b = Number.parseInt(color[3] + color[3], 16) / 255;
      } else if (color.length === 7) {
        r = Number.parseInt(color.slice(1, 3), 16) / 255;
        g = Number.parseInt(color.slice(3, 5), 16) / 255;
        b = Number.parseInt(color.slice(5, 7), 16) / 255;
      }

      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luminance > 0.179 ? "#222222" : "#f5f5f5";
    },
    size() {
      return this.enableHidden ? "1.25rem" : "2.5rem";
    },
  },
};
</script>

<style scoped>
.pixel {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 0.7rem;
  user-select: none;
}
</style>
