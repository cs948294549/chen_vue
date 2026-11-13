<template>
  <span class="status-dot">
    <svg :width="size" :height="size" viewBox="0 0 10 10" aria-hidden="true">
      <circle v-if="shape === 'circle'" cx="5" cy="5" r="4.2" :fill="color" />
      <polygon v-else-if="shape === 'triangle'" points="5,0.8 9.6,9.2 0.4,9.2" :fill="color" />
      <rect v-else x="1" y="1" width="8" height="8" rx="1.4" :fill="color" />
    </svg>
    <span v-if="label" class="status-label" :style="{ color: labelColor }">{{ label }}</span>
  </span>
</template>

<script>
/**
 * 状态标记。形状 + 文字同时表达状态，色盲或黑白打印也能分辨。
 */
export default {
  name: 'StatusDot',
  props: {
    color: { type: String, default: '#0ca30c' },
    shape: { type: String, default: 'circle' },
    label: { type: String, default: '' },
    labelColor: { type: String, default: '' },
    size: { type: Number, default: 10 }
  }
}
</script>

<style scoped>
.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  vertical-align: middle;
}
.status-label {
  font-size: 12px;
  line-height: 1;
  color: var(--dash-ink2);
  white-space: nowrap;
}
</style>
