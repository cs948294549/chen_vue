<template>
  <el-dialog
    :visible="visible"
    width="560px"
    custom-class="topo-form-dialog"
    :close-on-click-modal="false"
    @close="handleClose">
    <div slot="title" class="dialog-title">
      <i :class="mode === 'create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>{{ title }}
    </div>
    <el-form ref="form" :model="formData" :rules="rules" label-width="90px" size="small">
      <el-form-item label="拓扑名称" prop="topology_name">
        <el-input v-model="formData.topology_name" placeholder="请输入拓扑名称" maxlength="64" show-word-limit></el-input>
      </el-form-item>
      <el-form-item label="分类路径" prop="category_types">
        <el-select
          v-model="categoryInput"
          placeholder="选择已有分类，或直接输入新路径"
          clearable
          filterable
          allow-create
          default-first-option
          style="width: 100%;"
          @change="handleCategoryChange">
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
            <i class="el-icon-folder opt-icon"></i>{{ item.label }}
          </el-option>
        </el-select>
        <div v-if="formData.category_types.length" class="path-preview">
          <span v-for="(c, i) in formData.category_types" :key="i" class="path-item">
            <i v-if="i > 0" class="el-icon-arrow-right path-sep"></i>
            <span class="path-chip">{{ c }}</span>
          </span>
        </div>
        <div class="form-tip">使用"/"分隔多级分类，例如：按机房/IDC-A/核心层；留空则归入"未分类"</div>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入拓扑描述（可选）"></el-input>
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
.opt-icon {
  margin-right: 6px;
  color: #e6a23c;
}
.path-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}
.path-item {
  display: inline-flex;
  align-items: center;
  margin-bottom: 4px;
}
.path-chip {
  padding: 0 8px;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  border-radius: 4px;
  color: #409eff;
  background: #ecf5ff;
}
.path-sep {
  margin: 0 4px;
  font-size: 12px;
  color: #c0c4cc;
}
.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}
</style>
