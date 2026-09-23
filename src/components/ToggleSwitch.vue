<template>
  <label class="toggle">
    <span>{{ labelText }}</span>
    <input
      type="checkbox"
      role="switch"
      :aria-label="labelText"
      :checked="state"
      @change="$emit('update:state', $event.target.checked)"
    />
    <span class="switch" aria-hidden="true">
      <span class="state-text">{{ state ? leftText : rightText }}</span>
      <span class="knob"></span>
    </span>
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
}
.toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: 0 0 88px;
  width: 88px;
  height: 32px;
  border-radius: 999px;
  background: #c9ced6;
  color: #243344;
}
.state-text {
  position: absolute;
  left: 34px;
  right: 6px;
  text-align: center;
  font-size: 0.75rem;
}
.knob {
  position: absolute;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}
.toggle input:checked + .switch .knob { transform: translateX(56px); }
.toggle input:checked + .switch { background: #7ec97e; }
.toggle input:checked + .switch .state-text { left: 6px; right: 34px; }
.toggle input:focus-visible + .switch { outline: 3px solid #245c9c; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .knob { transition: none; }
}
</style>
