<template>
  <div class="uri-page">
    <!-- 工具栏 -->
    <div class="uri-toolbar">
      <div class="uri-filters">
        <el-input
          v-model="filter_uri"
          size="small"
          class="uri-search mono-input"
          prefix-icon="el-icon-search"
          placeholder="搜索接口路径"
          clearable
          @keyup.enter.native="searchKey"></el-input>
        <el-radio-group v-model="filter_privilege" size="small">
          <el-radio-button label="">全部 {{ table_data.length }}</el-radio-button>
          <el-radio-button label="0">只读 {{ privilegeStats.readonly }}</el-radio-button>
          <el-radio-button label="1">管理 {{ privilegeStats.manage }}</el-radio-button>
        </el-radio-group>
        <el-button size="small" type="primary" icon="el-icon-search" :loading="isload" @click="searchKey">查询</el-button>
      </div>
      <el-button size="small" type="primary" icon="el-icon-plus" @click="openCreate">新建接口</el-button>
    </div>

    <el-table
      :data="filtered"
      v-loading="isload"
      size="small"
      stripe
      class="uri-table">
      <template slot="empty">
        <el-empty :image-size="70" :description="table_data.length ? '没有符合筛选条件的接口' : '该页面还没有配置接口'"></el-empty>
      </template>
      <el-table-column prop="uri" label="接口路径" min-width="260" sortable>
        <template slot-scope="scope">
          <span class="mono uri-text">{{ scope.row.uri }}</span>
          <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.uri)"></i>
        </template>
      </el-table-column>
      <el-table-column prop="privilege" label="权限" width="90" align="center" sortable>
        <template slot-scope="scope">
          <span :class="['priv-tag', scope.row.privilege === '0' ? 'priv-read' : 'priv-admin']">
            {{ scope.row.privilege === '0' ? '只读' : '管理' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="descr" label="描述" min-width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.descr" class="sub-text">{{ scope.row.descr }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center" fixed="right" class-name="op-col">
        <template slot-scope="scope">
          <el-button type="text" size="mini" icon="el-icon-edit-outline" @click="updateRow(scope.row)">修改</el-button>
          <el-button type="text" size="mini" icon="el-icon-delete" class="danger-btn" @click="deleteRow(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 修改 -->
    <el-dialog
      :visible.sync="formVisible"
      :title="formMode === 'create' ? '新增接口' : '修改接口'"
      width="560px"
      :close-on-click-modal="false"
      append-to-body>
      <div slot="title" class="dialog-title">
        <i :class="formMode === 'create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>
        {{ formMode === 'create' ? '新增接口' : '修改接口' }}
        <span class="title-page">{{ page_info.name }}</span>
      </div>
      <el-form ref="uriForm" :model="feature_uri" :rules="rules" label-width="80px" size="small">
        <el-form-item label="接口路径" prop="uri">
          <el-input v-model="feature_uri.uri" class="mono-input" placeholder="如：/device/get_devices_list" maxlength="200"></el-input>
        </el-form-item>
        <el-form-item label="权限" prop="privilege">
          <el-radio-group v-model="feature_uri.privilege">
            <el-radio-button label="0">只读</el-radio-button>
            <el-radio-button label="1">管理</el-radio-button>
          </el-radio-group>
          <div class="form-tip">只读：角色可查看页面即可访问；管理：需要页面本身的写权限</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="feature_uri.descr" type="textarea" :rows="3" resize="none" maxlength="300" placeholder="可选，说明该接口的用途"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="formVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="isload" @click="submit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import uri_api from "@/api/mapis/user_interface.js"

  export default {
    props: {
      page_info: {
        type: Object,
        default: () => {
          return {};
        }
      },
    },
    name: 'uri_manage',
    data() {
      return {
        filter_uri: "",
        filter_privilege: "",
        isload: false,
        table_data: [],

        formVisible: false,
        formMode: 'create',
        feature_uri: {},

        rules: {
          uri: [
            { required: true, message: '请输入接口路径', trigger: 'blur' }
          ],
          privilege: [
            { required: true, message: '请选择权限', trigger: 'change' }
          ]
        }
      };
    },
    computed: {
      filtered() {
        if (!this.filter_privilege) return this.table_data
        return this.table_data.filter(r => String(r.privilege) === this.filter_privilege)
      },
      privilegeStats() {
        let readonly = 0
        let manage = 0
        this.table_data.forEach(r => {
          if (String(r.privilege) === '0') readonly++
          else manage++
        })
        return { readonly: readonly, manage: manage }
      }
    },
    mounted() {
      this.searchKey()
    },
    methods: {
      searchKey() {
        let post_data = {
          "page_id": this.page_info["page_id"]
        }

        this.filter_uri = this.filter_uri.replace(/^\s*|\s*$/g, "")
        if (this.filter_uri != "") {
          post_data["uri_reg"] = this.filter_uri
        }

        this.isload = true
        uri_api.getUriList(post_data, {}).then(response => {
          if (response.data.code == 0) {
            this.table_data = response.data.data || []
          } else {
            this.$message.error('查询失败：' + (response.data.message || response.data.msg || ''))
          }
        }).catch(error => {
          console.log(error)
          this.$message.error('查询失败，请重试')
        }).finally(() => {
          this.isload = false
        })
      },

      openCreate() {
        this.formMode = 'create'
        this.feature_uri = {
          page_id: this.page_info['page_id'],
          uri: '',
          descr: '',
          privilege: '0'
        }
        this.formVisible = true
        this.clearValidate()
      },
      updateRow(row) {
        this.formMode = 'edit'
        this.feature_uri = {
          uri_id: row["uri_id"],
          page_id: row["page_id"],
          uri: row["uri"],
          descr: row["descr"],
          privilege: String(row["privilege"])
        }
        this.formVisible = true
        this.clearValidate()
      },
      clearValidate() {
        this.$nextTick(() => {
          if (this.$refs.uriForm) this.$refs.uriForm.clearValidate()
        })
      },

      submit() {
        this.$refs.uriForm.validate(valid => {
          if (!valid) return
          if (this.formMode === 'create') {
            this.submit_create()
          } else {
            this.submit_update()
          }
        })
      },

      submit_create() {
        this.isload = true
        let post_data = {
          "page_id": this.feature_uri["page_id"],
          "uri": (this.feature_uri["uri"] || "").trim(),
          "descr": this.feature_uri["descr"] || "",
          "privilege": this.feature_uri["privilege"],
        }
        uri_api.addUri(post_data, {}).then(response => {
          if (response.data.code == 0) {
            this.formVisible = false
            this.searchKey()
            this.$message.success('添加完成')
          } else {
            this.$message.error('添加失败：' + response.data.message)
          }
        }).catch(error => {
          console.log(error)
          this.$message.error('操作失败，请重试')
        }).finally(() => {
          this.isload = false
        })
      },

      submit_update() {
        this.isload = true
        let post_data = {
          "uri_id": this.feature_uri["uri_id"],
          "uri": (this.feature_uri["uri"] || "").trim(),
          "descr": this.feature_uri["descr"] || "",
          "privilege": this.feature_uri["privilege"],
        }
        uri_api.updateUri(post_data, {}).then(response => {
          if (response.data.code == 0) {
            this.formVisible = false
            this.searchKey()
            this.$message.success('更新完成')
          } else {
            this.$message.error('更新失败：' + response.data.message)
          }
        }).catch(error => {
          console.log(error)
          this.$message.error('操作失败，请重试')
        }).finally(() => {
          this.isload = false
        })
      },

      deleteRow(row) {
        this.$confirm('确定删除接口「' + row.uri + '」？删除后相关角色的权限也会失效。', '删除确认', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger',
          type: 'warning'
        }).then(() => {
          uri_api.delUri({ "uri_id": row.uri_id }, {}).then(response => {
            if (response.data.code == 0) {
              this.$message.success('删除成功')
              this.searchKey()
            } else {
              this.$message.error('删除失败：' + response.data.message)
            }
          }).catch(error => {
            console.log(error)
            this.$message.error('删除异常')
          })
        }).catch(() => {})
      },

      copyText(text) {
        if (!text) return
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          this.$message.success('已复制')
        } catch (e) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(ta)
      },
    },
    components: {},
  }
</script>

<style scoped>
.uri-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ input {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}

.uri-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.uri-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.uri-filters > * {
  margin: 0 10px 8px 0;
}
.uri-search {
  width: 240px;
}

.uri-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.uri-text {
  font-size: 12px;
  color: #303133;
}
.priv-tag {
  display: inline-block;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
}
.priv-read {
  color: #67c23a;
  background: #f0f9eb;
}
.priv-admin {
  color: #e6a23c;
  background: #fdf6ec;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.uri-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.uri-table /deep/ .op-col .cell {
  white-space: nowrap;
}
.danger-btn {
  color: #f56c6c;
}
.danger-btn:hover,
.danger-btn:focus {
  color: #f78989;
}

.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dialog-title > i {
  margin-right: 6px;
  color: #409eff;
}
.title-page {
  margin-left: 10px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}
</style>
