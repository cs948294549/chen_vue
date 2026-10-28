<template>
  <div class="ap-icon" :class="[statusClass, {'is-selected': selected}]">
    <!-- 锚点：零尺寸，pin 的尖端钉在 left/top 上，缩放时位置不漂移 -->
    <div class="ap-icon__pin-wrap" :title="tooltip" @mousedown.stop="$emit('marker-down', marker, $event)">
      <div class="ap-icon__pin" :style="pinStyle">
        <svg class="ap-icon__glyph" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="18.4" r="1.7" fill="currentColor"/>
          <path d="M6.9 13.6a7.4 7.4 0 0 1 10.2 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3.4 10.1a12.3 12.3 0 0 1 17.2 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span v-if="alarm && !nameOnly" class="ap-icon__alarm-dot"></span>
      </div>
    </div>

    <!-- 标签分级：0 只显示状态点，1 名称+用户数，2 名称+各射频明细 -->
    <!-- name-only 用于地图编辑：只关心放了哪些 AP，不展示指标 -->
    <div v-if="labelLevel === 1" class="ap-icon__label">
      <span class="ap-icon__name">{{ title }}</span>
      <template v-if="!nameOnly">
        <span class="ap-icon__count" v-if="isOnline">{{ marker.client_count }}人</span>
        <span class="ap-icon__count is-off" v-else>离线</span>
      </template>
    </div>
    <!-- 全量标签：名称 + 各射频标签（射频/利用率/信道/功率/终端数，单行展示） -->
    <!-- 刚拖入的 AP 还没有射频快照，只显示名称，避免出现一堆 --dBm/0人 -->
    <div v-else-if="labelLevel === 2" class="ap-icon__label is-full">
      <span class="ap-icon__name">{{ title }}</span>
      <!-- 利用率按射频分开：一个射频一个标签，颜色随信道利用率变化 -->
      <!-- 信息只往横向铺，不换行不加高：射频数多时靠 flex-wrap 另起一排标签 -->
      <span class="ap-icon__radios" v-if="isOnline && radioChips.length">
        <em
          v-for="r in radioChips"
          :key="r.key"
          class="ap-icon__radio"
          :class="'is-' + r.level"
          :title="r.tip">{{ r.text }}</em>
      </span>
    </div>
  </div>
</template>

<script>
const UTIL_WARN = 40
const UTIL_BAD = 70

export default {
  name: 'ApIcon',

  props: {
    marker: { type: Object, required: true },
    labelLevel: { type: Number, default: 2 },
    nameOnly: { type: Boolean, default: false },   // 只显示名称，不展示终端数等指标
    selected: { type: Boolean, default: false }
  },

  computed: {
    isOnline() {
      return this.marker.online_status === 'online'
    },

    isUnknown() {
      return this.marker.online_status === 'unknown' || !this.marker.online_status
    },

    title() {
      return this.marker.display_name || this.marker.ap_name || this.marker.ap_mac
    },

    // 悬浮提示：标签被缩小时也能看到完整名称和 MAC
    tooltip() {
      const name = this.marker.ap_name || this.marker.ap_mac
      const display = this.marker.display_name
      return display && display !== name ? display + '\n' + name + '\n' + this.marker.ap_mac : name + '\n' + this.marker.ap_mac
    },

    statusClass() {
      if (this.isUnknown) return 'is-unknown'
      return this.isOnline ? 'is-online' : 'is-offline'
    },

    utilValue() {
      return typeof this.marker.utilization === 'number' ? this.marker.utilization : null
    },

    utilLevel() {
      if (!this.isOnline || this.utilValue === null) return 'none'
      if (this.utilValue > UTIL_BAD) return 'bad'
      if (this.utilValue >= UTIL_WARN) return 'warn'
      return 'ok'
    },

    ringColor() {
      if (this.isUnknown) return '#c0c4cc'
      if (!this.isOnline) return '#b1b6bd'
      if (this.utilLevel === 'bad') return '#f56c6c'
      if (this.utilLevel === 'warn') return '#e6a23c'
      return '#67c23a'
    },

    pinStyle() {
      return {
        '--ring': this.ringColor,
        '--ring-soft': this.ringColor + '33'
      }
    },

    // 利用率高视为需要关注的告警
    alarm() {
      return this.isOnline && this.utilLevel === 'bad'
    },

    // 每个射频一个单行标签：R0 62% CH149 · 20dBm · 8人
    // 只往横向铺，不换行不加高；不写频段，信道号本身就能区分 2.4G / 5G
    radioChips() {
      const list = this.marker.radios || []
      if (!list.length) {
        // 后端未返回射频明细时，退回 AP 汇总的单值（max 利用率 + 汇总终端数）
        if (typeof this.marker.utilization !== 'number') return []
        const extra = this.subText('', this.marker.tx_power, this.marker.client_count)
        return [{
          key: 'sum',
          text: ['利用率 ' + this.marker.utilization + '%', extra].filter(Boolean).join(' '),
          level: this.utilLevelOf(this.marker.utilization),
          tip: '信道利用率 ' + this.marker.utilization + '%' + (extra ? '\n' + extra : '')
        }]
      }
      return list.map((r, i) => {
        const id = this.radioLabel(r.radio_id, i)
        const ch = r.channel ? 'CH' + r.channel : ''
        const hasUtil = typeof r.utilization === 'number'
        const util = hasUtil ? r.utilization + '%' : '--'
        const extra = this.subText(ch, r.tx_power, r.client_count)
        return {
          key: 'r' + id,
          text: [id, util, extra].filter(Boolean).join(' '),
          level: this.utilLevelOf(r.utilization),
          tip: [
            `${id}${ch ? ' · ' + ch : ''} 信道利用率 ${hasUtil ? r.utilization + '%' : '--'}`,
            extra
          ].filter(Boolean).join('\n')
        }
      })
    }
  },

  methods: {
    // 射频 ID 只是个数字，加 R 前缀更像个标识：R0 / R1
    radioLabel(radioId, index) {
      if (radioId === null || radioId === undefined || radioId === '') return 'R' + (index + 1)
      return 'R' + radioId
    },

    // 标签尾部附加信息：信道 · 功率 · 终端数，任一为空就跳过
    subText(channel, power, clients) {
      const parts = []
      if (channel) parts.push(channel)
      if (power !== null && power !== undefined && power !== '') parts.push(power + 'dBm')
      if (clients !== null && clients !== undefined && clients !== '') parts.push(clients + '人')
      return parts.join(' · ')
    },

    utilLevelOf(v) {
      if (typeof v !== 'number') return 'none'
      if (v > UTIL_BAD) return 'bad'
      if (v >= UTIL_WARN) return 'warn'
      return 'ok'
    }
  }
}
</script>

