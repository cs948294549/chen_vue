<template>
  <div class="topology-manage-page">
    <!-- 左侧分类树（包含拓扑列表） -->
    <div class="left-panel">
      <TopologyTree
        :topology-list="topologyList"
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
          <i class="el-icon-share" style="font-size: 80px; color: #1890ff;"></i>
          <h2 style="margin: 20px 0;">网络拓扑管理</h2>
          <p style="color: #999;">请从左侧选择或新建拓扑</p>
        </div>
      </div>

      <!-- 拓扑编辑视图 -->
      <div v-if="currentView === 'edit'" class="edit-view">
        <TopologyEditor
          :topology-data="currentTopology"
          @back="handleBackToWelcome"
          @save="handleSaveTopology"
          @node-click="handleNodeClick"
          @link-click="handleLinkClick"
          @view-detail="handleViewDetail"
          @delete-node="handleDeleteNode"
          @add-node="handleAddNode"
          @add-link="handleAddLink"
          @auto-layout="handleAutoLayout"
          @build-from-lldp="handleBuildFromLLDP">
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

      // 当前编辑的拓扑
      currentTopology: null,

      // 对话框
      dialogVisible: false,
      dialogMode: 'create', // 'create' | 'edit'
      dialogTopologyData: null,
      categoryPathOptions: []
    }
  },

  mounted() {
    this.loadTopologyList()
  },

  methods: {
    // ==================== 数据加载 ====================

    loadTopologyList() {
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
      })
    },

    // ==================== 拓扑编辑操作 ====================

    handleOpenTopology(row) {
      this.currentTopology = row
      this.currentView = 'edit'
    },

    handleBackToWelcome() {
      this.currentView = 'welcome'
      this.currentTopology = null
    },

    handleSaveTopology(topologyData) {
      // TODO: 调用后端接口保存
      console.log('保存拓扑', topologyData)

      setTimeout(() => {
        this.$message.success('保存成功')
        this.loadTopologyList()
      }, 500)
    },

    // ==================== 拓扑画布交互 ====================

    handleNodeClick(node) {
      console.log('节点点击', node)
    },

    handleLinkClick() {
      console.log('连接点击')
    },

    handleViewDetail(data) {
      this.$message.info('查看详情功能开发中...')
    },

    handleDeleteNode(data) {
      this.$message.info('删除节点功能开发中...')
    },

    handleAddNode() {
      this.$message.info('添加节点功能开发中...')
    },

    handleAddLink() {
      this.$message.info('添加连接功能开发中...')
    },

    handleAutoLayout() {
      this.$message.info('自动布局功能开发中...')
    },

    handleBuildFromLLDP() {
      this.$message.info('从LLDP生成功能开发中...')
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
.topology-manage-page {
  display: flex;
  height: calc(100vh - 100px);
  background: #f0f2f5;
}

.left-panel {
  width: 320px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.welcome-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  margin: 10px;
  border-radius: 4px;
}

.welcome-content {
  text-align: center;
}

.edit-view {
  flex: 1;
  padding: 10px;
  overflow: hidden;
}
</style>
