<template>
  <DashPanel flat>
    <div class="kpi-row">
      <div class="kpi-cell" v-for="(k, i) in kpis" :key="k.key">
        <StatTile
          :hero="i === 0"
          :label="k.label"
          :value="k.value"
          :unit="k.unit"
          :caliber="caliberOf(k)"
          :delta="k.delta"
          :delta-unit="k.deltaUnit"
          :good-when-up="k.goodWhenUp"
          :compare="k.compare"
          :spark="k.spark"
          :spark-color="sparkColor"
        />
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatTile from '../components/StatTile.vue'
import { LIGHT } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

export default {
  name: 'ExecKpiRow',
  components: { DashPanel, StatTile },
  props: {
    kpis: { type: Array, default: () => [] }
  },
  data () {
    return { sparkColor: LIGHT.series[0] }
  },
  methods: {
    // mock 里存的是 CALIBER 的键，这里翻成口径文案
    caliberOf (k) {
      return CALIBER[k.caliber] || ''
    }
  }
}
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
  gap: 28px;
  align-items: start;
}
.kpi-cell {
  min-width: 0;
  padding-left: 18px;
  border-left: 1px solid var(--dash-border);
}
.kpi-cell:first-child {
  padding-left: 0;
  border-left: none;
}
</style>
