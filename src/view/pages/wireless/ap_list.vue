<template>
  <div class="wl-page">
    <!-- 标题栏 -->
    <div class="wl-header">
      <div class="wl-title">
        <i class="el-icon-connection"></i>AP 列表
        <span class="wl-count">{{ filtered.length === table_info.length ? table_info.length : filtered.length + ' / ' + table_info.length }}</span>
        <span class="wl-subtitle">各 AC 采集的无线接入点，点击 AP 名称查看射频与终端详情</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-refresh" :loading="isload" @click="getViews">刷新</el-button>
        <el-button size="small" icon="el-icon-download" :disabled="filtered.length === 0" @click="download_table">导出</el-button>
      </div>
    </div>

    <!-- 统计卡片：状态卡片可点击筛选 -->
    <div class="wl-stats">
      <div
        v-for="c in statCards"
        :key="c.key"
        :class="['stat-card', 'stat-' + c.type, { clickable: c.filter, active: c.filter && filter_online_status === c.status }]"
        @click="c.filter && setStatus(c.status)">
        <div class="stat-icon"><i :class="c.icon"></i></div>
        <div class="stat-body">
          <div class="stat-value">{{ c.value }}<small v-if="c.unit">{{ c.unit }}</small></div>
          <div class="stat-label">{{ c.label }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="wl-filter">
      <div class="filter-row">
        <el-input v-model="filter_ap_name" size="small" class="f-input" prefix-icon="el-icon-search" placeholder="AP 名称" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_ap_mac" size="small" class="f-input mono-input" placeholder="MAC" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_ap_ip" size="small" class="f-input mono-input" placeholder="IP" clearable @keyup.enter.native="getViews"></el-input>
        <el-select v-model="filter_ac_id" size="small" class="f-input" placeholder="全部 AC" clearable @change="getViews">
          <el-option v-for="ac in ac_list" :key="ac.ac_id" :label="ac.ac_name" :value="ac.ac_id"></el-option>
        </el-select>
        <el-button size="small" type="primary" icon="el-icon-search" :loading="isload" @click="getViews">查询</el-button>
        <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
        <el-button size="small" type="text" class="more-btn" @click="showMore = !showMore">
          更多条件<span v-if="!showMore && moreCount" class="more-badge">{{ moreCount }}</span>
          <i :class="showMore ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
        </el-button>
      </div>
      <div v-show="showMore" class="filter-row filter-more">
        <el-input v-model="filter_sn" size="small" class="f-input mono-input" placeholder="SN" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_model" size="small" class="f-input" placeholder="型号" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_ap_group" size="small" class="f-input" placeholder="分组" clearable @keyup.enter.native="getViews"></el-input>
        <el-input v-model="filter_sw_version" size="small" class="f-input" placeholder="软件版本" clearable @keyup.enter.native="getViews"></el-input>
      </div>
    </div>

    <!-- AP 表格 -->
    <el-table
      :data="pageRows"
      v-loading="isload"
      row-key="ap_mac"
      size="small"
      stripe
      class="wl-table"
      @sort-change="onSort">
      <template slot="empty">
        <el-empty :image-size="80" :description="table_info.length ? '没有符合筛选条件的 AP' : '暂无 AP 数据'"></el-empty>
      </template>
      <el-table-column prop="ap_name" label="AP 名称" min-width="190" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="ap-link" @click="openDetail(scope.row)">{{ scope.row.ap_name || scope.row.ap_mac }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="online_status" label="状态" width="80">
        <template slot-scope="scope">
          <span :class="['status-dot', 'dot-' + statusTagType(scope.row.online_status)]">{{ statusText(scope.row.online_status) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ap_mac" label="MAC" min-width="150">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.ap_mac }}</span>
          <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.ap_mac)"></i>
        </template>
      </el-table-column>
      <el-table-column prop="ap_ip" label="IP" min-width="130" sortable="custom">
        <template slot-scope="scope">
          <span v-if="scope.row.ap_ip" class="mono">{{ scope.row.ap_ip }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="model" label="型号" min-width="120" sortable="custom" show-overflow-tooltip></el-table-column>
      <el-table-column prop="ap_group" label="分组" min-width="120" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.ap_group" class="chip">{{ scope.row.ap_group }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="client_count" label="终端" width="80" align="center" sortable="custom">
        <template slot-scope="scope">
          <span :class="['client-num', { zero: !Number(scope.row.client_count) }]">{{ scope.row.client_count || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ac_name" label="所属 AC" min-width="110" show-overflow-tooltip></el-table-column>
      <el-table-column label="上联" min-width="190">
        <template slot-scope="scope">
          <div v-if="scope.row.lldp_name || scope.row.lldp_port" class="two-line">
            <span class="ellipsis" :title="scope.row.lldp_name">{{ scope.row.lldp_name || '-' }}</span>
            <span class="mono sub" :title="scope.row.lldp_port">{{ scope.row.lldp_port || '-' }}</span>
          </div>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sn" label="SN" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.sn" class="mono">{{ scope.row.sn }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sw_version" label="软件版本" min-width="130" sortable="custom" show-overflow-tooltip></el-table-column>
      <el-table-column prop="last_seen_at" label="采集时间" width="160" sortable="custom">
        <template slot-scope="scope">
          <span class="sub-text">{{ scope.row.last_seen_at || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" icon="el-icon-view" @click="openDetail(scope.row)">详情</el-button>
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

  const EMPTY_SUMMARY = { total: 0, online: 0, offline: 0, unknown: 0, clients: 0 }

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
        filter_ap_name: '',
        filter_ap_mac: '',
        filter_ap_ip: '',
        filter_sn: '',
        filter_model: '',
        filter_ap_group: '',
        filter_sw_version: '',
        filter_ac_id: '',
        filter_online_status: '',  // 前端筛选，保持统计卡片为全量数据
        ac_list: [],
        summary: Object.assign({}, EMPTY_SUMMARY),
        selectedMac: '',
        drawerVisible: false,
      }
    },
    computed: {
      statCards () {
        const s = this.summary
        const rate = s.total ? Math.round(s.online / s.total * 100) : 0
        const cards = [
          { key: 'total', status: '', label: 'AP 总数', value: s.total, icon: 'el-icon-connection', type: 'primary', filter: true },
          { key: 'online', status: 'online', label: '在线', value: s.online, icon: 'el-icon-circle-check', type: 'success', filter: true },
          { key: 'offline', status: 'offline', label: '离线', value: s.offline, icon: 'el-icon-circle-close', type: 'danger', filter: true },
        ]
        if (s.unknown) {
          cards.push({ key: 'unknown', status: 'unknown', label: '未知', value: s.unknown, icon: 'el-icon-question', type: 'info', filter: true })
        }
        cards.push({ key: 'rate', label: '在线率', value: rate, unit: '%', icon: 'el-icon-pie-chart', type: rate >= 95 ? 'success' : 'warning', filter: false })
        cards.push({ key: 'clients', label: '接入终端', value: s.clients, icon: 'el-icon-mobile-phone', type: 'primary', filter: false })
        return cards
      },
      // 更多条件里已填写的数量，收起时提示
      moreCount () {
        return [this.filter_sn, this.filter_model, this.filter_ap_group, this.filter_sw_version].filter(v => String(v || '').trim()).length
      },
      filtered () {
        const status = this.filter_online_status
        if (!status) return this.table_info
        // 与 statusText 保持一致：非 online/offline 都归为未知
        const norm = s => (s === 'online' || s === 'offline') ? s : 'unknown'
        return this.table_info.filter(r => norm(r.online_status) === status)
      },
      sorted () {
        const { prop, order } = this.sort
        if (!prop || !order) return this.filtered
        const numeric = prop === 'client_count'
        const list = this.filtered.slice()
        list.sort((a, b) => {
          let cmp
          if (numeric) {
            cmp = Number(a[prop] || 0) - Number(b[prop] || 0)
          } else if (prop === 'ap_ip') {
            cmp = this.ipValue(a[prop]) - this.ipValue(b[prop])
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
          ap_name: trim(this.filter_ap_name),
          ap_mac: trim(this.filter_ap_mac),
          ap_ip: trim(this.filter_ap_ip),
          sn: trim(this.filter_sn),
          model: trim(this.filter_model),
          ap_group: trim(this.filter_ap_group),
          sw_version: trim(this.filter_sw_version),
        }
        const post_data = {}
        for (const k in fields) {
          if (fields[k]) post_data[k] = fields[k]
        }
        if (this.filter_ac_id !== '' && this.filter_ac_id !== null && this.filter_ac_id !== undefined) {
          post_data.ac_id = this.filter_ac_id
        }

        this.isload = true
        wifiApi.getApList(post_data).then(res => {
          this.table_info = (res && res.list) || []
          this.summary = (res && res.summary) || Object.assign({}, EMPTY_SUMMARY)
          this.table_currentPage = 1
        }).catch(err => {
          this.$message.error((err && err.message) || '查询 AP 列表失败')
        }).finally(() => {
          this.isload = false
        })
      },
      resetFilter () {
        this.filter_ap_name = ''
        this.filter_ap_mac = ''
        this.filter_ap_ip = ''
        this.filter_sn = ''
        this.filter_model = ''
        this.filter_ap_group = ''
        this.filter_sw_version = ''
        this.filter_ac_id = ''
        this.filter_online_status = ''
        this.getViews()
      },
      setStatus (status) {
        this.filter_online_status = status
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
      statusText (s) {
        return { online: '在线', offline: '离线' }[s] || '未知'
      },
      statusTagType (s) {
        return { online: 'success', offline: 'danger' }[s] || 'info'
      },
      ipValue (ip) {
        const parts = String(ip || '').split('.')
        if (parts.length !== 4) return -1
        return parts.reduce((acc, p) => acc * 256 + (parseInt(p, 10) || 0), 0)
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
          'AP名称': r.ap_name,
          '状态': this.statusText(r.online_status),
          'MAC': r.ap_mac,
          'IP': r.ap_ip,
          '型号': r.model,
          '分组': r.ap_group,
          '终端数': r.client_count,
          '所属AC': r.ac_name,
          '上联设备': r.lldp_name,
          '上联端口': r.lldp_port,
          'SN': r.sn,
          '软件版本': r.sw_version,
          '采集时间': r.last_seen_at,
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
        aTag.download = "ap_list.xlsx"
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
.empty-text {
  color: #c0c4cc;
}
.sub-text {
  font-size: 12px;
  color: #909399;
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
.stat-value small {
  margin-left: 2px;
  font-size: 13px;
  font-weight: normal;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
.stat-primary .stat-icon { color: #409eff; background: #ecf5ff; }
.stat-success .stat-icon { color: #67c23a; background: #f0f9eb; }
.stat-danger .stat-icon { color: #f56c6c; background: #fef0f0; }
.stat-warning .stat-icon { color: #e6a23c; background: #fdf6ec; }
.stat-info .stat-icon { color: #909399; background: #f4f4f5; }
.stat-success .stat-value { color: #67c23a; }
.stat-danger .stat-value { color: #f56c6c; }
.stat-warning .stat-value { color: #e6a23c; }

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
.ap-link {
  font-weight: 500;
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
.chip {
  display: inline-block;
  max-width: 100%;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
  color: #606266;
  background: #f4f4f5;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.client-num {
  font-weight: 600;
  color: #409eff;
}
.client-num.zero {
  font-weight: normal;
  color: #c0c4cc;
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
.ellipsis,
.two-line .sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
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
