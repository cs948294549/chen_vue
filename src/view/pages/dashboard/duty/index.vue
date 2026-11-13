<template>
  <div class="duty-dash" :style="vars">
    <DutyHeader :problems="problems" :sources="meta.sources" />

    <ChangeBanner :change="activeChange" />

    <div class="dash-grid">
      <div class="grid-col grid-col-left">
        <EgressWaterLevel :groups="egress" />
        <DcMatrix :list="dataCenters" />
      </div>

      <div class="grid-col grid-col-mid">
        <ProblemFeed :problems="problems" />
        <DutyTrend :trend="egressTrend24h" />
      </div>

      <div class="grid-col grid-col-right">
        <TopTalkers :list="topTalkers" />
        <DeviceLinkHealth :health="health" :gap="coverageGap" />
      </div>
    </div>

    <div class="dash-foot">
      <span>刷新间隔 {{ tickSeconds }}s</span>
      <span>最后刷新 {{ refreshedAt }}</span>
      <span>口径说明见各面板标题后的 i 图标</span>
    </div>
  </div>
</template>

<script>
import ChangeBanner from './ChangeBanner.vue'
import DcMatrix from './DcMatrix.vue'
import DeviceLinkHealth from './DeviceLinkHealth.vue'
import DutyHeader from './DutyHeader.vue'
import DutyTrend from './DutyTrend.vue'
import EgressWaterLevel from './EgressWaterLevel.vue'
import ProblemFeed from './ProblemFeed.vue'
import TopTalkers from './TopTalkers.vue'
import { DARK, cssVars } from '../dashboardTheme'
import { formatClock } from '../dashboardUtils'
import {
  egressGroups,
  dataCenters,
  problems,
  topTalkers,
  health,
  coverageGap,
  egressTrend24h,
  activeChange,
  meta
} from '../mock/dutyMock'

export default {
  name: 'DutyDashboard',
  components: {
    ChangeBanner,
    DcMatrix,
    DeviceLinkHealth,
    DutyHeader,
    DutyTrend,
    EgressWaterLevel,
    ProblemFeed,
    TopTalkers
  },
  data () {
    return {
      vars: cssVars(DARK),
      tickSeconds: 5,
      refreshedAt: formatClock(Date.now()),
      // mock 深拷贝一份，定时抖动当前流量，演示时看起来是活的
      egress: JSON.parse(JSON.stringify(egressGroups)),
      dataCenters: dataCenters,
      problems: problems,
      topTalkers: topTalkers,
      health: health,
      coverageGap: coverageGap,
      egressTrend24h: egressTrend24h,
      activeChange: activeChange,
      meta: meta
    }
  },
  mounted () {
    this.timer = setInterval(this.tick, this.tickSeconds * 1000)
  },
  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    // 接真实接口时这里换成一次拉取，组件不用改
    tick () {
      this.egress.forEach(g => {
        const jitter = (Math.random() - 0.45) * 0.12
        const next = Number(g.currentGbps) * (1 + jitter)
        g.currentGbps = Number(Math.max(0.2, Math.min(g.contractGbps, next)).toFixed(2))
      })
      this.refreshedAt = formatClock(Date.now())
    }
  }
}
</script>

<style scoped>
/* 投屏用，1920×1080 一屏放完不滚动 */
.duty-dash {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100vh;
  padding: 12px 14px;
  box-sizing: border-box;
  background: var(--dash-page);
  color: var(--dash-ink);
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1.25fr 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}
.grid-col {
  display: grid;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}
.grid-col-left {
  grid-template-rows: 1.15fr 1fr;
}
.grid-col-mid {
  grid-template-rows: 1.5fr 1fr;
}
.grid-col-right {
  grid-template-rows: 1fr 1.15fr;
}
.dash-foot {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 11px;
  color: var(--dash-muted);
}
</style>
