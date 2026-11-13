<template>
  <DashPanel title="机房水位" caliber="机房水位 = 该机房上行链路最高利用率，问题数为未恢复问题" source="Zabbix + CMDB">
    <div class="dc-grid">
      <div
        class="dc-cell"
        v-for="dc in list"
        :key="dc.code"
        :style="{ background: rampOf(dc.util) }"
      >
        <div class="cell-top">
          <span class="cell-code">{{ dc.code }}</span>
          <span class="cell-problems" v-if="dc.problems > 0">
            <StatusDot :color="problemColor(dc.problems)" :shape="problemShape(dc.problems)" :size="8" />
            <span class="problems-num">{{ dc.problems }}</span>
          </span>
        </div>
        <div class="cell-city">{{ dc.city }}</div>
        <div class="cell-util">{{ dc.util }}<span class="util-unit">%</span></div>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatusDot from '../components/StatusDot.vue'
import { DARK, STATUS } from '../dashboardTheme'

export default {
  name: 'DcMatrix',
  components: { DashPanel, StatusDot },
  props: {
    list: { type: Array, default: () => [] }
  },
  methods: {
    // 顺序色带：水位越高越亮，单色系不混多色
    rampOf (util) {
      const ramp = DARK.ramp
      const v = Math.max(0, Math.min(100, Number(util) || 0))
      const idx = Math.min(ramp.length - 1, Math.floor((v / 100) * ramp.length))
      return ramp[idx]
    },
    problemColor (n) {
      if (n >= 3) return STATUS.critical
      if (n >= 2) return STATUS.serious
      return STATUS.warning
    },
    problemShape (n) {
      if (n >= 3) return 'circle'
      if (n >= 2) return 'triangle'
      return 'square'
    }
  }
}
</script>

<style scoped>
.dc-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  height: 100%;
}
.dc-cell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 9px;
  border-radius: 4px;
  min-width: 0;
}
.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.cell-code {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.02em;
}
.cell-problems {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.problems-num {
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}
.cell-city {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cell-util {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.1;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}
.util-unit {
  font-size: 11px;
  font-weight: 400;
  margin-left: 1px;
  color: rgba(255, 255, 255, 0.72);
}
</style>
