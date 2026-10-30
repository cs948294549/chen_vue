<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="540px"
    :close-on-click-modal="false"
    @close="handleClose">
    <div slot="title" class="dialog-title">
      <i :class="mode === 'create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>{{ mode === 'create' ? '添加节点' : '编辑节点' }}
    </div>
    <el-form ref="form" :model="formData" :rules="rules" label-width="90px" size="small">
      <el-form-item label="节点类型" prop="group">
        <el-radio-group v-model="formData.group" @change="handleGroupChange">
          <el-radio-button label="switch"><i class="el-icon-s-grid"></i> 交换机</el-radio-button>
          <el-radio-button label="router"><i class="el-icon-share"></i> 路由器</el-radio-button>
          <el-radio-button label="cloud"><i class="el-icon-cloudy"></i> 云</el-radio-button>
        </el-radio-group>
        <div v-if="isCloud" class="form-tip">云节点表示公网、运营商、专线或外部网络等逻辑区域，不关联具体设备</div>
      </el-form-item>

      <el-form-item label="选择设备" prop="device" v-if="mode === 'create' && !isCloud">
        <el-select
          v-model="selectedDevice"
          filterable
          :loading="deviceLoading"
          placeholder="输入设备名称或IP搜索，自动填充下方信息"
          @change="handleDeviceSelect"
          style="width: 100%;">
          <el-option
            v-for="item in deviceList"
            :key="item.ip"
            :label="`${item.sysname} (${item.ip})`"
            :value="item.ip">
            <span class="opt-name">{{ item.sysname }}</span>
            <span class="opt-ip">{{ item.ip }}</span>
          </el-option>
        </el-select>
        <div v-if="selectedInfo" class="dev-info">
          <span><em>型号</em>{{ selectedInfo.model || '-' }}</span>
          <span><em>厂商</em>{{ selectedInfo.vendor || '-' }}</span>
          <span v-if="selectedInfo.location"><em>位置</em>{{ selectedInfo.location }}</span>
        </div>
      </el-form-item>

      <el-form-item label="节点ID" prop="id">
        <el-input
          v-model="formData.id"
          class="mono-input"
          :placeholder="isCloud ? '唯一标识，如：cloud-telecom' : '设备管理IP，如：192.168.1.1'"
          :disabled="mode === 'edit'"></el-input>
      </el-form-item>

      <el-form-item label="显示名称" prop="label">
        <el-input v-model="formData.label" :placeholder="isCloud ? '拓扑图上显示的名称，如：电信公网' : '拓扑图上显示的名称，如：核心交换机'"></el-input>
      </el-form-item>

      <el-form-item v-if="!isCloud" key="dev-name" label="设备名" prop="deviceName">
        <el-input v-model="formData.deviceName" placeholder="设备实际名称（sysname）"></el-input>
        <div class="form-tip">用于 LLDP 自动连线和搜索关联，不影响拓扑图显示；填写 <span class="mono">设备名[接口名]</span> 时链路详情直接按该接口查询</div>
      </el-form-item>
      <el-form-item v-else key="cloud-dev-name" label="设备名">
        <el-input v-model="formData.deviceName" class="mono-input" placeholder="可选，如：CORE-01[GigabitEthernet1/0/24]"></el-input>
        <div class="form-tip">填写 <span class="mono">设备名[接口名]</span> 后，链路详情直接查询该设备接口（云端没有 LLDP）</div>
      </el-form-item>

      <el-form-item label="悬浮提示" prop="title">
        <el-input v-model="formData.title" placeholder="鼠标悬停节点时显示（可选）"></el-input>
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" size="small" :loading="submitting">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import collectorApi from '@/api/mapis/collector_interface'

