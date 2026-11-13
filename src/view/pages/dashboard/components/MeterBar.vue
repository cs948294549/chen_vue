<template>
  <div class="meter">
    <div class="meter-track" :style="{ height: height + 'px' }">
      <div
        class="meter-fill"
        :style="{ width: clamped + '%', background: color, borderRadius: radius + 'px' }"
      ></div>
      <span
        v-if="markerPct !== null"
        class="meter-marker"
        :style="{ left: markerPct + '%' }"
        :title="markerLabel"
      ></span>
    </div>
    <span v-if="showValue" class="meter-value">{{ display }}</span>
  </div>
</template>

<script>
/**
 * 水位条。填充色表示严重度，轨道是同色系的浅一档，
 * 百分比始终以文字给出，不靠颜色单独表达。
 * marker 用于标注配额线 / 安全线。
 */
export default {
  name: 'MeterBar',
  props: {
    value: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    color: { type: String, default: '#3987e5' },
    height: { type: Number, default: 6 },
    radius: { type: Number, default: 4 },
    showValue: { type: Boolean, default: true },
    display: { type: String, default: '' },
    marker: { type: Number, default: null },
    markerLabel: { type: String, default: '' }
  },
  computed: {
    clamped () {
      return this.toPct(this.value)
    },
    markerPct () {
      if (this.marker === null || this.marker === undefined) return null
      return this.toPct(this.marker)
    }
  },
  methods: {
    toPct (v) {
      const pct = (Number(v) / (Number(this.max) || 100)) * 100
      if (isNaN(pct)) return 0
      return Math.max(0, Math.min(100, pct))
    }
  }
}
</script>

<style scoped>
.meter {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.meter-track {
  position: relative;
  flex: 1;
  min-width: 0;
  background: var(--dash-track);
  border-radius: 4px;
}
.meter-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  transition: width 0.6s ease;
}
.meter-marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  background: var(--dash-ink2);
  border-radius: 1px;
}
.meter-value {
  flex-shrink: 0;
  min-width: 44px;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--dash-ink2);
}
</style>
