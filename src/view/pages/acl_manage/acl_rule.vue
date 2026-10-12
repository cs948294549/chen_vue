<template>
  <div class="acl-rule-page">
    <div class="toolbar">
      <el-button type="primary" size="small" icon="el-icon-plus" @click="handleCreate">新建标准规则</el-button>
      <el-input v-model="searchKeyword" placeholder="搜索规则名称" size="small" clearable
        style="width: 240px; margin-left: 12px;" @keyup.enter.native="loadData">
        <el-button slot="append" icon="el-icon-search" @click="loadData"></el-button>
      </el-input>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%; margin-top: 16px;">
      <el-table-column prop="name" label="规则名称" min-width="180">
        <template slot-scope="scope">
          <el-tag>{{ scope.row.name }}</el-tag>
          <el-tag v-if="scope.row.acl_number" type="info" size="mini" style="margin-left:4px;">编号 {{ scope.row.acl_number }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="acl_type" label="地址族" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.acl_type === 'ipv6' ? 'warning' : 'primary'" size="mini">{{ scope.row.acl_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="acl_kind" label="类型" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="mini" effect="plain">{{ scope.row.acl_kind || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fingerprint" label="配置指纹" width="170">
        <template slot-scope="scope">
          <span class="fingerprint-text">{{ scope.row.fingerprint.substring(0, 16) }}...</span>
        </template>
      </el-table-column>
      <el-table-column label="条目数量" width="90" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="mini">{{ scope.row.rule_count }} 条</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="应用统计" width="220" align="center">
        <template slot-scope="scope">
          <div v-if="statistics[scope.row.id]" class="stat-tags">
            <el-tag size="mini" type="success">{{ statistics[scope.row.id].matched }} 匹配</el-tag>
            <el-tag size="mini" type="warning" style="margin-left:4px;">{{ statistics[scope.row.id].drifted }} 漂移</el-tag>
            <el-tag size="mini" type="info" style="margin-left:4px;">{{ statistics[scope.row.id].total }} 设备</el-tag>
          </div>
          <el-button v-else type="text" size="mini" @click="loadStatistics(scope.row.id)">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="is_active" label="状态" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'" size="mini">{{ scope.row.is_active ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160" align="center">
        <template slot-scope="scope">{{ formatTime(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="handleView(scope.row)">查看</el-button>
          <el-button type="text" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" @click="handleManage(scope.row)">配置管理</el-button>
          <el-button type="text" size="mini" :style="{color: scope.row.is_active ? '#E6A23C' : '#67C23A'}" @click="handleToggle(scope.row)">{{ scope.row.is_active ? '停用' : '启用' }}</el-button>
          <el-button type="text" size="mini" style="color:#F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Config Dialog -->
    <el-dialog :title="configDialog.title" :visible.sync="configDialog.visible" width="860px" :close-on-click-modal="false">
      <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="90px" size="small">
        <el-row :gutter="16">
          <el-col :span="10"><el-form-item label="规则名称" prop="name"><el-input v-model="configForm.name" :disabled="configDialog.mode==='view'" placeholder="如 PERMIT_INTERNET_OUT"></el-input></el-form-item></el-col>
          <el-col :span="5"><el-form-item label="ACL编号"><el-input v-model.number="configForm.acl_number" :disabled="configDialog.mode==='view'" placeholder="可选"></el-input></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="地址族" prop="acl_type"><el-select v-model="configForm.acl_type" :disabled="configDialog.mode==='view'" style="width:100%;"><el-option label="IPv4" value="ipv4"></el-option><el-option label="IPv6" value="ipv6"></el-option></el-select></el-form-item></el-col>
          <el-col :span="5"><el-form-item label="类型"><el-select v-model="configForm.acl_kind" :disabled="configDialog.mode==='view'" style="width:100%;"><el-option v-for="k in ['basic','advanced','l2','custom','named']" :key="k" :label="k" :value="k"></el-option></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="描述"><el-input v-model="configForm.description" :disabled="configDialog.mode==='view'" placeholder="可选"></el-input></el-form-item>
        <el-form-item label="条目列表">
          <el-table :data="configForm.entries" border size="mini" style="width:100%;">
            <el-table-column label="Seq" width="70"><template slot-scope="scope"><el-input v-model.number="scope.row.seq" :disabled="configDialog.mode==='view'" size="mini"></el-input></template></el-table-column>
            <el-table-column label="动作" width="90"><template slot-scope="scope"><el-select v-model="scope.row.action" :disabled="configDialog.mode==='view'" size="mini" style="width:100%;"><el-option label="permit" value="permit"></el-option><el-option label="deny" value="deny"></el-option></el-select></template></el-table-column>
            <el-table-column label="协议" width="80"><template slot-scope="scope"><el-input v-model="scope.row.protocol" :disabled="configDialog.mode==='view'" size="mini" placeholder="ip"></el-input></template></el-table-column>
            <el-table-column label="源地址"><template slot-scope="scope"><el-input v-model="scope.row._src_str" :disabled="configDialog.mode==='view'" size="mini" placeholder="any / 10.0.0.0/8"></el-input></template></el-table-column>
            <el-table-column label="目的地址"><template slot-scope="scope"><el-input v-model="scope.row._dst_str" :disabled="configDialog.mode==='view'" size="mini" placeholder="any / 192.168.0.0/16"></el-input></template></el-table-column>
            <el-table-column label="目的端口" width="120"><template slot-scope="scope"><el-input v-model="scope.row._dst_port_str" :disabled="configDialog.mode==='view'" size="mini" placeholder="eq 80"></el-input></template></el-table-column>
            <el-table-column label="操作" width="60" align="center"><template slot-scope="scope"><el-button v-if="configDialog.mode!=='view'" type="text" size="mini" icon="el-icon-delete" style="color:#F56C6C;" @click="configForm.entries.splice(scope.$index,1)"></el-button></template></el-table-column>
          </el-table>
          <el-button v-if="configDialog.mode!=='view'" type="text" size="mini" icon="el-icon-plus" @click="addEntry" style="margin-top:8px;">添加条目</el-button>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="configDialog.visible=false" size="small">取消</el-button>
        <el-button v-if="configDialog.mode!=='view'" type="primary" size="small" :loading="configDialog.loading" @click="submitConfig">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="配置管理" :visible.sync="manageDialog.visible" width="720px">
      <div style="margin-bottom:12px;">
        <el-tag>{{ manageDialog.standard && manageDialog.standard.name }}</el-tag>
        <el-radio-group v-model="manageDialog.filter" size="mini" style="margin-left:16px;" @change="filterDeviceList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="matched">匹配</el-radio-button>
          <el-radio-button label="drifted">漂移</el-radio-button>
          <el-radio-button label="matched_other">匹配其他</el-radio-button>
        </el-radio-group>
      </div>
      <el-table :data="manageDialog.filteredDevices" border size="small" style="width:100%;">
        <el-table-column prop="device_ip" label="设备IP" width="140" />
        <el-table-column prop="device_name" label="设备名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
        <el-table-column prop="match_status" label="匹配状态" width="110" align="center"><template slot-scope="scope"><el-tag :type="matchStatusTag(scope.row.match_status)" size="mini">{{ matchStatusLabel(scope.row.match_status) }}</el-tag></template></el-table-column>
        <el-table-column prop="collected_at" label="采集时间" width="155" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
        <el-table-column label="操作" width="100" align="center"><template slot-scope="scope"><el-button v-if="scope.row.match_status==='drifted'" type="text" size="mini" @click="handleDiff(manageDialog.standard,scope.row)">查看差异</el-button></template></el-table-column>
      </el-table>
      <span slot="footer"><el-button @click="manageDialog.visible=false" size="small">关闭</el-button></span>
    </el-dialog>

    <el-dialog title="配置差异" :visible.sync="diffDialog.visible" width="860px">
      <div v-if="diffDialog.diffHtml" class="diff-container" v-html="diffDialog.diffHtml"></div>
      <div v-else style="text-align:center;padding:40px;color:#909399;">加载中...</div>
      <span slot="footer"><el-button @click="diffDialog.visible=false" size="small">关闭</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'

function emptyEntry() {
  return { seq: 10, action: 'permit', protocol: 'ip', src: { type: 'any' }, src_port: null, dst: { type: 'any' }, dst_port: null, options: {}, _src_str: 'any', _dst_str: 'any', _dst_port_str: 'any' }
}

function parseAddrStr(str) {
  if (!str || str === 'any') return { type: 'any' }
  if (str.startsWith('group:')) return { type: 'addrgroup', name: str.slice(6) }
  return { type: str.includes('/') ? 'network' : 'host', address: str }
}

function parsePortStr(str) {
  if (!str || str === 'any') return null
  if (str.startsWith('group:')) return { type: 'portgroup', name: str.slice(6) }
  const parts = str.trim().split(/\s+/)
  const op = parts[0]
  const ports = parts.slice(1).map(Number)
  return { type: 'direct', op, ports }
}

export default {
  name: 'AclRule',
  data() {
    return {
      searchKeyword: '',
      tableData: [],
      statistics: {},
      configDialog: { visible: false, mode: 'create', title: '', loading: false },
      configForm: { id: null, name: '', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', description: '', entries: [] },
      configRules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        acl_type: [{ required: true, message: '请选择地址族', trigger: 'change' }]
      },
      manageDialog: { visible: false, standard: null, devices: [], filteredDevices: [], filter: '' },
      diffDialog: { visible: false, diffHtml: '' }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      aclApi.getStandardsList({ keyword: this.searchKeyword }).then(res => { this.tableData = res.data.data || [] })
    },
    loadStatistics(id) {
      aclApi.getStandardStatistics({ standard_id: id }).then(res => { this.statistics = { ...this.statistics, [id]: res.data.data } })
    },
    handleCreate() {
      this.configDialog = { visible: true, mode: 'create', title: '新建标准规则', loading: false }
      this.configForm = { id: null, name: '', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', description: '', entries: [emptyEntry()] }
    },
    handleView(row) {
      aclApi.getStandardDetail({ id: row.id }).then(res => {
        this.configDialog = { visible: true, mode: 'view', title: '查看标准规则', loading: false }
        this.configForm = this.decorateEntries(res.data.data)
      })
    },
    handleEdit(row) {
      aclApi.getStandardDetail({ id: row.id }).then(res => {
        this.configDialog = { visible: true, mode: 'edit', title: '编辑标准规则', loading: false }
        this.configForm = this.decorateEntries(res.data.data)
      })
    },
    decorateEntries(data) {
      const entries = (data.entries || []).map(e => ({
        ...e,
        _src_str: this.formatAddrSpec(e.src),
        _dst_str: this.formatAddrSpec(e.dst),
        _dst_port_str: this.formatPortSpec(e.dst_port)
      }))
      return { ...data, entries }
    },
    addEntry() { this.configForm.entries.push(emptyEntry()) },
    submitConfig() {
      this.$refs.configFormRef.validate(valid => {
        if (!valid) return
        this.configDialog.loading = true
        const entries = this.configForm.entries.map(e => ({
          seq: e.seq, action: e.action, protocol: e.protocol,
          src: parseAddrStr(e._src_str), src_port: null,
          dst: parseAddrStr(e._dst_str), dst_port: parsePortStr(e._dst_port_str),
          options: e.options || {}
        }))
        const payload = { ...this.configForm, entries }
        const api = this.configDialog.mode === 'create' ? aclApi.createStandard(payload) : aclApi.updateStandard(payload)
        api.then(() => {
          this.$message.success('保存成功')
          this.configDialog.visible = false
          this.loadData()
        }).finally(() => { this.configDialog.loading = false })
      })
    },
    handleToggle(row) {
      aclApi.toggleStandardActive({ id: row.id }).then(() => { this.$message.success('状态已更新'); this.loadData() })
    },
    handleDelete(row) {
      this.$confirm('确定删除该标准规则？', '提示', { type: 'warning' }).then(() => {
        aclApi.deleteStandard({ id: row.id }).then(() => { this.$message.success('删除成功'); this.loadData() })
      }).catch(() => {})
    },
    handleManage(row) {
      this.manageDialog = { visible: true, standard: row, devices: [], filteredDevices: [], filter: '' }
      aclApi.getStandardDeviceList({ standard_id: row.id }).then(res => {
        this.manageDialog.devices = res.data.data || []
        this.manageDialog.filteredDevices = this.manageDialog.devices
      })
    },
    filterDeviceList() {
      const f = this.manageDialog.filter
      this.manageDialog.filteredDevices = f ? this.manageDialog.devices.filter(d => d.match_status === f) : this.manageDialog.devices
    },
    handleDiff(standard, device) {
      this.diffDialog = { visible: true, diffHtml: '' }
      aclApi.compareTextDiff({ standard_id: standard.id, device_ip: device.device_ip }).then(res => {
        this.diffDialog.diffHtml = res.data.data.diff_html
      })
    },
    matchStatusLabel(s) { return { matched: '匹配', matched_other: '匹配其他', drifted: '漂移' }[s] || s },
    matchStatusTag(s) { return { matched: 'success', matched_other: 'primary', drifted: 'warning' }[s] || '' },
    formatTime(ts) {
      if (!ts) return '-'
      const d = new Date(Number(ts) * 1000)
      return d.toLocaleString('zh-CN', { hour12: false })
    },
    formatAddrSpec(spec) {
      if (!spec) return 'any'
      if (spec.type === 'any') return 'any'
      if (spec.type === 'addrgroup') return `group:${spec.name}`
      return spec.address || 'any'
    },
    formatPortSpec(spec) {
      if (!spec) return 'any'
      if (spec.type === 'portgroup') return `group:${spec.name}`
      if (spec.type === 'direct') return `${spec.op} ${spec.ports.join('-')}`
      return 'any'
    }
  }
}
</script>

<style scoped>
.toolbar { display: flex; align-items: center; }
.fingerprint-text { font-family: monospace; font-size: 12px; color: #606266; }
.stat-tags { display: flex; justify-content: center; gap: 4px; }
.diff-container { font-size: 12px; overflow-x: auto; }
.diff-container table { border-collapse: collapse; width: 100%; }
</style>
