<template>
  <DashPanel title="出口总流量 24 小时" caliber="出口合计带宽，出入方向同为 Gbps，单轴对比" source="Zabbix 5min">
    <TrendChart
      dark
      type="line"
      unit="G"
      :categories="trend.hours"
      :series="series"
      :y-min="0"
      :grid="grid"
    />
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import TrendChart from '../components/TrendChart.vue'

export default {
  name: 'DutyTrend',
  components: { DashPanel, TrendChart },
  props: {
    trend: { type: Object, default: () => ({ hours: [], outflow: [], inflow: [] }) }
  },
  data () {
    return {
      grid: { left: 2, right: 10, top: 30, bottom: 2, containLabel: true }
    }
  },
  computed: {
    // 出入方向量纲相同，放一张图、一根 y 轴
    series () {
      return [
        { name: '出方向', data: this.trend.outflow, area: true },
        { name: '入方向', data: this.trend.inflow }
      ]
    }
  }
}
</script>

<style scoped>
</style>
