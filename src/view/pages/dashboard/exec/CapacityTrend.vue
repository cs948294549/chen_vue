<template>
  <DashPanel title="出口水位趋势" :caliber="caliber" source="Cacti 95 峰值（计费权威口径）">
    <div class="cap-body">
      <div class="cap-chart">
        <TrendChart
          type="line"
          unit="%"
          :categories="trend.months"
          :series="series"
          :y-min="0"
          :y-max="100"
          label-mode="end"
        />
      </div>

      <div class="cap-list">
        <div class="list-title">各出口本月 95 峰值利用率</div>
        <div class="list-row" v-for="g in trend.byGroup" :key="g.name">
          <span class="row-name" :title="g.name">{{ g.name }}</span>
          <MeterBar
            :value="g.util"
            :color="levelOf(g.util).color"
            :marker="safeLine"
            marker-label="安全水位线 80%"
            :height="8"
            :display="g.util + '%'"
          />
          <span class="row-raw">{{ g.p95 }} / {{ g.contract }}</span>
        </div>
        <div class="list-note">竖线为 80% 安全水位线</div>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import MeterBar from '../components/MeterBar.vue'
import TrendChart from '../components/TrendChart.vue'
import { STATUS } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

export default {
  name: 'CapacityTrend',
  components: { DashPanel, MeterBar, TrendChart },
  props: {
    trend: { type: Object, default: () => ({ months: [], series: [], byGroup: [] }) },
    safeLine: { type: Number, default: 80 }
  },
  data () {
    return { caliber: CALIBER.egress95 }
  },
  computed: {
    // 两条线同为百分比，单轴即可
    series () {
      return (this.trend.series || []).map(s => ({
        name: s.name,
        data: s.data,
        dashed: s.dashed === true,
        area: s.dashed !== true
      }))
    }
  },
  methods: {
    levelOf (util) {
      const v = Number(util) || 0
      if (v >= this.safeLine) return { color: STATUS.critical, label: '超安全线' }
      if (v >= this.safeLine * 0.85) return { color: STATUS.warning, label: '偏高' }
      return { color: STATUS.good, label: '正常' }
    }
  }
}
</script>

<style scoped>
.cap-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
  min-height: 0;
}
.cap-chart {
  min-width: 0;
  min-height: 180px;
}
.cap-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}
.list-title {
  font-size: 12px;
  color: var(--dash-muted);
}
.list-row {
  display: grid;
  grid-template-columns: 112px 1fr 104px;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.row-name {
  font-size: 12px;
  color: var(--dash-ink2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-raw {
  text-align: right;
  font-size: 11px;
  color: var(--dash-muted);
  font-variant-numeric: tabular-nums;
}
.list-note {
  margin-top: 2px;
  font-size: 11px;
  color: var(--dash-muted);
}
</style>
