<template>
  <DashPanel title="容量预测" :caliber="caliber" source="按近 30 天 95 峰值线性回归">
    <div class="fc-list">
      <div class="fc-row" v-for="f in list" :key="f.name">
        <div class="fc-head">
          <span class="fc-name" :title="f.name">{{ f.name }}</span>
          <StatusDot :color="lv(f.status).color" :shape="lv(f.status).shape" :label="lv(f.status).label" />
        </div>
        <div class="fc-figure">
          <span class="fig-months">{{ monthsText(f.monthsLeft) }}</span>
          <span class="fig-label">触及 80% 安全线</span>
        </div>
        <div class="fc-foot">
          当前 {{ f.current }}% · 月均增长 {{ f.growthPerMonth }}pp
        </div>
      </div>
    </div>
    <div class="fc-note">预测为趋势参考，不构成容量承诺</div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatusDot from '../components/StatusDot.vue'
import { STATUS } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

export default {
  name: 'ForecastStrip',
  components: { DashPanel, StatusDot },
  props: {
    list: { type: Array, default: () => [] }
  },
  data () {
    return { caliber: CALIBER.forecast }
  },
  methods: {
    lv (status) {
      if (status === 'critical') return { color: STATUS.critical, shape: 'circle', label: '需提前扩容' }
      if (status === 'warning') return { color: STATUS.warning, shape: 'triangle', label: '需关注' }
      return { color: STATUS.good, shape: 'square', label: '余量充足' }
    },
    monthsText (m) {
      const v = Number(m) || 0
      if (v >= 24) return '24 个月以上'
      return v.toFixed(1) + ' 个月'
    }
  }
}
</script>

<style scoped>
.fc-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}
.fc-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 4px;
  background: var(--dash-surface2);
  min-width: 0;
}
.fc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.fc-name {
  font-size: 12px;
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fc-figure {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.fig-months {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}
.fig-label {
  font-size: 11px;
  color: var(--dash-ink2);
}
.fc-foot {
  font-size: 11px;
  color: var(--dash-muted);
  font-variant-numeric: tabular-nums;
}
.fc-note {
  margin-top: 8px;
  font-size: 11px;
  color: var(--dash-muted);
}
</style>
