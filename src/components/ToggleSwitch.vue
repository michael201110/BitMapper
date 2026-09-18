<template>

  <label class="toggle">

    <span>{{ labelText }}</span>

    <input

      type="checkbox"

      :checked="state"

      @change="$emit('update:state', $event.target.checked)"

    />

    <div class="switch">

      <span class="left">{{ leftText }}</span>

      <span class="knob"></span>

      <span class="right">{{ rightText }}</span>

    </div>

  </label>

</template>



<script>

export default {

  name: "ToggleSwitch",

  props: {

    labelText: { type: String, default: "Toggle" },

    leftText: { type: String, default: "On" },

    rightText: { type: String, default: "Off" },

    state: { type: Boolean, default: false },

  },

  emits: ["update:state"],

};

</script>



<style scoped>

.toggle {

  display: inline-flex;

  align-items: center;

  gap: 0.5rem;

  margin: 0.5rem 0;

}

.toggle input {

  display: none;

}

.switch {

  position: relative;

  display: inline-flex;

  align-items: center;

  width: 110px;

  height: 30px;

  border-radius: 999px;

  background: #c9ced6;

  overflow: hidden;

}

.left,

.right {

  position: absolute;

  top: 50%;

  transform: translateY(-50%);

  font-size: 0.7rem;

}

.left {

  left: 12px;

}

.right {

  right: 12px;

}

.knob {

  position: absolute;

  left: 4px;

  width: 24px;

  height: 24px;

  border-radius: 50%;

  background: white;

  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

  transition: left 0.2s ease;

}

.toggle input:checked + .switch .knob {

  left: 80px;

}

.toggle input:checked + .switch {

  background: #7ec97e;

}

</style>

