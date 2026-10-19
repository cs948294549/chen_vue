<template>
  <div class="port-group-standards-page">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" icon="el-icon-plus" @click="handleCreate">新建标准规则</el-button>
      <el-input
        v-model="searchText"
        placeholder="搜索端口组名称"
        prefix-icon="el-icon-search"
        style="width: 300px;"
        clearable
        @clear="handleSearch">
      </el-input>
      <el-select v-model="filterType" placeholder="地址族" clearable style="width: 120px;" @change="handleSearch">
        <el-option label="IPv4" value="ipv4"></el-option>
        <el-option label="IPv6" value="ipv6"></el-option>
      </el-select>
      <el-button size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
    </div>

    <!-- 标准规则列表 -->
    <el-table
      :data="filteredTableData"
      border
      stripe
      style="width: 100%"
      v-loading="loading">

      <el-table-column prop="name" label="端口组名称" width="200" fixed>
        <template slot-scope="scope">
          <el-tag>{{ scope.row.name }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="acl_type" label="地址族" width="90" align="center">
        <template slot-scope="scope">
          <el-tag type="primary" size="mini">{{ scope.row.acl_type }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="fingerprint" label="配置指纹" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="fingerprint-text">{{ (scope.row.fingerprint || '').substring(0, 16) }}...</span>
        </template>
      </el-table-column>

      <el-table-column label="条目数量" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="small">{{ entryList(scope.row).length }} 条</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="ref_count" label="被引用" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.ref_count > 0 ? 'warning' : 'info'" size="small">
            {{ scope.row.ref_count || 0 }} 次
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="应用统计" width="330" align="center">
        <template slot-scope="scope">
          <div v-if="scope.row.statistics" class="statistics-inline">
            <el-tooltip content="设备总数" placement="top">
              <span class="stat-item"><i class="el-icon-monitor"></i> {{ scope.row.statistics.total }}</span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="已匹配" placement="top">
              <span class="stat-item stat-matched"><i class="el-icon-success"></i> {{ scope.row.statistics.matched }}</span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="匹配其他标准" placement="top">
              <span class="stat-item"><i class="el-icon-info"></i> {{ scope.row.statistics.matched_other }}</span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="配置漂移" placement="top">
              <span class="stat-item stat-drifted"><i class="el-icon-warning"></i> {{ scope.row.statistics.drifted }}</span>
            </el-tooltip>
            <el-divider direction="vertical"></el-divider>
            <el-tooltip content="匹配率" placement="top">
              <span class="stat-item">{{ scope.row.statistics.rate }}%</span>
            </el-tooltip>
          </div>
          <span v-else style="color: #909399;">暂无数据</span>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />

      <el-table-column prop="is_active" label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.is_active === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.is_active === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="创建时间" width="160">
        <template slot-scope="scope">
          {{ formatTime(scope.row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="scope">
          <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            v-if="scope.row.is_active"
            size="small"
            type="text"
            icon="el-icon-s-operation"
            @click="handleManageConfig(scope.row)">
            管理配置
          </el-button>
          <el-button size="small" type="text" icon="el-icon-delete" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="tableData.length > pageSize"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="tableData.length"
      style="margin-top: 20px; text-align: right;">
    </el-pagination>

    <!-- 标准规则编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="920px"
      :close-on-click-modal="false">

      <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="端口组名称" prop="name">
              <el-input v-model="ruleForm.name" placeholder="例如：og_port_per" :disabled="isViewMode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址族" prop="acl_type">
              <el-select v-model="ruleForm.acl_type" :disabled="isViewMode" style="width: 100%;">
                <el-option label="IPv4" value="ipv4"></el-option>
                <el-option label="IPv6" value="ipv6"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="规则说明">
          <el-input v-model="ruleForm.description" type="textarea" :rows="2" placeholder="请输入规则说明" :disabled="isViewMode"></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="ruleForm.is_active" :disabled="isViewMode">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="端口条目">
          <div style="width: 100%;">
            <el-button
              v-if="!isViewMode"
              size="small"
              type="primary"
              icon="el-icon-plus"
              style="margin-bottom: 10px;"
              @click="handleAddEntry">
              添加条目
            </el-button>

            <el-table :data="ruleForm.entries" border size="small" max-height="400">
              <el-table-column label="运算符" width="120" align="center">
                <template slot-scope="scope">
                  <el-select
                    v-if="!isViewMode"
                    v-model="scope.row.op"
                    size="mini"
                    style="width: 100%;"
                    @change="onOpChange(scope.row)">
                    <el-option v-for="op in portOpOptions" :key="op" :label="op" :value="op"></el-option>
                  </el-select>
                  <el-tag v-else size="mini" effect="plain">{{ scope.row.op }}</el-tag>
                </template>
              </el-table-column>

              <el-table-column label="端口" min-width="260">
                <template slot-scope="scope">
                  <el-input
                    v-if="!isViewMode"
                    v-model="scope.row.portsText"
                    size="mini"
                    :placeholder="scope.row.op === 'range' ? '起止端口，如 5900, 5930' : '端口或服务名，多个用逗号分隔'"></el-input>
                  <span v-else>{{ portsText(scope.row.ports) }}</span>
                </template>
              </el-table-column>

              <el-table-column label="描述" min-width="160">
                <template slot-scope="scope">
                  <el-input v-if="!isViewMode" v-model="scope.row.description" size="mini" placeholder="可选"></el-input>
                  <span v-else>{{ scope.row.description }}</span>
                </template>
              </el-table-column>

              <el-table-column label="提交预览" width="200" show-overflow-tooltip>
                <template slot-scope="scope">
                  <code class="mono">{{ previewEntry(scope.row) }}</code>
                </template>
              </el-table-column>

              <el-table-column v-if="!isViewMode" label="操作" width="80" align="center">
                <template slot-scope="scope">
                  <el-button size="mini" type="text" icon="el-icon-delete" style="color: #f56c6c;" @click="handleDeleteEntry(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-form-item v-if="isViewMode" label="配置指纹">
          <el-input v-model="ruleForm.fingerprint" readonly>
            <el-button slot="append" icon="el-icon-document-copy" @click="copyFingerprint(ruleForm.fingerprint)">复制</el-button>
          </el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button v-if="!isViewMode" size="small" type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </el-dialog>

    <!-- 配置管理对话框 -->
    <el-dialog
      title="配置管理"
      :visible.sync="manageDialogVisible"
      width="1200px"
      top="5vh"
      :close-on-click-modal="false">

      <div v-if="currentManageStandard">
        <el-descriptions :column="4" border size="small" style="margin-bottom: 20px;">
          <el-descriptions-item label="端口组名称">
            <el-tag type="primary">{{ currentManageStandard.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="地址族">
            <el-tag type="primary" size="mini">{{ currentManageStandard.acl_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准指纹">
            <span class="fingerprint-text">{{ (currentManageStandard.fingerprint || '').substring(0, 20) }}...</span>
          </el-descriptions-item>
          <el-descriptions-item label="条目数量">
            <el-tag type="info" size="small">{{ entryList(currentManageStandard).length }} 条</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="toolbar-header">
          <span style="font-weight: bold;">设备配置列表</span>
          <div style="float: right;">
            <el-radio-group v-model="manageDeviceFilter" size="mini" style="margin-right: 10px;" @change="loadDeviceStatistics(currentManageStandard)">
              <el-radio-button label="all">全部 ({{ manageDeviceList.length }})</el-radio-button>
              <el-radio-button label="matched">已匹配 ({{ matchedDeviceCount }})</el-radio-button>
              <el-radio-button label="matched_other">匹配其他标准 ({{ matchedOtherDeviceCount }})</el-radio-button>
              <el-radio-button label="drifted">配置漂移 ({{ driftedDeviceCount }})</el-radio-button>
            </el-radio-group>
            <el-button
              v-if="selectedDevices.length > 0"
              type="warning"
              size="small"
              icon="el-icon-document-add"
              @click="handleCreateIssueRecords">
              创建处理记录 ({{ selectedDevices.length }})
            </el-button>
          </div>
        </div>

        <el-table
          ref="deviceListTable"
          :data="manageDeviceList"
          border
          stripe
          max-height="450"
          style="margin-top: 10px;"
          @selection-change="handleDeviceSelectionChange">

          <el-table-column type="selection" width="55" :selectable="checkDeviceSelectable"></el-table-column>

          <el-table-column prop="device_ip" label="设备IP" width="140" fixed>
            <template slot-scope="scope">
              <span class="device-ip">{{ scope.row.device_ip }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />

          <el-table-column prop="vendor" label="厂商" width="110" align="center">
            <template slot-scope="scope">
              <el-tag :type="getVendorTagType(scope.row.vendor)" size="mini">{{ scope.row.vendor }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="match_status" label="匹配状态" width="130" align="center">
            <template slot-scope="scope">
              <el-tag :type="matchStatusTagType(scope.row.match_status)" size="small">
                {{ matchStatusText(scope.row.match_status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="fingerprint" label="设备指纹" width="160" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="fingerprint-text">{{ (scope.row.fingerprint || '').substring(0, 16) }}...</span>
            </template>
          </el-table-column>

          <el-table-column prop="entry_count" label="条目数量" width="100" align="center">
            <template slot-scope="scope">
              <el-tag type="info" size="small">{{ scope.row.entry_count }} 条</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="collected_at" label="采集时间" width="160">
            <template slot-scope="scope">
              {{ formatTime(scope.row.collected_at) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.match_status === 'drifted'"
                size="small"
                type="text"
                icon="el-icon-s-operation"
                @click="handleCompareConfig(scope.row)">
                对比差异
              </el-button>
              <span v-else style="color: #67C23A;"><i class="el-icon-success"></i> 已匹配</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="manageDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 配置差异对比对话框 -->
    <el-dialog
      title="配置差异对比"
      :visible.sync="compareDialogVisible"
      width="90%"
      top="5vh"
      append-to-body>

      <div v-if="compareData">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 15px;">
          <el-descriptions-item label="设备IP"><span class="device-ip">{{ compareData.device_ip }}</span></el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ compareData.device_name }}</el-descriptions-item>
          <el-descriptions-item label="差异摘要">
            <el-tag type="warning" size="small">{{ compareData.diff_summary }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-bottom: 10px;">
          <el-radio-group v-model="diffMode" size="small" @change="loadDiffComparison">
            <el-radio-button label="context">上下文对比</el-radio-button>
            <el-radio-button label="full">完整对比</el-radio-button>
          </el-radio-group>
        </div>

        <div v-loading="diffLoading" class="diff-html-container" v-html="diffHtml"></div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="compareDialogVisible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="handleCreateSingleIssueRecord">创建处理记录</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'
import { PORT_OP_OPTIONS, PORT_OP_ARITY } from '@/view/pages/policy_manage/utils/spec_format'

export default {
  name: 'PortGroupRule',

  data() {
    return {
      loading: false,
      searchText: '',
      filterType: '',
      currentPage: 1,
      pageSize: 20,

      tableData: [],
      portOpOptions: PORT_OP_OPTIONS,

      dialogVisible: false,
      dialogMode: 'create',
      ruleForm: {
        id: null,
        name: '',
        acl_type: 'ipv4',
        description: '',
        entries: [],
        fingerprint: '',
        is_active: 1
      },

      rules: {
        name: [{ required: true, message: '请输入端口组名称', trigger: 'blur' }],
        acl_type: [{ required: true, message: '请选择地址族', trigger: 'change' }]
      },

      manageDialogVisible: false,
      currentManageStandard: null,
      manageDeviceList: [],
      manageDeviceFilter: 'all',
      selectedDevices: [],

      compareDialogVisible: false,
      compareData: null,
      diffMode: 'context',
      diffHtml: '',
      diffLoading: false
    }
  },

  computed: {
    isViewMode() {
      return this.dialogMode === 'view'
    },

    dialogTitle() {
      const map = { create: '新建标准规则', edit: '编辑标准规则', view: '查看标准规则' }
      return map[this.dialogMode] || '标准规则'
    },

    filteredTableData() {
      let data = this.tableData

      if (this.searchText) {
        const keyword = this.searchText.toLowerCase()
        data = data.filter(item => (item.name || '').toLowerCase().includes(keyword))
      }

      if (this.filterType) {
        data = data.filter(item => item.acl_type === this.filterType)
      }

      const start = (this.currentPage - 1) * this.pageSize
      return data.slice(start, start + this.pageSize)
    },

    matchedDeviceCount() {
      return this.manageDeviceList.filter(item => item.match_status === 'matched').length
    },

    matchedOtherDeviceCount() {
      return this.manageDeviceList.filter(item => item.match_status === 'matched_other').length
    },

    driftedDeviceCount() {
      return this.manageDeviceList.filter(item => item.match_status === 'drifted').length
    }
  },

  mounted() {
    this.loadData()
  },

  methods: {
    // ==================== 工具方法 ====================

    // 条目在标准表里是裸数组，详情接口沿用同一形态
    entryList(row) {
      if (!row || !row.entries) return []
      return Array.isArray(row.entries) ? row.entries : (row.entries.entries || [])
    },

    // 端口值可能是 int（数字端口）或 string（服务名别名）
    portsText(ports) {
      if (!Array.isArray(ports) || ports.length === 0) return '-'
      return ports.map(p => (p === null || p === undefined ? '' : String(p))).join(', ')
    },

    matchStatusText(status) {
      const map = { matched: '已匹配', matched_other: '匹配其他标准', drifted: '配置漂移' }
      return map[status] || status
    },

    matchStatusTagType(status) {
      const map = { matched: 'success', matched_other: 'info', drifted: 'warning' }
      return map[status] || ''
    },

    getVendorTagType(vendor) {
      const typeMap = {
        'cisco_nx': 'primary',
        'cisco_ios': 'success',
        'cisco_xr': 'warning',
        'h3c': 'info',
        'huawei': 'danger'
      }
      return typeMap[vendor] || ''
    },

    formatTime(timestamp) {
      if (!timestamp) return '-'
      const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
      const date = new Date(Number(time))
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },

    copyFingerprint(fingerprint) {
      const input = document.createElement('input')
      input.value = fingerprint || ''
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('指纹已复制到剪贴板')
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },

    handleCurrentChange(val) {
      this.currentPage = val
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    // ==================== 数据加载 ====================

    loadData() {
      this.loading = true
      aclApi.getPortGroupList({ keyword: this.searchText || undefined }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.tableData = res.data || []
          this.tableData.forEach(item => this.loadStatistics(item))
        } else {
          this.$message.error(res.message || '加载标准规则列表失败')
        }
      }).catch(error => {
        console.error('加载标准规则列表失败:', error)
        this.$message.error('加载标准规则列表失败')
      }).finally(() => {
        this.loading = false
      })
    },

    loadStatistics(standard) {
      aclApi.getPortGroupStatistics({ standard_id: standard.id }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.$set(standard, 'statistics', res.data)
        }
      }).catch(error => {
        console.error('加载统计信息失败:', error)
      })
    },

    // ==================== 标准规则增删改查 ====================

    handleCreate() {
      this.dialogMode = 'create'
      this.ruleForm = {
        id: null,
        name: '',
        acl_type: this.filterType || 'ipv4',
        description: '',
        entries: [this.blankEntry()],
        fingerprint: '',
        is_active: 1
      }
      this.dialogVisible = true
    },

    handleView(row) {
      this.dialogMode = 'view'
      this.loadDetail(row)
    },

    handleEdit(row) {
      this.dialogMode = 'edit'
      this.loadDetail(row)
    },

    loadDetail(row) {
      aclApi.getPortGroupDetail({ id: row.id }).then(response => {
        const res = response.data
        const source = (res.code === 0 && res.data) ? res.data : row
        this.ruleForm = {
          id: source.id,
          name: source.name,
          acl_type: source.acl_type,
          description: source.description || '',
          entries: this.entryList(source).map(e => this.decorateEntry(e)),
          fingerprint: source.fingerprint,
          is_active: source.is_active
        }
        this.dialogVisible = true
      }).catch(error => {
        console.error('加载标准规则详情失败:', error)
        this.$message.error('加载标准规则详情失败')
      })
    },

    handleDelete(row) {
      const suffix = row.ref_count > 0
        ? `\n\n该端口组已被 ${row.ref_count} 条 ACL 规则引用，删除后这些引用将悬空。`
        : ''

      this.$confirm(`确定删除标准规则"${row.name}"吗？${suffix}`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: row.ref_count > 0 ? 'error' : 'warning'
      }).then(() => {
        aclApi.deletePortGroup({ id: row.id }).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.loadData()
          } else {
            this.$message.error(res.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    handleSubmit() {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return

        const entries = this.buildEntries()
        if (entries.length === 0) {
          this.$message.warning('请至少添加一条端口条目')
          return
        }
        const err = this.validateEntries(entries)
        if (err) {
          this.$message.warning(err)
          return
        }

        const payload = {
          id: this.ruleForm.id,
          name: this.ruleForm.name,
          acl_type: this.ruleForm.acl_type,
          description: this.ruleForm.description,
          is_active: this.ruleForm.is_active,
          entries: entries
        }

        const apiCall = this.dialogMode === 'create'
          ? aclApi.createPortGroup(payload)
          : aclApi.updatePortGroup(payload)

        apiCall.then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success(this.dialogMode === 'create' ? '创建成功' : '更新成功')
            this.dialogVisible = false
            this.loadData()
          } else {
            this.$message.error(res.message || '操作失败')
          }
        }).catch(error => {
          console.error('保存失败:', error)
          this.$message.error('保存失败')
        })
      })
    },

    // ==================== 端口条目编辑 ====================

    blankEntry() {
      return { op: 'eq', ports: [], portsText: '', description: '' }
    },

    // 记录结构 {seq,op,ports,description} -> 编辑结构 {op,ports,portsText,description}
    decorateEntry(entry) {
      const ports = Array.isArray(entry.ports) ? entry.ports : []
      return {
        op: entry.op || 'eq',
        ports: ports,
        portsText: ports.map(p => String(p)).join(', '),
        description: entry.description || ''
      }
    },

    handleAddEntry() {
      this.ruleForm.entries.push(this.blankEntry())
    },

    handleDeleteEntry(index) {
      this.ruleForm.entries.splice(index, 1)
    },

    // range 恒定两个值，切成单值时只保留第一个输入
    onOpChange(row) {
      if (row.op !== 'range') {
        const first = String(row.portsText || '').split(/[,\s]+/).filter(s => s !== '')[0]
        row.portsText = first || ''
      }
    },

    previewEntry(row) {
      const built = this.buildEntry(row, 10)
      const ports = (built.ports || []).map(p => String(p)).join(' ')
      return `${built.op} ${ports || '?'}`
    },

    // 编辑结构 -> 提交结构（记录结构），数字端口转 int、服务名别名保留字符串
    buildEntry(entry, seq) {
      const op = entry.op || 'eq'
      let ports = String(entry.portsText || '')
        .split(/[,\s]+/)
        .filter(s => s !== '')
        .map(s => (/^\d+$/.test(s) ? Number(s) : s))

      if (op === 'range') {
        ports = ports.slice(0, 2)
      }

      return {
        seq: seq,
        op: op,
        ports: ports,
        description: entry.description || null
      }
    },

    buildEntries() {
      return this.ruleForm.entries.map((e, i) => this.buildEntry(e, (i + 1) * 10))
    },

    validateEntries(entries) {
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]
        const no = i + 1
        const arity = PORT_OP_ARITY[e.op] || 1
        if (e.ports.length !== arity) {
          return e.op === 'range'
            ? `第 ${no} 条：range 需要填写起止两个端口`
            : `第 ${no} 条：${e.op} 需要且只能填一个端口`
        }
      }
      return ''
    },

    // ==================== 配置管理 ====================

    handleManageConfig(row) {
      aclApi.getPortGroupDetail({ id: row.id }).then(response => {
        const res = response.data
        this.currentManageStandard = (res.code === 0 && res.data) ? res.data : row
        this.manageDeviceFilter = 'all'
        this.selectedDevices = []
        this.loadDeviceStatistics(this.currentManageStandard)
        this.manageDialogVisible = true
      }).catch(error => {
        console.error('加载标准规则详情失败:', error)
        this.currentManageStandard = row
        this.manageDeviceFilter = 'all'
        this.selectedDevices = []
        this.loadDeviceStatistics(row)
        this.manageDialogVisible = true
      })
    },

    loadDeviceStatistics(standard) {
      aclApi.getPortGroupDeviceList({
        standard_id: standard.id,
        filter: this.manageDeviceFilter
      }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.manageDeviceList = res.data || []
        } else {
          this.$message.error(res.message || '加载设备列表失败')
        }
      }).catch(error => {
        console.error('加载设备列表失败:', error)
        this.$message.error('加载设备列表失败')
      })
    },

    handleDeviceSelectionChange(selection) {
      this.selectedDevices = selection
    },

    // 只有配置漂移的设备可以勾选，已匹配的没有可修复的问题
    checkDeviceSelectable(row) {
      return row.match_status === 'drifted'
    },

    handleCompareConfig(row) {
      const standardEntries = this.entryList(this.currentManageStandard)
      const deviceEntries = row.entries || []

      let diffSummary = ''
      if (standardEntries.length > deviceEntries.length) {
        diffSummary = `设备缺少 ${standardEntries.length - deviceEntries.length} 条配置`
      } else if (standardEntries.length < deviceEntries.length) {
        diffSummary = `设备多出 ${deviceEntries.length - standardEntries.length} 条配置`
      } else {
        diffSummary = '条目数量相同，但内容存在差异'
      }

      this.compareData = {
        device_ip: row.device_ip,
        device_name: row.device_name,
        device_vendor: row.vendor,
        device_fingerprint: row.fingerprint,
        device_entries: deviceEntries,
        diff_summary: diffSummary
      }

      this.diffMode = 'context'
      this.compareDialogVisible = true
      this.loadDiffComparison()
    },

    loadDiffComparison() {
      if (!this.compareData) return

      this.diffLoading = true
      aclApi.comparePortGroupTextDiff({
        standard_id: this.currentManageStandard.id,
        device_ip: this.compareData.device_ip,
        full_diff: this.diffMode === 'full'
      }).then(response => {
        const res = response.data
        if (res.code === 0 && res.data) {
          this.diffHtml = res.data.diff_html || res.data.html || ''
        } else {
          this.$message.error(res.message || '对比失败')
          this.diffHtml = '<p style="color:#f56c6c;">对比失败</p>'
        }
      }).catch(error => {
        console.error('对比失败:', error)
        this.$message.error('对比失败')
        this.diffHtml = '<p style="color:#f56c6c;">对比失败</p>'
      }).finally(() => {
        this.diffLoading = false
      })
    },

    handleCreateIssueRecords() {
      const deviceList = this.selectedDevices.map(d => `${d.device_name}(${d.device_ip})`).join('、')

      this.$prompt(`确定为以下 ${this.selectedDevices.length} 台设备创建处理记录吗？\n\n${deviceList}`, '创建处理记录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入备注（可选）',
        inputType: 'textarea'
      }).then(({ value }) => {
        const devices = this.selectedDevices.map(device => ({
          device_ip: device.device_ip,
          device_name: device.device_name,
          vendor: device.vendor,
          device_fingerprint: device.fingerprint,
          device_entries: device.entries || []
        }))

        aclApi.batchCreatePortGroupIssueRecords({
          standard_id: this.currentManageStandard.id,
          devices: devices,
          remark: value || ''
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            const created = (res.data && res.data.created) || 0
            const failed = (res.data && res.data.failed) || []
            if (failed.length > 0) {
              const details = failed.map(f => `${f.device_ip}: ${f.message || f.reason}`).join('\n')
              this.$alert(`成功 ${created} 条，失败 ${failed.length} 条\n\n失败详情：\n${details}`, '创建结果', {
                confirmButtonText: '确定',
                type: failed.length === devices.length ? 'error' : 'warning'
              })
            } else {
              this.$message.success(`处理记录创建完成：成功 ${created} 条`)
            }

            this.selectedDevices = []
            if (this.$refs.deviceListTable) {
              this.$refs.deviceListTable.clearSelection()
            }
          } else {
            this.$message.error(res.message || '创建处理记录失败')
          }
        }).catch(error => {
          console.error('创建处理记录失败:', error)
          this.$message.error('创建处理记录失败')
        })
      }).catch(() => {})
    },

    handleCreateSingleIssueRecord() {
      this.$prompt(`确定为设备 ${this.compareData.device_name}(${this.compareData.device_ip}) 创建处理记录吗？`, '创建处理记录', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入备注（可选）',
        inputType: 'textarea'
      }).then(({ value }) => {
        const devices = [{
          device_ip: this.compareData.device_ip,
          device_name: this.compareData.device_name,
          vendor: this.compareData.device_vendor,
          device_fingerprint: this.compareData.device_fingerprint,
          device_entries: this.compareData.device_entries || []
        }]

        aclApi.batchCreatePortGroupIssueRecords({
          standard_id: this.currentManageStandard.id,
          devices: devices,
          remark: value || ''
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            const failed = (res.data && res.data.failed) || []
            if (failed.length > 0) {
              this.$message.error(`创建失败: ${failed[0].message || failed[0].reason}`)
            } else {
              this.$message.success('处理记录创建成功')
              this.compareDialogVisible = false
            }
          } else {
            this.$message.error(res.message || '创建处理记录失败')
          }
        }).catch(error => {
          console.error('创建处理记录失败:', error)
          this.$message.error('创建处理记录失败')
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.port-group-standards-page {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 100px);
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.fingerprint-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}

.mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.device-ip {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #409EFF;
}

.statistics-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 13px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.stat-matched {
  color: #67C23A;
}

.stat-drifted {
  color: #E6A23C;
}

.toolbar-header {
  padding: 12px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 10px;
  overflow: hidden;
}

.diff-html-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
}

.diff-html-container >>> table.diff {
  width: 100% !important;
  font-size: 13px;
}
</style>
