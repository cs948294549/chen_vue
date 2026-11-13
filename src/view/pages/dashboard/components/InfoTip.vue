<template>
  <span class="info-tip" tabindex="0" role="note" :aria-label="text">
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M8 7v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="8" cy="4.4" r="0.95" fill="currentColor" />
    </svg>
    <span class="tip-body">{{ text }}</span>
  </span>
</template>

<script>
export default {
  name: 'InfoTip',
  props: {
    text: { type: String, required: true }
  }
}
</script>

<style scoped>
.info-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  color: var(--dash-muted);
  cursor: help;
  outline: none;
  flex-shrink: 0;
}
.info-tip:hover,
.info-tip:focus {
  color: var(--dash-ink2);
}
.tip-body {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  width: 280px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.55;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--dash-ink);
  background: var(--dash-surface2);
  border: 1px solid var(--dash-border);
  border-radius: 4px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 30;
  pointer-events: none;
  white-space: normal;
  text-align: left;
}
.info-tip:hover .tip-body,
.info-tip:focus .tip-body {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
</style>
