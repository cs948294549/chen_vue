<template>
  <div>
    <div v-if="table_info.length>0" style="margin-bottom: 10px;">
      <el-button type="primary" size="mini" @click="download_table">下载</el-button>
      <span style="margin-left: 15px; font-size: 12px; color: #606266;">
        终端总数 {{ summary.total }}，
        <span style="color: #67c23a;">在线 {{ summary.online }}</span>，
        <span style="color: #f56c6c;">离线 {{ summary.offline }}</span>
      </span>
    </div>
    <el-row>
      <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
        <el-form-item label="IP">
          <el-input placeholder="IP" v-model="filter_ip" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input placeholder="用户名" v-model="filter_username" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="MAC">
          <el-input placeholder="MAC" v-model="filter_client_mac" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="AP名称">
          <el-input placeholder="AP名称" v-model="filter_ap_name" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
        <el-form-item label="SSID">
          <el-input placeholder="SSID" v-model="filter_ssid" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="频段">
          <el-input placeholder="如 5G" v-model="filter_band" @keyup.enter.native="getViews" clearable style="width: 110px;"></el-input>
        </el-form-item>
        <el-form-item label="AC">
          <el-select v-model="filter_ac_id" placeholder="全部" @change="getViews" clearable>
            <el-option v-for="ac in ac_list" :key="ac.ac_id" :label="ac.ac_name" :value="ac.ac_id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter_status" placeholder="全部" @change="getViews" clearable style="width: 100px;">
            <el-option label="在线" value="online"></el-option>
            <el-option label="离线" value="offline"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading='isload' @click="getViews">筛选</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-table border :data.sync='table_info_show' size="mini" v-loading="isload">
      <el-table-column prop="ip" label="IP" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="username" label="用户名" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop="status" label="状态" min-width='8' align='center'>
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusTagType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="client_mac" label="MAC" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop="ap_name" label="所属AP" show-overflow-tooltip min-width='20' align='center'>
        <template slot-scope="scope">
          <el-button v-if="apLabel(scope.row) !== '未知'" type="text" size="mini" @click="openDetail(scope.row)">
            {{ apLabel(scope.row) }}
          </el-button>
          <span v-else>未知</span>
        </template>
      </el-table-column>
      <el-table-column prop="ssid" label="SSID" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="channel" label="信道" min-width='8' align='center'></el-table-column>
      <el-table-column prop="rssi" label="信号(dBm)" min-width='10' align='center'>
        <template slot-scope="scope">
          <span :style="{color: rssiColor(scope.row.rssi)}">{{ scope.row.rssi === null ? '--' : scope.row.rssi }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="up_rate" label="上行" min-width='10' align='center'>
        <template slot-scope="scope">{{ formatRate(scope.row.up_rate) }}</template>
      </el-table-column>
      <el-table-column prop="down_rate" label="下行" min-width='10' align='center'>
        <template slot-scope="scope">{{ formatRate(scope.row.down_rate) }}</template>
      </el-table-column>
      <el-table-column prop="vlan_id" label="VLAN" min-width='8' align='center'></el-table-column>
      <el-table-column prop="ac_name" label="所属AC" show-overflow-tooltip min-width='12' align='center'></el-table-column>
    </el-table>
    <el-pagination @current-change='handleCurrentChange' :current-page='table_currentPage' @size-change="handleSizeChange"
      :page-sizes="[2, 20, 50, 100, 200, 500]" :page-size="table_size" layout='total, sizes, prev, pager, next'
      :total='table_total' style='float: right'>
    </el-pagination><br/>

    <ApDetailDrawer :visible.sync="drawerVisible" :ap-mac="selectedMac" />
  </div>
</template>

<script>
  import XLSX from 'xlsx'
  import wifiApi from '@/api/mapis/wifi_interface'
  import ApDetailDrawer from './wifi_components/ApDetailDrawer.vue'

  export default {
    components: { ApDetailDrawer },
    data () {
      return {
        table_currentPage: 1,
        table_info: [],
        table_info_show: [],
        table_total: 0,
        table_size: 20,
        isload: false,
        filter_ip: '',
        filter_username: '',
        filter_client_mac: '',
        filter_ap_name: '',
        filter_ssid: '',
        filter_band: '',
        filter_ac_id: '',
        filter_status: '',
        ac_list: [],
        summary: { total: 0, online: 0, offline: 0 },
        selectedMac: '',
        drawerVisible: false,
      }
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
          status: this.filter_status,
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
          this.table_total = this.table_info.length
          this.summary = (res && res.summary) || { total: 0, online: 0, offline: 0 }
          this.table_currentPage = 1
          this.table_info_show = this.table_info.slice(0, this.table_size)
        }).catch(err => {
          this.$message.error((err && err.message) || '查询终端列表失败')
        }).finally(() => {
          this.isload = false
        })
      },
      handleCurrentChange (val) {
        this.table_currentPage = val
        this.table_info_show = this.table_info.slice((this.table_currentPage - 1) * this.table_size, this.table_currentPage * this.table_size)
      },
      handleSizeChange (val) {
        this.table_size = val
        this.table_info_show = this.table_info.slice((this.table_currentPage - 1) * this.table_size, this.table_currentPage * this.table_size)
      },
      openDetail (row) {
        this.selectedMac = row.ap_mac
        this.drawerVisible = true
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
      rssiColor (rssi) {
        if (rssi === null || rssi === undefined || rssi === '') return '#909399'
        if (rssi >= -60) return '#67c23a'
        if (rssi >= -75) return '#e6a23c'
        return '#f56c6c'
      },
      formatRate (bps) {
        const v = Number(bps || 0)
        if (!v) return '0'
        if (v >= 1000000) return (v / 1000000).toFixed(1) + ' Mbps'
        if (v >= 1000) return (v / 1000).toFixed(1) + ' Kbps'
        return v + ' bps'
      },

      // ==================== Excel导出相关 ====================
      download_table () {
        // 生成新数组，downloadExcl 里的 unshift 不会污染 table_info
        const rows = this.table_info.map(r => ({
          'IP': r.ip,
          '用户名': r.username,
          '状态': this.statusText(r.status),
          'MAC': r.client_mac,
          '所属AP': r.ap_name,
          'AP MAC': r.ap_mac,
          'SSID': r.ssid,
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
</style>