<style scoped>
.ap-icon {
  position: absolute;
  width: 0;
  height: 0;
  z-index: 10;
}

.ap-icon.is-selected {
  z-index: 30;
}

/* ---------- 图标 ---------- */

.ap-icon__pin-wrap {
  position: absolute;
  left: 0;
  bottom: 0;
  transform: translateX(-50%);
  cursor: pointer;
  padding: 4px 6px 10px;   /* 扩大点击热区，尖端仍对齐锚点 */
  margin: 0 0 -10px;
}

.ap-icon__pin {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--ring, #909399);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18), 0 0 0 4px var(--ring-soft, rgba(144, 147, 153, 0.2));
  color: var(--ring, #909399);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* 尖端（pin 底部三角） */
.ap-icon__pin::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -7px;
  margin-left: -6px;
  border: 6px solid transparent;
  border-top-color: var(--ring, #909399);
}

.ap-icon__glyph {
  width: 17px;
  height: 17px;
}

.ap-icon__alarm-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f56c6c;
  border: 2px solid #fff;
  animation: ap-pulse 1.6s infinite;
}

@keyframes ap-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6); }
  50% { box-shadow: 0 0 0 5px rgba(245, 108, 108, 0); }
}

.ap-icon.is-offline .ap-icon__pin {
  border-style: dashed;
  color: #a8abb2;
  opacity: 0.9;
}

.ap-icon.is-unknown .ap-icon__pin {
  border-style: dashed;
  opacity: 0.8;
}

.ap-icon.is-selected .ap-icon__pin {
  transform: scale(1.16);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25), 0 0 0 5px var(--ring-soft, rgba(64, 158, 255, 0.25));
}

/* ---------- 标签 ---------- */

.ap-icon__label {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  font-size: 12px;
  color: #303133;
  pointer-events: none;
}

.ap-icon__label.is-full {
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 9px;
  border-radius: 6px;
}

.ap-icon__name {
  font-weight: 600;
  font-size: 12px;
}

.ap-icon__count {
  color: #409eff;
  font-size: 11px;
}

.ap-icon__count.is-off {
  color: #909399;
}

/* 按射频分标签：颜色跟着该射频的信道利用率走，与圆环同一套阈值 */
/* 单个标签始终单行不折行；射频多了就整块换行，每个标签高度不变 */
.ap-icon__radios {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px 4px;
  max-width: 260px;
}

/* 每个射频一个单行标签：R0 62% CH149 · 20dBm · 8人 */
.ap-icon__radio {
  display: inline-flex;
  align-items: baseline;
  font-style: normal;
  font-size: 11px;
  line-height: 14px;
  padding: 0 6px;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid transparent;
}

.ap-icon__radio.is-ok {
  color: #2f7a1a;
  background: rgba(103, 194, 58, 0.22);
  border-color: rgba(103, 194, 58, 0.5);
}

.ap-icon__radio.is-warn {
  color: #a35f0d;
  background: rgba(230, 162, 60, 0.26);
  border-color: rgba(230, 162, 60, 0.55);
}

.ap-icon__radio.is-bad {
  color: #fff;
  background: rgba(245, 108, 108, 0.92);
  border-color: #f56c6c;
  font-weight: 600;
}

.ap-icon__radio.is-none {
  color: #909399;
  background: rgba(144, 147, 153, 0.16);
  border-color: rgba(144, 147, 153, 0.35);
}
</style>
