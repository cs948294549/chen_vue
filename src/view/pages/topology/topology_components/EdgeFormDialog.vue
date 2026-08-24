<template>
  <el-dialog
    :title="mode === 'create' ? '添加连接' : '编辑连接'"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose">
    <el-form ref="form" :model="formData" :rules="rules" label-width="100px" size="small">
      <el-form-item label="源节点" prop="from">
        <el-select v-model="formData.from" placeholder="请选择源节点" style="width: 100%;" filterable :disabled="mode === 'edit'">
          <el-option
            v-for="node in nodeList"
            :key="node.id"
            :label="`${node.label} (${node.id})`"
            :value="node.id">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="目标节点" prop="to">
        <el-select v-model="formData.to" placeholder="请选择目标节点" style="width: 100%;" filterable :disabled="mode === 'edit'">
          <el-option
            v-for="node in nodeList"
            :key="node.id"
            :label="`${node.label} (${node.id})`"
            :value="node.id">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="连接描述" prop="label">
        <el-input v-model="formData.label" placeholder="请输入连接描述（可选，如：10G）"></el-input>
      </el-form-item>

      <el-form-item label="线条颜色" prop="color">
        <el-color-picker v-model="formData.color"></el-color-picker>
        <span style="margin-left: 10px; color: #909399; font-size: 12px;">默认为 #333333</span>
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
</style>
