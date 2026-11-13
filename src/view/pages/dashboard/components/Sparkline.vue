<template>
  <div class="sparkline" ref="wrap" :style="{ height: height + 'px' }">
    <svg v-if="width > 0 && points.length > 1" :width="width" :height="height">
      <path v-if="fill" :d="areaPath" :fill="color" fill-opacity="0.10" stroke="none" />
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle
        :cx="last[0]"
        :cy="last[1]"
        r="3"
        :fill="color"
        stroke-width="2"
        :style="{ stroke: 'var(--dash-surface)' }"
      />
    </svg>
  </div>
</template>

<script>
/**
 * 迷你走势线，纯 SVG。
 * 宽高按容器实测像素绘制，避免 viewBox 拉伸把线宽和端点圆一起拉变形。
 */
export default {
  name: 'Sparkline',
  props: {
    data: { type: Array, default: () => [] },
    color: { type: String, default: '#3987e5' },
    height: { type: Number, default: 34 },
    fill: { type: Boolean, default: true }
  },
  data () {
    return { width: 0 }
  },
  computed: {
    points () {
      const vals = this.data.map(v => Number(v)).filter(v => !isNaN(v))
      if (vals.length < 2) return []
      const pad = 3
      const w = this.width
      const h = this.height
      const min = Math.min.apply(null, vals)
      const max = Math.max.apply(null, vals)
      const span = max - min || 1
      const stepX = (w - pad * 2) / (vals.length - 1)
      return vals.map((v, i) => [
        pad + i * stepX,
        pad + (h - pad * 2) * (1 - (v - min) / span)
      ])
    },
    last () {
      return this.points[this.points.length - 1] || [0, 0]
    },
    linePath () {
      return this.points
        .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2))
        .join(' ')
    },
    areaPath () {
      if (!this.points.length) return ''
      const bottom = this.height - 1
      const first = this.points[0]
      const last = this.points[this.points.length - 1]
      return (
        this.linePath +
        ' L' + last[0].toFixed(2) + ' ' + bottom +
        ' L' + first[0].toFixed(2) + ' ' + bottom + ' Z'
      )
    }
  },
  mounted () {
    this.measure()
    window.addEventListener('resize', this.measure)
    if (window.ResizeObserver) {
      this.ro = new window.ResizeObserver(this.measure)
      this.ro.observe(this.$refs.wrap)
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.measure)
    if (this.ro) this.ro.disconnect()
  },
  methods: {
    measure () {
      if (!this.$refs.wrap) return
      this.width = this.$refs.wrap.clientWidth
    }
  }
}
</script>

<style scoped>
.sparkline {
  width: 100%;
  overflow: hidden;
}
</style>
