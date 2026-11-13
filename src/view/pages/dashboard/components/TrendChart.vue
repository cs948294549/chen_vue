<template>
  <div class="trend-chart" ref="chart"></div>
</template>

<script>
import echarts from 'echarts'
import { DARK, LIGHT } from '../dashboardTheme'

/**
 * echarts 包装。
 * 只做单轴：两个量纲不同的指标请拆成两张图，不加第二根 y 轴。
 */
export default {
  name: 'TrendChart',
  props: {
    // 'line' | 'bar'
    type: { type: String, default: 'line' },
    dark: { type: Boolean, default: false },
    categories: { type: Array, default: () => [] },
    // [{ name, data, dashed, area }]
    series: { type: Array, default: () => [] },
    unit: { type: String, default: '' },
    yMax: { type: [Number, String], default: null },
    yMin: { type: [Number, String], default: 0 },
    showLegend: { type: Boolean, default: true },
    // 柱顶 / 末端直接标数值
    labelMode: { type: String, default: 'none' },
    colors: { type: Array, default: null },
    grid: { type: Object, default: null }
  },
  computed: {
    theme () {
      return this.dark ? DARK : LIGHT
    },
    palette () {
      return this.colors || this.theme.series
    }
  },
  watch: {
    categories: { handler: 'render' },
    series: { handler: 'render', deep: true },
    dark: { handler: 'render' }
  },
  mounted () {
    this.chart = echarts.init(this.$refs.chart)
    this.render()
    window.addEventListener('resize', this.resize)
    if (window.ResizeObserver) {
      this.ro = new window.ResizeObserver(this.resize)
      this.ro.observe(this.$refs.chart)
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resize)
    if (this.ro) this.ro.disconnect()
    if (this.chart) this.chart.dispose()
    this.chart = null
  },
  methods: {
    resize () {
      if (this.chart) this.chart.resize()
    },
    buildSeries () {
      const t = this.theme
      return this.series.map((s, i) => {
        const color = this.palette[i % this.palette.length]
        if (this.type === 'bar') {
          return {
            name: s.name,
            type: 'bar',
            data: s.data,
            barMaxWidth: 24,
            itemStyle: { color: color, barBorderRadius: [4, 4, 0, 0] },
            label: this.labelMode === 'none'
              ? { show: false }
              : {
                show: true,
                position: 'top',
                color: t.ink2,
                fontSize: 11,
                formatter: p => p.value + this.unit
              }
          }
        }
        return {
          name: s.name,
          type: 'line',
          data: s.data,
          smooth: false,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: s.dashed !== true,
          lineStyle: {
            width: 2,
            color: color,
            type: s.dashed ? 'dashed' : 'solid'
          },
          itemStyle: { color: color, borderColor: t.surface, borderWidth: 2 },
          areaStyle: s.area && !s.dashed ? { color: color, opacity: 0.1 } : null,
          endLabel: this.labelMode === 'end'
            ? {
              show: true,
              color: t.ink2,
              fontSize: 11,
              formatter: p => p.value + this.unit
            }
            : { show: false }
        }
      })
    },
    render () {
      if (!this.chart) return
      const t = this.theme
      const multi = this.series.length > 1
      this.chart.setOption({
        color: this.palette,
        backgroundColor: 'transparent',
        animationDuration: 420,
        textStyle: { fontSize: 12, color: t.ink2 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: this.type === 'bar' ? 'shadow' : 'line', lineStyle: { color: t.axis } },
          backgroundColor: t.surface2,
          borderColor: t.axis,
          borderWidth: 1,
          textStyle: { color: t.ink, fontSize: 12 },
          valueFormatter: v => v + this.unit
        },
        legend: this.showLegend && multi
          ? {
            show: true,
            top: 0,
            right: 0,
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 14,
            icon: 'roundRect',
            textStyle: { color: t.ink2, fontSize: 12 }
          }
          : { show: false },
        grid: this.grid || {
          left: 2,
          right: this.labelMode === 'end' ? 46 : 8,
          top: this.showLegend && multi ? 28 : 10,
          bottom: 2,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.categories,
          boundaryGap: this.type === 'bar',
          axisLine: { lineStyle: { color: t.axis } },
          axisTick: { show: false },
          axisLabel: { color: t.muted, fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          min: this.yMin === null ? undefined : this.yMin,
          max: this.yMax === null ? undefined : this.yMax,
          splitLine: { lineStyle: { color: t.grid, width: 1 } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: t.muted,
            fontSize: 11,
            formatter: v => v + this.unit
          }
        },
        series: this.buildSeries()
      }, true)
    }
  }
}
</script>

<style scoped>
.trend-chart {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
