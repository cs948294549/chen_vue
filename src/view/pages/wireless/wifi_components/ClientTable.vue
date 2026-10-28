<template>
  <div class="client-table">
    <div class="client-table__bar">
      <el-input
        v-model="keyword"
        size="mini"
        clearable
        placeholder="搜索 MAC / IP / 用户名"
        prefix-icon="el-icon-search"
        class="client-table__search">
      </el-input>

      <div class="client-table__spacer"></div>

      <span class="client-table__count">共 {{ filtered.length }} 个终端</span>

      <div class="client-table__time" v-if="statsTime">
        <i class="el-icon-refresh"></i>
        <span>实时指标 {{ statsTime }}</span>
      </div>

      <el-button
        size="mini"
        icon="el-icon-refresh"
        :loading="statsLoading"
        @click="$emit('refresh-stats')">刷新实时指标</el-button>
    </div>

    <div class="client-table__body">
    <el-table
      ref="table"
      :data="paged"
      size="mini"
      border
      height="100%"
      highlight-current-row
      @sort-change="handleSortChange">
      <el-table-column prop="client_mac" label="终端 MAC" min-width="140">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.client_mac }}</span>
          <el-tag v-if="scope.row.username" size="mini" type="info" class="client-table__tag">
            {{ scope.row.username }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="ip" label="IP 地址" min-width="110">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.ip || '--' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="radio_id" label="射频" width="110" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="is5g(scope.row) ? 'success' : ''">
            {{ radioLabel(scope.row.radio_id) }} CH{{ scope.row.channel }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="ssid" label="SSID" min-width="110" show-overflow-tooltip></el-table-column>

      <el-table-column prop="vlan_id" label="VLAN" width="70" align="center"></el-table-column>

      <el-table-column prop="status" label="状态" width="80" align="center">
        <template slot-scope="scope">
          <span :class="scope.row.status === 'online' ? 'is-online' : 'is-off'">
            {{ scope.row.status === 'online' ? '在线' : scope.row.status }}
          </span>
        </template>
      </el-table-column>

      <!-- 实时列：不入库，由抽屉的「刷新实时指标」按钮触发重取 -->
      <el-table-column prop="rssi" label="信号强度" width="150" sortable="custom" align="center">
        <template slot-scope="scope">
          <div v-if="hasStat(scope.row)" class="signal">
            <span class="signal__bars">
              <i v-for="n in 4" :key="n" :class="{'is-on': n <= signalLevel(scope.row)}"></i>
            </span>
            <span class="signal__value">{{ scope.row.rssi }} dBm</span>
          </div>
          <span v-else class="is-empty">--</span>
        </template>
      </el-table-column>

      <el-table-column prop="rx_bps" label="下行速率" width="110" sortable="custom" align="right">
        <template slot-scope="scope">
          <span v-if="hasStat(scope.row)" class="mono">{{ formatBps(scope.row.rx_bps) }}</span>
          <span v-else class="is-empty">--</span>
        </template>
      </el-table-column>

      <el-table-column prop="tx_bps" label="上行速率" width="110" sortable="custom" align="right">
        <template slot-scope="scope">
          <span v-if="hasStat(scope.row)" class="mono">{{ formatBps(scope.row.tx_bps) }}</span>
          <span v-else class="is-empty">--</span>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <el-pagination
      class="client-table__pager"
      small
      layout="total, sizes, prev, pager, next"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :current-page.sync="currentPage"
      :total="filtered.length">
    </el-pagination>
  </div>
</template>

<script>
export default {
  name: 'ClientTable',

  props: {
    clients: { type: Array, default: () => [] },
    // { client_mac: { rssi, rx_bps, tx_bps } }
    stats: { type: Object, default: () => ({}) },
    statsTime: { type: String, default: '' },
    statsLoading: { type: Boolean, default: false }
  },

  data() {
    return {
      keyword: '',
      currentPage: 1,
      pageSize: 20,
      sortProp: '',
      sortOrder: ''
    }
  },

  computed: {
    merged() {
      // 把实时指标并进快照行；查不到时字段为 undefined，模板显示 --
      return this.clients.map(c => {
        const s = this.stats[c.client_mac] || {}
        return Object.assign({}, c, {
          rssi: s.rssi,
          rx_bps: s.rx_bps,
          tx_bps: s.tx_bps
        })
      })
    },

    filtered() {
      const kw = this.keyword.trim().toLowerCase()
      let rows = this.merged
      if (kw) {
        rows = rows.filter(r =>
          (r.client_mac || '').toLowerCase().includes(kw) ||
          (r.ip || '').toLowerCase().includes(kw) ||
          (r.username || '').toLowerCase().includes(kw) ||
          (r.ssid || '').toLowerCase().includes(kw)
        )
      }
      if (this.sortProp && this.sortOrder) {
        const prop = this.sortProp
        const dir = this.sortOrder === 'ascending' ? 1 : -1
        rows = rows.slice().sort((a, b) => {
          const va = a[prop] === undefined || a[prop] === null ? -Infinity : a[prop]
          const vb = b[prop] === undefined || b[prop] === null ? -Infinity : b[prop]
          if (va === vb) return 0
          return va > vb ? dir : -dir
        })
      }
      return rows
    },

    paged() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filtered.slice(start, start + this.pageSize)
    }
  },

  watch: {
    keyword() {
      this.currentPage = 1
    },
    clients() {
      this.currentPage = 1
    }
  },

  methods: {
    // 射频 ID 只是个数字，加 R 前缀更像个标识：R0 / R1
    radioLabel(radioId) {
      if (radioId === null || radioId === undefined || radioId === '') return 'R--'
      return 'R' + radioId
    },

    // 频段只用来给射频 tag 上色：优先 band，缺失时按信道号判断（2.4G 是 1~14）
    is5g(row) {
      if (row.band) return row.band === '5G'
      return Number(row.channel) > 14
    },

    hasStat(row) {
      return row.rssi !== undefined && row.rssi !== null
    },

    // dBm → 4 格信号，阈值按 802.11 常见经验值
    signalLevel(row) {
      const r = row.rssi
      if (r === undefined || r === null) return 0
      if (r >= -55) return 4
      if (r >= -65) return 3
      if (r >= -75) return 2
      return 1
    },

    // bps 按量级自适应，避免表格里出现 9 位数
    formatBps(bps) {
      if (bps === undefined || bps === null) return '--'
      if (bps >= 1e9) return (bps / 1e9).toFixed(2) + ' Gbps'
      if (bps >= 1e6) return (bps / 1e6).toFixed(2) + ' Mbps'
      if (bps >= 1e3) return (bps / 1e3).toFixed(1) + ' Kbps'
      return bps + ' bps'
    },

    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
.client-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.client-table__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.client-table__body {
  flex: 1;
  min-height: 0;
}

.client-table__search {
  width: 230px;
}

.client-table__spacer {
  flex: 1;
}

.client-table__count {
  font-size: 12px;
  color: #909399;
}

.client-table__time {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #a8abb2;
}

.client-table__pager {
  margin-top: 8px;
  text-align: right;
}

.client-table__tag {
  margin-left: 6px;
  transform: scale(0.9);
}

.mono {
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
}

.is-online {
  color: #67c23a;
}

.is-off {
  color: #909399;
}

.is-empty {
  color: #c0c4cc;
}

/* 信号格 */
.signal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.signal__bars {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.signal__bars i {
  width: 3px;
  background: #dcdfe6;
  border-radius: 1px;
}

.signal__bars i:nth-child(1) { height: 5px; }
.signal__bars i:nth-child(2) { height: 8px; }
.signal__bars i:nth-child(3) { height: 11px; }
.signal__bars i:nth-child(4) { height: 14px; }

.signal__bars i.is-on {
  background: #67c23a;
}

.signal__value {
  font-size: 12px;
  color: #606266;
  font-family: Menlo, Consolas, monospace;
}
</style>
