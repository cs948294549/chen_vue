<template>
  <div
    class="change-banner"
    v-if="change && change.atId"
    :style="{ borderLeftColor: color }"
  >
    <StatusDot :color="color" shape="triangle" label="变更进行中" />
    <span class="banner-id">{{ change.atId }}</span>
    <span class="banner-title" :title="change.title">{{ change.title }}</span>
    <span class="banner-field">窗口 {{ change.window }}</span>
    <span class="banner-field">影响 {{ change.affected }}</span>
    <span class="banner-field">{{ change.owner }}</span>
    <span class="banner-meter">
      <MeterBar
        :value="Number(change.progress)"
        :color="color"
        :height="6"
        :display="change.progress + '%'"
      />
    </span>
  </div>
</template>

<script>
import MeterBar from '../components/MeterBar.vue'
import StatusDot from '../components/StatusDot.vue'
import { STATUS } from '../dashboardTheme'

/**
 * 变更横幅。
 * 变更窗口内的告警大多是人为动作造成的，
 * 值班先看到这条就不会把割接当故障处理。
 */
export default {
  name: 'ChangeBanner',
  components: { MeterBar, StatusDot },
  props: {
    change: { type: Object, default: null }
  },
  data () {
    return { color: STATUS.warning }
  }
}
</script>

<style scoped>
.change-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-left-width: 2px;
  border-left-style: solid;
  border-radius: 6px;
  font-size: 12px;
  min-width: 0;
}
.banner-id {
  font-weight: 600;
  color: var(--dash-ink);
  font-variant-numeric: tabular-nums;
}
.banner-title {
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.banner-field {
  flex-shrink: 0;
  color: var(--dash-muted);
}
.banner-meter {
  flex-shrink: 0;
  width: 160px;
  margin-left: auto;
}
</style>
