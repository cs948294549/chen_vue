<template>
  <el-dialog
    :title="mode === 'create' ? '添加节点' : '编辑节点'"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose">
    <el-form ref="form" :model="formData" :rules="rules" label-width="80px" size="small">
      <el-form-item label="节点ID" prop="id">
        <el-input v-model="formData.id" placeholder="请输入节点ID（如：192.168.1.1）" :disabled="mode === 'edit'"></el-input>
      </el-form-item>

      <el-form-item label="节点名称" prop="label">
        <el-input v-model="formData.label" placeholder="请输入节点名称（如：Core-SW-01）"></el-input>
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
      formData: {
        id: '',
        label: '',
        group: 'switch',
        title: ''
      },
      rules: {
        id: [
          { required: true, message: '请输入节点ID', trigger: 'blur' }
        ],
        label: [
          { required: true, message: '请输入节点名称', trigger: 'blur' }
        ],
        group: [
          { required: true, message: '请选择节点类型', trigger: 'change' }
        ]
      },
      submitting: false
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
      if (this.mode === 'edit' && this.nodeData) {
        this.formData = {
          id: this.nodeData.id,
          label: this.nodeData.label || '',
          group: this.nodeData.group || 'switch',
          title: this.nodeData.title || ''
        }
      } else {
        this.formData = {
          id: '',
          label: '',
          group: 'switch',
          title: ''
        }
      }

      // 清除验证
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
