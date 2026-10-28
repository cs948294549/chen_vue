<template>
  <div>
    <div v-if="table_info.length>0" style="margin-bottom: 10px;">
      <el-button type="primary" size="mini" @click="download_table">下载</el-button>
      <span style="margin-left: 15px; font-size: 12px; color: #606266;">
        AP 总数 {{ summary.total }}，
        <span style="color: #67c23a;">在线 {{ summary.online }}</span>，
        <span style="color: #f56c6c;">离线 {{ summary.offline }}</span>
        <span v-if="summary.unknown">，未知 {{ summary.unknown }}</span>，
        终端 {{ summary.clients }}
      </span>
    </div>
    <el-row>
      <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
        <el-form-item label="AP名称">
          <el-input placeholder="AP名称" v-model="filter_ap_name" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="MAC">
          <el-input placeholder="MAC" v-model="filter_ap_mac" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="IP">
          <el-input placeholder="IP" v-model="filter_ap_ip" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="SN">
          <el-input placeholder="SN" v-model="filter_sn" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row>
      <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
        <el-form-item label="型号">
          <el-input placeholder="型号" v-model="filter_model" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="分组">
          <el-input placeholder="分组" v-model="filter_ap_group" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="版本">
          <el-input placeholder="软件版本" v-model="filter_sw_version" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="AC">
          <el-select v-model="filter_ac_id" placeholder="全部" @change="getViews" clearable>
            <el-option v-for="ac in ac_list" :key="ac.ac_id" :label="ac.ac_name" :value="ac.ac_id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter_online_status" placeholder="全部" @change="getViews" clearable style="width: 100px;">
            <el-option label="在线" value="online"></el-option>
            <el-option label="离线" value="offline"></el-option>
            <el-option label="未知" value="unknown"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading='isload' @click="getViews">筛选</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-table border :data.sync='table_info_show' size="mini" v-loading="isload">
      <el-table-column prop="ap_name" label="AP名称" show-overflow-tooltip min-width='20' align='center'></el-table-column>
      <el-table-column prop="online_status" label="状态" min-width='8' align='center'>
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusTagType(scope.row.online_status)">{{ statusText(scope.row.online_status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ap_mac" label="MAC" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop="ap_ip" label="IP" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="model" label="型号" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="ap_group" label="分组" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="client_count" label="终端数" min-width='8' align='center'></el-table-column>
      <el-table-column prop="ac_name" label="所属AC" show-overflow-tooltip min-width='12' align='center'></el-table-column>
      <el-table-column prop="lldp_name" label="上联设备" show-overflow-tooltip min-width='18' align='center'></el-table-column>
      <el-table-column prop="lldp_port" label="上联端口" show-overflow-tooltip min-width='13' align='center'></el-table-column>
      <el-table-column prop="sn" label="SN" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop="sw_version" label="软件版本" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop="last_seen_at" label="采集时间" show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column label="操作" min-width='8' align='center' fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
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
        filter_ap_name: '',
        filter_ap_mac: '',
        filter_ap_ip: '',
        filter_sn: '',
        filter_model: '',
        filter_ap_group: '',
        filter_sw_version: '',
        filter_ac_id: '',
        filter_online_status: '',
        ac_list: [],
        summary: { total: 0, online: 0, offline: 0, unknown: 0, clients: 0 },
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
          ap_name: trim(this.filter_ap_name),
          ap_mac: trim(this.filter_ap_mac),
          ap_ip: trim(this.filter_ap_ip),
          sn: trim(this.filter_sn),
          model: trim(this.filter_model),
          ap_group: trim(this.filter_ap_group),
          sw_version: trim(this.filter_sw_version),
          online_status: this.filter_online_status,
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
          this.table_total = this.table_info.length
          this.summary = (res && res.summary) || { total: 0, online: 0, offline: 0, unknown: 0, clients: 0 }
          this.table_currentPage = 1
          this.table_info_show = this.table_info.slice(0, this.table_size)
        }).catch(err => {
          this.$message.error((err && err.message) || '查询 AP 列表失败')
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
      statusText (s) {
        return { online: '在线', offline: '离线' }[s] || '未知'
      },
      statusTagType (s) {
        return { online: 'success', offline: 'danger' }[s] || 'info'
      },
      // ==================== Excel导出相关 ====================
      download_table () {
        // 生成新数组，downloadExcl 里的 unshift 不会污染 table_info
        const rows = this.table_info.map(r => ({
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
</style>
