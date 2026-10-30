<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose">
    <div slot="title" class="dialog-title">
      <i class="el-icon-connection"></i>{{ mode === 'create' ? '添加连接' : '编辑连接' }}
    </div>

    <!-- 连接预览 -->
    <div class="link-preview">
      <div class="lp-end" :class="{ empty: !formData.from }">
        <div class="lp-label">源节点</div>
        <div class="lp-name">{{ nodeLabel(formData.from) || '未选择' }}</div>
        <div class="lp-ip">{{ formData.from || '-' }}</div>
      </div>
      <div class="lp-line">
        <span class="lp-bar" :style="{ background: formData.color || '#333333' }"></span>
        <span class="lp-text">{{ formData.label || '无描述' }}</span>
      </div>
      <div class="lp-end" :class="{ empty: !formData.to }">
        <div class="lp-label">目标节点</div>
        <div class="lp-name">{{ nodeLabel(formData.to) || '未选择' }}</div>
        <div class="lp-ip">{{ formData.to || '-' }}</div>
      </div>
    </div>

    <el-form ref="form" :model="formData" :rules="rules" label-width="90px" size="small">
      <el-form-item label="源节点" prop="from">
        <el-select v-model="formData.from" placeholder="请选择源节点" style="width: 100%;" filterable :disabled="mode === 'edit'">
          <el-option
            v-for="node in nodeList"
            :key="node.id"
            :label="`${node.label} (${node.id})`"
            :value="node.id">
            <span class="opt-name">{{ node.label }}</span>
            <span class="opt-ip">{{ node.id }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="目标节点" prop="to">
        <el-select v-model="formData.to" placeholder="请选择目标节点" style="width: 100%;" filterable :disabled="mode === 'edit'">
          <el-option
            v-for="node in nodeList"
            :key="node.id"
            :label="`${node.label} (${node.id})`"
            :value="node.id"
            :disabled="node.id === formData.from">
            <span class="opt-name">{{ node.label }}</span>
            <span class="opt-ip">{{ node.id }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="连接描述" prop="label">
        <el-input v-model="formData.label" placeholder="可选，如：10G、2条线路"></el-input>
      </el-form-item>

      <el-form-item label="线条颜色" prop="color">
        <el-color-picker v-model="formData.color" :predefine="colorPresets"></el-color-picker>
        <span class="form-tip-inline">默认为 #333333</span>
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" size="small" :loading="submitting">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'EdgeFormDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create' // 'create' | 'edit'
    },
    edgeData: {
      type: Object,
      default: null
    },
    nodeList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      dialogVisible: false,
      submitting: false,
      colorPresets: ['#333333', '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],

      // 表单数据
      formData: {
        from: '',
        to: '',
        label: '',
        color: '#333333'
      },

      rules: {
        from: [
          { required: true, message: '请选择源节点', trigger: 'change' }
        ],
        to: [
          { required: true, message: '请选择目标节点', trigger: 'change' }
        ]
      }
    }
  },

  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.initForm()
      }
    },
    dialogVisible(val) {
      if (!val) {
        this.$emit('update:visible', false)
      }
    }
  },

  methods: {
    nodeLabel(id) {
      if (!id) return ''
      const node = this.nodeList.find(n => n.id === id)
      return node ? node.label : id
    },

    initForm() {
      if (this.mode === 'edit' && this.edgeData) {
        this.formData = {
          from: this.edgeData.from || '',
          to: this.edgeData.to || '',
          label: this.edgeData.label || '',
          color: (this.edgeData.color && this.edgeData.color.color) || '#333333'
        }
      } else {
        this.formData = {
          from: '',
          to: '',
          label: '',
          color: '#333333'
        }
      }

      if (this.$refs.form) {
        this.$refs.form.clearValidate()
      }
    },

    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          if (this.formData.from === this.formData.to) {
            this.$message.warning('源节点和目标节点不能相同')
            return
          }

          this.submitting = true

          const edgeData = {
            id: this.mode === 'edit' ? this.edgeData.id : `${this.formData.from}@${this.formData.to}`,
            from: this.formData.from,
            to: this.formData.to,
            label: this.formData.label || '',
            color: {
              color: this.formData.color || '#333333'
            }
          }

          // 编辑模式下保留meta数据
          if (this.mode === 'edit' && this.edgeData.meta) {
            edgeData.meta = this.edgeData.meta
          }

          this.$emit('submit', [edgeData])

          setTimeout(() => {
            this.submitting = false
            this.handleClose()
          }, 500)
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

.link-preview {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.lp-end {
  width: 150px;
  min-width: 0;
  text-align: center;
}
.lp-end.empty .lp-name {
  color: #c0c4cc;
}
.lp-label {
  font-size: 12px;
  color: #909399;
}
.lp-name {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lp-ip {
  font-size: 12px;
  color: #909399;
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.lp-line {
  flex: 1;
  min-width: 0;
  position: relative;
  margin: 0 10px;
  text-align: center;
}
.lp-bar {
  display: block;
  height: 2px;
  border-radius: 1px;
}
.lp-text {
  display: inline-block;
  max-width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.form-tip-inline {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  vertical-align: top;
}
</style>
