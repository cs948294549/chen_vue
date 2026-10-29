<template>
  <div class="prefix-list-standards-page">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" icon="el-icon-plus" @click="handleCreate">新建标准规则</el-button>
      <el-input
        v-model="searchText"
        placeholder="搜索规则名称"
        prefix-icon="el-icon-search"
        style="width: 300px; margin-left: 10px;"
        clearable>
      </el-input>
    </div>

    <!-- 标准规则列表 -->
    <el-table
      :data="filteredTableData"
      border
      stripe
      style="width: 100%"
      :default-sort="{prop: 'created_at', order: 'descending'}">

      <el-table-column prop="name" label="规则名称" width="180" fixed>
        <template slot-scope="scope">
          <el-tag>{{ scope.row.name }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="fingerprint" label="配置指纹" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="fingerprint-text">{{ scope.row.fingerprint.substring(0, 16) }}...</span>
        </template>
      </el-table-column>

      <el-table-column prop="entry_count" label="条目数量" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="info" size="small">
            {{ scope.row.entries.entries ? scope.row.entries.entries.length : 0 }} 条
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="应用统计" width="340" align="center">
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
              <span class="stat-item">
                {{ scope.row.statistics.rate }}%
              </span>
            </el-tooltip>
          </div>
          <span v-else style="color: #909399;">暂无数据</span>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />

      <el-table-column prop="is_active" label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.is_active === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.is_active === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="创建时间" width="160" sortable>
        <template slot-scope="scope">
          {{ formatTime(scope.row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" fixed="right">
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
          <el-button size="small" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" style="color: #f56c6c;">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-if="tableData.length > 0"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="tableData.length"
      style="margin-top: 20px; text-align: right;">
    </el-pagination>

    <!-- 配置详情对话框 -->
    <el-dialog
      :title="dialogMode === 'create' ? '新建标准规则' : dialogMode === 'edit' ? '编辑标准规则' : '查看标准规则'"
      :visible.sync="dialogVisible"
      width="900px"
      :close-on-click-modal="false">

      <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="120px">
        <el-form-item label="规则名称" prop="name">
          <el-input
            v-model="ruleForm.name"
            placeholder="例如：pl_global"
            :disabled="dialogMode === 'view'">
          </el-input>
        </el-form-item>

        <el-form-item label="规则说明" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则说明"
            :disabled="dialogMode === 'view'">
          </el-input>
        </el-form-item>

        <el-form-item label="状态" prop="is_active">
          <el-radio-group v-model="ruleForm.is_active" :disabled="dialogMode === 'view'">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            禁用状态下，不允许创建处理记录
          </div>
        </el-form-item>

        <el-form-item label="配置条目">
          <div class="entries-editor">
            <el-button
              v-if="dialogMode !== 'view'"
              size="small"
              type="primary"
              icon="el-icon-plus"
              @click="handleAddEntry"
              style="margin-bottom: 10px;">
              添加条目
            </el-button>

            <el-table
              :data="ruleForm.entries"
              border
              size="small"
              max-height="400">

              <el-table-column prop="seq" label="序号" width="80">
                <template slot-scope="scope">
                  <el-input-number
                    v-if="dialogMode !== 'view'"
                    v-model="scope.row.seq"
                    :min="1"
                    :max="99999"
                    :step="5"
                    size="mini"
                    controls-position="right">
                  </el-input-number>
                  <span v-else>{{ scope.row.seq }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="action" label="动作" width="100">
                <template slot-scope="scope">
                  <el-select
                    v-if="dialogMode !== 'view'"
                    v-model="scope.row.action"
                    size="mini"
                    style="width: 100%;">
                    <el-option label="permit" value="permit"></el-option>
                    <el-option label="deny" value="deny"></el-option>
                  </el-select>
                  <el-tag v-else :type="scope.row.action === 'permit' ? 'success' : 'danger'" size="mini">
                    {{ scope.row.action }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="prefix" label="前缀" min-width="180">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogMode !== 'view'"
                    v-model="scope.row.prefix"
                    size="mini"
                    placeholder="例如：10.0.0.0/8">
                  </el-input>
                  <span v-else>{{ scope.row.prefix }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="ge" label="GE" width="80">
                <template slot-scope="scope">
                  <el-input-number
                    v-if="dialogMode !== 'view'"
                    v-model="scope.row.ge"
                    :min="0"
                    :max="32"
                    size="mini"
                    controls-position="right">
                  </el-input-number>
                  <span v-else>{{ scope.row.ge || '-' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="le" label="LE" width="80">
                <template slot-scope="scope">
                  <el-input-number
                    v-if="dialogMode !== 'view'"
                    v-model="scope.row.le"
                    :min="0"
                    :max="32"
                    size="mini"
                    controls-position="right">
                  </el-input-number>
                  <span v-else>{{ scope.row.le || '-' }}</span>
                </template>
              </el-table-column>

              <el-table-column v-if="dialogMode !== 'view'" label="操作" width="80" align="center">
                <template slot-scope="scope">
                  <el-button
                    size="mini"
                    type="text"
                    icon="el-icon-delete"
                    @click="handleDeleteEntry(scope.$index)"
                    style="color: #f56c6c;">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-form-item v-if="dialogMode === 'view'" label="配置指纹">
          <el-input v-model="ruleForm.fingerprint" readonly>
            <el-button slot="append" icon="el-icon-document-copy" @click="copyFingerprint">复制</el-button>
          </el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" v-if="dialogMode !== 'view'" type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </el-dialog>

    <!-- 配置管理对话框 -->
    <el-dialog
      title="配置管理"
      :visible.sync="manageDialogVisible"
      width="1200px"
      top="5vh"
      :close-on-click-modal="false">

      <div v-if="currentManageStandard" class="manage-container">
        <!-- 标准规则信息 -->
        <el-descriptions :column="4" border size="small" style="margin-bottom: 20px;">
          <el-descriptions-item label="规则名称">
            <el-tag type="primary">{{ currentManageStandard.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准指纹">
            <span class="fingerprint-text">{{ currentManageStandard.fingerprint.substring(0, 20) }}...</span>
          </el-descriptions-item>
          <el-descriptions-item label="条目数量">
            <el-tag type="info" size="small">{{ currentManageStandard.entries.entries.length }} 条</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentManageStandard.is_active ? 'success' : 'info'" size="small">
              {{ currentManageStandard.is_active ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 设备列表 -->
        <div class="toolbar-header">
          <span style="font-weight: bold;">设备配置列表</span>
          <div style="float: right;">
            <el-radio-group v-model="manageDeviceFilter" size="mini" style="margin-right: 10px;">
              <el-radio-button label="all">
                全部 ({{ manageDeviceList.length }})
              </el-radio-button>
              <el-radio-button label="matched">
                已匹配 ({{ matchedDeviceCount }})
              </el-radio-button>
              <el-radio-button label="matched_other">
                匹配其他标准 ({{ matchedOtherDeviceCount }})
              </el-radio-button>
              <el-radio-button label="drifted">
                配置漂移 ({{ driftedDeviceCount }})
              </el-radio-button>
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
          :data="filteredManageDeviceList"
          border
          stripe
          @selection-change="handleDeviceSelectionChange"
          max-height="450"
          style="margin-top: 10px;">

          <el-table-column
            type="selection"
            width="55"
            :selectable="checkDeviceSelectable">
          </el-table-column>

          <el-table-column prop="device_ip" label="设备IP" width="140" fixed>
            <template slot-scope="scope">
              <span class="device-ip">{{ scope.row.device_ip }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />

          <el-table-column prop="vendor" label="厂商类型" width="110">
            <template slot-scope="scope">
              <el-tag :type="getVendorTagType(scope.row.vendor)" size="mini">
                {{ scope.row.vendor }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="match_status" label="匹配状态" width="130" align="center">
            <template slot-scope="scope">
              <el-tag
                :type="scope.row.match_status === 'matched' ? 'success' : scope.row.match_status === 'matched_other' ? 'info' : 'warning'"
                size="small">
                {{ scope.row.match_status === 'matched' ? '已匹配' : scope.row.match_status === 'matched_other' ? '匹配其他标准' : '配置漂移' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="fingerprint" label="设备指纹" width="160" show-overflow-tooltip>
            <template slot-scope="scope">
              <span class="fingerprint-text">{{ scope.row.fingerprint.substring(0, 16) }}...</span>
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

          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.match_status === 'drifted'"
                size="small"
                type="text"
                icon="el-icon-s-operation"
                @click="handleCompareConfig(scope.row)">
                对比差异
              </el-button>
              <span v-else style="color: #67C23A;">
                <i class="el-icon-success"></i> 已匹配
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="manageDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 配置对比对话框 -->
    <el-dialog
      title="配置差异对比"
      :visible.sync="compareDialogVisible"
      width="90%"
      top="5vh"
      append-to-body>

      <div v-if="compareData" class="compare-container">
        <!-- 设备信息 -->
        <el-descriptions :column="3" border size="small" style="margin-bottom: 15px;">
          <el-descriptions-item label="设备IP">{{ compareData.device_ip }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ compareData.device_name }}</el-descriptions-item>
          <el-descriptions-item label="差异摘要">
            <el-tag type="warning" size="small">{{ compareData.diff_summary }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 对比模式切换 -->
        <div style="margin-bottom: 10px;">
          <el-radio-group v-model="diffMode" size="small" @change="loadDiffComparison">
            <el-radio-button label="context">上下文对比</el-radio-button>
            <el-radio-button label="full">完整对比</el-radio-button>
          </el-radio-group>
        </div>

        <!-- HTML差异展示 -->
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
import prefixListApi from '@/api/mapis/prefix_list_interface'

export default {
  name: 'PrefixListStandards',

  data() {
    return {
      searchText: '',
      currentPage: 1,
      pageSize: 20,

      // 表格数据
      tableData: [],

      // 对话框
      dialogVisible: false,
      dialogMode: 'create', // 'create' | 'edit' | 'view'
      ruleForm: {
        id: null,
        name: '',
        description: '',
        entries: [],
        fingerprint: '',
        is_active: 1
      },

      // 表单验证规则
      rules: {
        name: [
          { required: true, message: '请输入规则名称', trigger: 'blur' },
          { min: 2, max: 64, message: '长度在 2 到 64 个字符', trigger: 'blur' }
        ]
      },

      // 配置管理对话框
      manageDialogVisible: false,
      currentManageStandard: null,
      manageDeviceList: [],
      manageDeviceFilter: 'all',
      selectedDevices: [],

      // 配置对比对话框
      compareDialogVisible: false,
      compareData: null,
      diffMode: 'context', // 'context' | 'full'
      diffHtml: '',
      diffLoading: false
    }
  },

  computed: {
    filteredTableData() {
      let data = this.tableData

      if (this.searchText) {
        data = data.filter(item =>
          item.name.toLowerCase().includes(this.searchText.toLowerCase())
        )
      }

      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return data.slice(start, end)
    },

    filteredManageDeviceList() {
      let list = this.manageDeviceList

      if (this.manageDeviceFilter === 'matched') {
        list = list.filter(item => item.match_status === 'matched')
      } else if (this.manageDeviceFilter === 'matched_other') {
        list = list.filter(item => item.match_status === 'matched_other')
      } else if (this.manageDeviceFilter === 'drifted') {
        list = list.filter(item => item.match_status === 'drifted')
      }

      return list
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

    formatTime(timestamp) {
      if (!timestamp) return '-'
      // 10位时间戳转换为毫秒
      const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
      const date = new Date(time)

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    // ==================== 数据加载 ====================

    loadData() {
      // 调用后端API加载数据
      prefixListApi.getStandardsList({}).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.tableData = res.data || []
          // 加载每个标准规则的统计信息
          this.tableData.forEach(item => {
            this.loadStatistics(item)
          })
        } else {
          this.$message.error('加载标准规则列表失败')
        }
      }).catch(error => {
        console.error('加载标准规则列表失败:', error)
        this.$message.error('加载标准规则列表失败')
      })
    },

    loadStatistics(standard) {
      // 加载标准规则的设备应用统计
      prefixListApi.getStandardStatistics({ id: standard.id }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.$set(standard, 'statistics', res.data)
        }
      }).catch(error => {
        console.error('加载统计信息失败:', error)
      })
    },

    // ==================== CRUD操作 ====================

    handleCreate() {
      this.dialogMode = 'create'
      this.ruleForm = {
        id: null,
        name: '',
        description: '',
        entries: [],
        fingerprint: '',
        is_active: 1
      }
      this.dialogVisible = true
    },

    handleView(row) {
      this.dialogMode = 'view'
      const copied = JSON.parse(JSON.stringify(row))
      // 确保 entries 是数组格式
      if (copied.entries && copied.entries.entries) {
        copied.entries = copied.entries.entries
      }
      // 按 seq 升序展示，与提交顺序保持一致
      if (Array.isArray(copied.entries)) {
        copied.entries.sort((a, b) => Number(a.seq) - Number(b.seq))
      }
      this.ruleForm = copied
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.dialogMode = 'edit'
      const copied = JSON.parse(JSON.stringify(row))
      // 确保 entries 是数组格式
      if (copied.entries && copied.entries.entries) {
        copied.entries = copied.entries.entries
      }
      // 按 seq 升序展示，与提交顺序保持一致
      if (Array.isArray(copied.entries)) {
        copied.entries.sort((a, b) => Number(a.seq) - Number(b.seq))
      }
      this.ruleForm = copied
      this.dialogVisible = true
    },

    handleDelete(row) {
      this.$confirm(`确定删除规则"${row.name}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 调用删除API
        prefixListApi.deleteStandard({ id: row.id }).then(response => {
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

    handleManageConfig(row) {
      // 打开配置管理对话框
      const copied = JSON.parse(JSON.stringify(row))
      // 确保 entries 格式正确
      if (copied.entries && !copied.entries.entries) {
        // 如果entries是数组，包装成 {entries: [...]} 格式
        if (Array.isArray(copied.entries)) {
          copied.entries = { entries: copied.entries }
        }
      }
      this.currentManageStandard = copied
      this.loadDeviceStatistics(copied)
      this.manageDialogVisible = true
    },

    // ==================== 配置管理操作 ====================

    loadDeviceStatistics(standard) {
      // 调用后端API获取设备列表
      prefixListApi.getStandardDeviceList({
        id: standard.id,
        filter: this.manageDeviceFilter
      }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.manageDeviceList = res.data || []
        } else {
          this.$message.error('加载设备列表失败')
        }
      }).catch(error => {
        console.error('加载设备列表失败:', error)
        this.$message.error('加载设备列表失败')
      })
    },

    handleRefreshStatistics() {
      if (this.currentManageStandard) {
        this.loadDeviceStatistics(this.currentManageStandard)
        this.$message.success('数据已刷新')
      }
    },

    handleDeviceSelectionChange(selection) {
      this.selectedDevices = selection
    },

    checkDeviceSelectable(row) {
      // 只有配置漂移的设备才能勾选
      return row.match_status === 'drifted'
    },

    handleCompareConfig(row) {
      const standardEntries = this.currentManageStandard.entries.entries
      const deviceEntries = row.entries

      // 简单的差异统计
      const standardCount = standardEntries.length
      const deviceCount = deviceEntries.length
      let diffSummary = ''

      if (standardCount > deviceCount) {
        diffSummary = `设备缺少 ${standardCount - deviceCount} 条配置`
      } else if (standardCount < deviceCount) {
        diffSummary = `设备多出 ${deviceCount - standardCount} 条配置`
      } else {
        diffSummary = '配置条目数量相同，但内容存在差异'
      }

      this.compareData = {
        device_name: row.device_name,
        device_ip: row.device_ip,
        device_vendor: row.vendor,
        device_fingerprint: row.fingerprint,
        standard_entries: standardEntries,
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
      prefixListApi.compareTextDiff({
        src_entries: this.compareData.device_entries,
        target_entries: this.compareData.standard_entries,
        full_diff: this.diffMode === 'full'
      }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.diffHtml = res.data.html
        } else {
          this.$message.error(res.message || '对比失败')
          this.diffHtml = '<p style="color: red;">对比失败</p>'
        }
      }).catch(error => {
        console.error('对比失败:', error)
        this.$message.error('对比失败')
        this.diffHtml = '<p style="color: red;">对比失败</p>'
      }).finally(() => {
        this.diffLoading = false
      })
    },

    handleCreateIssueRecords() {
      const deviceList = this.selectedDevices.map(d => `${d.device_name}(${d.device_ip})`).join('、')

      this.$prompt(`确定为以下 ${this.selectedDevices.length} 台设备创建处理记录吗？\n\n${deviceList}\n\n可选填备注信息：`, '创建处理记录', {
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

        prefixListApi.batchCreateIssueRecords({
          standard_id: this.currentManageStandard.id,
          devices: devices,
          remark: value || ''
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            const successCount = res.data.success.length
            const failedCount = res.data.failed.length

            if (failedCount > 0) {
              // 显示失败详情
              const failedDetails = res.data.failed.map(f => `${f.device_ip}: ${f.reason}`).join('\n')
              this.$alert(`成功 ${successCount} 条，失败 ${failedCount} 条\n\n失败详情：\n${failedDetails}`, '创建结果', {
                confirmButtonText: '确定',
                type: failedCount === devices.length ? 'error' : 'warning'
              })
            } else {
              this.$message.success(`处理记录创建完成：成功 ${successCount} 条`)
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
      this.$prompt(`确定为设备 ${this.compareData.device_name}(${this.compareData.device_ip}) 创建处理记录吗？\n\n可选填备注信息：`, '创建处理记录', {
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

        prefixListApi.batchCreateIssueRecords({
          standard_id: this.currentManageStandard.id,
          devices: devices,
          remark: value || ''
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            if (res.data.failed.length > 0) {
              this.$message.error(`创建失败: ${res.data.failed[0].reason}`)
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
    },

    handleSubmit() {
      this.$refs.ruleForm.validate(valid => {
        if (valid) {
          if (this.ruleForm.entries.length === 0) {
            this.$message.warning('请至少添加一条配置条目')
            return
          }

          // 按 seq 升序排列，保证提交顺序与设备配置顺序一致，否则指纹会对不上
          this.ruleForm.entries.sort((a, b) => Number(a.seq) - Number(b.seq))

          // 调用后端API保存
          const apiCall = this.dialogMode === 'create'
            ? prefixListApi.createStandard(this.ruleForm)
            : prefixListApi.updateStandard(this.ruleForm)

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
        }
      })
    },

    // ==================== 配置条目操作 ====================

    handleAddEntry() {
      this.ruleForm.entries.push({
        seq: this.ruleForm.entries.length > 0
          ? Math.max(...this.ruleForm.entries.map(e => e.seq)) + 10
          : 10,
        action: 'permit',
        prefix: '',
        ge: null,
        le: null
      })
    },

    handleDeleteEntry(index) {
      this.ruleForm.entries.splice(index, 1)
    },

    // ==================== 工具方法 ====================

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

    copyFingerprint() {
      const input = document.createElement('input')
      input.value = this.ruleForm.fingerprint
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
    }
  }
}
</script>

<style scoped>
.prefix-list-standards-page {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 100px);
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.fingerprint-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}

.entries-editor {
  width: 100%;
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

/* 配置管理对话框样式 */
.manage-container {
  max-height: 70vh;
  overflow-y: auto;
}

.toolbar-header {
  padding: 12px 0;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 10px;
}

/* 配置对比样式 */
.compare-container {
  max-height: 60vh;
  overflow-y: auto;
}

.config-panel {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  padding: 12px 15px;
  font-weight: bold;
  color: #fff;
}

.standard-header {
  background: #409EFF;
}

.device-header {
  background: #E6A23C;
}

.panel-content {
  padding: 0;
}

/* 文本对比HTML容器样式 */
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
