<template>
  <div class="config-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 工单类型配置 -->
      <el-tab-pane label="工单类型配置" name="type">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddType">添加类型</el-button>
          </div>

          <el-table
            :data="typeList"
            border
            size="small"
            v-loading="typeLoading"
            style="width: 100%">
            <el-table-column prop="pid" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="name" label="类型名称" min-width="200"></el-table-column>
            <el-table-column label="审批流程1" min-width="150" align="center">
              <template slot-scope="scope">
                {{ getGroupName(scope.row.op_group1) }}
              </template>
            </el-table-column>
            <el-table-column label="审批流程2" min-width="150" align="center">
              <template slot-scope="scope">
                {{ getGroupName(scope.row.op_group2) }}
              </template>
            </el-table-column>
            <el-table-column label="审批流程3" min-width="150" align="center">
              <template slot-scope="scope">
                {{ getGroupName(scope.row.op_group3) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click="handleEditType(scope.row)">编辑</el-button>
                <el-button size="mini" type="text" style="color: #f56c6c;" @click="handleDeleteType(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 审批分组配置 -->
      <el-tab-pane label="审批分组配置" name="group">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" size="small" @click="handleAddGroup">添加分组</el-button>
          </div>

          <el-table
            :data="groupList"
            border
            size="small"
            v-loading="groupLoading"
            style="width: 100%">
            <el-table-column prop="pid" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="name" label="分组名称" min-width="200"></el-table-column>
            <el-table-column label="成员列表" min-width="400">
              <template slot-scope="scope">
                <el-tag
                  v-for="(member, index) in getMemberList(scope.row.op_list)"
                  :key="index"
                  size="small"
                  style="margin-right: 5px; margin-bottom: 5px;">
                  {{ member }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click="handleEditGroup(scope.row)">编辑</el-button>
                <el-button size="mini" type="text" style="color: #f56c6c;" @click="handleDeleteGroup(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 工单类型对话框 -->
    <el-dialog
      :title="typeDialogTitle"
      :visible.sync="typeDialogVisible"
      width="600px"
      :close-on-click-modal="false">
      <el-form :model="typeForm" :rules="typeRules" ref="typeForm" label-width="120px" size="small">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="请输入工单类型名称"></el-input>
        </el-form-item>
        <el-form-item label="审批流程1" prop="op_group1">
          <el-select v-model="typeForm.op_group1" placeholder="请选择第一轮审批组" clearable style="width: 100%;">
            <el-option v-for="item in groupList" :key="item.pid" :label="item.name" :value="item.pid"></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px;">必填,工单提交后进入第一轮审批</span>
        </el-form-item>
        <el-form-item label="审批流程2">
          <el-select v-model="typeForm.op_group2" placeholder="请选择第二轮审批组" clearable style="width: 100%;">
            <el-option v-for="item in groupList" :key="item.pid" :label="item.name" :value="item.pid"></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px;">可选,第一轮审批通过后进入第二轮</span>
        </el-form-item>
        <el-form-item label="审批流程3">
          <el-select v-model="typeForm.op_group3" placeholder="请选择第三轮审批组" clearable style="width: 100%;">
            <el-option v-for="item in groupList" :key="item.pid" :label="item.name" :value="item.pid"></el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px;">可选,第二轮审批通过后进入第三轮</span>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="typeDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="handleSaveType">保存</el-button>
      </div>
    </el-dialog>

    <!-- 审批分组对话框 -->
    <el-dialog
      :title="groupDialogTitle"
      :visible.sync="groupDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @open="handleGroupDialogOpen">
      <el-form :model="groupForm" :rules="groupRules" ref="groupForm" label-width="120px" size="small">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入审批分组名称"></el-input>
        </el-form-item>
        <el-form-item label="成员列表" prop="op_list">
          <el-select
            v-model="groupForm.op_list"
            multiple
            filterable
            placeholder="请选择成员"
            style="width: 100%;"
            :loading="userListLoading">
            <el-option
              v-for="user in userList"
              :key="user.username"
              :label="user.subname ? `${user.subname}(${user.username})` : user.username"
              :value="user.username">
            </el-option>
          </el-select>
          <span style="color: #909399; font-size: 12px;">可多选，最终以逗号分隔存储</span>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="groupDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" @click="handleSaveGroup">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import alterationApi from '@/api/mapis/alteration_interface'
import userApi from '@/api/mapis/user_interface'

export default {
  name: 'ConfigManage',
  data() {
    return {
      activeTab: 'type',
      submitting: false,

      // 工单类型
      typeLoading: false,
      typeList: [],
      typeDialogVisible: false,
      typeDialogTitle: '添加工单类型',
      isEditType: false,
      typeForm: {
        pid: null,
        name: '',
        op_group1: '',
        op_group2: '',
        op_group3: ''
      },
      typeRules: {
        name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
        op_group1: [{ required: true, message: '请选择第一轮审批组', trigger: 'change' }]
      },

      // 审批分组
      groupLoading: false,
      groupList: [],
      groupDialogVisible: false,
      groupDialogTitle: '添加审批分组',
      isEditGroup: false,
      groupForm: {
        pid: null,
        name: '',
        op_list: []
      },
      groupRules: {
        name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
        op_list: [{ required: true, message: '请选择成员', trigger: 'change' }]
      },
      userList: [],
      userListLoading: false
    }
  },

  mounted() {
    this.loadTypeList()
    this.loadGroupList()
  },

  methods: {
    // ==================== 工单类型管理 ====================
    loadTypeList() {
      this.typeLoading = true
      alterationApi.getTypeList({}).then(response => {
        if (response.data.code === 0) {
          this.typeList = response.data.data || []
        } else {
          this.$message.error(response.data.message || '加载工单类型失败')
        }
        this.typeLoading = false
      }).catch(error => {
        console.error('加载工单类型失败:', error)
        this.$message.error('加载工单类型失败')
        this.typeLoading = false
      })
    },

    handleAddType() {
      if (this.groupList.length === 0) {
        this.$message.warning('请先创建审批分组')
        this.activeTab = 'group'
        return
      }

      this.typeDialogTitle = '添加工单类型'
      this.isEditType = false
      this.typeForm = {
        pid: null,
        name: '',
        op_group1: '',
        op_group2: '',
        op_group3: ''
      }
      this.typeDialogVisible = true
    },

    handleEditType(row) {
      this.typeDialogTitle = '编辑工单类型'
      this.isEditType = true
      this.typeForm = {
        pid: row.pid,
        name: row.name,
        op_group1: row.op_group1 || '',
        op_group2: row.op_group2 || '',
        op_group3: row.op_group3 || ''
      }
      this.typeDialogVisible = true
    },

    handleSaveType() {
      this.$refs.typeForm.validate(valid => {
        if (!valid) return

        this.submitting = true

        let params = {
          name: this.typeForm.name,
          op_group1: this.typeForm.op_group1 || null,
          op_group2: this.typeForm.op_group2 || null,
          op_group3: this.typeForm.op_group3 || null
        }

        if (this.isEditType) {
          params.pid = this.typeForm.pid
        }

        const apiCall = this.isEditType ? alterationApi.updateType(params) : alterationApi.addType(params)

        apiCall.then(response => {
          if (response.data.code === 0) {
            this.$message.success(this.isEditType ? '保存成功' : '添加成功')
            this.typeDialogVisible = false
            this.loadTypeList()
          } else {
            this.$message.error(response.data.message || '操作失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('保存工单类型失败:', error)
          this.$message.error('操作失败')
          this.submitting = false
        })
      })
    },

    handleDeleteType(row) {
      this.$confirm(`确认删除工单类型 "${row.name}" 吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        alterationApi.deleteType({ pid: row.pid }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('删除成功')
            this.loadTypeList()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除工单类型失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    // ==================== 审批分组管理 ====================
    loadUserList() {
      this.userListLoading = true
      userApi.getUserSimpleList({}).then(response => {
        if (response.data.code === 0) {
          this.userList = response.data.data || []
        } else {
          this.$message.error(response.data.message || '加载用户列表失败')
        }
        this.userListLoading = false
      }).catch(error => {
        console.error('加载用户列表失败:', error)
        this.$message.error('加载用户列表失败')
        this.userListLoading = false
      })
    },

    handleGroupDialogOpen() {
      // 打开对话框时加载用户列表
      if (this.userList.length === 0) {
        this.loadUserList()
      }
    },

    loadGroupList() {
      this.groupLoading = true
      alterationApi.getGroupList({}).then(response => {
        if (response.data.code === 0) {
          this.groupList = response.data.data || []
        } else {
          this.$message.error(response.data.message || '加载审批分组失败')
        }
        this.groupLoading = false
      }).catch(error => {
        console.error('加载审批分组失败:', error)
        this.$message.error('加载审批分组失败')
        this.groupLoading = false
      })
    },

    handleAddGroup() {
      this.groupDialogTitle = '添加审批分组'
      this.isEditGroup = false
      this.groupForm = {
        pid: null,
        name: '',
        op_list: []
      }
      this.groupDialogVisible = true
    },

    handleEditGroup(row) {
      this.groupDialogTitle = '编辑审批分组'
      this.isEditGroup = true
      // 将逗号分隔转换为数组
      let op_list = row.op_list || ''
      let memberArray = op_list.split(',').filter(m => m.trim())
      this.groupForm = {
        pid: row.pid,
        name: row.name,
        op_list: memberArray
      }
      this.groupDialogVisible = true
    },

    handleSaveGroup() {
      this.$refs.groupForm.validate(valid => {
        if (!valid) return

        this.submitting = true

        // 将数组转换为逗号分隔的字符串
        let op_list = ''
        if (Array.isArray(this.groupForm.op_list)) {
          op_list = this.groupForm.op_list.join(',')
        }

        let params = {
          name: this.groupForm.name,
          op_list: op_list
        }

        if (this.isEditGroup) {
          params.pid = this.groupForm.pid
        }

        const apiCall = this.isEditGroup ? alterationApi.updateGroup(params) : alterationApi.addGroup(params)

        apiCall.then(response => {
          if (response.data.code === 0) {
            this.$message.success(this.isEditGroup ? '保存成功' : '添加成功')
            this.groupDialogVisible = false
            this.loadGroupList()
          } else {
            this.$message.error(response.data.message || '操作失败')
          }
          this.submitting = false
        }).catch(error => {
          console.error('保存审批分组失败:', error)
          this.$message.error('操作失败')
          this.submitting = false
        })
      })
    },

    handleDeleteGroup(row) {
      this.$confirm(`确认删除审批分组 "${row.name}" 吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        alterationApi.deleteGroup({ pid: row.pid }).then(response => {
          if (response.data.code === 0) {
            this.$message.success('删除成功')
            this.loadGroupList()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        }).catch(error => {
          console.error('删除审批分组失败:', error)
          this.$message.error('删除失败')
        })
      }).catch(() => {})
    },

    getMemberList(op_list) {
      if (!op_list) return []
      return op_list.split(',').filter(m => m.trim())
    },

    // ==================== 工具方法 ====================
    getGroupName(groupId) {
      if (!groupId) return '-'
      let group = this.groupList.find(g => g.pid === groupId)
      return group ? group.name : '-'
    }
  }
}
</script>

<style scoped>
.config-manage {
  padding: 20px;
}

.tab-content {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}
</style>
