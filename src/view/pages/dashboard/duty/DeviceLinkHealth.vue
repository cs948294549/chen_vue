<template>
  <DashPanel title="设备与链路健康" :caliber="caliber" source="Zabbix host.get + CMDB">
    <div class="health">
      <div class="health-top">
        <StatTile
          label="纳管设备"
          :value="health.managed + ' / ' + health.total"
          :caliber="caliber"
          :delta="null"
        />
        <div class="gap-box">
          <div class="gap-line">
            <StatusDot :color="gapLevel.color" :shape="gapLevel.shape" :label="gapLevel.label" />
            <span class="gap-num">缺口 {{ gapCount }} 台</span>
          </div>
          <div class="gap-row" v-for="g in gap" :key="g.ip">
            <span class="gap-type">{{ g.type }}</span>
            <span class="gap-host">{{ g.host }}</span>
            <span class="gap-reason" :title="g.reason">{{ g.reason }}</span>
          </div>
        </div>
      </div>

      <div class="health-cols">
        <div class="col">
          <div class="col-title">CPU 最高</div>
          <div class="col-row" v-for="c in health.cpuTop" :key="c.host">
            <span class="col-name" :title="c.host">{{ c.host }}</span>
            <MeterBar
              :value="c.value"
              :color="utilColor(c.value)"
              :height="6"
              :display="c.value + '%'"
            />
          </div>
        </div>
        <div class="col">
          <div class="col-title">链路利用率最高</div>
          <div class="col-row" v-for="l in health.linkTop" :key="l.name">
            <span class="col-name" :title="l.name">{{ l.name }}</span>
            <MeterBar
              :value="l.util"
              :color="utilColor(l.util)"
              :height="6"
              :display="l.util + '%'"
            />
          </div>
        </div>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import MeterBar from '../components/MeterBar.vue'
import StatTile from '../components/StatTile.vue'
import StatusDot from '../components/StatusDot.vue'
import { STATUS } from '../dashboardTheme'
import { CALIBER } from '../dashboardUtils'

export default {
  name: 'DeviceLinkHealth',
  components: { DashPanel, MeterBar, StatTile, StatusDot },
  props: {
    health: { type: Object, default: () => ({ managed: 0, total: 0, cpuTop: [], linkTop: [] }) },
    gap: { type: Array, default: () => [] }
  },
  data () {
    return { caliber: CALIBER.coverage }
  },
  computed: {
    // 缺口 = CMDB 有、Zabbix 没纳管或采集断了的设备
    // 这类设备在看板上会"看起来正常"，所以必须单独报出来
    gapCount () {
      return Math.max(0, Number(this.health.total) - Number(this.health.managed))
    },
    gapLevel () {
      const n = this.gapCount
      if (n >= 10) return { color: STATUS.critical, shape: 'circle', label: '覆盖不足' }
      if (n > 0) return { color: STATUS.warning, shape: 'triangle', label: '有缺口' }
      return { color: STATUS.good, shape: 'square', label: '全覆盖' }
    }
  },
  methods: {
    utilColor (v) {
      const n = Number(v) || 0
      if (n >= 85) return STATUS.critical
      if (n >= 70) return STATUS.warning
      return STATUS.good
    }
  }
}
</script>

<style scoped>
.health {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.health-top {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 14px;
  align-items: start;
}
.gap-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.gap-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}
.gap-num {
  font-size: 12px;
  color: var(--dash-ink2);
  font-variant-numeric: tabular-nums;
}
.gap-row {
  display: grid;
  grid-template-columns: 62px 112px 1fr;
  gap: 8px;
  font-size: 11px;
  color: var(--dash-muted);
  min-width: 0;
}
.gap-type {
  color: var(--dash-ink2);
}
.gap-host,
.gap-reason {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.health-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  flex: 1;
  min-height: 0;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.col-title {
  font-size: 11px;
  color: var(--dash-muted);
  letter-spacing: 0.02em;
}
.col-row {
  display: grid;
  grid-template-columns: 1fr 108px;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.col-name {
  font-size: 12px;
  color: var(--dash-ink2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
