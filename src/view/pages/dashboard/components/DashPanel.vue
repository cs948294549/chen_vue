<template>
  <div class="dash-panel" :class="{ 'is-flat': flat }">
    <div class="panel-head" v-if="title || $slots.extra">
      <div class="panel-title">
        <span class="title-text">{{ title }}</span>
        <InfoTip v-if="caliber" :text="caliber" />
      </div>
      <div class="panel-extra">
        <slot name="extra"></slot>
      </div>
    </div>
    <div class="panel-body" :style="{ minHeight: bodyHeight }">
      <slot></slot>
    </div>
    <div class="panel-foot" v-if="source">
      <span class="source-tag">{{ source }}</span>
    </div>
  </div>
</template>

<script>
import InfoTip from './InfoTip.vue'

export default {
  name: 'DashPanel',
  components: { InfoTip },
  props: {
    title: { type: String, default: '' },
    // 口径说明，悬停图标显示，两份看板共用同一份文案
    caliber: { type: String, default: '' },
    // 数据来源标识，排查时不用猜为什么两个数对不上
    source: { type: String, default: '' },
    bodyHeight: { type: String, default: '' },
    flat: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.dash-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 12px 14px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  border-radius: 6px;
}
.dash-panel.is-flat {
  background: transparent;
  border: none;
  padding: 0;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.panel-title {
  display: flex;
  align-items: center;
  min-width: 0;
}
.title-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.panel-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.panel-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
.panel-foot {
  flex-shrink: 0;
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.source-tag {
  font-size: 11px;
  color: var(--dash-muted);
  letter-spacing: 0.04em;
}
</style>
