<template>
  <DashPanel title="出口大流量 Top 5" caliber="按源 IP 统计出方向流量，ElastiFlow 近 15 分钟窗口" source="ElastiFlow 15min">
    <template slot="extra">
      <span class="head-note">环比为与上一窗口对比</span>
    </template>

    <div class="talker-list">
      <div class="talker-row" v-for="(t, i) in list" :key="t.ip">
        <span class="row-rank">{{ i + 1 }}</span>
        <div class="row-main">
          <div class="row-top">
            <span class="row-owner" :title="t.owner">{{ t.owner }}</span>
            <span class="row-biz">{{ t.biz }}</span>
            <span class="row-ip">{{ t.ip }}</span>
          </div>
          <MeterBar
            :value="Number(t.gbps)"
            :max="max"
            :color="barColor"
            :height="6"
            :display="fmt(t.gbps)"
          />
        </div>
        <span class="row-delta" :style="{ color: deltaColor(t.delta) }">
          {{ deltaText(t.delta) }}
        </span>
      </div>
    </div>
  </DashPanel>
</template>

<script>
import DashPanel from '../components/DashPanel.vue'
import MeterBar from '../components/MeterBar.vue'
import { DARK, STATUS } from '../dashboardTheme'
import { formatBandwidth } from '../dashboardUtils'

export default {
  name: 'TopTalkers',
  components: { DashPanel, MeterBar },
  props: {
    list: { type: Array, default: () => [] },
    // 环比涨幅超过这个值就标成警告色，提示值班去看
    surgeThreshold: { type: Number, default: 30 }
  },
  data () {
    return { barColor: DARK.series[0] }
  },
  computed: {
    // 条形长度按榜首归一，看的是相对占比
    max () {
      const vals = this.list.map(t => Number(t.gbps) || 0)
      return Math.max.apply(null, vals.concat([0.1]))
    }
  },
  methods: {
    fmt: formatBandwidth,
    deltaText (d) {
      const v = Number(d) || 0
      if (v === 0) return '持平'
      return (v > 0 ? '↑' : '↓') + Math.abs(v) + '%'
    },
    // 流量涨得猛才是值班要关心的，跌了不着色
    deltaColor (d) {
      const v = Number(d) || 0
      if (v >= this.surgeThreshold * 2) return STATUS.critical
      if (v >= this.surgeThreshold) return STATUS.warning
      return 'var(--dash-muted)'
    }
  }
}
</script>

<style scoped>
.head-note {
  font-size: 11px;
  color: var(--dash-muted);
}
.talker-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  justify-content: space-between;
}
.talker-row {
  display: grid;
  grid-template-columns: 16px 1fr 50px;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.row-rank {
  font-size: 12px;
  font-weight: 600;
  color: var(--dash-muted);
  font-variant-numeric: tabular-nums;
}
.row-main {
  min-width: 0;
}
.row-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-width: 0;
}
.row-owner {
  font-size: 12px;
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-biz {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--dash-surface2);
  font-size: 11px;
  color: var(--dash-ink2);
}
.row-ip {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 11px;
  color: var(--dash-muted);
  font-variant-numeric: tabular-nums;
}
.row-delta {
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
