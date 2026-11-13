<template>
  <DashPanel title="本月要点" source="网络组整理">
    <div class="hl-list">
      <div class="hl-row" v-for="(h, i) in list" :key="i">
        <StatusDot :color="lv(h.type).color" :shape="lv(h.type).shape" :label="lv(h.type).label" />
        <span class="hl-text">{{ h.text }}</span>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatusDot from '../components/StatusDot.vue'
import { STATUS } from '../dashboardTheme'

export default {
  name: 'Highlights',
  components: { DashPanel, StatusDot },
  props: {
    list: { type: Array, default: () => [] }
  },
  methods: {
    lv (type) {
      if (type === 'critical') return { color: STATUS.critical, shape: 'circle', label: '风险' }
      if (type === 'warning') return { color: STATUS.warning, shape: 'triangle', label: '关注' }
      return { color: STATUS.good, shape: 'square', label: '改善' }
    }
  }
}
</script>

<style scoped>
.hl-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.hl-row {
  display: grid;
  grid-template-columns: 62px 1fr;
  align-items: start;
  gap: 12px;
}
.hl-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dash-ink2);
}
</style>
