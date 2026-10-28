<template>
  <el-drawer
    :visible="visible"
    :size="760"
    :with-header="false"
    :append-to-body="true"
    :close-on-press-escape="true"
    :wrapper-closable="true"
    custom-class="ap-drawer"
    @close="handleClose">

    <div class="ap-drawer__wrap" v-loading="loading">

      <!-- ============ 顶部标题 ============ -->
      <div class="ap-drawer__header">
        <div class="ap-drawer__title">
          <i class="el-icon-wifi ap-drawer__title-icon" :class="statusColorClass"></i>
          <span class="ap-drawer__name">{{ apName }}</span>
          <el-tag :type="statusTagType" size="mini">{{ statusText }}</el-tag>
          <el-tag v-if="utilAlarm" type="danger" size="mini" effect="dark">高负载</el-tag>
        </div>
        <div class="ap-drawer__sub">
          <span class="mono">{{ apMac }}</span>
          <span v-if="base.ac_name">· {{ base.ac_name }}</span>
          <span v-if="base.last_seen_at">· 数据时间 {{ base.last_seen_at }}</span>
        </div>
        <el-button class="ap-drawer__close" icon="el-icon-close" circle size="mini" @click="handleClose"></el-button>
      </div>

      <div class="ap-drawer__body">
        <!-- ============ 1. 基础信息 ============ -->
        <section class="ap-section">
          <div class="ap-section__title">
            <i class="el-icon-info"></i><span>基础信息</span>
          </div>
          <el-descriptions :column="3" size="mini" border>
            <el-descriptions-item label="AP 名称">{{ base.ap_name || '--' }}</el-descriptions-item>
            <el-descriptions-item label="MAC">{{ base.ap_mac || '--' }}</el-descriptions-item>
            <el-descriptions-item label="IP">{{ base.ap_ip || '--' }}</el-descriptions-item>
            <el-descriptions-item label="型号">{{ base.model || '--' }}</el-descriptions-item>
            <el-descriptions-item label="软件版本">{{ base.sw_version || '--' }}</el-descriptions-item>
            <el-descriptions-item label="分组">{{ base.ap_group || '--' }}</el-descriptions-item>
            <el-descriptions-item label="所属 AC">{{ base.ac_name || '--' }}</el-descriptions-item>
            <el-descriptions-item label="上级设备">{{ base.lldp_name || '--' }}</el-descriptions-item>
            <el-descriptions-item label="上级端口">{{ base.lldp_port || '--' }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <!-- ============ 2. 射频信息 ============ -->
        <section class="ap-section">
          <div class="ap-section__title">
            <i class="el-icon-odometer"></i><span>射频信息</span>
            <span class="ap-section__hint">共 {{ radios.length }} 个已开射频</span>
          </div>

          <div v-if="radios.length" class="radio-grid">
            <div v-for="r in radios" :key="r.radio_id" class="radio-card">
              <div class="radio-card__head">
                <span class="radio-card__radio">{{ radioLabel(r.radio_id) }}</span>
                <span class="radio-card__band" :class="is5g(r) ? 'is-5g' : 'is-24g'">{{ bandText(r) }}</span>
                <el-tag :type="r.channel_status === 'up' ? 'success' : 'info'" size="mini">
                  {{ r.channel_status === 'up' ? '已开启' : r.channel_status }}
                </el-tag>
              </div>

              <div class="radio-card__rows">
                <div class="radio-card__row">
                  <span class="k">信道</span>
                  <span class="v mono">CH{{ r.channel || '--' }} / {{ r.bandwidth || '--' }}MHz</span>
                </div>
                <div class="radio-card__row">
                  <span class="k">功率</span>
                  <span class="v mono">{{ r.tx_power == null ? '--' : r.tx_power + ' dBm' }}
                    <em class="muted">/ 最大 {{ r.max_power == null ? '--' : r.max_power + ' dBm' }}</em>
                  </span>
                </div>
                <div class="radio-card__row">
                  <span class="k">关联用户</span>
                  <span class="v mono">{{ r.client_count }} 人</span>
                </div>
                <div class="radio-card__row">
                  <span class="k">干扰率</span>
                  <span class="v mono" :class="rateClass(r.interference_rate, 15, 30)">
                    {{ r.interference_rate == null ? '--' : r.interference_rate + '%' }}
                  </span>
                </div>
              </div>

              <div class="radio-card__util">
                <div class="radio-card__util-label">
                  <span>信道利用率</span>
                  <span :class="rateClass(r.utilization, 40, 70)">
                    {{ r.utilization == null ? '--' : r.utilization + '%' }}
                  </span>
                </div>
                <div class="radio-card__bar">
                  <div
                    class="radio-card__bar-inner"
                    :class="barClass(r.utilization)"
                    :style="{ width: Math.min(r.utilization || 0, 100) + '%' }">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="该 AP 未开启射频" :image-size="60"></el-empty>
        </section>

        <!-- ============ 3. 开放 SSID ============ -->
        <section class="ap-section">
          <div class="ap-section__title">
            <i class="el-icon-share"></i><span>开放 SSID</span>
            <span class="ap-section__hint">共 {{ ssids.length }} 条</span>
          </div>
          <el-table v-if="ssids.length" :data="ssids" size="mini" border>
            <el-table-column prop="ssid" label="SSID" min-width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                <i class="el-icon-wifi" style="margin-right: 5px; color: #909399;"></i>{{ scope.row.ssid }}
              </template>
            </el-table-column>
            <el-table-column label="绑定射频" width="120" align="center">
              <template slot-scope="scope">
                {{ radioLabel(scope.row.radio_id) }} · CH{{ channelOfRadio(scope.row.radio_id) }}
              </template>
            </el-table-column>
            <el-table-column prop="client_count" label="在线数量" width="90" align="center"></el-table-column>
            <el-table-column prop="ssid_status" label="状态" width="80" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.ssid_status === 'up' ? 'success' : 'info'" size="mini">
                  {{ scope.row.ssid_status === 'up' ? '开启' : '关闭' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="无开放 SSID" :image-size="60"></el-empty>
        </section>

        <!-- ============ 4. 终端表格 ============ -->
        <section class="ap-section ap-section--client">
          <div class="ap-section__title">
            <i class="el-icon-user"></i><span>接入终端</span>
            <span class="ap-section__hint">
              关联信息为 {{ clientsTime || '--' }} 的快照；信号强度与速率随快照更新，可点「刷新实时指标」重取
            </span>
          </div>

          <div v-if="offline" class="ap-drawer__offline">
            <i class="el-icon-warning-outline"></i>
            AP 离线，终端数据不可用
          </div>
          <div v-else class="ap-section__client-wrap">
            <ClientTable
              :clients="clients"
              :stats="stats"
              :stats-time="statsTime"
              :stats-loading="statsLoading"
              @refresh-stats="loadStats" />
          </div>
        </section>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import ClientTable from './ClientTable.vue'
import wifiApi from '@/api/mapis/wifi_interface'

export default {
  name: 'ApDetailDrawer',

  components: { ClientTable },

  props: {
    visible: { type: Boolean, default: false },
    apMac: { type: String, default: '' }
  },

  data() {
    return {
      loading: false,
      base: {},
      radios: [],
      ssids: [],
      clients: [],
      clientsTime: '',
      stats: {},
      statsTime: '',
      statsLoading: false
    }
  },

  computed: {
    apName() {
      return this.base.ap_name || this.apMac || '--'
    },

    statusText() {
      const s = this.base.online_status
      if (s === 'online') return '在线'
      if (s === 'offline') return '离线'
      return '未知'
    },

    statusTagType() {
      const s = this.base.online_status
      if (s === 'online') return 'success'
      if (s === 'offline') return 'danger'
      return 'info'
    },

    statusColorClass() {
      const s = this.base.online_status
      if (s === 'online') return 'is-online'
      if (s === 'offline') return 'is-offline'
      return 'is-unknown'
    },

    offline() {
      return this.base.online_status === 'offline'
    },

    // 与地图图标同一口径：取所有射频利用率最大值
    utilAlarm() {
      if (!this.radios.length) return false
      const vals = this.radios.map(r => r.utilization).filter(v => v !== null && v !== undefined)
      return vals.length ? Math.max(...vals) > 70 : false
    }
  },

  watch: {
    visible(val) {
      if (val && this.apMac) this.load()
    },
    apMac() {
      if (this.visible && this.apMac) this.load()
    }
  },

  methods: {
    load() {
      this.reset()
      this.loading = true
      Promise.all([
        wifiApi.getApDetail(this.apMac),
        wifiApi.getApClients(this.apMac)
      ]).then(([detail, clientRes]) => {
        this.base = detail.base || {}
        this.radios = detail.radios || []
        this.ssids = detail.ssids || []
        this.clients = clientRes.list || []
        this.clientsTime = clientRes.data_time || ''
        // 终端快照里已带 rssi / 上下行速率，直接复用，不再多发一次同样的请求
        this.stats = this.statsFromClients(this.clients)
        this.statsTime = this.nowText()
        this.loading = false
      }).catch(err => {
        this.loading = false
        this.$message.error((err && err.message) || '加载 AP 详情失败')
      })
    },

    reset() {
      this.base = {}
      this.radios = []
      this.ssids = []
      this.clients = []
      this.clientsTime = ''
      this.stats = {}
      this.statsTime = ''
    },

    // 终端快照列表 → { client_mac: { rssi, rx_bps, tx_bps } }
    statsFromClients(list) {
      const stats = {}
      ;(list || []).forEach(c => {
        stats[c.client_mac] = { client_mac: c.client_mac, rssi: c.rssi, rx_bps: c.up_rate, tx_bps: c.down_rate }
      })
      return stats
    },

    // 仅由「刷新实时指标」按钮触发，不做定时轮询
    loadStats() {
      if (!this.apMac || this.offline) return
      this.statsLoading = true
      wifiApi.getApClients(this.apMac).then(res => {
        this.clients = res.list || []
        this.clientsTime = res.data_time || ''
        this.stats = this.statsFromClients(this.clients)
        this.statsTime = this.nowText()
        this.statsLoading = false
      }).catch(() => {
        // 实时指标失败不影响快照表，两列显示 --
        this.statsLoading = false
      })
    },

    nowText() {
      const d = new Date()
      const p = n => String(n).padStart(2, '0')
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    },

    handleClose() {
      this.$emit('update:visible', false)
    },

    // 射频 ID 只是个数字，加 R 前缀更像个标识：R0 / R1
    radioLabel(radioId) {
      if (radioId === null || radioId === undefined || radioId === '') return 'R--'
      return 'R' + radioId
    },

    // 频段只用来给 R 徽标上色：优先 band，缺失时按信道号判断（2.4G 是 1~14）
    is5g(r) {
      if (r.band) return r.band === '5G'
      return Number(r.channel) > 14
    },

    // 频段文字：band 按 OID 原值存，空值时按信道号推断
    bandText(r) {
      if (r.band) return r.band
      if (r.channel === null || r.channel === undefined || r.channel === '') return '--'
      return Number(r.channel) > 14 ? '5G' : '2.4G'
    },

    channelOfRadio(radioId) {
      const r = this.radios.find(x => x.radio_id === radioId)
      return r && r.channel ? r.channel : '--'
    },

    rateClass(val, warn, bad) {
      if (val === null || val === undefined) return ''
      if (val > bad) return 'is-bad'
      if (val >= warn) return 'is-warn'
      return 'is-ok'
    },

    barClass(val) {
      if (val === null || val === undefined) return 'is-none'
      if (val > 70) return 'is-bad'
      if (val >= 40) return 'is-warn'
      return 'is-ok'
    }
  }
}
</script>

<style scoped>
.ap-drawer__wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

/* ---------- header ---------- */

.ap-drawer__header {
  position: relative;
  padding: 14px 18px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.ap-drawer__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ap-drawer__title-icon {
  font-size: 20px;
}

.ap-drawer__title-icon.is-online { color: #67c23a; }
.ap-drawer__title-icon.is-offline { color: #f56c6c; }
.ap-drawer__title-icon.is-unknown { color: #c0c4cc; }

.ap-drawer__name {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.ap-drawer__sub {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 6px;
}

.ap-drawer__close {
  position: absolute;
  right: 14px;
  top: 14px;
}

.ap-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 18px;
}

/* ---------- section ---------- */

.ap-section {
  background: #fff;
  border-radius: 4px;
  padding: 12px 14px 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.ap-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.ap-section__title i {
  color: #409eff;
}

.ap-section__hint {
  font-weight: normal;
  font-size: 12px;
  color: #a8abb2;
  margin-left: 6px;
}

/* el-table 的 height="100%" 需要父级有确定高度 */
.ap-section__client-wrap {
  height: 480px;
}

/* ---------- 射频卡片 ---------- */

.radio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}

.radio-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px 12px;
  background: #fafcff;
}

.radio-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.radio-card__radio {
  font-size: 11px;
  font-weight: 700;
  color: #606266;
  padding: 0 5px;
  line-height: 16px;
  border-radius: 3px;
  background: #eef1f6;
}

.radio-card__band {
  font-weight: 700;
  font-size: 14px;
}

.radio-card__band.is-5g { color: #409eff; }
.radio-card__band.is-24g { color: #e6a23c; }

.radio-card__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-card__row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.radio-card__row .k {
  color: #909399;
}

.radio-card__row .v {
  color: #303133;
}

.radio-card__row .muted {
  font-style: normal;
  color: #c0c4cc;
  font-size: 11px;
}

.radio-card__util {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
}

.radio-card__util-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.radio-card__bar {
  height: 6px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.radio-card__bar-inner {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.radio-card__bar-inner.is-ok { background: #67c23a; }
.radio-card__bar-inner.is-warn { background: #e6a23c; }
.radio-card__bar-inner.is-bad { background: #f56c6c; }
.radio-card__bar-inner.is-none { background: #dcdfe6; }

/* ---------- 通用 ---------- */

.ap-drawer__offline {
  padding: 26px;
  text-align: center;
  color: #909399;
  background: #fafafa;
  border-radius: 4px;
}

.ap-drawer__offline i {
  font-size: 22px;
  margin-right: 6px;
  color: #e6a23c;
}

.mono {
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
}

.is-ok { color: #67c23a; }
.is-warn { color: #e6a23c; font-weight: 600; }
.is-bad { color: #f56c6c; font-weight: 600; }
</style>
