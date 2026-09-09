<template>
  <div class="order-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button size="small" icon="el-icon-arrow-left" @click="goBack">返回</el-button>
      <span class="page-title">工单详情 #{{ orderDetail.op_id }}</span>
      <el-tag :type="getStatusType(orderDetail.status)" size="medium" style="margin-left: 10px;">
        {{ getStatusText(orderDetail.status) }}
      </el-tag>
    </div>

    <div v-loading="loading">
      <!-- 进度条 -->
      <div v-if="stepItems.active > 0" class="progress-section">
        <el-steps :active="stepItems.active" finish-status="success" align-center>
          <el-step
            v-for="(step, index) in stepItems.nodes"
            :key="step.id"
            :title="step.title"
            :description="step.description"
            :status="getStepStatus(index)">
          </el-step>
        </el-steps>
      </div>

      <!-- 上半部分：工单信息和操作记录 -->
      <div class="top-section">
        <!-- 左侧：工单基本信息 -->
        <div class="info-section">
          <div class="info-header">
            <h3>【{{ getTypeName(orderDetail.op_type) }}】{{ orderDetail.title }}</h3>
          </div>

          <div class="info-content">
            <div class="info-row">
              <div class="info-item">
                <span class="label">工单号</span>
                <span class="value">{{ orderDetail.op_id }}</span>
              </div>
              <div class="info-item">
                <span class="label">状态</span>
                <el-tag :type="getStatusType(orderDetail.status)" size="small">
                  {{ getStatusText(orderDetail.status) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">建单人</span>
                <span class="value">{{ orderDetail.username }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item">
                <span class="label">变更时间</span>
                <span class="value" v-if="orderDetail.begin_time && orderDetail.finish_time">
                  {{ formatTime(orderDetail.begin_time) }} ~ {{ formatTime(orderDetail.finish_time) }}
                </span>
                <span class="value" v-else>-</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item">
                <span class="label">指派给</span>
                <span class="value">{{ orderDetail.assigner || '无' }}</span>
              </div>
              <div class="info-item" v-if="orderDetail.is_auto">
                <el-tag type="success" size="mini">自动化执行</el-tag>
              </div>
            </div>

            <div class="info-row" v-if="orderDetail.popo">
              <div class="info-item">
                <span class="label">通知群组</span>
                <span class="value">{{ orderDetail.popo }}</span>
              </div>
            </div>

            <div class="descrip-box" v-if="orderDetail.descrip">
              <div class="descrip-label">变更说明</div>
              <div class="descrip-content">{{ orderDetail.descrip }}</div>
            </div>
          </div>

          <!-- 流程操作按钮 -->
          <div class="action-buttons" v-if="hasAnyAction">
            <el-button v-if="canSubmit" type="primary" size="small" icon="el-icon-s-promotion" @click="handleSubmit">提交工单</el-button>
            <el-button v-if="canTakeover" type="success" size="small" icon="el-icon-finished" @click="handleTakeover">接手工单</el-button>
            <el-button v-if="canApprove" type="success" size="small" icon="el-icon-circle-check" @click="handleApprove('10')">通过</el-button>
            <el-button v-if="canApprove" type="danger" size="small" icon="el-icon-circle-close" @click="handleApprove('92')">拒绝</el-button>
            <el-button v-if="canExecute" type="warning" size="small" icon="el-icon-video-play" :loading="executing" @click="handleExecute">开始变更</el-button>
            <el-button v-if="canFinishChange" type="success" size="small" icon="el-icon-circle-check" :loading="finishing" @click="handleFinishChange">变更结束</el-button>
            <el-button v-if="canCancel" type="info" size="small" icon="el-icon-close" @click="handleCancel">取消工单</el-button>
          </div>
        </div>

        <!-- 右侧：操作记录 -->
        <div class="log-section">
          <div class="section-title">
            <i class="el-icon-time"></i>
            操作记录
          </div>
          <div class="log-wrapper">
            <div v-if="logList.length > 0" class="log-list">
              <div v-for="(log, index) in logList" :key="index" class="log-item">
                <div class="log-time">{{ formatTime(log.create_time) }}</div>
                <div class="log-content">
                  <span :class="['log_tag', getLogTagClass(log.tag)]" v-if="log.tag">
                    {{ getLogTagText(log.tag) }}
                  </span>
                  <div class="log-msg">{{ log.msg }}</div>
                  <div class="log-user">{{ log.username }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-text">暂无操作记录</div>
          </div>
        </div>
      </div>

      <!-- 下半部分：变更内容（按批次分组） -->
      <div class="bottom-section">
        <div class="section-header">
          <div class="section-title">
            <i class="el-icon-s-grid"></i>
            变更内容 <span class="device-count">({{ deviceList.length }}台设备，{{ batchList.length }}个批次)</span>
          </div>
          <el-button v-if="canEditDevice" type="primary" size="small" icon="el-icon-plus" @click="handleAddDevice">添加设备</el-button>
        </div>

        <div v-if="batchList.length > 0" class="batch-container">
          <div v-for="batch in batchList" :key="batch.batch" class="batch-group">
            <div class="batch-header">
              <div class="batch-info">
                <span class="batch-number">批次 {{ batch.batch }}</span>
                <span class="batch-count">{{ batch.devices.length }}台设备</span>
              </div>
              <div class="batch-actions">
                <el-button v-if="canExecuteBatch" type="primary" size="small" icon="el-icon-video-play" :loading="executing" @click="handleExecuteBatch(batch)">执行批次</el-button>
                <div v-else class="batch-tip">此批次设备将同时执行变更</div>
              </div>
            </div>

            <div class="batch-devices">
              <div v-for="device in batch.devices" :key="device.pid" class="device-card">
                <div class="device-card-header">
                  <div class="device-card-info">
                    <h4>{{ device.sysname }}</h4>
                    <p>{{ device.ip }} | {{ device.model || '未知型号' }}</p>
                  </div>
                  <div class="device-card-status">
                    <el-tag :type="getDeviceStatusType(device.status)" size="small">
                      {{ getDeviceStatusText(device.status) }}
                    </el-tag>
                    <div class="device-card-actions">
                      <el-button v-if="canExecuteDevice" type="success" size="mini" icon="el-icon-video-play" :loading="executing" @click="handleExecuteDevice(device)">执行</el-button>
                      <el-button v-if="canRollbackDevice(device)" type="warning" size="mini" icon="el-icon-refresh-left" :loading="rollingDevice[device.pid]" @click="handleRollbackDevice(device)">回滚</el-button>
                      <el-button v-if="canEditDevice" type="text" size="mini" icon="el-icon-edit" @click="handleEditDevice(device)">编辑</el-button>
                      <el-button v-if="canEditDevice" type="text" size="mini" icon="el-icon-delete" @click="handleDeleteDevice(device)" style="color: #f56c6c;">删除</el-button>
                    </div>
                  </div>
                </div>

                <div class="device-card-body">
                  <div class="cmd-block">
                    <div class="cmd-label">
                      <i class="el-icon-video-play"></i>
                      执行命令
                    </div>
                    <pre class="cmd-text">{{ device.cmd_exec || '暂无执行命令' }}</pre>
                  </div>

                  <div class="cmd-block">
                    <div class="cmd-label">
                      <i class="el-icon-refresh-left"></i>
                      回滚命令
                    </div>
                    <pre class="cmd-text">{{ device.cmd_roll || '暂无回滚命令' }}</pre>
                  </div>

                  <div class="cmd-block" v-if="device.result">
                    <div class="cmd-label">
                      <i class="el-icon-document"></i>
                      执行结果
                    </div>
                    <div class="result-link">
                      <el-button size="small" type="text" @click="handleViewResult(device)">查看完整结果</el-button>
                    </div>
                  </div>

                  <div class="cmd-block" v-if="canViewConfigDiff(device)">
                    <div class="cmd-label">
                      <i class="el-icon-document-copy"></i>
                      配置对比
                    </div>
                    <div class="result-link">
                      <el-button size="small" type="primary" @click="handleViewConfigDiff(device)">查看配置前后对比</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-device">
          <i class="el-icon-s-platform empty-icon"></i>
          <div class="empty-text">暂无设备配置</div>
          <el-button v-if="canEditDevice" type="primary" size="small" @click="handleAddDevice" style="margin-top: 20px;">
            <i class="el-icon-plus"></i> 添加设备
          </el-button>
        </div>
      </div>
    </div>

    <!-- 设备命令编辑对话框 -->
    <el-dialog
      :title="deviceDialogTitle"
      :visible.sync="deviceDialogVisible"
      width="700px"
      :close-on-click-modal="false">
      <el-form :model="deviceForm" :rules="deviceRules" ref="deviceForm" label-width="120px" size="small">
        <el-form-item label="批次号" prop="batch">
          <el-input-number v-model="deviceForm.batch" :min="1" :max="10" style="width: 100%;"></el-input-number>
          <span style="color: #909399; font-size: 12px;">同一批次的设备将同时执行</span>
        </el-form-item>
        <el-form-item label="选择设备" prop="ip">
          <el-select
            v-model="deviceForm.ip"
            filterable
            placeholder="请输入设备IP或名称搜索"
            :loading="deviceSearchLoading"
            @change="handleDeviceSelect"
            style="width: 100%;">
            <el-option
              v-for="item in deviceOptions"
              :key="item.ip"
              :label="`${item.sysname} (${item.ip})`"
              :value="item.ip">
              <span style="float: left">{{ item.sysname }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">{{ item.ip }} | {{ item.hardware }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="deviceForm.sysname" disabled></el-input>
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="deviceForm.model" disabled></el-input>
        </el-form-item>
        <el-form-item label="资产编号">
          <el-input v-model="deviceForm.asset_no" disabled></el-input>
        </el-form-item>
        <el-form-item label="执行命令" prop="cmd_exec">
          <el-input v-model="deviceForm.cmd_exec" type="textarea" :rows="6" placeholder="请输入执行命令，支持多行"></el-input>
        </el-form-item>
        <el-form-item label="回滚命令" prop="cmd_roll">
          <el-input v-model="deviceForm.cmd_roll" type="textarea" :rows="6" placeholder="请输入回滚命令，支持多行"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="deviceDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="handleSaveDevice">保存</el-button>
      </div>
    </el-dialog>

    <!-- 执行结果查看对话框 -->
    <el-dialog
      title="执行结果"
      :visible.sync="resultDialogVisible"
      width="700px">
      <div class="result-content">
        <pre>{{ currentResult }}</pre>
      </div>
      <div slot="footer">
        <el-button size="small" @click="resultDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      :title="approveDialogTitle"
      :visible.sync="approveDialogVisible"
      width="400px">
      <el-form :model="approveForm" label-width="80px" size="small">
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见（可选）"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="approveDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="confirmApprove">确认</el-button>
      </div>
    </el-dialog>

    <!-- 配置对比对话框 -->
    <el-dialog
      title="配置对比"
      :visible.sync="configDiffDialogVisible"
      width="90%"
      top="5vh"
      :close-on-click-modal="false">
      <div v-loading="loadingConfigDiff" class="config-diff-wrapper">
        <div v-if="configDiffData.before && configDiffData.after" class="diff-header">
          <div class="diff-info">
            <div class="diff-info-item">
              <span class="diff-label">变更前：</span>
              <span>{{ configDiffData.before.backup_time }}</span>
            </div>
            <div class="diff-info-item">
              <span class="diff-label">变更后：</span>
              <span>{{ configDiffData.after.backup_time }}</span>
            </div>
          </div>
          <div class="diff-controls">
            <el-radio-group v-model="configDiffMode" size="small" @change="handleDiffModeChange">
              <el-radio-button label="diff">差异对比</el-radio-button>
              <el-radio-button label="full">全文对比</el-radio-button>
            </el-radio-group>
            <div class="diff-stats">
              <el-tag type="success" size="small">新增 {{ configDiffData.stats.added }} 行</el-tag>
              <el-tag type="danger" size="small">删除 {{ configDiffData.stats.deleted }} 行</el-tag>
              <el-tag type="warning" size="small">修改 {{ configDiffData.stats.modified }} 行</el-tag>
            </div>
          </div>
        </div>
        <div v-if="configDiffData.html" class="diff-content" v-html="configDiffData.html"></div>
        <div v-else class="empty-text">暂无配置对比数据</div>
      </div>
      <div slot="footer">
        <el-button size="small" @click="configDiffDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import alterationApi from '@/api/mapis/alteration_interface'
import collectorApi from '@/api/mapis/collector_interface'
import configApi from '@/api/mapis/config_interface'

export default {
  name: 'OrderDetail',
  data() {
    return {
      loading: false,
      submitting: false,
      executing: false,  // 开始变更/执行操作loading
      rolling: false,    // 回滚操作loading

      // 工单ID
      opId: null,

      // 工单详情
      orderDetail: {},

      // 工单类型列表
      typeList: [],

      // 设备列表
      deviceList: [],

      // 日志列表
      logList: [],

      // 当前激活的设备Tab
      activeDeviceTab: '',

      // 当前用户
      currentUser: '',
      currentRid: '',

      // 进度条数据
      stepItems: {
        active: 0,
        nodes: []
      },

      // 设备对话框
      deviceDialogVisible: false,
      deviceDialogTitle: '添加设备',
      isEditDevice: false,
      deviceSearchLoading: false,
      deviceOptions: [],
      deviceForm: {
        pid: null,
        batch: 1,
        ip: '',
        sysname: '',
        model: '',
        asset_no: '',
        cmd_exec: '',
        cmd_roll: '',
        status: '00'
      },
      deviceRules: {
        batch: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
        ip: [{ required: true, message: '请选择设备', trigger: 'change' }],
        cmd_exec: [{ required: true, message: '请输入执行命令', trigger: 'blur' }],
        cmd_roll: [{ required: true, message: '请输入回滚命令', trigger: 'blur' }]
      },

      // 执行结果对话框
      resultDialogVisible: false,
      currentResult: '',

      // 审批对话框
      approveDialogVisible: false,
      approveDialogTitle: '审批工单',
      approveForm: {
        status: '10',
        comment: ''
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

      // 操作loading状态
      finishing: false,
      rollingDevice: {},  // 设备回滚loading状态，key为pid

      // 配置对比对话框
      configDiffDialogVisible: false,
      loadingConfigDiff: false,
      configDiffMode: 'diff',  // 对比模式：'diff'=差异对比, 'full'=全文对比
      currentDiffDevice: null,  // 当前查看配置对比的设备
      configDiffData: {
        html: '',
        stats: { added: 0, deleted: 0, modified: 0 },
        before: null,
        after: null
      }
    }
  },

  computed: {
    // 按批次分组设备
    batchList() {
      const batchMap = {}
      this.deviceList.forEach(device => {
        const batch = device.batch || 1
        if (!batchMap[batch]) {
          batchMap[batch] = []
        }
        batchMap[batch].push(device)
      })

      // 转换为数组并按批次号排序
      const batches = Object.keys(batchMap).map(batch => ({
        batch: parseInt(batch),
        devices: batchMap[batch]
      }))

      batches.sort((a, b) => a.batch - b.batch)
      return batches
    },

    // 是否可以提交
    canSubmit() {
      return this.orderDetail.status === '00' && this.orderDetail.username === this.currentUser
    },

    // 是否可以接手
    canTakeover() {
      if (this.orderDetail.status !== '01') return false
      if (!this.orderDetail.cur_group) return false
      const members = this.orderDetail.cur_group.split(',')
      return members.includes(this.currentUser)
    },

    // 是否可以审批
    canApprove() {
      return this.orderDetail.status === '02' && this.orderDetail.cur_user === this.currentUser
    },

    // 是否可以开始变更
    canExecute() {
      if (!['20'].includes(this.orderDetail.status)) return false
      // 只有创建人或指定执行人可以开始变更
      const isCreator = this.orderDetail.username === this.currentUser
      const isAssigner = this.orderDetail.assigner === this.currentUser
      return isCreator || isAssigner
    },

    // 是否可以变更结束
    canFinishChange() {
      if (this.orderDetail.status !== '21') return false
      // 只有创建人或指定变更人可以结束变更
      const isCreator = this.orderDetail.username === this.currentUser
      const isAssigner = this.orderDetail.assigner === this.currentUser
      return isCreator || isAssigner
    },

    // 是否可以取消
    canCancel() {
      if (this.orderDetail.username !== this.currentUser) return false
      return ['00', '01', '02', '10', '20'].includes(this.orderDetail.status)
    },

    // 是否可以编辑设备
    canEditDevice() {
      return this.orderDetail.status === '00' && this.orderDetail.username === this.currentUser
    },

    // 是否可以执行批次
    canExecuteBatch() {
      if (this.orderDetail.status !== '21') return false
      // 只有创建人或指定变更人可以执行
      const isCreator = this.orderDetail.username === this.currentUser
      const isAssigner = this.orderDetail.assigner === this.currentUser
      return isCreator || isAssigner
    },

    // 是否可以执行单个设备
    canExecuteDevice() {
      if (this.orderDetail.status !== '21') return false
      // 只有创建人或指定变更人可以执行
      const isCreator = this.orderDetail.username === this.currentUser
      const isAssigner = this.orderDetail.assigner === this.currentUser
      return isCreator || isAssigner
    },

    // 是否有任何操作权限
    hasAnyAction() {
      return this.canSubmit || this.canTakeover || this.canApprove ||
             this.canExecute || this.canFinishChange || this.canCancel
    }
  },

  mounted() {
    // 从 store 获取用户信息
    const userInfo = this.$store.getters["user/user_info"]
    this.currentUser = (userInfo && userInfo.username) || localStorage.getItem('username') || ''
    this.currentRid = (userInfo && userInfo.rid) || localStorage.getItem('rid') || ''

    // 从路由获取工单ID
    this.opId = this.$route.query.op_id || this.$route.params.op_id

    if (!this.opId) {
      this.$message.error('缺少工单ID')
      this.goBack()
      return
    }

    this.loadTypeList()
    this.loadOrderDetail()
    this.loadDeviceList()
    this.loadLogList()
  },

  methods: {
    // 返回工单列表
    goBack() {
      this.$router.push({ path: '/pages/alteration/alteration_manage' })
    },

    // 是否可以回滚设备（单台设备）
    canRollbackDevice(device) {
      if (this.orderDetail.status !== '21') return false
      if (device.status !== '10') return false
      // 只有创建人或指定变更人可以回滚
      const isCreator = this.orderDetail.username === this.currentUser
      const isAssigner = this.orderDetail.assigner === this.currentUser
      return isCreator || isAssigner
    },

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

    // 加载工单详情
    loadOrderDetail() {
      this.loading = true
      alterationApi.getOrderDetail({ op_id: this.opId }).then(response => {
        if (response.data.code === 0) {
          this.orderDetail = response.data.data || {}
          this.updateStepItems()
        } else {
          this.$message.error(response.data.message || '加载工单详情失败')
        }
        this.loading = false
      }).catch(error => {
        console.error('加载工单详情失败:', error)
        this.$message.error('加载工单详情失败')
        this.loading = false
      })
    },

    // 获取步骤状态
    getStepStatus(index) {
      const currentActive = this.stepItems.active
      const status = this.orderDetail.status

      // index 从 0 开始，active 从 1 开始
      const stepNumber = index + 1

      if (stepNumber < currentActive) {
        // 已完成的步骤
        return 'success'
      } else if (stepNumber === currentActive) {
        // 当前步骤
        if (status === '92') {
          // 审批拒绝，当前步骤显示错误
          return 'error'
        } else if (status === '91') {
          // 变更失败，当前步骤显示错误
          return 'error'
        } else {
          // 进行中
          return 'process'
        }
      } else {
        // 未开始的步骤
        return 'wait'
      }
    },

    // 更新进度条
    updateStepItems() {
      const status = this.orderDetail.status
      const nodeInfo = this.orderDetail.node_info
      const stepId = this.orderDetail.step_id || 0

      // 如果有 node_info，使用后端返回的节点信息
      if (nodeInfo && nodeInfo !== '') {
        try {
          const nodes = JSON.parse(nodeInfo)
          if (nodes && nodes.length > 0) {
            // 将后端节点转换为前端进度条格式
            const steps = nodes.map(node => ({
              id: node.id,
              title: node.title,
              description: node.description || ''
            }))

            // 根据状态确定激活步骤
            let active = stepId

            // 处理特殊状态
            if (status === '00') {
              // 草稿状态，未开始流程
              active = 0
            } else if (status === '21') {
              // 变更中：当前在"开始变更"节点，激活到下一步（让"开始变更"显示为已完成）
              active = stepId + 1
            } else if (status === '90' || status === '91') {
              // 变更完成或失败：激活到超出最后一步（让最后一步显示为已完成）
              active = steps.length + 1
            }
            // 其他状态（'01', '02', '20', '92', '93'）直接使用后端的 step_id

            this.stepItems = {
              active: active,
              nodes: steps
            }
            return
          }
        } catch (e) {
          console.error('解析 node_info 失败:', e)
        }
      }

      // 如果没有 node_info 或解析失败，不显示进度条
      this.stepItems = {
        active: 0,
        nodes: []
      }
    },

    // 加载设备列表
    loadDeviceList() {
      alterationApi.getDeviceList({ op_id: this.opId }).then(response => {
        if (response.data.code === 0) {
          this.deviceList = response.data.data || []
          // 默认激活第一个设备
          if (this.deviceList.length > 0 && !this.activeDeviceTab) {
            this.activeDeviceTab = String(this.deviceList[0].pid)
          }
        } else {
          this.$message.error(response.data.message || '加载设备列表失败')
        }
      }).catch(error => {
        console.error('加载设备列表失败:', error)
      })
    },

    // 加载操作日志
    loadLogList() {
      alterationApi.getLogList({ op_id: this.opId }).then(response => {
        if (response.data.code === 0) {
          this.logList = response.data.data || []
        } else {
          this.$message.error(response.data.message || '加载操作日志失败')
        }
      }).catch(error => {
        console.error('加载操作日志失败:', error)
      })
    },

    // 获取工单类型名称
    getTypeName(typeId) {
      const type = this.typeList.find(t => t.pid === typeId)
      return type ? type.name : '-'
    },

    // 获取状态文本
    getStatusText(status) {
      const option = this.statusOptions.find(s => s.value === status)
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

    // 获取设备状态文本
    getDeviceStatusText(status) {
      const statusMap = {
        '00': '未执行',
        '10': '执行成功',
        '90': '执行失败'
      }
      return statusMap[status] || status
    },

    // 获取设备状态类型
    getDeviceStatusType(status) {
      const typeMap = {
        '00': 'info',
        '10': 'success',
        '90': 'danger'
      }
      return typeMap[status] || 'info'
    },

    // 获取日志标签样式
    getLogTagClass(tag) {
      const classMap = {
        '01': 'cm_tag1',
        '02': 'cm_tag2',
        '03': 'cm_tag3',
        '04': 'cm_tag2',
        '05': 'cm_tag3',
        '06': 'cm_tag4',
        '07': 'cm_tag5',
        '08': 'cm_tag6',
        '09': 'cm_tag1'
      }
      return classMap[tag] || ''
    },

    // 获取日志标签文本
    getLogTagText(tag) {
      const textMap = {
        '01': '草稿',
        '02': '修改工单',
        '03': '提交工单',
        '04': '接手工单',
        '05': '审批通过',
        '06': '审批拒绝',
        '07': '开始变更',
        '08': '变更完成',
        '09': '取消工单'
      }
      return textMap[tag] || ''
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(parseInt(timestamp) * 1000)
      const pad = n => String(n).padStart(2, '0')
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
             pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    },

    // ==================== 流程操作 ====================
    handleSubmit() {
      this.$confirm('确认提交工单吗？提交后将进入审批流程', '提交确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.submitting = true
        alterationApi.submitOrder({ op_id: this.opId }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('提交成功')
            this.loadOrderDetail()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '提交失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('提交工单失败:', error)
          this.$message.error('提交失败')
          this.submitting = false
        })
      }).catch(() => {})
    },

    handleTakeover() {
      this.$confirm('确认接手此工单吗？接手后将由您负责审批', '接手确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.submitting = true
        alterationApi.takeoverOrder({ op_id: this.opId }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('接手成功')
            this.loadOrderDetail()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '接手失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('接手工单失败:', error)
          this.$message.error('接手失败')
          this.submitting = false
        })
      }).catch(() => {})
    },

    handleApprove(status) {
      this.approveDialogTitle = status === '10' ? '审批通过' : '审批拒绝'
      this.approveForm.status = status
      this.approveForm.comment = ''
      this.approveDialogVisible = true
    },

    confirmApprove() {
      this.submitting = true
      alterationApi.approveOrder({
        op_id: this.opId,
        status: this.approveForm.status,
        comment: this.approveForm.comment
      }).then(response => {
        if (response.data.code === 0) {
          this.$message.success('审批完成')
          this.approveDialogVisible = false
          this.loadOrderDetail()
          this.loadLogList()
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

    handleExecute() {
      this.$confirm('确认开始变更吗？变更前将自动备份所有设备配置。', '开始变更确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.executing = true
        alterationApi.startChange({ op_id: this.opId }).then(response => {
          if (response.data.code === 0) {
            const data = response.data.data || {}
            this.$message.success(`开始变更成功，配置备份完成(${data.success || 0}成功/${data.failed || 0}失败)`)
            this.loadOrderDetail()
            this.loadDeviceList()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '开始变更失败')
          }
          this.executing = false
        }).catch(error => {
          console.error('开始变更失败:', error)
          this.$message.error('开始变更失败')
          this.executing = false
        })
      }).catch(() => {})
    },

    handleExecuteBatch(batch) {
      // 过滤出状态为00的设备
      const executableDevices = batch.devices.filter(d => d.status === '00')

      if (executableDevices.length === 0) {
        this.$message.warning('该批次没有可执行的设备（状态为未执行的设备）')
        return
      }

      const totalCount = batch.devices.length
      const executableCount = executableDevices.length
      const skipCount = totalCount - executableCount

      let confirmMsg = `确认执行批次 ${batch.batch} 的 ${executableCount} 台设备吗？`
      if (skipCount > 0) {
        confirmMsg += `\n（将跳过 ${skipCount} 台已执行过的设备）`
      }

      this.$confirm(confirmMsg, '执行确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.executing = true
        const deviceIds = executableDevices.map(d => d.pid)
        alterationApi.executeBatch({ op_id: this.opId, device_ids: deviceIds }).then(response => {
          if (response.data.code === 0) {
            this.$message.success(`批次 ${batch.batch} 开始执行（${executableCount}台设备）`)
            this.loadDeviceList()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '执行失败')
          }
          this.executing = false
        }).catch(error => {
          console.error('执行批次失败:', error)
          this.$message.error('执行失败')
          this.executing = false
        })
      }).catch(() => {})
    },

    handleExecuteDevice(device) {
      this.$confirm(`确认执行设备 ${device.sysname}(${device.ip}) 的变更吗？`, '执行确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.executing = true
        alterationApi.executeDevice({ op_id: this.opId, device_id: device.pid }).then(response => {
          if (response.data.code === 0) {
            this.$message.success(`设备 ${device.sysname} 开始执行`)
            this.loadDeviceList()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '执行失败')
          }
          this.executing = false
        }).catch(error => {
          console.error('执行设备失败:', error)
          this.$message.error('执行失败')
          this.executing = false
        })
      }).catch(() => {})
    },

    handleRollbackDevice(device) {
      this.$confirm(`确认回滚设备 ${device.sysname}(${device.ip}) 吗？`, '回滚确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$set(this.rollingDevice, device.pid, true)
        alterationApi.rollbackDevice({ op_id: this.opId, device_id: device.pid }).then(response => {
          if (response.data.code === 0) {
            this.$message.success(`设备 ${device.sysname} 开始回滚`)
            this.loadDeviceList()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '回滚失败')
          }
          this.$set(this.rollingDevice, device.pid, false)
        }).catch(error => {
          console.error('回滚设备失败:', error)
          this.$message.error('回滚失败')
          this.$set(this.rollingDevice, device.pid, false)
        })
      }).catch(() => {})
    },

    handleFinishChange() {
      this.$confirm('确认结束变更吗？', '结束确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.finishing = true
        alterationApi.finishChange({ op_id: this.opId }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('变更已结束')
            this.loadOrderDetail()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '结束变更失败')
          }
          this.finishing = false
        }).catch(error => {
          console.error('结束变更失败:', error)
          this.$message.error('结束变更失败')
          this.finishing = false
        })
      }).catch(() => {})
    },

    handleCancel() {
      this.$confirm('确认取消工单吗？', '取消确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.submitting = true
        alterationApi.cancelOrder({ op_id: this.opId }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('工单已取消')
            this.loadOrderDetail()
            this.loadLogList()
          } else {
            this.$message.error(response.data.message || '取消失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('取消工单失败:', error)
          this.$message.error('取消失败')
          this.submitting = false
        })
      }).catch(() => {})
    },

    // ==================== 设备管理 ====================
    loadDeviceOptions() {
      this.deviceSearchLoading = true
      collectorApi.getDevs({}).then(response => {
        if (response.data.code === 0) {
          this.deviceOptions = response.data.data || []
        } else {
          this.deviceOptions = []
        }
        this.deviceSearchLoading = false
      }).catch(error => {
        console.error('加载设备列表失败:', error)
        this.deviceOptions = []
        this.deviceSearchLoading = false
      })
    },

    handleDeviceSelect(ip) {
      const device = this.deviceOptions.find(d => d.ip === ip)
      if (device) {
        this.deviceForm.sysname = device.sysname || ''
        this.deviceForm.model = device.hardware || ''
        this.deviceForm.asset_no = device.syscontact || ''
      }
    },

    handleAddDevice() {
      this.deviceDialogTitle = '添加设备'
      this.isEditDevice = false
      this.deviceForm = {
        pid: null,
        batch: 1,
        ip: '',
        sysname: '',
        model: '',
        asset_no: '',
        cmd_exec: '',
        cmd_roll: '',
        status: '00'
      }
      // 打开对话框时加载设备列表
      this.loadDeviceOptions()
      this.deviceDialogVisible = true
    },

    handleEditDevice(row) {
      this.deviceDialogTitle = '编辑设备'
      this.isEditDevice = true
      this.deviceForm = {
        pid: row.pid,
        batch: row.batch,
        ip: row.ip,
        sysname: row.sysname,
        model: row.model,
        asset_no: row.asset_no,
        cmd_exec: row.cmd_exec,
        cmd_roll: row.cmd_roll,
        status: row.status
      }
      this.deviceDialogVisible = true
    },

    handleSaveDevice() {
      this.$refs.deviceForm.validate(valid => {
        if (!valid) return

        this.submitting = true

        const params = {
          op_id: this.opId,
          batch: this.deviceForm.batch,
          ip: this.deviceForm.ip,
          sysname: this.deviceForm.sysname,
          model: this.deviceForm.model,
          asset_no: this.deviceForm.asset_no,
          cmd_exec: this.deviceForm.cmd_exec,
          cmd_roll: this.deviceForm.cmd_roll,
          status: '00'
        }

        if (this.isEditDevice) {
          params.pid = this.deviceForm.pid
        }

        const apiCall = this.isEditDevice ?
          alterationApi.updateDevice(params) :
          alterationApi.addDevice(params)

        apiCall.then(response => {
          if (response.data.code === 0) {
            this.$message.success(this.isEditDevice ? '保存成功' : '添加成功')
            this.deviceDialogVisible = false
            this.loadDeviceList()
          } else {
            this.$message.error(response.data.message || '操作失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('保存设备失败:', error)
          this.$message.error('操作失败')
          this.submitting = false
        })
      })
    },

    handleDeleteDevice(row) {
      this.$confirm('确认删除该设备配置吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        alterationApi.deleteDevice({ pid: row.pid }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('删除成功')
            this.loadDeviceList()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除设备失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    handleViewResult(row) {
      this.currentResult = row.result || '无执行结果'
      this.resultDialogVisible = true
    },

    // 是否可以查看配置对比
    canViewConfigDiff(device) {
      // 只有在变更结束后（状态90或91）才能查看配置对比
      return ['90', '91'].includes(this.orderDetail.status)
    },

    // 查看配置对比
    handleViewConfigDiff(device) {
      this.currentDiffDevice = device
      this.configDiffMode = 'diff'  // 默认差异对比
      this.loadConfigDiff(device, false)
      this.configDiffDialogVisible = true
    },

    // 加载配置对比数据
    loadConfigDiff(device, fullDiff) {
      this.loadingConfigDiff = true
      this.configDiffData = {
        html: '',
        stats: { added: 0, deleted: 0, modified: 0 },
        before: null,
        after: null
      }

      configApi.compareConfigByOrder({
        ip: device.ip,
        op_id: this.opId,
        full_diff: fullDiff
      }).then(response => {
        if (response.data.code === 0) {
          const data = response.data.data || {}
          this.configDiffData = {
            html: data.html || '',
            stats: data.stats || { added: 0, deleted: 0, modified: 0 },
            before: data.before,
            after: data.after
          }
        } else {
          this.$message.error(response.data.message || '获取配置对比失败')
        }
        this.loadingConfigDiff = false
      }).catch(error => {
        console.error('获取配置对比失败:', error)
        this.$message.error('获取配置对比失败')
        this.loadingConfigDiff = false
      })
    },

    // 切换对比模式
    handleDiffModeChange(mode) {
      if (!this.currentDiffDevice) return
      const fullDiff = mode === 'full'
      this.loadConfigDiff(this.currentDiffDevice, fullDiff)
    }
  }
}
</script>

<style scoped>
.order-detail {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  margin-left: 10px;
}

/* 进度条 */
.progress-section {
  background: #fff;
  padding: 30px 40px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 上半部分布局 */
.top-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.info-section {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 580px;
}

.info-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.info-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-content {
  padding: 20px;
  flex: 1;
}

.info-row {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-item .label {
  color: #909399;
  font-size: 13px;
}

.info-item .value {
  color: #606266;
  font-size: 13px;
}

.descrip-box {
  margin-top: 20px;
  padding: 15px;
  background: #f9fafc;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.descrip-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.descrip-content {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 13px;
  color: #606266;
  overflow-y: auto;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
}

/* 操作记录 */
.log-section {
  width: 550px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 580px;
}

.section-title {
  padding: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.log-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  padding: 12px;
  background: #f9fafc;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.log-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log_tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.cm_tag1 { background: #e4e7ed; color: #606266; }
.cm_tag2 { background: #e1f3d8; color: #67c23a; }
.cm_tag3 { background: #d9ecff; color: #409eff; }
.cm_tag4 { background: #fde2e2; color: #f56c6c; }
.cm_tag5 { background: #fdf6ec; color: #e6a23c; }
.cm_tag6 { background: #f4f4f5; color: #909399; }

.log-msg {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.log-user {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

/* 下半部分 */
.bottom-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.device-count {
  font-size: 13px;
  color: #909399;
  font-weight: normal;
}

/* 批次分组 */
.batch-container {
  padding: 20px;
}

.batch-group {
  margin-bottom: 30px;
}

.batch-group:last-child {
  margin-bottom: 0;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px;
  margin-bottom: 15px;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-number {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.batch-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.batch-actions {
  display: flex;
  align-items: center;
}

.batch-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.batch-devices {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 设备卡片 */
.device-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  transition: box-shadow 0.3s;
}

.device-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.device-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f5f7fa;
  background: #fafbfc;
}

.device-card-info h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.device-card-info p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.device-card-status {
  display: flex;
  align-items: center;
  gap: 15px;
}

.device-card-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.device-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cmd-block {
  background: #f9fafc;
  border-radius: 4px;
  padding: 12px;
  border: 1px solid #ebeef5;
}

.cmd-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cmd-text {
  margin: 0;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 12px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: 1px solid #dcdfe6;
}

.result-link {
  padding: 5px;
}

.empty-device {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 15px;
}

.empty-text {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.result-content {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.result-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

/* 配置对比对话框 */
.config-diff-wrapper {
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
}

.diff-info {
  display: flex;
  gap: 30px;
  flex: 1;
}

.diff-info-item {
  font-size: 13px;
  color: #606266;
}

.diff-label {
  font-weight: 600;
  color: #303133;
  margin-right: 5px;
}

.diff-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.diff-stats {
  display: flex;
  gap: 10px;
}

.diff-content {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.diff-content >>> table {
  width: 100%;
  border-collapse: collapse;
}

.diff-content >>> td {
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.6;
  font-family: 'Courier New', Consolas, monospace;
  vertical-align: top;
}

.diff-content >>> .diff_header {
  background-color: #f5f5f5;
  font-weight: 600;
  text-align: center;
  padding: 8px;
}

.diff-content >>> .diff_next {
  background-color: #e8f4ff;
  text-align: center;
  cursor: pointer;
}

.diff-content >>> .diff_add {
  background-color: #e6ffed;
}

.diff-content >>> .diff_chg {
  background-color: #fff3cd;
}

.diff-content >>> .diff_sub {
  background-color: #ffe6e6;
}
</style>
