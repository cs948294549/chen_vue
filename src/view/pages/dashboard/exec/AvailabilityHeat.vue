<template>
  <DashPanel title="各机房可用性" :caliber="caliber" source="Zabbix SLA">
    <template slot="extra">
      <span class="heat-legend">
        <StatusDot :color="STATUS.good" shape="square" :label="'达标 ≥ ' + target + '%'" />
        <StatusDot :color="STATUS.warning" shape="triangle" label="未达标" />
      </span>
    </template>

    <div class="heat">
      <div class="heat-head">
        <span class="h-dc">机房</span>
        <span class="h-week" v-for="w in heat.weeks" :key="w">{{ w }}</span>
        <span class="h-month">本月</span>
      </div>

      <div class="heat-row" v-for="r in rows" :key="r.code">
        <span class="r-dc">
          <span class="dc-code">{{ r.code }}</span>
          <span class="dc-city">{{ r.city }}</span>
        </span>
        <span
          class="r-cell"
          v-for="(c, i) in r.cells"
          :key="i"
          :style="{ background: cellBg(c) }"
        >
          <span class="cell-num">{{ fmtCell(c) }}</span>
          <StatusDot v-if="c < target" :color="STATUS.warning" shape="triangle" :size="8" />
        </span>
        <span class="r-month">
          <StatusDot
            :color="r.avg >= target ? STATUS.good : STATUS.warning"
            :shape="r.avg >= target ? 'square' : 'triangle'"
            :label="fmtCell(r.avg) + '%'"
          />
        </span>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatusDot from '../components/StatusDot.vue'
import { LIGHT, STATUS } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

export default {
  name: 'AvailabilityHeat',
  components: { DashPanel, StatusDot },
  props: {
    heat: { type: Object, default: () => ({ weeks: [], rows: [], target: 99.95 }) }
  },
  data () {
    return { STATUS: STATUS, caliber: CALIBER.availability }
  },
  computed: {
    target () {
      return Number(this.heat.target) || 99.95
    },
    rows () {
      return (this.heat.rows || []).map(r => {
        const cells = r.cells || []
        const sum = cells.reduce((a, b) => a + Number(b), 0)
        return {
          code: r.code,
          city: r.city,
          cells: cells,
          avg: cells.length ? sum / cells.length : 0
        }
      })
    }
  },
  methods: {
    // 数值始终以文字直标，颜色只做辅助
    fmtCell (v) {
      const n = Number(v) || 0
      return n >= 100 ? '100' : n.toFixed(2)
    },
    // 达标用同一色系的浅色阶表示程度，未达标走状态色
    cellBg (v) {
      const n = Number(v) || 0
      if (n < this.target) return 'rgba(250, 178, 25, 0.22)'
      if (n >= 100) return LIGHT.ramp[1]
      return LIGHT.ramp[0]
    }
  }
}
</script>

<style scoped>
.heat-legend {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}
.heat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.heat-head,
.heat-row {
  display: grid;
  grid-template-columns: 132px repeat(4, 1fr) 104px;
  align-items: center;
  gap: 2px;
}
.heat-head {
  margin-bottom: 2px;
  font-size: 11px;
  color: var(--dash-muted);
}
.h-week {
  text-align: center;
}
.h-month {
  text-align: right;
  padding-right: 2px;
}
.r-dc {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.dc-code {
  font-size: 12px;
  font-weight: 600;
  color: var(--dash-ink);
}
.dc-city {
  font-size: 11px;
  color: var(--dash-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 26px;
  border-radius: 4px;
}
.cell-num {
  font-size: 12px;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}
.r-month {
  display: flex;
  justify-content: flex-end;
  padding-right: 2px;
}
</style>
