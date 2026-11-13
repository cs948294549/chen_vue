<template>
  <DashPanel title="未恢复问题" :caliber="caliber" source="Zabbix problem.get">
    <template slot="extra">
      <span class="sev-legend">
        <StatusDot :color="SEVERITY.P1.color" shape="circle" :label="'P1 ' + count.P1" />
        <StatusDot :color="SEVERITY.P2.color" shape="triangle" :label="'P2 ' + count.P2" />
        <StatusDot :color="SEVERITY.P3.color" shape="square" :label="'P3 ' + count.P3" />
      </span>
    </template>

    <div class="feed">
      <div
        class="feed-row"
        v-for="p in visible"
        :key="p.eventid"
        :class="{ 'is-unack': !p.acknowledged }"
      >
        <span class="row-sev" :style="{ color: sev(p).color }">
          <StatusDot :color="sev(p).color" :shape="sev(p).shape" :size="9" />
          <span class="sev-key">{{ sev(p).key }}</span>
        </span>
        <span class="row-name" :title="p.name">{{ p.name }}</span>
        <span class="row-host">{{ p.host }}</span>
        <span class="row-dur">{{ dur(p.clock) }}</span>
        <span class="row-ack">{{ p.acknowledged ? '已确认' : '待确认' }}</span>
      </div>

      <div class="feed-more" v-if="hiddenP3 > 0">
        另有 {{ hiddenP3 }} 条 P3 提示未展开
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import StatusDot from '../components/StatusDot.vue'
import { SEVERITY, severityOf } from '../dashboardTheme'
import { formatDuration, CALIBER } from '../dashboardUtils'

export default {
  name: 'ProblemFeed',
  components: { DashPanel, StatusDot },
  props: {
    problems: { type: Array, default: () => [] },
    // P3 默认只展示前几条，值班先看得见 P1/P2
    maxP3: { type: Number, default: 2 }
  },
  data () {
    return { SEVERITY: SEVERITY, caliber: CALIBER.problemCount }
  },
  computed: {
    sorted () {
      return this.problems.slice().sort((a, b) => {
        if (b.severity !== a.severity) return b.severity - a.severity
        // 同级按持续时间短的在前，新发的先看
        return a.clock - b.clock
      })
    },
    count () {
      const c = { P1: 0, P2: 0, P3: 0 }
      this.problems.forEach(p => { c[severityOf(p.severity).key]++ })
      return c
    },
    visible () {
      let p3 = 0
      return this.sorted.filter(p => {
        if (severityOf(p.severity).key !== 'P3') return true
        p3++
        return p3 <= this.maxP3
      })
    },
    hiddenP3 () {
      return Math.max(0, this.count.P3 - this.maxP3)
    }
  },
  methods: {
    sev: severityOf,
    // mock 里 clock 是相对分钟数
    dur (minutes) {
      return formatDuration(Number(minutes) * 60)
    }
  }
}
</script>

<style scoped>
.sev-legend {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.feed {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  overflow: hidden;
}
.feed-row {
  display: grid;
  grid-template-columns: 54px 1fr 150px 54px 52px;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 4px;
  background: var(--dash-surface2);
  font-size: 12px;
}
.feed-row.is-unack {
  box-shadow: inset 2px 0 0 0 currentColor;
}
.row-sev {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sev-key {
  font-size: 11px;
  font-weight: 600;
}
.row-name {
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-host {
  color: var(--dash-ink2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-dur {
  color: var(--dash-ink2);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.row-ack {
  color: var(--dash-muted);
  text-align: right;
  font-size: 11px;
}
.feed-more {
  margin-top: 4px;
  padding: 6px 8px;
  font-size: 11px;
  color: var(--dash-muted);
}
</style>
