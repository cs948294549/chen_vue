<template>
  <el-dialog
    :title="mode === 'create' ? '添加节点' : '编辑节点'"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose">
    <el-form ref="form" :model="formData" :rules="rules" label-width="80px" size="small">
      <el-form-item label="选择设备" prop="device" v-if="mode === 'create'">
        <el-select
          v-model="selectedDevice"
          filterable
          placeholder="请输入设备名称或IP搜索"
          @change="handleDeviceSelect"
          style="width: 100%;">
          <el-option
            v-for="item in deviceList"
            :key="item.ip"
            :label="`${item.sysname} (${item.ip})`"
            :value="item.ip">
            <span style="float: left">{{ item.sysname }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px">{{ item.ip }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="节点ID" prop="id">
        <el-input v-model="formData.id" placeholder="请输入节点ID（如：192.168.1.1）" :disabled="mode === 'edit'"></el-input>
      </el-form-item>

      <el-form-item label="显示名称" prop="label">
        <el-input v-model="formData.label" placeholder="请输入拓扑图上显示的名称（如：核心交换机）"></el-input>
      </el-form-item>

      <el-form-item label="设备名" prop="deviceName">
        <el-input v-model="formData.deviceName" placeholder="请输入设备实际名称（用于搜索关联）"></el-input>
        <div style="font-size: 12px; color: #909399; margin-top: 4px;">设备实际名称，用于搜索和关联，不影响拓扑图显示</div>
      </el-form-item>

      <el-form-item label="节点类型" prop="group">
        <el-select v-model="formData.group" placeholder="请选择节点类型" style="width: 100%;">
          <el-option label="路由器" value="router"></el-option>
          <el-option label="交换机" value="switch"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="悬浮提示" prop="title">
        <el-input v-model="formData.title" placeholder="请输入悬浮提示信息（可选）"></el-input>
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
        this.formData = {
          id: this.nodeData.id,
          label: this.nodeData.label || '',
          deviceName: (this.nodeData.meta && this.nodeData.meta.sysname) || this.nodeData.label || '',  // 从 meta.sysname 读取
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
    },

    handleDeviceSelect(ip) {
      const device = this.deviceList.find(d => d.ip === ip)
      if (device) {
        this.formData.id = device.ip
        this.formData.label = device.sysname  // 默认显示名称也使用设备名
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
          if (this.formData.meta) {
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

          console.log('=== 提交的节点数据 ===')
          console.log('模式:', this.mode)
          console.log('节点数据:', JSON.stringify(nodeData, null, 2))

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
</style>
