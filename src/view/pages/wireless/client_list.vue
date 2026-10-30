<template>
  <div class="wl-page">
    <!-- 标题栏 -->
    <div class="wl-header">
      <div class="wl-title">
        <i class="el-icon-mobile-phone"></i>终端列表
        <span class="wl-count">{{ filtered.length === table_info.length ? table_info.length : filtered.length + ' / ' + table_info.length }}</span>
        <span class="wl-subtitle">无线接入终端，点击所属 AP 查看 AP 详情</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-refresh" :loading="isload" @click="getViews">刷新</el-button>
        <el-button size="small" icon="el-icon-download" :disabled="filtered.length === 0" @click="download_table">导出</el-button>
      </div>
    </div>

    <!-- 统计卡片：可点击快速筛选 -->
    <div class="wl-stats">
      <div
        v-for="c in statCards"
        :key="c.key"
        :class="['stat-card', 'stat-' + c.type, 'clickable', { active: isCardActive(c) }]"
        @click="onCardClick(c)">
        <div class="stat-icon"><i :class="c.icon"></i></div>
        <div class="stat-body">
          <div class="stat-value">{{ c.value }}</div>
          <div class="stat-label">{{ c.label }}</div>
        </div>
      </div>
      <div class="stat-card stat-band">
        <div class="stat-icon"><i class="el-icon-s-data"></i></div>
        <div class="stat-body band-body">
          <div class="stat-label">频段分布</div>
          <div v-if="bandStats.length" class="band-list">
            <span v-for="b in bandStats" :key="b.band" class="band-item">
              <span class="band-chip">{{ b.band }}</span>{{ b.count }}
            </span>
          </div>
          <div v-else class="empty-text">-</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="wl-filter">
      <div class="filter-row">
        <el-input v-model="filter_ip" size="small" class="f-input mono-input" prefix-icon="el-icon-search" placeholder="IP" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_username" size="small" class="f-input" placeholder="用户名" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_client_mac" size="small" class="f-input mono-input" placeholder="终端 MAC" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_ap_name" size="small" class="f-input" placeholder="AP 名称" clearable @keyup.enter.native="getViews"></el-input>
        <el-button size="small" type="primary" icon="el-icon-search" :loading="isload" @click="getViews">查询</el-button>
        <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
        <el-button size="small" type="text" class="more-btn" @click="showMore = !showMore">
          更多条件<span v-if="!showMore && moreCount" class="more-badge">{{ moreCount }}</span>
          <i :class="showMore ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
        </el-button>
      </div>
      <div v-show="showMore" class="filter-row filter-more">
        <el-input v-model="filter_ssid" size="small" class="f-input" placeholder="SSID" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_band" size="small" class="f-input" placeholder="频段，如 5G" clearable @keyup.enter.native="getViews"></el-input>
        <el-select v-model="filter_ac_id" size="small" class="f-input" placeholder="全部 AC" clearable @change="getViews">
          <el-option v-for="ac in ac_list" :key="ac.ac_id" :label="ac.ac_name" :value="ac.ac_id"></el-option>
        </el-select>
      </div>
    </div>

    <!-- 终端表格 -->
    <el-table
      :data="pageRows"
      v-loading="isload"
      size="small"
      stripe
      class="wl-table"
      @sort-change="onSort">
      <template slot="empty">
        <el-empty :image-size="80" :description="table_info.length ? '没有符合筛选条件的终端' : '暂无终端数据'"></el-empty>
      </template>
      <el-table-column label="终端" min-width="200">
        <template slot-scope="scope">
          <div class="two-line">
            <span>
              <span class="mono strong">{{ scope.row.ip || '-' }}</span>
              <i v-if="scope.row.ip" class="el-icon-document-copy copy-btn" title="复制 IP" @click="copyText(scope.row.ip)"></i>
            </span>
            <span class="sub">
              <span class="mono">{{ scope.row.client_mac || '-' }}</span>
              <i v-if="scope.row.client_mac" class="el-icon-document-copy copy-btn" title="复制 MAC" @click="copyText(scope.row.client_mac)"></i>
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" min-width="130" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.username"><i class="el-icon-user user-icon"></i>{{ scope.row.username }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template slot-scope="scope">
          <span :class="['status-dot', 'dot-' + statusTagType(scope.row.status)]">{{ statusText(scope.row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ap_name" label="所属 AP" min-width="170" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="apLabel(scope.row) !== '未知'" class="ap-link" @click="openDetail(scope.row)">{{ apLabel(scope.row) }}</span>
          <span v-else class="empty-text">未知</span>
        </template>
      </el-table-column>
      <el-table-column prop="ssid" label="SSID" min-width="120" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.ssid"><i class="el-icon-connection ssid-icon"></i>{{ scope.row.ssid }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="频段 / 信道" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.band" :class="['band-chip', bandClass(scope.row.band)]">{{ scope.row.band }}</span>
          <span v-if="hasValue(scope.row.channel)" class="mono">{{ scope.row.channel }}</span>
          <span v-if="!scope.row.band && !hasValue(scope.row.channel)" class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="rssi" label="信号" width="120" sortable="custom">
        <template slot-scope="scope">
          <span v-if="hasValue(scope.row.rssi)" class="signal" :style="{ color: rssiColor(scope.row.rssi) }">
            <span class="bars">
              <i v-for="n in 4" :key="n" :class="{ on: n <= rssiLevel(scope.row.rssi) }" :style="{ height: (n * 3 + 2) + 'px' }"></i>
            </span>
            <span class="mono">{{ scope.row.rssi }}</span><small>dBm</small>
          </span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="up_rate" label="上行 / 下行" min-width="150" sortable="custom">
        <template slot-scope="scope">
          <div class="rate">
            <span class="rate-up"><i class="el-icon-top"></i>{{ formatRate(scope.row.up_rate) }}</span>
            <span class="rate-down"><i class="el-icon-bottom"></i>{{ formatRate(scope.row.down_rate) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="vlan_id" label="VLAN" width="80" align="center" sortable="custom">
        <template slot-scope="scope">
          <span v-if="hasValue(scope.row.vlan_id)" class="mono">{{ scope.row.vlan_id }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="ac_name" label="所属 AC" min-width="110" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.ac_name">{{ scope.row.ac_name }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="wl-pager">
      <el-pagination
        background
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        :current-page="table_currentPage"
        :page-sizes="[20, 50, 100, 200, 500]"
        :page-size="table_size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filtered.length">
      </el-pagination>
    </div>

    <ApDetailDrawer :visible.sync="drawerVisible" :ap-mac="selectedMac" />
  </div>
</template>

<script>
  import XLSX from 'xlsx'
  import wifiApi from '@/api/mapis/wifi_interface'
  import ApDetailDrawer from './wifi_components/ApDetailDrawer.vue'

  const EMPTY_SUMMARY = { total: 0, online: 0, offline: 0 }
  const WEAK_RSSI = -75  // 低于该值视为弱信号

  export default {
    components: { ApDetailDrawer },
    data () {
      return {
        table_currentPage: 1,
        table_info: [],
        table_size: 20,
        isload: false,
        showMore: false,
        sort: { prop: '', order: '' },
        filter_ip: '',
        filter_username: '',
        filter_client_mac: '',
        filter_ap_name: '',
        filter_ssid: '',
        filter_band: '',
        filter_ac_id: '',
        // 以下两项为前端筛选，保持统计卡片为全量数据
        filter_status: '',
        only_weak: false,
        ac_list: [],
        summary: Object.assign({}, EMPTY_SUMMARY),
        selectedMac: '',
        drawerVisible: false,
      }
    },
    computed: {
      weakCount () {
        return this.table_info.filter(r => this.isWeak(r.rssi)).length
      },
      statCards () {
        const s = this.summary
        return [
          { key: 'total', status: '', label: '终端总数', value: s.total, icon: 'el-icon-mobile-phone', type: 'primary' },
          { key: 'online', status: 'online', label: '在线', value: s.online, icon: 'el-icon-circle-check', type: 'success' },
          { key: 'offline', status: 'offline', label: '离线', value: s.offline, icon: 'el-icon-circle-close', type: 'danger' },
          { key: 'weak', weak: true, label: '弱信号（< ' + WEAK_RSSI + ' dBm）', value: this.weakCount, icon: 'el-icon-warning-outline', type: 'warning' },
        ]
      },
      // 按频段统计终端数
      bandStats () {
        const map = {}
        this.table_info.forEach(r => {
          if (!r.band) return
          map[r.band] = (map[r.band] || 0) + 1
        })
        return Object.keys(map).sort().map(band => ({ band: band, count: map[band] }))
      },
      moreCount () {
        const n = [this.filter_ssid, this.filter_band].filter(v => String(v || '').trim()).length
        return n + (this.filter_ac_id !== '' && this.filter_ac_id !== null && this.filter_ac_id !== undefined ? 1 : 0)
      },
      filtered () {
        const status = this.filter_status
        const weak = this.only_weak
        if (!status && !weak) return this.table_info
        return this.table_info.filter(r => {
          if (status && r.status !== status) return false
          if (weak && !this.isWeak(r.rssi)) return false
          return true
        })
      },
      sorted () {
        const { prop, order } = this.sort
        if (!prop || !order) return this.filtered
        const numeric = ['rssi', 'up_rate', 'vlan_id'].indexOf(prop) !== -1
        const list = this.filtered.slice()
        list.sort((a, b) => {
          let cmp
          if (numeric) {
            // 空值始终排在最后
            const va = this.hasValue(a[prop]) ? Number(a[prop]) : null
            const vb = this.hasValue(b[prop]) ? Number(b[prop]) : null
            if (va === null || vb === null) return va === vb ? 0 : (va === null ? 1 : -1)
            cmp = va - vb
          } else {
            cmp = String(a[prop] || '').localeCompare(String(b[prop] || ''))
          }
          return order === 'descending' ? -cmp : cmp
        })
        return list
      },
      pageRows () {
        const start = (this.table_currentPage - 1) * this.table_size
        return this.sorted.slice(start, start + this.table_size)
      },
    },
    created () {
      this.getViews()
      this.loadAcList()
    },
    methods: {
      loadAcList () {
        wifiApi.getAcList().then(res => {
          this.ac_list = (res && res.list) || []
        }).catch(() => {
          this.ac_list = []
        })
      },
      getViews () {
        const trim = v => String(v || '').replace(/^\s*|\s*$/g, "")
        const fields = {
          ip: trim(this.filter_ip),
          username: trim(this.filter_username),
          client_mac: trim(this.filter_client_mac),
          ap_name: trim(this.filter_ap_name),
          ssid: trim(this.filter_ssid),
          band: trim(this.filter_band),
        }
        const post_data = {}
        for (const k in fields) {
          if (fields[k]) post_data[k] = fields[k]
        }
        if (this.filter_ac_id !== '' && this.filter_ac_id !== null && this.filter_ac_id !== undefined) {
          post_data.ac_id = this.filter_ac_id
        }

        this.isload = true
        wifiApi.getClientList(post_data).then(res => {
          this.table_info = (res && res.list) || []
          this.summary = (res && res.summary) || Object.assign({}, EMPTY_SUMMARY)
          this.table_currentPage = 1
        }).catch(err => {
          this.$message.error((err && err.message) || '查询终端列表失败')
        }).finally(() => {
          this.isload = false
        })
      },
      resetFilter () {
        this.filter_ip = ''
        this.filter_username = ''
        this.filter_client_mac = ''
        this.filter_ap_name = ''
        this.filter_ssid = ''
        this.filter_band = ''
        this.filter_ac_id = ''
        this.filter_status = ''
        this.only_weak = false
        this.getViews()
      },
      isCardActive (c) {
        if (c.weak) return this.only_weak
        return !this.only_weak && this.filter_status === c.status
      },
      onCardClick (c) {
        if (c.weak) {
          this.only_weak = !this.only_weak
        } else {
          this.filter_status = c.status
          this.only_weak = false
        }
        this.table_currentPage = 1
      },
      onSort ({ prop, order }) {
        this.sort = { prop: prop || '', order: order || '' }
        this.table_currentPage = 1
      },
      handleCurrentChange (val) {
        this.table_currentPage = val
      },
      handleSizeChange (val) {
        this.table_size = val
        this.table_currentPage = 1
      },
      openDetail (row) {
        this.selectedMac = row.ap_mac
        this.drawerVisible = true
      },
      hasValue (v) {
        return v !== null && v !== undefined && v !== ''
      },
      isWeak (rssi) {
        return this.hasValue(rssi) && Number(rssi) < WEAK_RSSI
      },
      // 所属 AP 展示名：优先 ap_name，其次 ap_mac；ap_mac 是 Hex-STRING 解出的乱码时不展示
      apLabel (row) {
        if (row.ap_name) return row.ap_name
        const mac = row.ap_mac || ''
        if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(mac)) return mac
        return '未知'
      },
      statusText (s) {
        return { online: '在线', offline: '离线' }[s] || '未知'
      },
      statusTagType (s) {
        return { online: 'success', offline: 'danger' }[s] || 'info'
      },
      bandClass (band) {
        return /5|6/.test(String(band).replace(/2\.4/, '')) ? 'band-5g' : 'band-2g'
      },
      rssiColor (rssi) {
        if (!this.hasValue(rssi)) return '#909399'
        if (rssi >= -60) return '#67c23a'
        if (rssi >= -75) return '#e6a23c'
        return '#f56c6c'
      },
      // 信号格数 1~4
      rssiLevel (rssi) {
        const v = Number(rssi)
        if (v >= -55) return 4
        if (v >= -65) return 3
        if (v >= -75) return 2
        return 1
      },
      formatRate (bps) {
        const v = Number(bps || 0)
        if (!v) return '0'
        if (v >= 1000000) return (v / 1000000).toFixed(1) + ' Mbps'
        if (v >= 1000) return (v / 1000).toFixed(1) + ' Kbps'
        return v + ' bps'
      },
      copyText (text) {
        if (!text) return
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          this.$message.success('已复制')
        } catch (e) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(ta)
      },

      // ==================== Excel导出相关 ====================
      download_table () {
        // 导出当前筛选、排序后的结果；生成新数组，downloadExcl 里的 unshift 不会污染 table_info
        const rows = this.sorted.map(r => ({
          'IP': r.ip,
          '用户名': r.username,
          '状态': this.statusText(r.status),
          'MAC': r.client_mac,
          '所属AP': r.ap_name,
          'AP MAC': r.ap_mac,
          'SSID': r.ssid,
          '频段': r.band,
          '信道': r.channel,
          '信号(dBm)': r.rssi === null ? '' : r.rssi,
          '上行': this.formatRate(r.up_rate),
          '下行': this.formatRate(r.down_rate),
          'VLAN': r.vlan_id,
          '所属AC': r.ac_name,
        }))
        if (rows.length === 0) return
        this.downloadExcl(rows)
      },
      downloadExcl (json, type) {
        let tmpDown
        let getjson = json
        let keys = getjson[0]
        getjson.unshift({})
        let keyMap = []
        for (let k in keys) {
          keyMap.push(k)
          getjson[0][k] = k
        }
        let tmpdata = []
        getjson.map((v, i) => keyMap.map((k, j) => Object.assign({}, {
          v: v[k] === undefined || v[k] === null ? '' : v[k],
          position: (j > 25 ? this.getCharCol(j) : String.fromCharCode(65 + j)) + (i + 1)
        }))).reduce((prev, next) => prev.concat(next)).forEach((v, i) => tmpdata[v.position] = {
          v: v.v
        })
        let outputPos = Object.keys(tmpdata)
        let tmpWB = {
          SheetNames: ['mySheet'],
          Sheets: {
            'mySheet': Object.assign({}, tmpdata, {
              '!ref': outputPos[0] + ':' + outputPos[outputPos.length - 1]
            })
          }
        }

        tmpDown = new Blob([this.s2ab(XLSX.write(tmpWB,
          { bookType: (type == undefined ? 'xlsx' : type), bookSST: false, type: 'binary' }
        ))], { type: "" })

        let aTag = document.createElement('a')
        aTag.download = "client_list.xlsx"
        aTag.href = URL.createObjectURL(tmpDown)
        aTag.click()
        URL.revokeObjectURL(aTag.href)
      },
      s2ab (s) {
        let buf = new ArrayBuffer(s.length)
        let view = new Uint8Array(buf)
        for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF
        return buf
      },
      getCharCol (n) {
        let s = '', m = 0
        while (n > 0) {
          m = n % 26 + 1
          s = String.fromCharCode(m + 64) + s
          n = (n - m) / 26
        }
        return s
      },
    },
  }
</script>

<style scoped>
.wl-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ input {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.strong {
  font-weight: 500;
}
.empty-text {
  color: #c0c4cc;
}

/* 标题栏 */
.wl-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wl-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.wl-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.wl-count {
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 9px;
  color: #409eff;
  background-color: #ecf5ff;
}
.wl-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 统计卡片 */
.wl-stats {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -6px 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 150px;
  margin: 0 6px 8px;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  transition: all .2s;
}
.stat-card.clickable {
  cursor: pointer;
}
.stat-card.clickable:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, .12);
}
.stat-card.active {
  border-color: #409eff;
  background: #f5faff;
}
.stat-card.stat-band {
  flex: 1.4;
  min-width: 200px;
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  margin-right: 12px;
  font-size: 20px;
  border-radius: 8px;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 26px;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
.stat-primary .stat-icon { color: #409eff; background: #ecf5ff; }
.stat-success .stat-icon { color: #67c23a; background: #f0f9eb; }
.stat-danger .stat-icon { color: #f56c6c; background: #fef0f0; }
.stat-warning .stat-icon { color: #e6a23c; background: #fdf6ec; }
.stat-band .stat-icon { color: #909399; background: #f4f4f5; }
.stat-success .stat-value { color: #67c23a; }
.stat-danger .stat-value { color: #f56c6c; }
.stat-warning .stat-value { color: #e6a23c; }
.band-body {
  min-width: 0;
}
.band-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 4px;
}
.band-item {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
}

/* 筛选栏 */
.wl-filter {
  padding: 12px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafbfc;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.filter-row > * {
  margin: 0 10px 8px 0;
}
.filter-row > .el-button + .el-button {
  margin-left: 0;
}
.filter-more {
  padding-top: 8px;
  border-top: 1px dashed #ebeef5;
}
.f-input {
  width: 180px;
}
.more-btn i {
  margin-left: 2px;
}
.more-badge {
  display: inline-block;
  margin-left: 4px;
  padding: 0 5px;
  height: 16px;
  line-height: 16px;
  font-size: 12px;
  border-radius: 8px;
  color: #fff;
  background: #409eff;
}

/* 表格 */
.wl-table {
  margin-top: 12px;
}
.wl-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.two-line {
  display: flex;
  flex-direction: column;
  line-height: 18px;
}
.two-line .sub {
  font-size: 12px;
  color: #909399;
}
.user-icon,
.ssid-icon {
  margin-right: 4px;
  color: #c0c4cc;
}
.ap-link {
  color: #409eff;
  cursor: pointer;
}
.ap-link:hover {
  text-decoration: underline;
}
.status-dot {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}
.status-dot::before {
  content: "";
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
}
.dot-success { color: #67c23a; }
.dot-success::before { background: #67c23a; box-shadow: 0 0 0 3px rgba(103, 194, 58, .18); }
.dot-danger { color: #f56c6c; }
.dot-danger::before { background: #f56c6c; box-shadow: 0 0 0 3px rgba(245, 108, 108, .18); }
.dot-info { color: #909399; }
.dot-info::before { background: #c0c4cc; }
.band-chip {
  display: inline-block;
  margin-right: 6px;
  padding: 0 5px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 3px;
  color: #606266;
  background: #f4f4f5;
}
.band-chip.band-5g {
  color: #409eff;
  background: #ecf5ff;
}
.band-chip.band-2g {
  color: #e6a23c;
  background: #fdf6ec;
}
.signal {
  display: inline-flex;
  align-items: center;
}
.signal small {
  margin-left: 2px;
  font-size: 11px;
  color: #c0c4cc;
}
.bars {
  display: inline-flex;
  align-items: flex-end;
  height: 14px;
  margin-right: 6px;
}
.bars i {
  width: 3px;
  margin-right: 1px;
  border-radius: 1px;
  background: #e4e7ed;
}
.bars i.on {
  background: currentColor;
}
.rate {
  display: flex;
  flex-direction: column;
  line-height: 18px;
  font-size: 12px;
}
.rate i {
  margin-right: 2px;
}
.rate-up { color: #67c23a; }
.rate-down { color: #409eff; }
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.wl-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.wl-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
