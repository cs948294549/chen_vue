<template>
  <div class="duty-head">
    <div class="head-left">
      <span class="head-title">网络实时运行看板</span>
      <span class="head-sub">值班视图</span>
    </div>

    <div class="head-mid">
      <StatTile
        hero
        label="当前未恢复问题"
        :value="total"
        unit="条"
        :caliber="caliber"
      >
        <div class="hero-breakdown">
          <StatusDot :color="SEVERITY.P1.color" shape="circle" :label="'P1 ' + count.P1" />
          <StatusDot :color="SEVERITY.P2.color" shape="triangle" :label="'P2 ' + count.P2" />
          <StatusDot :color="SEVERITY.P3.color" shape="square" :label="'P3 ' + count.P3" />
        </div>
      </StatTile>
    </div>

    <div class="head-right">
      <div class="head-row">
        <StatusDot :color="overall.color" :shape="overall.shape" :label="overall.label" />
      </div>
      <div class="head-clock">{{ clock }}</div>
      <div class="head-meta">
        数据源 {{ sources.join(' · ') }}
      </div>
    </div>
  </div>
</template>

<script>
import StatTile from '../components/StatTile.vue'
import StatusDot from '../components/StatusDot.vue'
import { SEVERITY, STATUS, severityOf } from '../dashboardTheme'
import { formatClock, CALIBER } from '../dashboardUtils'

export default {
  name: 'DutyHeader',
  components: { StatTile, StatusDot },
  props: {
    problems: { type: Array, default: () => [] },
    sources: { type: Array, default: () => [] }
  },
  data () {
    return {
      SEVERITY: SEVERITY,
      caliber: CALIBER.problemCount,
      clock: formatClock(Date.now())
    }
  },
  computed: {
    total () {
      return this.problems.length
    },
    count () {
      const c = { P1: 0, P2: 0, P3: 0 }
      this.problems.forEach(p => { c[severityOf(p.severity).key]++ })
      return c
    },
    // 整体状态由最高级别的未恢复问题决定
    overall () {
      if (this.count.P1 > 0) return { color: STATUS.critical, shape: 'circle', label: '有严重故障' }
      if (this.count.P2 > 0) return { color: STATUS.warning, shape: 'triangle', label: '存在告警' }
      return { color: STATUS.good, shape: 'square', label: '运行正常' }
    }
  },
  mounted () {
    this.timer = setInterval(() => {
      this.clock = formatClock(Date.now())
    }, 1000)
  },
  beforeDestroy () {
    if (this.timer) clearInterval(this.timer)
  }
}
</script>

<style scoped>
.duty-head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 12px 18px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 6px;
}
.head-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.head-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--dash-ink);
}
.head-sub {
  font-size: 12px;
  color: var(--dash-muted);
}
.head-mid {
  display: flex;
  justify-content: center;
}
.hero-breakdown {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}
.head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.head-row {
  display: flex;
  align-items: center;
}
.head-clock {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}
.head-meta {
  font-size: 11px;
  color: var(--dash-muted);
}
</style>
