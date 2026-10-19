<template>
  <div class="acl-rule-page">
    <div class="toolbar">
      <el-button type="primary" size="small" icon="el-icon-plus" @click="handleCreate">新建标准规则</el-button>
      <el-input v-model="searchKeyword" placeholder="搜索规则名称" size="small" clearable
        style="width: 240px; margin-left: 12px;" @keyup.enter.native="loadData">
        <el-button slot="append" icon="el-icon-search" @click="loadData"></el-button>
      </el-input>
      <el-select v-model="filterType" size="small" clearable placeholder="地址族" style="width:120px;margin-left:12px;" @change="loadData">
        <el-option label="IPv4" value="ipv4"></el-option>
      </el-select>
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
          <el-tag type="primary" size="mini">{{ scope.row.acl_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="acl_kind" label="类型" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="mini" effect="plain">{{ scope.row.acl_kind || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fingerprint" label="配置指纹" width="170">
        <template slot-scope="scope">
          <span class="fingerprint-text">{{ (scope.row.fingerprint || '').substring(0, 16) }}...</span>
        </template>
      </el-table-column>
      <el-table-column label="条目数量" width="90" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="mini">{{ scope.row.rule_count }} 条</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="应用统计" width="320" align="center">
        <template slot-scope="scope">
          <div v-if="scope.row.statistics" class="statistics-inline">
            <el-tooltip content="设备总数" placement="top">
              <span class="stat-item">
                <i class="el-icon-monitor"></i> {{ scope.row.statistics.total }}
              </span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="已匹配" placement="top">
              <span class="stat-item stat-matched">
                <i class="el-icon-success"></i> {{ scope.row.statistics.matched }}
              </span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="匹配其他标准" placement="top">
              <span class="stat-item stat-matched-other">
                <i class="el-icon-info"></i> {{ scope.row.statistics.matched_other }}
              </span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="配置漂移" placement="top">
              <span class="stat-item stat-drifted">
                <i class="el-icon-warning"></i> {{ scope.row.statistics.drifted }}
              </span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="匹配率" placement="top">
              <span class="stat-item">{{ scope.row.statistics.rate }}%</span>
            </el-tooltip>
          </div>
          <span v-else style="color:#909399;">暂无数据</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="160" align="center">
        <template slot-scope="scope">{{ formatTime(scope.row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="handleView(scope.row)">查看</el-button>
          <el-button type="text" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" @click="handleManage(scope.row)">配置管理</el-button>
          <el-button type="text" size="mini" style="color:#F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Config Dialog -->
    <el-dialog :title="configDialog.title" :visible.sync="configDialog.visible" width="1080px" :close-on-click-modal="false" top="5vh">
      <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="90px" size="small">
        <el-row :gutter="16">
          <el-col :span="10"><el-form-item label="规则名称" prop="name"><el-input v-model="configForm.name" :disabled="isIdentityLocked" placeholder="如 acl_office_to_idc"></el-input></el-form-item></el-col>
          <el-col :span="5"><el-form-item label="ACL编号"><el-input v-model.number="configForm.acl_number" :disabled="isIdentityLocked" placeholder="可选"></el-input></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="地址族" prop="acl_type"><el-select v-model="configForm.acl_type" :disabled="isIdentityLocked" style="width:100%;" @change="loadGroupNames"><el-option label="IPv4" value="ipv4"></el-option></el-select></el-form-item></el-col>
          <el-col :span="5"><el-form-item label="类型"><el-select v-model="configForm.acl_kind" :disabled="isIdentityLocked" style="width:100%;"><el-option v-for="k in ['basic','advanced']" :key="k" :label="k" :value="k"></el-option></el-select></el-form-item></el-col>
        </el-row>
        <div v-if="configDialog.mode === 'edit'" class="identity-hint">
          名称、编号、地址族和类型是规则的标识，创建后不可修改；如需调整请新建标准规则。
        </div>
        <el-form-item label="描述"><el-input v-model="configForm.description" :disabled="isView" placeholder="可选"></el-input></el-form-item>

        <el-form-item label="条目列表">
          <div class="entry-toolbar">
            <el-button v-if="!isView" type="primary" size="mini" icon="el-icon-plus" @click="addEntry">添加条目</el-button>
            <span class="entry-count">共 {{ configForm.entries.length }} 条</span>
            <span v-if="danglingEntries.length" class="dangling-warn">
              <i class="el-icon-warning"></i> {{ danglingEntries.length }} 条引用未定义的组
            </span>
          </div>

          <el-table :data="configForm.entries" border size="mini" style="width:100%;" max-height="380">
            <el-table-column label="Seq" width="72" align="center">
              <template slot-scope="scope">
                <span class="mono">{{ scope.row.seq }}</span>
                <i v-if="isDangling(scope.row)" class="el-icon-warning dangling-icon" title="引用的组未定义"></i>
              </template>
            </el-table-column>
            <el-table-column label="动作" width="80" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.action === 'deny' ? 'danger' : 'success'" size="mini">{{ scope.row.action }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="协议" width="70" align="center">
              <template slot-scope="scope"><span class="mono">{{ scope.row.protocol }}</span></template>
            </el-table-column>
            <el-table-column label="源地址" min-width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                <span :class="{ 'group-ref': scope.row.src.type === 'addrgroup' }">{{ addrSpecText(scope.row.src) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="源端口" width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                <span v-if="portSpecText(scope.row.src_port)" class="mono">{{ portSpecText(scope.row.src_port) }}</span>
                <span v-else class="muted">any</span>
              </template>
            </el-table-column>
            <el-table-column label="目的地址" min-width="140" show-overflow-tooltip>
              <template slot-scope="scope">
                <span :class="{ 'group-ref': scope.row.dst.type === 'addrgroup' }">{{ addrSpecText(scope.row.dst) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="目的端口" width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                <span v-if="portSpecText(scope.row.dst_port)" class="mono">{{ portSpecText(scope.row.dst_port) }}</span>
                <span v-else class="muted">any</span>
              </template>
            </el-table-column>
            <el-table-column label="选项" width="110">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.options && scope.row.options.established" size="mini" type="warning" effect="plain">established</el-tag>
                <span v-else class="muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button v-if="!isView" type="text" size="mini" @click="editEntry(scope.$index)">编辑</el-button>
                <el-button v-if="!isView" type="text" size="mini" style="color:#F56C6C;" @click="removeEntry(scope.$index)">删除</el-button>
                <el-button v-if="isView" type="text" size="mini" @click="editEntry(scope.$index)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="configDialog.visible=false" size="small">取消</el-button>
        <el-button v-if="!isView" type="primary" size="small" :loading="configDialog.loading" @click="submitConfig">保存</el-button>
      </span>
    </el-dialog>

    <entry-editor-dialog
      :visible.sync="entryDialog.visible"
      :entry="entryDialog.entry"
      :mode="entryDialog.mode"
      :addr-groups="groupNames.addrgroup"
      :port-groups="groupNames.portgroup"
      @save="saveEntry"></entry-editor-dialog>

    <el-dialog title="配置管理" :visible.sync="manageDialog.visible" width="1200px" top="5vh" :close-on-click-modal="false">
      <div v-if="manageDialog.standard" class="manage-container">
        <el-descriptions :column="3" border size="small" style="margin-bottom:20px;">
          <el-descriptions-item label="规则名称">
            <el-tag type="primary">{{ manageDialog.standard.name }}</el-tag>
            <el-tag v-if="manageDialog.standard.acl_number" type="info" size="mini" style="margin-left:4px;">编号 {{ manageDialog.standard.acl_number }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准指纹">
            <span class="fingerprint-text">{{ (manageDialog.standard.fingerprint || '').substring(0, 20) }}...</span>
          </el-descriptions-item>
          <el-descriptions-item label="条目数量">
            <el-tag type="info" size="small">{{ manageDialog.standard.rule_count }} 条</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="toolbar-header">
          <span style="font-weight: bold;">设备配置列表</span>
          <div style="float: right;">
            <el-radio-group v-model="manageDialog.filter" size="mini" style="margin-right: 10px;">
              <el-radio-button label="">全部 ({{ manageDialog.devices.length }})</el-radio-button>
              <el-radio-button label="matched">已匹配 ({{ manageDeviceCounts.matched }})</el-radio-button>
              <el-radio-button label="matched_other">匹配其他标准 ({{ manageDeviceCounts.matched_other }})</el-radio-button>
              <el-radio-button label="drifted">配置漂移 ({{ manageDeviceCounts.drifted }})</el-radio-button>
            </el-radio-group>
            <el-button
              v-if="manageDialog.selectedDevices.length > 0"
              type="warning"
              size="small"
              icon="el-icon-document-add"
              @click="handleCreateIssueRecords">
              创建处理记录 ({{ manageDialog.selectedDevices.length }})
            </el-button>
          </div>
        </div>

        <el-table
          ref="deviceListTable"
          :data="filteredManageDevices"
          border
          stripe
          max-height="450"
          style="width:100%;margin-top:10px;"
          @selection-change="handleDeviceSelectionChange">
          <el-table-column type="selection" width="55" :selectable="checkDeviceSelectable" />
          <el-table-column prop="device_ip" label="设备IP" width="140" fixed><template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template></el-table-column>
          <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />
          <el-table-column prop="vendor" label="厂商类型" width="110" align="center"><template slot-scope="scope"><el-tag :type="vendorTagType(scope.row.vendor)" size="mini">{{ scope.row.vendor }}</el-tag></template></el-table-column>
          <el-table-column prop="match_status" label="匹配状态" width="130" align="center"><template slot-scope="scope"><el-tag :type="matchStatusTag(scope.row.match_status)" size="small">{{ matchStatusLabel(scope.row.match_status) }}</el-tag></template></el-table-column>
          <el-table-column prop="fingerprint" label="设备指纹" width="160" show-overflow-tooltip><template slot-scope="scope"><span class="fingerprint-text">{{ (scope.row.fingerprint || '').substring(0, 16) }}...</span></template></el-table-column>
          <el-table-column prop="entry_count" label="条目数量" width="100" align="center"><template slot-scope="scope"><el-tag type="info" size="small">{{ scope.row.entry_count }} 条</el-tag></template></el-table-column>
          <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button v-if="scope.row.match_status === 'drifted'" type="text" size="small" icon="el-icon-s-operation" @click="handleCompareConfig(scope.row)">对比差异</el-button>
              <span v-else style="color:#67C23A;"><i class="el-icon-success"></i> 已匹配</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer"><el-button @click="manageDialog.visible=false" size="small">关闭</el-button></span>
    </el-dialog>

    <!-- 配置差异对比 -->
    <el-dialog title="配置差异对比" :visible.sync="diffDialog.visible" width="90%" top="5vh" append-to-body>
      <div v-if="diffDialog.compareData" class="compare-container">
        <el-descriptions :column="3" border size="small" style="margin-bottom:15px;">
          <el-descriptions-item label="设备IP"><span class="device-ip">{{ diffDialog.compareData.device_ip }}</span></el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ diffDialog.compareData.device_name }}</el-descriptions-item>
          <el-descriptions-item label="差异摘要"><el-tag type="warning" size="small">{{ diffDialog.compareData.diff_summary }}</el-tag></el-descriptions-item>
        </el-descriptions>

        <div style="margin-bottom:10px;">
          <el-radio-group v-model="diffDialog.mode" size="small" @change="loadDiffComparison">
            <el-radio-button label="context">上下文对比</el-radio-button>
            <el-radio-button label="full">完整对比</el-radio-button>
          </el-radio-group>
        </div>

        <div v-loading="diffDialog.loading" class="diff-html-container" v-html="diffDialog.diffHtml"></div>
      </div>
      <span slot="footer">
        <el-button @click="diffDialog.visible=false" size="small">关闭</el-button>
        <el-button type="primary" size="small" @click="handleCreateSingleIssueRecord">创建处理记录</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'
import EntryEditorDialog from '@/view/pages/policy_manage/components/EntryEditorDialog.vue'
import { addrSpecText, portSpecText, blankEntry, formatTimestamp } from '@/view/pages/policy_manage/utils/spec_format'

export default {
  name: 'AclRule',
  components: { EntryEditorDialog },
  data() {
    return {
      searchKeyword: '',
      filterType: '',
      tableData: [],
      configDialog: { visible: false, mode: 'create', title: '', loading: false },
      configForm: { id: null, name: '', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', description: '', entries: [] },
      configRules: {
        name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
        acl_type: [{ required: true, message: '请选择地址族', trigger: 'change' }]
      },
      entryDialog: { visible: false, mode: 'create', entry: null, index: -1 },
      groupNames: { addrgroup: [], portgroup: [] },
      manageDialog: { visible: false, standard: null, devices: [], filter: '', selectedDevices: [] },
      diffDialog: { visible: false, compareData: null, mode: 'context', diffHtml: '', loading: false }
    }
  },
  computed: {
    isView() {
      return this.configDialog.mode === 'view'
    },
    // 名称/编号/地址族/类型是规则标识，仅新建时可填，编辑与查看均只读
    isIdentityLocked() {
      return this.configDialog.mode !== 'create'
    },
    // 引用了地址组/端口组、但该组当前未定义的条目
    danglingEntries() {      const entry = this.configForm.entries
      const addr = this.groupNames.addrgroup
      const port = this.groupNames.portgroup
      if (!addr.length && !port.length) return []
      const hit = (spec, kind, names) => spec && spec.type === kind && spec.name && names.indexOf(spec.name) === -1
      const out = []
      ;(entry || []).forEach(e => {
        if (hit(e.src, 'addrgroup', addr) || hit(e.dst, 'addrgroup', addr) ||
          hit(e.src_port, 'portgroup', port) || hit(e.dst_port, 'portgroup', port)) {
          out.push(e.seq)
        }
      })
      return out
    },
    // 配置管理弹窗的设备列表按匹配状态筛选
    filteredManageDevices() {
      const f = this.manageDialog.filter
      if (!f) return this.manageDialog.devices
      return this.manageDialog.devices.filter(d => d.match_status === f)
    },
    manageDeviceCounts() {
      const list = this.manageDialog.devices
      return {
        matched: list.filter(d => d.match_status === 'matched').length,
        matched_other: list.filter(d => d.match_status === 'matched_other').length,
        drifted: list.filter(d => d.match_status === 'drifted').length
      }
    }
  },
  created() {
    this.loadData()
    this.loadGroupNames()
  },
  methods: {
    addrSpecText,
    portSpecText,
    formatTime: formatTimestamp,
    isDangling(entry) {
      const addr = this.groupNames.addrgroup
      const port = this.groupNames.portgroup
      if (!addr.length && !port.length) return false
      const hit = (spec, kind, names) => spec && spec.type === kind && spec.name && names.indexOf(spec.name) === -1
      return hit(entry.src, 'addrgroup', addr) || hit(entry.dst, 'addrgroup', addr) ||
        hit(entry.src_port, 'portgroup', port) || hit(entry.dst_port, 'portgroup', port)
    },
    loadGroupNames() {
      const type = this.configForm.acl_type || 'ipv4'
      aclApi.getAddrGroupList({ acl_type: type }).then(res => {
        this.groupNames.addrgroup = (res.data.data || []).map(g => g.name)
      })
      aclApi.getPortGroupList({ acl_type: type }).then(res => {
        this.groupNames.portgroup = (res.data.data || []).map(g => g.name)
      })
    },
    loadData() {
      aclApi.getStandardsList({ keyword: this.searchKeyword, acl_type: this.filterType }).then(res => {
        this.tableData = res.data.data || []
        // 逐条加载应用统计，与 prefix_rule 保持一致
        this.tableData.forEach(item => this.loadStatistics(item))
      })
    },
    loadStatistics(row) {
      aclApi.getStandardStatistics({ standard_id: row.id }).then(res => {
        this.$set(row, 'statistics', res.data.data)
      }).catch(error => {
        console.error('加载统计信息失败:', error)
      })
    },
    handleCreate() {
      this.configDialog = { visible: true, mode: 'create', title: '新建标准规则', loading: false }
      this.configForm = { id: null, name: '', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', description: '', entries: [] }
      this.loadGroupNames()
    },
    handleView(row) {
      this.loadDetail(row, 'view', '查看标准规则')
    },
    handleEdit(row) {
      this.loadDetail(row, 'edit', '编辑标准规则')
    },
    loadDetail(row, mode, title) {
      aclApi.getStandardDetail({ id: row.id }).then(res => {
        const data = res.data.data
        this.configDialog = { visible: true, mode, title, loading: false }
        this.configForm = {
          id: data.id,
          name: data.name,
          acl_number: data.acl_number,
          acl_type: data.acl_type,
          acl_kind: data.acl_kind,
          description: data.description || '',
          entries: (data.entries || []).slice().sort((a, b) => a.seq - b.seq)
        }
      })
    },
    nextSeq() {
      if (!this.configForm.entries.length) return 10
      return Math.max(...this.configForm.entries.map(e => Number(e.seq) || 0)) + 10
    },
    addEntry() {
      this.entryDialog = { visible: true, mode: 'create', entry: blankEntry(this.nextSeq()), index: -1 }
    },
    editEntry(index) {
      this.entryDialog = {
        visible: true,
        mode: this.isView ? 'view' : 'edit',
        entry: this.configForm.entries[index],
        index
      }
    },
    removeEntry(index) {
      this.configForm.entries.splice(index, 1)
    },
    saveEntry(entry) {
      const list = this.configForm.entries
      if (this.entryDialog.index === -1) {
        list.push(entry)
      } else {
        this.$set(list, this.entryDialog.index, entry)
      }
      list.sort((a, b) => a.seq - b.seq)
      // 排序后原下标失效，关闭对话框即可
      this.entryDialog.index = -1
    },    submitConfig() {
      this.$refs.configFormRef.validate(valid => {
        if (!valid) return
        if (!this.configForm.entries.length) {
          this.$message.warning('请至少添加一条规则条目')
          return
        }
        this.configDialog.loading = true
        const entries = this.configForm.entries.slice().sort((a, b) => a.seq - b.seq)
        // 编辑只提交可改字段，标识字段不参与更新
        const payload = this.configDialog.mode === 'create'
          ? { ...this.configForm, entries }
          : {
            id: this.configForm.id,
            entries,
            description: this.configForm.description
          }
        const api = this.configDialog.mode === 'create' ? aclApi.createStandard(payload) : aclApi.updateStandard(payload)
        api.then(() => {
          this.$message.success('保存成功')
          this.configDialog.visible = false
          this.loadData()
        }).finally(() => { this.configDialog.loading = false })
      })
    },
    handleDelete(row) {
      this.$confirm('确定删除该标准规则？', '提示', { type: 'warning' }).then(() => {
        aclApi.deleteStandard({ id: row.id }).then(() => { this.$message.success('删除成功'); this.loadData() })
      }).catch(() => {})
    },
    handleManage(row) {
      this.manageDialog = { visible: true, standard: row, devices: [], filter: '', selectedDevices: [] }
      aclApi.getStandardDeviceList({ standard_id: row.id }).then(res => {
        this.manageDialog.devices = res.data.data || []
      })
    },
    handleDeviceSelectionChange(selection) {
      this.manageDialog.selectedDevices = selection
    },
    // 只有配置漂移的设备才能勾选建处理记录
    checkDeviceSelectable(row) {
      return row.match_status === 'drifted'
    },
    vendorTagType(vendor) {
      return { cisco_nx: 'primary', cisco_ios: 'success', cisco_xr: 'warning', h3c: 'info', huawei: 'danger' }[vendor] || ''
    },

    // ==================== 配置差异对比 ====================

    handleCompareConfig(row) {
      const standard = this.manageDialog.standard
      const standardCount = standard.rule_count
      const deviceCount = row.entry_count

      let diffSummary = ''
      if (standardCount > deviceCount) {
        diffSummary = `设备缺少 ${standardCount - deviceCount} 条配置`
      } else if (standardCount < deviceCount) {
        diffSummary = `设备多出 ${deviceCount - standardCount} 条配置`
      } else {
        diffSummary = '配置条目数量相同，但内容存在差异'
      }

      this.diffDialog.compareData = {
        device_ip: row.device_ip,
        device_name: row.device_name,
        device_vendor: row.vendor,
        device_fingerprint: row.fingerprint,
        diff_summary: diffSummary
      }
      this.diffDialog.mode = 'context'
      this.diffDialog.diffHtml = ''
      this.diffDialog.visible = true
      this.loadDiffComparison()
    },

    loadDiffComparison() {
      const compare = this.diffDialog.compareData
      if (!compare) return

      this.diffDialog.loading = true
      aclApi.compareTextDiff({
        standard_id: this.manageDialog.standard.id,
        device_ip: compare.device_ip,
        full_diff: this.diffDialog.mode === 'full'
      }).then(res => {
        if (res.data.code !== 0 || !res.data.data) {
          this.$message.error(res.data.message || '对比失败')
          this.diffDialog.diffHtml = `<p style="color:red;">${res.data.message || '对比失败'}</p>`
          return
        }
        this.diffDialog.diffHtml = res.data.data.diff_html
      }).catch(error => {
        console.error('对比失败:', error)
        this.$message.error('对比失败')
        this.diffDialog.diffHtml = '<p style="color:red;">对比失败</p>'
      }).finally(() => { this.diffDialog.loading = false })
    },

    // ==================== 创建处理记录 ====================

    handleCreateIssueRecords() {
      const selected = this.manageDialog.selectedDevices
      const deviceText = selected.map(d => `${d.device_name}(${d.device_ip})`).join('、')

      this.$prompt(`确定为以下 ${selected.length} 台设备创建处理记录吗？\n\n${deviceText}\n\n可选填备注信息：`, '创建处理记录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入备注（可选）',
        inputType: 'textarea'
      }).then(({ value }) => {
        const devices = selected.map(d => ({
          device_ip: d.device_ip,
          device_name: d.device_name,
          vendor: d.vendor,
          device_fingerprint: d.fingerprint,
          device_entries: d.entries || []
        }))

        aclApi.batchCreateIssues({
          standard_id: this.manageDialog.standard.id,
          devices: devices,
          remark: value || ''
        }).then(res => {
          const data = res.data.data || {}
          const successCount = (data.success || []).length
          const failed = data.failed || []

          if (failed.length > 0) {
            const details = failed.map(f => `${f.device_ip}: ${f.reason}`).join('\n')
            this.$alert(`成功 ${successCount} 条，失败 ${failed.length} 条\n\n失败详情：\n${details}`, '创建结果', {
              confirmButtonText: '确定',
              type: failed.length === devices.length ? 'error' : 'warning'
            })
          } else {
            this.$message.success(`处理记录创建完成：成功 ${successCount} 条`)
          }

          this.manageDialog.selectedDevices = []
          if (this.$refs.deviceListTable) {
            this.$refs.deviceListTable.clearSelection()
          }
        }).catch(error => {
          console.error('创建处理记录失败:', error)
          this.$message.error('创建处理记录失败')
        })
      }).catch(() => {})
    },

    handleCreateSingleIssueRecord() {
      const compare = this.diffDialog.compareData
      if (!compare) return

      this.$prompt(`确定为设备 ${compare.device_name}(${compare.device_ip}) 创建处理记录吗？\n\n可选填备注信息：`, '创建处理记录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入备注（可选）',
        inputType: 'textarea'
      }).then(({ value }) => {
        const row = this.manageDialog.devices.find(d => d.device_ip === compare.device_ip) || {}

        aclApi.batchCreateIssues({
          standard_id: this.manageDialog.standard.id,
          devices: [{
            device_ip: compare.device_ip,
            device_name: compare.device_name,
            vendor: compare.device_vendor,
            device_fingerprint: compare.device_fingerprint,
            device_entries: row.entries || []
          }],
          remark: value || ''
        }).then(res => {
          const failed = (res.data.data || {}).failed || []
          if (failed.length > 0) {
            this.$message.error(`创建失败: ${failed[0].reason}`)
          } else {
            this.$message.success('处理记录创建成功')
            this.diffDialog.visible = false
          }
        }).catch(error => {
          console.error('创建处理记录失败:', error)
          this.$message.error('创建处理记录失败')
        })
      }).catch(() => {})
    },

    matchStatusLabel(s) { return { matched: '已匹配', matched_other: '匹配其他', drifted: '配置漂移' }[s] || s },
    matchStatusTag(s) { return { matched: 'success', matched_other: 'primary', drifted: 'warning' }[s] || '' }
  }
}
</script>

<style scoped>
.toolbar { display: flex; align-items: center; }
.fingerprint-text { font-family: monospace; font-size: 12px; color: #606266; }
.identity-hint { margin: 0 0 16px 90px; color: #909399; font-size: 12px; line-height: 1.5; }
.statistics-inline { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 13px; }
.stat-item { display: inline-flex; align-items: center; gap: 3px; }
.stat-matched { color: #67C23A; }
.stat-matched-other { color: #409EFF; }
.stat-drifted { color: #E6A23C; }
.device-ip { font-family: monospace; }
.manage-container { max-height: 70vh; overflow-y: auto; }
.toolbar-header { padding: 12px 0; border-bottom: 1px solid #e8e8e8; margin-bottom: 10px; }
.compare-container { max-height: 60vh; overflow-y: auto; }
.diff-html-container { max-height: 600px; overflow: auto; border: 1px solid #e4e7ed; border-radius: 4px; background: #fff; }
.diff-html-container >>> table.diff { width: 100% !important; font-size: 13px; }
.entry-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.entry-count { color: #909399; font-size: 12px; }
.dangling-warn { color: #E6A23C; font-size: 12px; }
.mono { font-family: 'Courier New', monospace; }
.muted { color: #C0C4CC; }
.group-ref { color: #409EFF; }
.dangling-icon { color: #E6A23C; margin-left: 4px; }
</style>
