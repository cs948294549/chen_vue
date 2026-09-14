<template>
  <div class="prefix-list-issues-page">
    <div class="page-header">
      <h2>地址前缀列表 - 处理记录</h2>
      <p class="page-description">配置漂移问题的处理记录与工单管理</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="标准规则">
          <el-select
            v-model="filterForm.standard_id"
            placeholder="请选择"
            clearable
            style="width: 200px;">
            <el-option
              v-for="item in standardOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="设备">
          <el-input
            v-model="filterForm.device"
            placeholder="IP或设备名"
            clearable
            style="width: 180px;">
          </el-input>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;">
          </el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 处理记录列表 -->
    <el-card shadow="never" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span style="font-weight: bold;">处理记录列表</span>
        <div style="float: right;">
          <el-button
            type="success"
            size="mini"
            icon="el-icon-plus"
            @click="handleCreateRecord">
            新建处理记录
          </el-button>
          <el-button
            v-if="selectedRecords.length > 0"
            type="primary"
            size="mini"
            icon="el-icon-document-add"
            @click="handleBatchCreateTickets">
            批量创建工单 ({{ selectedRecords.length }})
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        style="width: 100%">

        <el-table-column
          type="selection"
          width="55"
          :selectable="checkSelectable">
        </el-table-column>

        <el-table-column prop="id" label="记录ID" width="80" align="center" />

        <el-table-column prop="standard_name" label="标准规则" width="150">
          <template slot-scope="scope">
            <el-tag type="primary" size="small">{{ scope.row.standard_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="device_ip" label="设备IP" width="140">
          <template slot-scope="scope">
            <span class="device-ip">{{ scope.row.device_ip }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />

        <el-table-column prop="device_vendor" label="设备厂商" width="120" align="center">
          <template slot-scope="scope">
            <el-tag size="small" effect="plain">{{ scope.row.device_vendor }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="issue_type" label="问题类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.issue_type === 'drifted' ? 'warning' : 'danger'" size="small">
              {{ scope.row.issue_type === 'drifted' ? '配置漂移' : '缺失配置' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="处理状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="change_ticket_id" label="工单ID" width="140">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.change_ticket_id"
              type="primary"
              :underline="false"
              @click="handleViewTicket(scope.row.change_ticket_id)">
              {{ scope.row.change_ticket_id }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_by" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template slot-scope="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="processed_at" label="处理时间" width="160">
          <template slot-scope="scope">
            {{ formatTime(scope.row.processed_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              icon="el-icon-view"
              @click="handleViewDetail(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="text"
              size="small"
              icon="el-icon-document-add"
              @click="handleCreateTicket(scope.row)">
              创建工单
            </el-button>
            <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              style="color: #f56c6c;">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="totalCount > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        style="margin-top: 20px; text-align: right;">
      </el-pagination>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      title="处理记录详情"
      :visible.sync="detailDialogVisible"
      width="1200px"
      append-to-body>

      <div v-if="currentDetail" class="detail-container">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="记录ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="标准规则">
            <el-tag type="primary">{{ currentDetail.standard_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备IP">
            <span class="device-ip">{{ currentDetail.device_ip }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentDetail.device_name }}</el-descriptions-item>
          <el-descriptions-item label="设备厂商">
            <el-tag size="small" effect="plain">{{ currentDetail.device_vendor }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag :type="currentDetail.issue_type === 'drifted' ? 'warning' : 'danger'">
              {{ currentDetail.issue_type === 'drifted' ? '配置漂移' : '缺失配置' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTagType(currentDetail.status)">
              {{ getStatusText(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工单ID">
            <el-link
              v-if="currentDetail.change_ticket_id"
              type="primary"
              :underline="false"
              @click="handleViewTicket(currentDetail.change_ticket_id)">
              {{ currentDetail.change_ticket_id }}
            </el-link>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.created_by }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(currentDetail.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ formatTime(currentDetail.processed_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentDetail.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 配置对比 -->
        <el-divider content-position="left">配置对比</el-divider>

        <!-- 对比模式切换 -->
        <div style="margin-bottom: 10px;">
          <el-radio-group v-model="diffMode" size="small" @change="loadDetailDiffComparison">
            <el-radio-button label="context">上下文对比</el-radio-button>
            <el-radio-button label="full">完整对比</el-radio-button>
          </el-radio-group>
        </div>

        <!-- HTML差异展示 -->
        <div v-loading="diffLoading" class="diff-html-container" v-html="diffHtml"></div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          size="small"
          v-if="currentDetail && currentDetail.status === 'pending'"
          type="primary"
          @click="handleCreateTicketFromDetail">
          创建工单
        </el-button>
      </span>
    </el-dialog>

    <!-- 新建处理记录对话框 -->
    <el-dialog
      title="新建处理记录"
      :visible.sync="createRecordDialogVisible"
      width="600px"
      append-to-body>

      <el-form
        ref="createRecordForm"
        :model="createRecordForm"
        :rules="createRecordRules"
        label-width="100px">

        <el-form-item label="设备" prop="device_ip">
          <el-select
            v-model="createRecordForm.device_ip"
            filterable
            placeholder="请选择设备"
            style="width: 100%;"
            clearable
            :loading="deviceLoading">
            <el-option
              v-for="item in deviceOptions"
              :key="item.ip"
              :label="`${item.sysname} (${item.ip})`"
              :value="item.ip">
              <span style="float: left">{{ item.sysname }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.ip }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="标准规则" prop="standard_id">
          <el-select
            v-model="createRecordForm.standard_id"
            placeholder="请选择标准规则"
            style="width: 100%;"
            clearable>
            <el-option
              v-for="item in standardOptions"
              :key="item.id"
              :label="`${item.name} - ${item.description || '无描述'}`"
              :value="item.id">
              <span style="float: left">{{ item.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.description || '无描述' }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="createRecordForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）">
          </el-input>
        </el-form-item>

        <el-alert
          title="说明"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 15px;">
          <div slot="default">
            <p style="margin: 0;">此功能用于手动创建设备缺失配置的处理记录（issue_type=missing）</p>
            <p style="margin: 5px 0 0 0;">系统将根据设备IP查询设备信息并创建待处理记录</p>
          </div>
        </el-alert>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="createRecordDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSubmitCreateRecord">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import prefixListApi from '@/api/mapis/prefix_list_interface'
import collectorApi from '@/api/mapis/collector_interface'

export default {
  name: 'PrefixListIssues',

  data() {
    return {
      // 筛选条件
      filterForm: {
        standard_id: null,
        device: '',
        status: '',
        dateRange: null
      },

      // 标准规则选项
      standardOptions: [],

      // 统计数据
      statistics: {
        pending: 0,
        processing: 0,
        completed: 0,
        ignored: 0
      },

      // 表格数据
      tableData: [],
      selectedRecords: [],
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,

      // 详情对话框
      detailDialogVisible: false,
      currentDetail: null,
      diffMode: 'context', // 'context' | 'full'
      diffHtml: '',
      diffLoading: false,

      // 新建处理记录对话框
      createRecordDialogVisible: false,
      createRecordForm: {
        device_ip: '',
        standard_id: null,
        remark: ''
      },
      createRecordRules: {
        device_ip: [
          { required: true, message: '请选择设备', trigger: 'change' }
        ],
        standard_id: [
          { required: true, message: '请选择标准规则', trigger: 'change' }
        ]
      },

      // 设备列表
      deviceOptions: [],
      deviceLoading: false
    }
  },

  mounted() {
    this.loadStandardOptions()
    this.loadData()
    this.loadStatistics()
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

    loadStandardOptions() {
      // 调用API加载标准规则选项
      prefixListApi.getStandardsList({ is_active: 1 }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.standardOptions = (res.data || []).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description
          }))
        }
      }).catch(error => {
        console.error('加载标准规则选项失败:', error)
      })
    },

    loadData() {
      // 调用API加载处理记录
      const params = {
        standard_id: this.filterForm.standard_id,
        device: this.filterForm.device,
        status: this.filterForm.status
      }

      // 处理日期范围
      if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
        params.start_date = this.filterForm.dateRange[0]
        params.end_date = this.filterForm.dateRange[1]
      }

      prefixListApi.getIssueRecordsList(params).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.tableData = res.data || []
          this.totalCount = this.tableData.length
        } else {
          this.$message.error('加载处理记录失败')
        }
      }).catch(error => {
        console.error('加载处理记录失败:', error)
        this.$message.error('加载处理记录失败')
      })
    },

    loadStatistics() {
      // 调用API加载统计数据
      prefixListApi.getIssueStatistics({}).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.statistics = res.data || {
            pending: 0,
            processing: 0,
            completed: 0,
            ignored: 0
          }
        }
      }).catch(error => {
        console.error('加载统计数据失败:', error)
      })
    },

    // ==================== 操作方法 ====================

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filterForm = {
        standard_id: null,
        device: '',
        status: '',
        dateRange: null
      }
      this.loadData()
    },

    handleSelectionChange(selection) {
      this.selectedRecords = selection
    },

    checkSelectable(row) {
      // 只有待处理的记录可以勾选
      return row.status === 'pending'
    },

    handleViewDetail(row) {
      this.currentDetail = row
      this.diffMode = 'context'
      this.detailDialogVisible = true
      this.loadDetailDiffComparison()
    },

    loadDetailDiffComparison() {
      if (!this.currentDetail) return

      this.diffLoading = true
      prefixListApi.compareTextDiff({
        src_entries: this.currentDetail.device_entries || [],
        target_entries: this.currentDetail.standard_entries || [],
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

    handleCreateTicket(row) {
      this.$prompt('请输入工单ID', '创建工单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        // TODO: 调用API创建工单
        this.$message.success('工单创建成功')
        row.change_ticket_id = value
        row.status = 'processing'
        this.loadData()
        this.loadStatistics()
      }).catch(() => {})
    },

    handleCreateTicketFromDetail() {
      this.handleCreateTicket(this.currentDetail)
      this.detailDialogVisible = false
    },

    handleBatchCreateTickets() {
      this.$message.success(`为 ${this.selectedRecords.length} 条记录创建工单`)
      this.loadData()
      this.loadStatistics()
    },

    handleDelete(row) {
      this.$confirm(`确定删除设备 ${row.device_name}(${row.device_ip}) 的处理记录吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        prefixListApi.deleteIssueRecord({ id: row.id }).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.loadData()
            this.loadStatistics()
          } else {
            this.$message.error(res.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    handleStatusChange(command) {
      const { row, status } = command
      // TODO: 调用API更新状态
      this.$message.success('状态已更新')
      row.status = status
      if (status === 'completed' || status === 'ignored') {
        row.processed_at = new Date().toLocaleString()
      }
      this.loadStatistics()
    },

    handleViewTicket(ticketId) {
      this.$message.info(`查看工单: ${ticketId}`)
    },

    handleCreateRecord() {
      this.createRecordDialogVisible = true
      this.createRecordForm = {
        device_ip: '',
        standard_id: null,
        remark: ''
      }
      // 加载设备列表
      this.loadDeviceList()
      // 重置表单验证
      this.$nextTick(() => {
        if (this.$refs.createRecordForm) {
          this.$refs.createRecordForm.clearValidate()
        }
      })
    },

    loadDeviceList() {
      this.deviceLoading = true
      // 调用接口获取设备列表
      collectorApi.getDevs({}, {})
        .then(res => {
          if (res.data && res.data.code === 0) {
            this.deviceOptions = res.data.data || []
          } else {
            this.$message.error('加载设备列表失败')
            this.deviceOptions = []
          }
        })
        .catch(err => {
          console.error('加载设备列表错误:', err)
          this.$message.error('加载设备列表失败')
          this.deviceOptions = []
        })
        .finally(() => {
          this.deviceLoading = false
        })
    },

    handleSubmitCreateRecord() {
      this.$refs.createRecordForm.validate((valid) => {
        if (valid) {
          // TODO: 调用API创建处理记录
          // 1. 先根据device_ip查询设备信息（device_name, device_vendor）
          // 2. 根据standard_id获取标准规则信息
          // 3. 创建 issue_type='missing', device_entries=[] 的记录
          this.$message.success('处理记录创建成功')
          this.createRecordDialogVisible = false
          this.loadData()
          this.loadStatistics()
        }
      })
    },

    // ==================== 工具方法 ====================

    getStatusTagType(status) {
      const typeMap = {
        'pending': 'warning',
        'processing': 'primary',
        'completed': 'success',
        'ignored': 'info'
      }
      return typeMap[status] || ''
    },

    getStatusText(status) {
      const textMap = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'ignored': '已忽略'
      }
      return textMap[status] || status
    },

    formatGeLeDisplay(ge, le) {
      if (ge && le) {
        return `${ge}/${le}`
      } else if (ge) {
        return `ge ${ge}`
      } else if (le) {
        return `le ${le}`
      }
      return '-'
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadData()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.loadData()
    }
  }
}
</script>

<style scoped>
.prefix-list-issues-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 100px);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.statistics-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 15px;
}

.stat-pending {
  background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
}

.stat-processing {
  background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%);
}

.stat-completed {
  background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
}

.stat-ignored {
  background: linear-gradient(135deg, #BDBDBD 0%, #9E9E9E 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.device-ip {
  font-family: 'Courier New', monospace;
  color: #409EFF;
  font-weight: 500;
}

.detail-container {
  padding: 10px 0;
}

.config-panel {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  padding: 12px 15px;
  font-weight: bold;
  font-size: 14px;
  color: #fff;
}

.standard-header {
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
}

.device-header {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
}

.panel-content {
  padding: 10px;
  background: #fff;
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
