<template>
  <div class="acl-records-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="ACL名称">
          <el-input v-model="filterForm.acl_name" placeholder="输入ACL名称" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="filterForm.device" placeholder="IP或设备名" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="filterForm.vendor" placeholder="请选择" clearable style="width: 150px;">
            <el-option label="Cisco NX-OS" value="cisco_nx"></el-option>
            <el-option label="Cisco IOS" value="cisco_ios"></el-option>
            <el-option label="Cisco IOS-XR" value="cisco_xr"></el-option>
            <el-option label="H3C" value="h3c"></el-option>
            <el-option label="Huawei" value="huawei"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="地址族">
          <el-select v-model="filterForm.acl_type" placeholder="全部" clearable style="width: 100px;">
            <el-option label="IPv4" value="ipv4"></el-option>
            <el-option label="IPv6" value="ipv6"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分组方式">
          <el-radio-group v-model="groupMode" @change="handleGroupModeChange">
            <el-radio-button label="fingerprint">按指纹分组</el-radio-button>
            <el-radio-button label="device">按设备展示</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="groupMode === 'fingerprint'" class="fingerprint-group-view">
      <el-collapse v-model="activeFingerprints" accordion>
        <el-collapse-item v-for="group in fingerprintGroups" :key="group.fingerprint" :name="group.fingerprint">
          <template slot="title">
            <div class="collapse-title">
              <div class="title-left">
                <el-tag type="primary" size="medium">{{ group.acl_name }}</el-tag>
                <el-tag :type="group.acl_type === 'ipv6' ? 'warning' : ''" size="mini" effect="plain">{{ group.acl_type }}</el-tag>
                <span class="fingerprint-short">指纹: {{ group.fingerprint.substring(0, 16) }}...</span>
              </div>
              <div class="title-right">
                <el-tag type="success" size="mini" effect="plain">{{ group.device_count }} 台设备</el-tag>
                <el-tag type="info" size="mini" effect="plain" style="margin-left:4px;">{{ group.entry_count }} 条规则</el-tag>
              </div>
            </div>
          </template>
          <el-table :data="group.records" border size="small" style="width:100%;">
            <el-table-column prop="device_ip" label="设备IP" width="140"><template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template></el-table-column>
            <el-table-column prop="device_name" label="设备名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
            <el-table-column prop="dangling_count" label="悬空引用" width="90" align="center"><template slot-scope="scope"><el-tag v-if="scope.row.dangling_count>0" type="danger" size="mini">{{ scope.row.dangling_count }}</el-tag><span v-else style="color:#67C23A;">0</span></template></el-table-column>
            <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
            <el-table-column label="操作" width="100" align="center"><template slot-scope="scope"><el-button type="text" size="mini" @click="handleViewDetail(scope.row)">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination background layout="total, prev, pager, next" :total="fingerprintTotal" :page-size="pageSize" :current-page.sync="currentPage" @current-change="loadData"></el-pagination>
      </div>
    </div>

    <div v-else class="device-flat-view">
      <el-table :data="flatRecords" border stripe style="width:100%;">
        <el-table-column prop="device_ip" label="设备IP" width="140"><template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template></el-table-column>
        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />
        <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
        <el-table-column prop="acl_name" label="ACL名称" width="180"><template slot-scope="scope"><el-tag>{{ scope.row.acl_name }}</el-tag></template></el-table-column>
        <el-table-column prop="acl_type" label="地址族" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.acl_type==='ipv6'?'warning':''" size="mini">{{ scope.row.acl_type }}</el-tag></template></el-table-column>
        <el-table-column prop="rule_count" label="条目数" width="80" align="center" />
        <el-table-column prop="dangling_count" label="悬空引用" width="90" align="center"><template slot-scope="scope"><el-tag v-if="scope.row.dangling_count>0" type="danger" size="mini">{{ scope.row.dangling_count }}</el-tag><span v-else style="color:#67C23A;">0</span></template></el-table-column>
        <el-table-column prop="fingerprint" label="指纹(前16位)" width="160"><template slot-scope="scope"><span class="fingerprint-text">{{ scope.row.fingerprint.substring(0,16) }}</span></template></el-table-column>
        <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right"><template slot-scope="scope"><el-button type="text" size="mini" @click="handleViewDetail(scope.row)">查看详情</el-button></template></el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination background layout="total, prev, pager, next" :total="flatTotal" :page-size="pageSize" :current-page.sync="currentPage" @current-change="loadData"></el-pagination>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog title="ACL配置详情" :visible.sync="detailDialog.visible" width="860px">
      <el-descriptions :column="3" border size="small" style="margin-bottom:16px;" v-if="detailDialog.record">
        <el-descriptions-item label="设备IP">{{ detailDialog.record.device_ip }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detailDialog.record.device_name }}</el-descriptions-item>
        <el-descriptions-item label="厂商">{{ detailDialog.record.vendor }}</el-descriptions-item>
        <el-descriptions-item label="ACL名称">{{ detailDialog.record.acl_name }}</el-descriptions-item>
        <el-descriptions-item label="地址族">{{ detailDialog.record.acl_type }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detailDialog.record.acl_kind }}</el-descriptions-item>
        <el-descriptions-item label="条目数量">{{ detailDialog.record.rule_count }}</el-descriptions-item>
        <el-descriptions-item label="悬空引用">{{ detailDialog.record.dangling_count }}</el-descriptions-item>
        <el-descriptions-item label="采集时间">{{ formatTime(detailDialog.record.collected_at) }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailDialog.record" :data="detailDialog.record.entries" border size="small" style="width:100%;">
        <el-table-column prop="seq" label="Seq" width="70" align="center" />
        <el-table-column prop="action" label="动作" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.action==='deny'?'danger':'success'" size="mini">{{ scope.row.action }}</el-tag></template></el-table-column>
        <el-table-column prop="protocol" label="协议" width="80" align="center" />
        <el-table-column label="源地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.src) }}</template></el-table-column>
        <el-table-column label="目的地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.dst) }}</template></el-table-column>
        <el-table-column label="目的端口" width="130"><template slot-scope="scope">{{ formatPortSpec(scope.row.dst_port) }}</template></el-table-column>
        <el-table-column label="选项" width="100"><template slot-scope="scope">{{ scope.row.options && scope.row.options.log ? 'log' : '' }}</template></el-table-column>
      </el-table>
      <span slot="footer"><el-button @click="detailDialog.visible=false" size="small">关闭</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'

export default {
  name: 'AclLog',
  data() {
    return {
      filterForm: { acl_name: '', device: '', vendor: '', acl_type: '' },
      groupMode: 'fingerprint',
      fingerprintGroups: [],
      fingerprintTotal: 0,
      flatRecords: [],
      flatTotal: 0,
      currentPage: 1,
      pageSize: 20,
      activeFingerprints: '',
      detailDialog: { visible: false, record: null }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      const params = { ...this.filterForm }
      aclApi.getRecordsList(params).then(res => {
        const list = res.data.data || []
        this.flatTotal = list.length
        const start = (this.currentPage - 1) * this.pageSize
        this.flatRecords = list.slice(start, start + this.pageSize)
        this.buildFingerprintGroups(list)
      })
    },
    buildFingerprintGroups(list) {
      const map = {}
      list.forEach(r => {
        if (!map[r.fingerprint]) {
          map[r.fingerprint] = { fingerprint: r.fingerprint, acl_name: r.acl_name, acl_type: r.acl_type, records: [], device_count: 0, entry_count: r.rule_count }
        }
        map[r.fingerprint].records.push(r)
        map[r.fingerprint].device_count++
      })
      this.fingerprintGroups = Object.values(map)
      this.fingerprintTotal = this.fingerprintGroups.length
    },
    handleGroupModeChange() { this.currentPage = 1; this.loadData() },
    handleSearch() { this.currentPage = 1; this.loadData() },
    handleReset() { this.filterForm = { acl_name: '', device: '', vendor: '', acl_type: '' }; this.currentPage = 1; this.loadData() },
    handleViewDetail(row) { this.detailDialog.record = row; this.detailDialog.visible = true },
    formatTime(ts) {
      if (!ts) return '-'
      const d = new Date(Number(ts) * 1000)
      return d.toLocaleString('zh-CN', { hour12: false })
    },
    formatAddrSpec(spec) {
      if (!spec) return '-'
      if (spec.type === 'any') return 'any'
      if (spec.type === 'addrgroup') return `group:${spec.name}`
      return spec.address || '-'
    },
    formatPortSpec(spec) {
      if (!spec) return 'any'
      if (spec.type === 'portgroup') return `group:${spec.name}`
      if (spec.type === 'direct') return `${spec.op} ${spec.ports.join('-')}`
      return '-'
    }
  }
}
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.collapse-title { display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 16px; }
.title-left { display: flex; align-items: center; gap: 8px; }
.title-right { display: flex; gap: 6px; }
.fingerprint-short { font-family: monospace; font-size: 12px; color: #909399; }
.device-ip { font-family: monospace; }
.fingerprint-text { font-family: monospace; font-size: 12px; color: #606266; }
.diff-container { font-size: 12px; overflow-x: auto; }
.diff-container table { border-collapse: collapse; width: 100%; }
</style>
