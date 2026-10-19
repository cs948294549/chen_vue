<template>
  <div class="policy-issues-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="对象类型">
          <el-select
            v-model="filterForm.object_type"
            placeholder="全部"
            clearable
            style="width: 130px;"
            @change="handleObjectTypeFilterChange">
            <el-option
              v-for="item in objectTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="标准规则">
          <el-select
            v-model="filterForm.standard_id"
            placeholder="请选择"
            filterable
            clearable
            style="width: 220px;">
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

        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待处理" value="pending"></el-option>
            <el-option label="处理中" value="processing"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已忽略" value="ignored"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px;">
          </el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 处理记录列表 -->
    <el-card shadow="never" class="table-card">
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
        :data="pagedTableData"
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

        <el-table-column prop="object_type" label="对象类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getObjectTypeTag(scope.row.object_type)" size="small">
              {{ scope.row.object_type_label || scope.row.object_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="standard_name" label="标准规则" width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.standard_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="device_ip" label="设备IP" width="140">
          <template slot-scope="scope">
            <span class="device-ip">{{ scope.row.device_ip }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="device_name" label="设备名称" width="180" show-overflow-tooltip />

        <el-table-column prop="device_vendor" label="设备厂商" width="110" align="center">
          <template slot-scope="scope">
            <el-tag size="small" effect="plain">{{ scope.row.device_vendor }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="issue_type" label="问题类型" width="110" align="center">
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
            <span v-if="scope.row.change_ticket_id">{{ scope.row.change_ticket_id }}</span>
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

        <el-table-column prop="remark" label="备注" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.remark || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              icon="el-icon-view"
              @click="handleViewDetail(scope.row)">
              查看
            </el-button>
            <el-dropdown
              v-if="scope.row.status === 'pending'"
              size="small"
              trigger="click"
              @command="handleStatusChange">
              <el-button type="text" size="small">
                标记 <i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item :command="{row: scope.row, status: 'processing'}">
                  <i class="el-icon-loading" style="color: #409EFF;"></i> 处理中
                </el-dropdown-item>
                <el-dropdown-item :command="{row: scope.row, status: 'completed'}">
                  <i class="el-icon-circle-check" style="color: #67c23a;"></i> 已完成
                </el-dropdown-item>
                <el-dropdown-item :command="{row: scope.row, status: 'ignored'}">
                  <i class="el-icon-remove-outline" style="color: #909399;"></i> 忽略
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button
              type="text"
              size="small"
              icon="el-icon-delete"
              style="color: #f56c6c;"
              @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页（后端返回全量，前端分页） -->
      <el-pagination
        v-if="totalCount > pageSize"
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
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="记录ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="对象类型">
            <el-tag :type="getObjectTypeTag(currentDetail.object_type)" size="small">
              {{ currentDetail.object_type_label || currentDetail.object_type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标准规则">
            <el-tag>{{ currentDetail.standard_name }}</el-tag>
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
          <el-descriptions-item label="工单ID">{{ currentDetail.change_ticket_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentDetail.created_by }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(currentDetail.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ formatTime(currentDetail.processed_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="detailTab" style="margin-top: 15px;">
          <el-tab-pane label="差异对比" name="diff">
            <div style="margin-bottom: 10px;">
              <el-radio-group v-model="diffMode" size="small" @change="loadDetailDiffComparison">
                <el-radio-button label="context">上下文对比</el-radio-button>
                <el-radio-button label="full">完整对比</el-radio-button>
              </el-radio-group>
            </div>
            <div v-loading="diffLoading" class="diff-html-container" v-html="diffHtml"></div>
          </el-tab-pane>

          <el-tab-pane label="标准配置" name="standard">
            <el-table :data="currentDetail.standard_entries || []" border size="small" style="width: 100%;">
              <el-table-column
                v-for="col in entryColumns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
                :align="col.align || 'left'">
                <template slot-scope="scope">
                  {{ formatEntryField(scope.row, col) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="设备配置" name="device">
            <el-table :data="currentDetail.device_entries || []" border size="small" style="width: 100%;">
              <el-table-column
                v-for="col in entryColumns"
                :key="col.prop"
                :prop="col.prop"
                :label="col.label"
                :width="col.width"
                :align="col.align || 'left'">
                <template slot-scope="scope">
                  {{ formatEntryField(scope.row, col) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentDetail && !currentDetail.change_ticket_id && currentDetail.status !== 'completed'"
          type="primary"
          size="small"
          @click="handleCreateTicketSingle(currentDetail)">
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

        <el-form-item label="对象类型" prop="object_type">
          <el-select
            v-model="createRecordForm.object_type"
            placeholder="请选择对象类型"
            style="width: 100%;"
            @change="handleCreateObjectTypeChange">
            <el-option
              v-for="item in objectTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>

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
            placeholder="请先选择对象类型"
            filterable
            style="width: 100%;"
            clearable>
            <el-option
              v-for="item in createStandardOptions"
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
import policyIssueApi from '@/api/mapis/policy_issue_interface'
import prefixListApi from '@/api/mapis/prefix_list_interface'
import aclApi from '@/api/mapis/acl_interface'
import collectorApi from '@/api/mapis/collector_interface'
import { addrSpecText, portSpecText, formatTimestamp } from './utils/spec_format'

export default {
  name: 'PolicyIssues',

  data() {
    return {
      objectTypeOptions: [
        { value: 'prefix_list', label: '前缀列表' },
        { value: 'acl', label: 'ACL' },
        { value: 'addrgroup', label: '地址组' },
        { value: 'portgroup', label: '端口组' }
      ],

      filterForm: {
        object_type: '',
        standard_id: null,
        device: '',
        status: '',
        dateRange: null
      },

      // 筛选栏的标准规则选项，随对象类型变化
      standardOptions: [],

      tableData: [],
      selectedRecords: [],
      currentPage: 1,
      pageSize: 20,
      totalCount: 0,

      detailDialogVisible: false,
      currentDetail: null,
      detailTab: 'diff',
      diffMode: 'context',
      diffHtml: '',
      diffLoading: false,

      createRecordDialogVisible: false,
      createRecordForm: {
        object_type: '',
        device_ip: '',
        standard_id: null,
        remark: ''
      },
      createRecordRules: {
        object_type: [
          { required: true, message: '请选择对象类型', trigger: 'change' }
        ],
        device_ip: [
          { required: true, message: '请选择设备', trigger: 'change' }
        ],
        standard_id: [
          { required: true, message: '请选择标准规则', trigger: 'change' }
        ]
      },
      // 新建对话框里的标准规则选项
      createStandardOptions: [],

      deviceOptions: [],
      deviceLoading: false
    }
  },

  computed: {
    // 分页后的表格数据
    pagedTableData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.tableData.slice(start, start + this.pageSize)
    },

    // 按对象类型给出条目列定义
    entryColumns() {
      const objectType = this.currentDetail ? this.currentDetail.object_type : ''

      if (objectType === 'prefix_list') {
        return [
          { prop: 'seq', label: 'Seq', width: '70', align: 'center' },
          { prop: 'action', label: '动作', width: '90', align: 'center' },
          { prop: 'prefix', label: '前缀', width: '' },
          { prop: 'ge', label: 'ge', width: '80', align: 'center' },
          { prop: 'le', label: 'le', width: '80', align: 'center' }
        ]
      }
      if (objectType === 'acl') {
        return [
          { prop: 'seq', label: 'Seq', width: '70', align: 'center' },
          { prop: 'action', label: '动作', width: '90', align: 'center' },
          { prop: 'protocol', label: '协议', width: '90', align: 'center' },
          { prop: 'src', label: '源地址', width: '' },
          { prop: 'src_port', label: '源端口', width: '120' },
          { prop: 'dst', label: '目的地址', width: '' },
          { prop: 'dst_port', label: '目的端口', width: '120' }
        ]
      }
      if (objectType === 'addrgroup') {
        return [
          { prop: 'seq', label: 'Seq', width: '70', align: 'center' },
          { prop: 'kind', label: '类型', width: '110', align: 'center' },
          { prop: 'addresses', label: '地址', width: '' },
          { prop: 'description', label: '描述', width: '200' }
        ]
      }
      if (objectType === 'portgroup') {
        return [
          { prop: 'seq', label: 'Seq', width: '70', align: 'center' },
          { prop: 'op', label: '运算符', width: '110', align: 'center' },
          { prop: 'ports', label: '端口', width: '' },
          { prop: 'description', label: '描述', width: '200' }
        ]
      }
      return []
    }
  },

  mounted() {
    this.loadStandardOptions('')
    this.loadData()
  },

  methods: {
    formatTime(timestamp) {
      return formatTimestamp(timestamp)
    },

    // created_at 存的是 10 位时间戳字符串，日期筛选要转成时间戳再比
    // endOfDay=true 时取当天 23:59:59
    dateToTimestamp(dateText, endOfDay) {
      const [y, m, d] = dateText.split('-').map(Number)
      const date = endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59)
        : new Date(y, m - 1, d, 0, 0, 0)
      return Math.floor(date.getTime() / 1000)
    },

    // ==================== 选项加载 ====================

    // object_type 为空时加载全部四类标准规则
    loadStandardOptions(objectType) {
      const tasks = []

      if (!objectType || objectType === 'prefix_list') {
        tasks.push(prefixListApi.getStandardsList({ is_active: 1 }).then(res => this.pickOptions(res, 'prefix')))
      }
      if (!objectType || objectType === 'acl') {
        tasks.push(aclApi.getStandardsList({ is_active: 1 }).then(res => this.pickOptions(res, 'acl')))
      }
      if (!objectType || objectType === 'addrgroup') {
        tasks.push(aclApi.getAddrGroupList({ is_active: 1 }).then(res => this.pickOptions(res, 'addrgroup')))
      }
      if (!objectType || objectType === 'portgroup') {
        tasks.push(aclApi.getPortGroupList({ is_active: 1 }).then(res => this.pickOptions(res, 'portgroup')))
      }

      Promise.all(tasks.map(p => p.catch(() => []))).then(lists => {
        const merged = [].concat.apply([], lists)
        if (objectType) {
          this.createStandardOptions = merged
        } else {
          this.standardOptions = merged
        }
      })
    },

    pickOptions(response, objectType) {
      const res = response.data
      if (!res || res.code !== 0) return []
      return (res.data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        object_type: objectType
      }))
    },

    handleObjectTypeFilterChange(value) {
      this.filterForm.standard_id = null
      this.standardOptions = []
      this.loadStandardOptions(value)
    },

    handleCreateObjectTypeChange() {
      this.createRecordForm.standard_id = null
      this.createStandardOptions = []
      if (this.createRecordForm.object_type) {
        this.loadStandardOptions(this.createRecordForm.object_type)
      }
    },

    // ==================== 数据加载 ====================

    loadData() {
      const params = {
        object_type: this.filterForm.object_type || undefined,
        standard_id: this.filterForm.standard_id,
        device: this.filterForm.device,
        status: this.filterForm.status
      }

      if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
        params.start_date = this.dateToTimestamp(this.filterForm.dateRange[0], false)
        params.end_date = this.dateToTimestamp(this.filterForm.dateRange[1], true)
      }

      policyIssueApi.getIssueRecordsList(params).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.tableData = res.data || []
          this.totalCount = this.tableData.length
        } else {
          this.$message.error(res.message || '加载处理记录失败')
        }
      }).catch(error => {
        console.error('加载处理记录失败:', error)
        this.$message.error('加载处理记录失败')
      })
    },

    // ==================== 操作方法 ====================

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filterForm = {
        object_type: '',
        standard_id: null,
        device: '',
        status: '',
        dateRange: null
      }
      this.currentPage = 1
      this.loadStandardOptions('')
      this.loadData()
    },

    handleSelectionChange(selection) {
      this.selectedRecords = selection
    },

    checkSelectable(row) {
      return row.status === 'pending'
    },

    handleViewDetail(row) {
      policyIssueApi.getIssueRecordDetail({ id: row.id }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.currentDetail = res.data
          this.detailTab = 'diff'
          this.diffMode = 'context'
          this.diffHtml = ''
          this.detailDialogVisible = true
          this.loadDetailDiffComparison()
        } else {
          this.$message.error(res.message || '获取详情失败')
        }
      }).catch(error => {
        console.error('获取详情失败:', error)
        this.$message.error('获取详情失败')
      })
    },

    loadDetailDiffComparison() {
      if (!this.currentDetail) return

      this.diffLoading = true
      policyIssueApi.compareTextDiff({
        object_type: this.currentDetail.object_type,
        src_entries: this.currentDetail.device_entries || [],
        target_entries: this.currentDetail.standard_entries || [],
        full_diff: this.diffMode === 'full'
      }).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.diffHtml = res.data.html || ''
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

    handleBatchCreateTickets() {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('请先选择待处理的记录')
        return
      }

      const objectTypes = new Set(this.selectedRecords.map(r => r.object_type))
      if (objectTypes.size > 1) {
        this.$message.warning('一个工单只能包含同一种对象类型的记录')
        return
      }

      this.$prompt('请输入工单标题（可选，留空则自动生成）', '批量创建工单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：ACL 配置变更-生产环境'
      }).then(({ value }) => {
        const params = {
          issue_ids: this.selectedRecords.map(r => r.id)
        }
        if (value && value.trim()) {
          params.title = value.trim()
        }
        this.submitChangeOrder(params)
      }).catch(() => {})
    },

    handleCreateTicketSingle(row) {
      const params = { issue_ids: [row.id] }
      this.submitChangeOrder(params)
    },

    submitChangeOrder(params) {
      policyIssueApi.createChangeOrder(params).then(response => {
        const res = response.data
        if (res.code === 0) {
          this.$message.success(`工单创建成功，工单ID: ${res.data.op_id}`)
          this.detailDialogVisible = false
          this.loadData()
        } else {
          this.$message.error(res.message || '创建工单失败')
        }
      }).catch(error => {
        console.error('创建工单失败:', error)
        this.$message.error('创建工单失败')
      })
    },

    handleDelete(row) {
      this.$confirm(`确定删除设备 ${row.device_name}(${row.device_ip}) 的处理记录吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        policyIssueApi.deleteIssueRecord({ id: row.id }).then(response => {
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

    handleStatusChange(command) {
      const { row, status } = command
      const statusText = this.getStatusText(status)

      this.$confirm(`确定将该记录标记为"${statusText}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        policyIssueApi.updateIssueStatus({ id: row.id, status }).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('状态已更新')
            this.loadData()
          } else {
            this.$message.error(res.message || '状态更新失败')
          }
        }).catch(error => {
          console.error('状态更新失败:', error)
          this.$message.error('状态更新失败')
        })
      }).catch(() => {})
    },

    handleCreateRecord() {
      this.createRecordDialogVisible = true
      this.createRecordForm = {
        object_type: '',
        device_ip: '',
        standard_id: null,
        remark: ''
      }
      this.createStandardOptions = []
      this.loadDeviceList()
      this.$nextTick(() => {
        if (this.$refs.createRecordForm) {
          this.$refs.createRecordForm.clearValidate()
        }
      })
    },

    loadDeviceList() {
      this.deviceLoading = true
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
        if (!valid) return

        policyIssueApi.createNewIssue({
          object_type: this.createRecordForm.object_type,
          device_ip: this.createRecordForm.device_ip,
          standard_id: this.createRecordForm.standard_id,
          remark: this.createRecordForm.remark || ''
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('处理记录创建成功')
            this.createRecordDialogVisible = false
            this.loadData()
          } else {
            this.$message.error(res.message || '创建失败')
          }
        }).catch(error => {
          console.error('创建处理记录失败:', error)
          this.$message.error('创建处理记录失败')
        })
      })
    },

    // ==================== 展示辅助 ====================

    formatEntryField(entry, col) {
      if (!entry) return '-'
      const value = entry[col.prop]

      switch (col.prop) {
        case 'src':
        case 'dst':
          return addrSpecText(value) || 'any'
        case 'src_port':
        case 'dst_port':
          return portSpecText(value) || 'any'
        case 'addresses':
        case 'ports':
          return (value || []).join(', ')
        case 'description':
          return value || '-'
        default:
          return value === null || value === undefined || value === '' ? '-' : value
      }
    },

    getObjectTypeTag(objectType) {
      const typeMap = {
        prefix_list: '',
        acl: 'success',
        addrgroup: 'warning',
        portgroup: 'info'
      }
      return typeMap[objectType] || ''
    },

    getStatusTagType(status) {
      const typeMap = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        ignored: 'info'
      }
      return typeMap[status] || ''
    },

    getStatusText(status) {
      const textMap = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        ignored: '已忽略'
      }
      return textMap[status] || status
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
.policy-issues-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 100px);
}

.filter-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.device-ip {
  font-family: 'Courier New', monospace;
  color: #409EFF;
  font-weight: 500;
}

.detail-container {
  padding: 10px 0;
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
