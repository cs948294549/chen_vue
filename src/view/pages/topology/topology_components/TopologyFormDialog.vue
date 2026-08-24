<template>
  <el-dialog :title="title" :visible.sync="visible" width="600px" :close-on-click-modal="false" @close="handleClose">
    <el-form ref="form" :model="formData" :rules="rules" label-width="100px" size="small">
      <el-form-item label="拓扑名称" prop="topology_name">
        <el-input v-model="formData.topology_name" placeholder="请输入拓扑名称"></el-input>
      </el-form-item>
      <el-form-item label="分类路径" prop="category_types">
        <el-select
          v-model="categoryInput"
          placeholder="输入分类路径，如：按机房/IDC-A/核心层"
          clearable
          filterable
          allow-create
          style="width: 100%;"
          @change="handleCategoryChange">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
        <div style="margin-top: 5px; color: #999; font-size: 12px;">
          提示：使用"/"分隔多级分类，例如：按机房/IDC-A/核心层
        </div>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入拓扑描述"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" size="small" :loading="submitting">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'TopologyFormDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create' // 'create' | 'edit'
    },
    topologyData: {
      type: Object,
      default: null
    },
    categoryOptions: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      formData: {
        topology_name: '',
        category_types: [],
        description: ''
      },
      categoryInput: '',
      rules: {
        topology_name: [
          { required: true, message: '请输入拓扑名称', trigger: 'blur' }
        ]
      },
      submitting: false
    }
  },

  computed: {
    title() {
      return this.mode === 'create' ? '新建拓扑' : '编辑拓扑'
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    }
  },

  methods: {
    initForm() {
      if (this.mode === 'edit' && this.topologyData) {
        this.formData = {
          topology_id: this.topologyData.topology_id,
          topology_name: this.topologyData.topology_name,
          category_types: this.topologyData.category_types || [],
          description: this.topologyData.description || '',
          version: this.topologyData.version
        }
        this.categoryInput = this.topologyData.category_types && this.topologyData.category_types.length > 0
          ? this.topologyData.category_types.join('/')
          : ''
      } else {
        this.formData = {
          topology_name: '',
          category_types: [],
          description: ''
        }
        this.categoryInput = ''
      }

      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    handleCategoryChange(value) {
      if (value) {
        this.formData.category_types = value.split('/').map(s => s.trim()).filter(s => s !== '')
      } else {
        this.formData.category_types = []
      }
    },

    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.submitting = true
          this.$emit('submit', { ...this.formData })

          // 提交后由父组件控制关闭和loading状态
          setTimeout(() => {
            this.submitting = false
          }, 100)
        }
      })
    },

    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
</style>