export default {
  name: 'NodeFormDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create' // 'create' | 'edit'
    },
    nodeData: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      dialogVisible: false,
      submitting: false,

      // 设备搜索
      selectedDevice: '',
      deviceList: [],
      deviceLoading: false,

      formData: {
        id: '',
        label: '',
        deviceName: '',  // 设备实际名称（存储在 meta.sysname）
        group: 'switch',
        title: '',
        meta: null  // 保存完整的 meta 数据
      },
      rules: {
        id: [
          { required: true, message: '请输入节点ID', trigger: 'blur' }
        ],
        label: [
          { required: true, message: '请输入显示名称', trigger: 'blur' }
        ],
        deviceName: [
          { required: true, message: '请输入设备名', trigger: 'blur' }
        ],
        group: [
          { required: true, message: '请选择节点类型', trigger: 'change' }
        ]
      }
    }
  },

  computed: {
    // 云节点：逻辑区域，不关联设备
    isCloud() {
      return this.formData.group === 'cloud'
    },
    // 已选设备的补充信息
    selectedInfo() {
      if (!this.selectedDevice) return null
      return this.deviceList.find(d => d.ip === this.selectedDevice) || null
    }
  },

  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.initForm()
        // 对话框打开时加载设备列表
        if (this.mode === 'create' && this.deviceList.length === 0) {
          this.loadDevices()
        }
      }
    },
    dialogVisible(val) {
      if (!val) {
        this.$emit('update:visible', false)
      }
    }
  },

  methods: {
    initForm() {
      if (this.mode === 'edit' && this.nodeData) {
        const sysname = (this.nodeData.meta && this.nodeData.meta.sysname) || ''
        this.formData = {
          id: this.nodeData.id,
          label: this.nodeData.label || '',
          // 只从 meta.sysname 读取，不回退到 label，避免提交后把显示名称写进设备名
          deviceName: sysname,
          group: this.nodeData.group || 'switch',
          title: this.nodeData.title || '',
          meta: this.nodeData.meta || null  // 保留原有的 meta 数据
        }
      } else {
        this.formData = {
          id: '',
          label: '',
          deviceName: '',
          group: 'switch',
          title: '',
          meta: null
        }
        this.selectedDevice = ''
      }

      // 清除验证
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    loadDevices() {
      // 加载全部设备列表
      this.deviceLoading = true
      collectorApi.getDevs({})
        .then(response => {
          const res = response.data
          if (res.code === 0) {
            this.deviceList = res.data || []
          } else {
            this.$message.error('加载设备列表失败: ' + res.message)
          }
        })
        .catch(error => {
          console.error('加载设备列表失败:', error)
          this.$message.error('加载设备列表失败')
        })
        .finally(() => {
          this.deviceLoading = false
        })
    },

    handleDeviceSelect(ip) {
      const device = this.deviceList.find(d => d.ip === ip)
      if (device) {
        const prev = this.deviceList.find(d => d.ip === this.formData.id)
        this.formData.id = device.ip
        // 显示名称为空或仍是上一次自动填充的设备名时才覆盖，保留用户手动输入的名称
        if (!this.formData.label || (prev && this.formData.label === prev.sysname)) {
          this.formData.label = device.sysname
        }
        this.formData.deviceName = device.sysname  // 设备实际名称
        // 根据设备描述判断类型，默认为switch
        const desc = (device.sysdesc || '').toLowerCase()
        if (desc.includes('router')) {
          this.formData.group = 'router'
        } else {
          this.formData.group = 'switch'
        }
        this.formData.title = `${device.sysname} (${device.ip})`
      }
    },

    // 新建时切换节点类型：云节点清空设备相关信息并生成默认ID
    handleGroupChange(group) {
      if (this.mode !== 'create') return
      if (group === 'cloud') {
        if (!this.formData.id || this.formData.id === this.selectedDevice) {
          this.formData.id = 'cloud_' + Date.now().toString(36)
        }
        if (this.selectedDevice && this.formData.label === this.formData.deviceName) {
          this.formData.label = ''
        }
        this.selectedDevice = ''
        this.formData.deviceName = ''
        this.formData.title = ''
      } else if (/^cloud_/.test(this.formData.id)) {
        this.formData.id = ''
      }
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.submitting = true

          // 构建节点数据（按照正确的数据结构）
          const nodeData = {
            id: this.formData.id,
            label: this.formData.label,
            group: this.formData.group
          }

          // 可选字段
          if (this.formData.title) {
            nodeData.title = this.formData.title
          }

          // 添加或保留 meta 元数据
          if (this.isCloud) {
            // 云节点不对应真实设备，sysname 仅允许填写 设备名[接口名] 用于链路接口查询
            nodeData.meta = {
              ip: '',
              sysname: (this.formData.deviceName || '').trim(),
              model: '',
              vendor: '',
              sysdesc: '',
              location: ''
            }
          } else if (this.formData.meta) {
            // 如果 formData 中有 meta，更新 sysname 后使用
            nodeData.meta = {
              ...this.formData.meta,
              sysname: this.formData.deviceName  // 更新设备名
            }
          } else {
            // 如果没有 meta，尝试从设备列表获取或初始化
            const device = this.deviceList.find(d => d.ip === this.formData.id)
            if (device) {
              nodeData.meta = {
                ip: device.ip,
                sysname: this.formData.deviceName,  // 使用用户输入的设备名
                model: device.model || '',
                vendor: device.vendor || '',
                sysdesc: device.sysdesc || '',
                location: device.location || ''
              }
            } else {
              // 初始化基本的 meta 结构
              nodeData.meta = {
                ip: this.formData.id,
                sysname: this.formData.deviceName,  // 使用用户输入的设备名
                model: '',
                vendor: '',
                sysdesc: '',
                location: ''
              }
            }
          }

          this.$emit('submit', nodeData)

          setTimeout(() => {
            this.submitting = false
          }, 100)
        }
      })
    },

    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dialog-title i {
  margin-right: 6px;
  color: #409eff;
}
.opt-name {
  float: left;
}
.opt-ip {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: #8492a6;
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.dev-info {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  padding: 6px 10px;
  line-height: 20px;
  font-size: 12px;
  color: #606266;
  border-radius: 4px;
  background: #f5f7fa;
}
.dev-info span {
  margin-right: 16px;
}
.dev-info em {
  margin-right: 4px;
  font-style: normal;
  color: #909399;
}
.mono-input /deep/ input {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
  color: #606266;
}
.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}
</style>
