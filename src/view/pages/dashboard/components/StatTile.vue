<template>
  <div class="stat-tile" :class="{ 'is-hero': hero }">
    <div class="tile-label">
      <span>{{ label }}</span>
      <InfoTip v-if="caliber" :text="caliber" />
    </div>
    <div class="tile-figure">
      <span class="figure-value">{{ value }}</span>
      <span v-if="unit" class="figure-unit">{{ unit }}</span>
    </div>
    <div class="tile-delta" v-if="hasDelta">
      <span class="delta-text" :style="{ color: deltaColor }">
        {{ deltaArrow }}{{ deltaAbs }}{{ deltaUnit }}
      </span>
      <span class="delta-compare">{{ compare }}</span>
    </div>
    <div class="tile-spark" v-if="spark && spark.length > 1">
      <Sparkline :data="spark" :color="sparkColor" :height="hero ? 44 : 30" />
    </div>
    <slot></slot>
  </div>
</template>

<script>
import InfoTip from './InfoTip.vue'
import Sparkline from './Sparkline.vue'
import { STATUS } from '../dashboardTheme'

export default {
  name: 'StatTile',
  components: { InfoTip, Sparkline },
  props: {
    label: { type: String, default: '' },
    value: { type: [String, Number], default: '' },
    unit: { type: String, default: '' },
    caliber: { type: String, default: '' },
    delta: { type: Number, default: null },
    deltaUnit: { type: String, default: '' },
    // 指标变大是好事还是坏事，决定升降箭头配什么颜色
    goodWhenUp: { type: Boolean, default: true },
    compare: { type: String, default: '较上月' },
    spark: { type: Array, default: null },
    sparkColor: { type: String, default: '#2a78d6' },
    hero: { type: Boolean, default: false }
  },
  computed: {
    hasDelta () {
      return this.delta !== null && this.delta !== undefined && !isNaN(Number(this.delta))
    },
    deltaAbs () {
      return Math.abs(Number(this.delta))
    },
    deltaArrow () {
      const d = Number(this.delta)
      if (d === 0) return '持平 '
      return d > 0 ? '↑' : '↓'
    },
    deltaColor () {
      const d = Number(this.delta)
      if (d === 0) return 'var(--dash-muted)'
      const up = d > 0
      return up === this.goodWhenUp ? STATUS.good : STATUS.critical
    }
  }
}
</script>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tile-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--dash-muted);
  letter-spacing: 0.02em;
}
.tile-figure {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 6px;
}
.figure-value {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--dash-ink);
}
.is-hero .figure-value {
  font-size: 52px;
}
.figure-unit {
  font-size: 13px;
  color: var(--dash-ink2);
}
.is-hero .figure-unit {
  font-size: 18px;
}
.tile-delta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
}
.delta-text {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.delta-compare {
  color: var(--dash-muted);
}
.tile-spark {
  margin-top: 8px;
}
</style>
