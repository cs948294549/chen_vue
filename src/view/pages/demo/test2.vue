<template>
  <div class="alteration-manage">
    <!-- 筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" size="small">
        <el-row>
          <el-form-item label="工单ID">
            <el-input v-model="filters.op_id" placeholder="工单ID" clearable style="width: 150px;"></el-input>
          </el-form-item>
          <el-form-item label="工单标题">
            <el-input v-model="filters.title" placeholder="标题关键字" clearable style="width: 200px;"></el-input>
          </el-form-item>
          <el-form-item label="工单状态">
            <el-select v-model="filters.status" multiple placeholder="请选择状态" clearable style="width: 300px;">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建人">
            <el-input v-model="filters.username" placeholder="创建人" clearable style="width: 150px;"></el-input>
          </el-form-item>
        </el-row>
        <el-row>
          <el-form-item label="工单类型">
            <el-select v-model="filters.op_type" placeholder="请选择类型" clearable style="width: 200px;">
              <el-option v-for="item in typeList" :key="item.pid" :label="item.name" :value="item.pid"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="filters.create_time_range"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="timestamp"
              style="width: 360px;">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="filters.my_tasks">待我处理</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="loadOrderList">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="success" @click="handleCreate">创建工单</el-button>
          </el-form-item>
        </el-row>
      </el-form>
    </el-card>

    <!-- 工单列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="orderList"
        border
        size="small"
        v-loading="loading"
        style="width: 100%">
        <el-table-column prop="op_id" label="工单ID" width="80" align="center"></el-table-column>
        <el-table-column prop="title" label="工单标题" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="工单类型" width="150" align="center">
          <template slot-scope="scope">
            {{ getTypeName(scope.row.op_type) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="创建人" width="100" align="center"></el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template slot-scope="scope">
            {{ formatTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="变更时间" width="180" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.begin_time">
              {{ formatTime(scope.row.begin_time) }} ~ {{ formatTime(scope.row.finish_time) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="当前处理人" width="120" align="center">
          <template slot-scope="scope">
            {{ scope.row.cur_user || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
            <el-button v-if="canEdit(scope.row)" size="mini" type="text" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="mini" type="text" @click="handleCopy(scope.row)">复制</el-button>
            <el-button v-if="canDelete(scope.row)" size="mini" type="text" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[20, 50, 100, 200]"
        :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        style="margin-top: 20px; text-align: right;">
      </el-pagination>
    </el-card>

    <!-- 创建/编辑工单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="60%"
      :close-on-click-modal="false"
      @close="handleDialogClose">
      <el-form :model="orderForm" :rules="orderRules" ref="orderForm" label-width="120px" size="small">
        <el-form-item label="工单类型" prop="op_type">
          <el-select v-model="orderForm.op_type" placeholder="请选择工单类型" style="width: 100%;">
            <el-option v-for="item in typeList" :key="item.pid" :label="item.name" :value="item.pid"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="orderForm.title" placeholder="请输入工单标题"></el-input>
        </el-form-item>
        <el-form-item label="工单描述">
          <el-input v-model="orderForm.descrip" type="textarea" :rows="4" placeholder="请输入工单描述"></el-input>
        </el-form-item>
        <el-form-item label="变更时间窗口" prop="time_range">
          <el-date-picker
            v-model="orderForm.time_range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="timestamp"
            style="width: 100%;"
            @change="validateTimeWindow">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="指定执行人">
          <el-input v-model="orderForm.assigner" placeholder="执行人邮箱前缀"></el-input>
        </el-form-item>
        <el-form-item label="通知群组">
          <el-select v-model="orderForm.popo" placeholder="请选择通知群组" clearable style="width: 100%;">
            <el-option v-for="item in notifyList" :key="item.pid" :label="item.name" :value="item.target"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </div>
    </el-dialog>

    <!-- 提交工单确认对话框 -->
    <el-dialog
      title="提交工单"
      :visible.sync="submitDialogVisible"
      width="400px">
      <p>确认提交工单 #{{ currentOrder.op_id }} 吗？</p>
      <p style="color: #909399; font-size: 12px;">提交后工单将进入审批流程</p>
      <div slot="footer">
        <el-button size="small" @click="submitDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="confirmSubmit">确认提交</el-button>
      </div>
    </el-dialog>

    <!-- 接手工单确认对话框 -->
    <el-dialog
      title="接手工单"
      :visible.sync="takeoverDialogVisible"
      width="400px">
      <p>确认接手工单 #{{ currentOrder.op_id }} 吗？</p>
      <p style="color: #909399; font-size: 12px;">接手后将由您负责审批此工单</p>
      <div slot="footer">
        <el-button size="small" @click="takeoverDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="confirmTakeover">确认接手</el-button>
      </div>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      title="工单审批"
      :visible.sync="approveDialogVisible"
      width="400px">
      <el-form :model="approveForm" label-width="80px" size="small">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.status">
            <el-radio label="10">通过</el-radio>
            <el-radio label="92">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="approveDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="confirmApprove">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import alterationApi from '@/api/mapis/alteration_interface'

export default {
  name: 'AlterationManage',
  data() {
    return {
      loading: false,
      submitting: false,

      // 筛选条件
      filters: {
        op_id: '',
        title: '',
        status: [],
        username: '',
        op_type: '',
        create_time_range: null,
        my_tasks: false
      },

      // 状态选项
      statusOptions: [
        { value: '00', label: '草稿' },
        { value: '01', label: '待接手' },
        { value: '02', label: '待审批' },
        { value: '10', label: '审批通过' },
        { value: '20', label: '待变更' },
        { value: '21', label: '变更中' },
        { value: '90', label: '变更完成' },
        { value: '91', label: '变更失败' },
        { value: '92', label: '审批拒绝' },
        { value: '93', label: '变更取消' }
      ],

      // 工单类型列表
      typeList: [],

      // 通知群组列表
      notifyList: [],

      // 工单列表
      orderList: [],

      // 分页
      pagination: {
        page: 1,
        size: 20,
        total: 0
      },

      // 对话框
      dialogVisible: false,
      dialogTitle: '创建工单',
      isEdit: false,

      // 工单表单
      orderForm: {
        op_id: null,
        op_type: '',
        title: '',
        descrip: '',
        time_range: null,
        assigner: '',
        popo: ''
      },

      // 表单验证规则
      orderRules: {
        op_type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
        title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
        time_range: [{ required: true, message: '请选择变更时间窗口', trigger: 'change' }]
      },

      // 当前操作的工单
      currentOrder: {},

      // 提交对话框
      submitDialogVisible: false,

      // 接手对话框
      takeoverDialogVisible: false,

      // 审批对话框
      approveDialogVisible: false,
      approveForm: {
        status: '10'
      },

      // 当前用户
      currentUser: '',
      currentRid: ''
    }
  },

  mounted() {
    // 从 store 获取用户信息
    const userInfo = this.$store.getters["user/user_info"]
    this.currentUser = (userInfo && userInfo.username) || localStorage.getItem('username') || ''
    this.currentRid = (userInfo && userInfo.rid) || localStorage.getItem('rid') || ''

    this.loadTypeList()
    this.loadNotifyList()
    this.loadOrderList()
  },

  methods: {
    // 加载工单类型列表
    loadTypeList() {
      alterationApi.getTypeList({}).then(response => {
        if (response.data.code === 0) {
          this.typeList = response.data.data || []
        }
      }).catch(error => {
        console.error('加载工单类型失败:', error)
      })
    },

    // 加载通知群组列表
    loadNotifyList() {
      alterationApi.getNotifyList({}).then(response => {
        if (response.data.code === 0) {
          this.notifyList = response.data.data || []
        }
      }).catch(error => {
        console.error('加载通知群组失败:', error)
      })
    },

    // 加载工单列表
    loadOrderList() {
      this.loading = true

      let params = {}

      if (this.filters.op_id) {
        params.op_id = this.filters.op_id
      }
      if (this.filters.title) {
        params.title = this.filters.title
      }
      if (this.filters.status && this.filters.status.length > 0) {
        params.status = this.filters.status
      }
      if (this.filters.username) {
        params.username = this.filters.username
      }
      if (this.filters.op_type) {
        params.op_type = this.filters.op_type
      }
      if (this.filters.create_time_range && this.filters.create_time_range.length === 2) {
        params.create_time_start = String(Math.floor(this.filters.create_time_range[0] / 1000))
        params.create_time_end = String(Math.floor(this.filters.create_time_range[1] / 1000))
      }
      if (this.filters.my_tasks) {
        params.cur_user = this.currentUser
      }

      alterationApi.getOrderList(params).then(response => {
        if (response.data.code === 0) {
          this.orderList = response.data.data || []
          this.pagination.total = this.orderList.length
        } else {
          this.$message.error(response.data.message || '加载工单列表失败')
        }
        this.loading = false
      }).catch(error => {
        console.error('加载工单列表失败:', error)
        this.$message.error('加载工单列表失败')
        this.loading = false
      })
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        op_id: '',
        title: '',
        status: [],
        username: '',
        op_type: '',
        create_time_range: null,
        my_tasks: false
      }
      this.loadOrderList()
    },

    // 分页
    handleSizeChange(val) {
      this.pagination.size = val
    },

    handleCurrentChange(val) {
      this.pagination.page = val
    },

    // 获取工单类型名称
    getTypeName(typeId) {
      let type = this.typeList.find(t => t.pid === typeId)
      return type ? type.name : '-'
    },

    // 获取状态文本
    getStatusText(status) {
      let option = this.statusOptions.find(s => s.value === status)
      return option ? option.label : status
    },

    // 获取状态标签类型
    getStatusType(status) {
      const typeMap = {
        '00': 'info',
        '01': 'warning',
        '02': 'warning',
        '10': 'success',
        '20': 'primary',
        '21': 'primary',
        '90': 'success',
        '91': 'danger',
        '92': 'danger',
        '93': 'info'
      }
      return typeMap[status] || 'info'
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '-'
      let date = new Date(parseInt(timestamp) * 1000)
      let pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    },

    // 验证时间窗口
    validateTimeWindow(value) {
      if (!value || value.length !== 2) return

      let start = new Date(value[0])
      let end = new Date(value[1])
      let duration = (end - start) / 1000 / 3600 // 小时

      // 检查是否在凌晨2-6点
      let startHour = start.getHours()
      let endHour = end.getHours()

      if ((startHour < 2 || startHour >= 6) || (endHour < 2 || endHour > 6)) {
        this.$message.warning('建议变更时间窗口在凌晨2:00-6:00之间')
      }

      // 检查时长
      if (duration > 4) {
        this.$message.warning('建议变更时长不超过4小时')
      }
    },

    // 权限判断
    canEdit(row) {
      // 只能编辑草稿状态且是自己创建的工单
      return row.status === '00' && row.username === this.currentUser
    },

    canSubmit(row) {
      return row.status === '00' && row.username === this.currentUser
    },

    canTakeover(row) {
      if (row.status !== '01') return false
      if (!row.cur_group) return false
      let members = row.cur_group.split(',')
      return members.includes(this.currentUser)
    },

    canApprove(row) {
      return row.status === '02' && row.cur_user === this.currentUser
    },

    canDelete(row) {
      // 管理员(system/admin)可以删除任意工单，普通用户只能删除草稿状态且是自己创建的工单
      const isAdmin = ['system', 'admin'].includes(this.currentRid)
      if (isAdmin) {
        return true
      }
      return row.status === '00' && row.username === this.currentUser
    },

    // 操作
    handleCreate() {
      this.dialogTitle = '创建工单'
      this.isEdit = false
      this.orderForm = {
        op_id: null,
        op_type: '',
        title: '',
        descrip: '',
        time_range: null,
        assigner: '',
        popo: ''
      }
      this.dialogVisible = true
    },

    handleView(row) {
      this.$router.push({
        path: '/pages/demo/test4',
        query: { op_id: row.op_id }
      })
    },

    handleEdit(row) {
      this.dialogTitle = '编辑工单'
      this.isEdit = true
      this.orderForm = {
        op_id: row.op_id,
        op_type: row.op_type,
        title: row.title,
        descrip: row.descrip,
        time_range: row.begin_time && row.finish_time ? [
          parseInt(row.begin_time) * 1000,
          parseInt(row.finish_time) * 1000
        ] : null,
        assigner: row.assigner || '',
        popo: row.popo || ''
      }
      this.dialogVisible = true
    },

    handleSubmit(row) {
      this.currentOrder = row
      this.submitDialogVisible = true
    },

    handleTakeover(row) {
      this.currentOrder = row
      this.takeoverDialogVisible = true
    },

    handleApprove(row) {
      this.currentOrder = row
      this.approveForm.status = '10'
      this.approveDialogVisible = true
    },

    handleCopy(row) {
      this.submitting = true
      alterationApi.copyOrder({ op_id: row.op_id }).then(response => {
        if (response.data.code === 0) {
          this.$message.success('复制成功')
          this.loadOrderList()
        } else {
          this.$message.error(response.data.message || '复制失败')
        }
        this.submitting = false
      }).catch(error => {
        console.error('复制工单失败:', error)
        this.$message.error('复制失败')
        this.submitting = false
      })
    },

    handleDelete(row) {
      this.$confirm(`确认删除工单 #${row.op_id} 吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        alterationApi.deleteOrder({ op_id: row.op_id }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('删除成功')
            this.loadOrderList()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除工单失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    // 保存工单
    handleSave() {
      this.$refs.orderForm.validate(valid => {
        if (!valid) return

        this.submitting = true

        let params = {
          op_type: this.orderForm.op_type,
          title: this.orderForm.title,
          descrip: this.orderForm.descrip,
          assigner: this.orderForm.assigner,
          popo: this.orderForm.popo
        }

        if (this.orderForm.time_range && this.orderForm.time_range.length === 2) {
          params.begin_time = String(Math.floor(this.orderForm.time_range[0] / 1000))
          params.finish_time = String(Math.floor(this.orderForm.time_range[1] / 1000))
        }

        if (this.isEdit) {
          params.op_id = this.orderForm.op_id
        }

        const apiCall = this.isEdit ? alterationApi.updateOrder(params) : alterationApi.addOrder(params)

        apiCall.then(response => {
          if (response.data.code === 0) {
            this.$message.success(this.isEdit ? '保存成功' : '创建成功')
            this.dialogVisible = false
            this.loadOrderList()
          } else {
            this.$message.error(response.data.message || '操作失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('保存工单失败:', error)
          this.$message.error('操作失败')
          this.submitting = false
        })
      })
    },

    // 确认提交
    confirmSubmit() {
      this.submitting = true
      alterationApi.submitOrder({ op_id: this.currentOrder.op_id }).then(response => {
        if (response.data.code === 0) {
          this.$message.success('提交成功')
          this.submitDialogVisible = false
          this.loadOrderList()
        } else {
          this.$message.error(response.data.message || '提交失败')
        }
        this.submitting = false
      }).catch(error => {
        console.error('提交工单失败:', error)
        this.$message.error('提交失败')
        this.submitting = false
      })
    },

    // 确认接手
    confirmTakeover() {
      this.submitting = true
      alterationApi.takeoverOrder({ op_id: this.currentOrder.op_id }).then(response => {
        if (response.data.code === 0) {
          this.$message.success('接手成功')
          this.takeoverDialogVisible = false
          this.loadOrderList()
        } else {
          this.$message.error(response.data.message || '接手失败')
        }
        this.submitting = false
      }).catch(error => {
        console.error('接手工单失败:', error)
        this.$message.error('接手失败')
        this.submitting = false
      })
    },

    // 确认审批
    confirmApprove() {
      this.submitting = true
      alterationApi.approveOrder({
        op_id: this.currentOrder.op_id,
        status: this.approveForm.status
      }).then(response => {
        if (response.data.code === 0) {
          this.$message.success('审批完成')
          this.approveDialogVisible = false
          this.loadOrderList()
        } else {
          this.$message.error(response.data.message || '审批失败')
        }
        this.submitting = false
      }).catch(error => {
        console.error('审批工单失败:', error)
        this.$message.error('审批失败')
        this.submitting = false
      })
    },

    handleDialogClose() {
      this.$refs.orderForm.resetFields()
    }
  }
}
</script>

<style scoped>
.alteration-manage {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}
</style>
