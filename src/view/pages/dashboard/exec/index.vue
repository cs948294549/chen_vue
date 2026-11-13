<template>
  <div class="exec-dash" :style="vars">
    <div class="exec-head">
      <div class="head-left">
        <span class="head-title">{{ report.title }}</span>
        <span class="head-period">{{ report.period }}</span>
      </div>
      <div class="head-right">
        <span class="head-asof">数据截至 {{ report.asOf }}</span>
        <span class="head-note">{{ report.asOfNote }}</span>
      </div>
    </div>

    <ExecKpiRow :kpis="kpis" />

    <CapacityTrend :trend="capacityTrend" />

    <AvailabilityHeat :heat="availabilityHeat" />

    <ProcessMetrics :metrics="processMetrics" />

    <div class="exec-bottom">
      <ForecastStrip :list="forecast" />
      <Highlights :list="highlights" />
    </div>

    <div class="exec-foot">
      数据来源 Zabbix · Cacti · CMDB · 云平台账单 · 平台变更工单，各指标口径见标题后 i 图标
    </div>
  </div>
</template>

<script>
import AvailabilityHeat from './AvailabilityHeat.vue'
import CapacityTrend from './CapacityTrend.vue'
import ExecKpiRow from './ExecKpiRow.vue'
import ForecastStrip from './ForecastStrip.vue'
import Highlights from './Highlights.vue'
import ProcessMetrics from './ProcessMetrics.vue'
import { LIGHT, cssVars } from '../dashboardTheme'
import {
  report,
  kpis,
  capacityTrend,
  availabilityHeat,
  forecast,
  processMetrics,
  highlights
} from '../mock/execMock'

/**
 * 领导看板。
 * 固定为每日定版快照，不做实时刷新、不做下钻；
 * 页面内不出现设备名与内网 IP，只给到机房/出口粒度的聚合值。
 */
export default {
  name: 'ExecDashboard',
  components: {
    AvailabilityHeat,
    CapacityTrend,
    ExecKpiRow,
    ForecastStrip,
    Highlights,
    ProcessMetrics
  },
  data () {
    return {
      vars: cssVars(LIGHT),
      report: report,
      kpis: kpis,
      capacityTrend: capacityTrend,
      availabilityHeat: availabilityHeat,
      forecast: forecast,
      processMetrics: processMetrics,
      highlights: highlights
    }
  }
}
</script>

<style scoped>
/* 领导看板按阅读顺序纵向排布，允许滚动 */
.exec-dash {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100vh;
  padding: 18px 22px 24px;
  box-sizing: border-box;
  background: var(--dash-page);
  color: var(--dash-ink);
}
.exec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--dash-border);
}
.head-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.head-title {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--dash-ink);
}
.head-period {
  font-size: 14px;
  color: var(--dash-ink2);
}
.head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.head-asof {
  font-size: 12px;
  color: var(--dash-ink2);
  font-variant-numeric: tabular-nums;
}
.head-note {
  font-size: 11px;
  color: var(--dash-muted);
}
.exec-bottom {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 12px;
}
.exec-foot {
  margin-top: 4px;
  font-size: 11px;
  color: var(--dash-muted);
}
.exec-dash >>> .trend-chart {
  min-height: 190px;
}
</style>
