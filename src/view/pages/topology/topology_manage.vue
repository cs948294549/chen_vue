<template>
  <div class="topology-manage-page">
    <!-- 左侧分类树（包含拓扑列表） -->
    <div class="left-panel">
      <TopologyTree
        :topology-list="topologyList"
        :loading="listLoading"
        :active-id="currentTopology ? currentTopology.topology_id : null"
        @create="handleCreateTopology"
        @open="handleOpenTopology"
        @edit="handleEditTopology"
        @delete="handleDeleteTopology">
      </TopologyTree>
    </div>

    <!-- 右侧内容区 -->
    <div class="right-panel">
      <!-- 欢迎页 -->
      <div v-if="currentView === 'welcome'" class="welcome-view">
        <div class="welcome-content">
          <div class="welcome-icon"><i class="el-icon-share"></i></div>
          <div class="welcome-title">网络拓扑管理</div>
          <div class="welcome-sub">从左侧选择拓扑进行查看与编辑，或新建一张拓扑图</div>

          <div class="welcome-stats">
            <div class="stat-item">
              <div class="stat-num">{{ topologyList.length }}</div>
              <div class="stat-label">拓扑总数</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ categoryPathOptions.length }}</div>
              <div class="stat-label">分类路径</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ uncategorizedCount }}</div>
              <div class="stat-label">未分类</div>
            </div>
          </div>

          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleCreateTopology">新建拓扑</el-button>

          <div v-if="recentList.length" class="recent-block">
            <div class="recent-title"><i class="el-icon-time"></i>最近更新</div>
            <div
              v-for="t in recentList"
              :key="t.topology_id"
              class="recent-item"
              @click="handleOpenTopology(t)">
              <i class="el-icon-picture-outline recent-icon"></i>
              <span class="recent-name">{{ t.topology_name }}</span>
              <span class="recent-path">{{ (t.category_types || []).join(' / ') || '未分类' }}</span>
              <span class="recent-time">{{ t.updated_at }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 拓扑编辑视图 -->
      <div v-if="currentView === 'edit'" class="edit-view">
        <TopologyEditor
          ref="topologyEditor"
          :topology-data="currentTopology"
          @back="handleBackToWelcome"
          @save="handleSaveTopology">
        </TopologyEditor>
      </div>
    </div>

    <!-- 新建/编辑拓扑对话框 -->
    <TopologyFormDialog
      :visible.sync="dialogVisible"
      :mode="dialogMode"
      :topology-data="dialogTopologyData"
      :category-options="categoryPathOptions"
      @submit="handleSubmitTopology">
    </TopologyFormDialog>
  </div>
</template>

<script>
import TopologyTree from './topology_components/TopologyTree.vue'
import TopologyEditor from './topology_components/TopologyEditor.vue'
import TopologyFormDialog from './topology_components/TopologyFormDialog.vue'
import topologyApi from '@/api/mapis/topology_interface'

export default {
  name: 'TopologyManage',

  data() {
    return {
      // 视图状态
      currentView: 'welcome', // 'welcome' | 'edit'

      // 拓扑列表
      topologyList: [],
      listLoading: false,

      // 当前编辑的拓扑
      currentTopology: null,

      // 对话框
      dialogVisible: false,
      dialogMode: 'create', // 'create' | 'edit'
      dialogTopologyData: null,
      categoryPathOptions: []
    }
  },

  computed: {
    uncategorizedCount() {
      return this.topologyList.filter(t => !t.category_types || t.category_types.length === 0).length
    },
    // 欢迎页展示最近更新的拓扑（列表接口未返回更新时间时不展示）
    recentList() {
      return this.topologyList
        .filter(t => t.updated_at)
        .slice()
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
        .slice(0, 6)
    }
  },

  mounted() {
    this.loadTopologyList()
  },

  methods: {
    // ==================== 数据加载 ====================

    loadTopologyList() {
      this.listLoading = true
      topologyApi.getTopologyList({})
        .then(response => {
          const res = response.data
          if (res.code === 0) {
            this.topologyList = res.data || []
            this.buildCategoryPathOptions()
          } else {
            this.$message.error('加载拓扑列表失败: ' + res.message)
          }
        })
        .catch(error => {
          console.error('加载拓扑列表失败:', error)
          this.$message.error('加载拓扑列表失败')
        })
        .finally(() => {
          this.listLoading = false
        })
    },

    buildCategoryPathOptions() {
      const pathSet = new Set()

      this.topologyList.forEach(topo => {
        const categories = topo.category_types || []
        if (categories.length > 0) {
          const path = categories.join('/')
          pathSet.add(path)
        }
      })

      this.categoryPathOptions = Array.from(pathSet).map(path => ({
        label: path,
        value: path
      }))
    },

    // ==================== 拓扑CRUD操作 ====================

    handleCreateTopology() {
      this.dialogMode = 'create'
      this.dialogTopologyData = null
      this.dialogVisible = true
    },

    handleEditTopology(row) {
      this.dialogMode = 'edit'
      this.dialogTopologyData = row
      this.dialogVisible = true
    },

    handleSubmitTopology(formData) {
      const apiCall = this.dialogMode === 'create'
        ? topologyApi.createTopology(formData)
        : topologyApi.updateTopology(formData)

      apiCall.then(response => {
        const res = response.data
        if (res.code === 0) {
          this.$message.success(this.dialogMode === 'create' ? '创建成功' : '更新成功')
          this.dialogVisible = false
          this.loadTopologyList()
        } else {
          this.$message.error(res.message || '操作失败')
        }
      }).catch(error => {
        console.error('提交拓扑失败:', error)
        this.$message.error('操作失败')
      })
    },

    handleDeleteTopology(row) {
      this.$confirm(`确定删除拓扑"${row.topology_name}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        topologyApi.deleteTopology({ topology_id: row.topology_id })
          .then(response => {
            const res = response.data
            if (res.code === 0) {
              this.$message.success('删除成功')

              // 如果删除的是当前打开的拓扑，返回欢迎页
              if (this.currentTopology && this.currentTopology.topology_id === row.topology_id) {
                this.handleBackToWelcome()
              }

              this.loadTopologyList()
            } else {
              this.$message.error(res.message || '删除失败')
            }
          })
          .catch(error => {
            console.error('删除拓扑失败:', error)
            this.$message.error('删除失败')
          })
      }).catch(() => {})
    },

    // ==================== 拓扑编辑操作 ====================

    handleOpenTopology(row) {
      // 先设置为加载状态
      this.currentView = 'edit'
      this.currentTopology = { ...row, topology_json: null }

      // 调用详情接口获取完整的拓扑数据
      topologyApi.getTopologyDetail({ topology_id: row.topology_id })
        .then(response => {
          const res = response.data
          if (res.code === 0) {
            this.currentTopology = res.data
          } else {
            this.$message.error('加载拓扑详情失败: ' + res.message)
            this.currentView = 'welcome'
            this.currentTopology = null
          }
        })
        .catch(error => {
          console.error('加载拓扑详情失败:', error)
          this.$message.error('加载拓扑详情失败')
          this.currentView = 'welcome'
          this.currentTopology = null
        })
    },

    handleBackToWelcome() {
      this.currentView = 'welcome'
      this.currentTopology = null
    },

    handleSaveTopology(topologyData) {
      topologyApi.updateTopology(topologyData)
        .then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('保存成功')
            // 重新加载当前拓扑的详情，确保版本号等数据是最新的
            if (this.currentTopology) {
              topologyApi.getTopologyDetail({ topology_id: this.currentTopology.topology_id })
                .then(detailResponse => {
                  const detailRes = detailResponse.data
                  if (detailRes.code === 0) {
                    this.currentTopology = detailRes.data
                  }
                })
                .catch(error => {
                  console.error('重新加载拓扑详情失败:', error)
                })
            }
            // 刷新列表
            this.loadTopologyList()
          } else if (res.message === '版本冲突，请刷新后重试') {
            this.$message.error('版本冲突，拓扑已被他人修改，请刷新后重试')
            // 版本冲突时也重新加载详情
            if (this.currentTopology) {
              topologyApi.getTopologyDetail({ topology_id: this.currentTopology.topology_id })
                .then(detailResponse => {
                  const detailRes = detailResponse.data
                  if (detailRes.code === 0) {
                    this.currentTopology = detailRes.data
                  }
                })
                .catch(error => {
                  console.error('重新加载拓扑详情失败:', error)
                })
            }
            this.loadTopologyList()
          } else {
            this.$message.error('保存失败: ' + res.message)
          }
        })
        .catch(error => {
          console.error('保存拓扑失败:', error)
          this.$message.error('保存失败')
        })
        .finally(() => {
          // 通知 TopologyEditor 保存完成，重置 saving 状态
          this.$nextTick(() => {
            if (this.$refs.topologyEditor) {
              this.$refs.topologyEditor.saving = false
            }
          })
        })
    }
  },

  components: {
    TopologyTree,
    TopologyEditor,
    TopologyFormDialog
  }
}
</script>

<style scoped>
/* 根节点同时带有布局的 page-container 类，这里改为撑满内容区高度 */
.topology-manage-page {
  display: flex;
  height: 100%;
  min-height: 560px;
  overflow: hidden;
  color: #303133;
}

.left-panel {
  flex-shrink: 0;
  width: 300px;
  margin-right: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 欢迎页 */
.welcome-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
  overflow-y: auto;
}
.welcome-content {
  width: 520px;
  max-width: 90%;
  padding: 32px 0;
  text-align: center;
}
.welcome-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  font-size: 34px;
  color: #409eff;
  background: #ecf5ff;
}
.welcome-title {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 600;
}
.welcome-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}
.welcome-stats {
  display: flex;
  justify-content: center;
  margin: 22px 0 20px;
}
.stat-item {
  width: 110px;
  padding: 10px 0;
  margin: 0 6px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
}
.stat-num {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}
.stat-label {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.recent-block {
  margin-top: 24px;
  text-align: left;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.recent-title {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
}
.recent-title i {
  margin-right: 6px;
  color: #409eff;
}
.recent-item {
  display: flex;
  align-items: center;
  padding: 9px 14px;
  font-size: 13px;
  cursor: pointer;
}
.recent-item + .recent-item {
  border-top: 1px dashed #f0f0f0;
}
.recent-item:hover {
  background: #f5f7fa;
}
.recent-item:hover .recent-name {
  color: #409eff;
}
.recent-icon {
  margin-right: 8px;
  color: #67c23a;
}
.recent-name {
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-path {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-time {
  flex-shrink: 0;
  margin-left: 10px;
  font-size: 12px;
  color: #c0c4cc;
}

.edit-view {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
