<template>
  <DashPanel title="出口水位" :caliber="caliber" source="Zabbix 1min">
    <template slot="extra">
      <span class="legend-note">竖线为配额线</span>
    </template>
    <div class="egress-list">
      <div class="egress-row" v-for="g in groups" :key="g.group">
        <div class="row-head">
          <span class="row-name">{{ g.group }}</span>
          <StatusDot
            :color="levelOf(g).color"
            :shape="levelOf(g).shape"
            :label="levelOf(g).label"
          />
        </div>
        <div class="row-meter">
          <MeterBar
            :value="utilOf(g)"
            :color="levelOf(g).color"
            :marker="quotaPct(g)"
            marker-label="配额线"
            :height="8"
            :display="utilOf(g).toFixed(0) + '%'"
          />
        </div>
        <div class="row-foot">
          <span>当前 {{ fmt(g.currentGbps) }} / 合同 {{ fmt(g.contractGbps) }}</span>
          <span class="foot-p95">95 峰值 {{ fmt(g.p95Gbps) }}</span>
        </div>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import MeterBar from '../components/MeterBar.vue'
import StatusDot from '../components/StatusDot.vue'
import { STATUS } from '../dashboardTheme'
import { formatBandwidth, CALIBER } from '../dashboardUtils'

export default {
  name: 'EgressWaterLevel',
  components: { DashPanel, MeterBar, StatusDot },
  props: {
    groups: { type: Array, default: () => [] }
  },
  data () {
    return { caliber: CALIBER.egressRealtime }
  },
  methods: {
    fmt: formatBandwidth,
    utilOf (g) {
      if (!g.contractGbps) return 0
      return (Number(g.currentGbps) / Number(g.contractGbps)) * 100
    },
    quotaPct (g) {
      if (!g.contractGbps || !g.quotaGbps) return null
      return (Number(g.quotaGbps) / Number(g.contractGbps)) * 100
    },
    // 超配额线 → 严重；到配额线八成 → 警告
    levelOf (g) {
      const util = this.utilOf(g)
      const quota = this.quotaPct(g) || 90
      if (util >= quota) return { color: STATUS.critical, shape: 'circle', label: '超配额' }
      if (util >= quota * 0.85) return { color: STATUS.warning, shape: 'triangle', label: '偏高' }
      return { color: STATUS.good, shape: 'square', label: '正常' }
    }
  }
}
</script>

<style scoped>
.legend-note {
  font-size: 11px;
  color: var(--dash-muted);
}
.egress-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  justify-content: space-between;
}
.egress-row {
  min-width: 0;
}
.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}
.row-name {
  font-size: 13px;
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--dash-muted);
}
.foot-p95 {
  flex-shrink: 0;
}
</style>
