<template>
  <div class="process">
    <DashPanel title="故障影响时长" :caliber="outageCaliber" source="Zabbix 故障记录">
      <TrendChart
        type="bar"
        unit="分钟"
        :categories="metrics.weeks"
        :series="outageSeries"
        :colors="outageColors"
        label-mode="top"
        :show-legend="false"
      />
    </DashPanel>

    <DashPanel title="变更次数与成功率" :caliber="changeCaliber" source="平台变更工单">
      <template slot="extra">
        <span class="succ-note">成功率 {{ successRate }}%</span>
      </template>
      <TrendChart
        type="bar"
        unit="次"
        :categories="metrics.weeks"
        :series="changeSeries"
        label-mode="top"
      />
    </DashPanel>
  </div>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import TrendChart from '../components/TrendChart.vue'
import { LIGHT } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

/**
 * 故障时长（分钟）和变更次数（次）量纲不同，
 * 拆成两张图，各自一根 y 轴，不做双轴。
 */
export default {
  name: 'ProcessMetrics',
  components: { DashPanel, TrendChart },
  props: {
    metrics: {
      type: Object,
      default: () => ({ weeks: [], outageMinutes: [], changes: [], changeSuccess: [] })
    }
  },
  data () {
    return {
      outageCaliber: CALIBER.outage,
      changeCaliber: CALIBER.change,
      // 故障是负向指标，单独用橙色槽位，不跟蓝色主序列混
      outageColors: [LIGHT.series[1]]
    }
  },
  computed: {
    outageSeries () {
      return [{ name: '故障影响时长', data: this.metrics.outageMinutes }]
    },
    changeSeries () {
      return [
        { name: '变更次数', data: this.metrics.changes },
        { name: '其中成功', data: this.metrics.changeSuccess }
      ]
    },
    successRate () {
      const all = (this.metrics.changes || []).reduce((a, b) => a + Number(b), 0)
      const ok = (this.metrics.changeSuccess || []).reduce((a, b) => a + Number(b), 0)
      if (!all) return '0.0'
      return ((ok / all) * 100).toFixed(1)
    }
  }
}
</script>

<style scoped>
.process {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
  min-height: 0;
}
.succ-note {
  font-size: 12px;
  color: var(--dash-ink2);
  font-variant-numeric: tabular-nums;
}
</style>
