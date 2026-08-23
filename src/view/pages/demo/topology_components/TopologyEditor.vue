<template>
  <div class="topology-editor">
    <div class="editor-toolbar">
      <el-button type="default" icon="el-icon-close" size="small" @click="handleBack">关闭</el-button>
      <span style="margin-left: 20px; font-weight: bold; font-size: 16px;">{{ topologyName }}</span>
      <div style="flex: 1;"></div>

      <!-- 编辑工具按钮组 -->
      <el-button-group style="margin-right: 10px;">
        <el-button size="small" icon="el-icon-aim" @click="handleFocusCenter" title="聚焦画布">聚焦</el-button>
        <el-button size="small" icon="el-icon-plus" @click="handleAddNode">添加节点</el-button>
        <el-button size="small" icon="el-icon-connection" @click="handleAddLink">添加连接</el-button>
        <el-button size="small" icon="el-icon-refresh" @click="handleAutoLayout">自动布局</el-button>
        <el-button size="small" icon="el-icon-download" @click="handleBuildFromLLDP">从LLDP生成</el-button>
      </el-button-group>

      <el-button type="success" icon="el-icon-check" size="small" @click="handleSave" :loading="saving">保存</el-button>
    </div>

    <!-- 拓扑详情信息 -->
    <div class="topology-info">
      <div class="info-row description-row">
        <span class="info-label">描述:</span>
        <span class="info-value description-value">{{ topologyData.description || '暂无描述' }}</span>
      </div>
      <div class="info-row meta-row">
        <div class="info-item">
          <span class="info-label">创建人:</span>
          <span class="info-value">{{ topologyData.created_by || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间:</span>
          <span class="info-value">{{ topologyData.created_at || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">更新人:</span>
          <span class="info-value">{{ topologyData.updated_by || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">更新时间:</span>
          <span class="info-value">{{ topologyData.updated_at || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">版本:</span>
          <span class="info-value">v{{ topologyData.version || 1 }}</span>
        </div>
      </div>
    </div>

    <!-- 拓扑画布：画布尺寸自适应窗口，无需滚动 -->
    <div class="topology-canvas-wrapper">
      <NetworkTopology
        v-if="canvasReady"
        ref="topologyCanvas"
        :toponame="'topology-editor'"
        :node_list="nodes"
        :link_list="edges"
        :position="positions"
        :chartswidth="canvasWidth"
        :chartsheight="canvasHeight"
        @savePosition="handleSavePosition"
        @click_node="handleNodeClick"
        @click_link="handleLinkClick"
        @rightclick="handleRightClick">
      </NetworkTopology>
    </div>

    <!-- 右键菜单 -->
    <div v-show="contextMenuVisible" class="context-menu" :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}">
      <div class="menu-item" @click="handleViewDetail">查看详情</div>
      <div class="menu-item" @click="handleDeleteNode">删除</div>
    </div>

    <!-- 节点表单对话框 -->
    <NodeFormDialog
      :visible.sync="nodeDialogVisible"
      :mode="nodeDialogMode"
      :nodeData="currentNode"
      @submit="handleNodeSubmit">
    </NodeFormDialog>
  </div>
</template>

<script>
import NetworkTopology from '@/components/topology/NetworkTopology.vue'
import NodeFormDialog from './NodeFormDialog.vue'

export default {
  name: 'TopologyEditor',

  props: {
    topologyData: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      nodes: [],
      edges: [],
      positions: {},
      saving: false,

      // 右键菜单
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuTarget: null,

      // 节点对话框
      nodeDialogVisible: false,
      nodeDialogMode: 'create', // 'create' | 'edit'
      currentNode: null,

      // 画布动态宽高
      canvasWidth: '1200px',
      canvasHeight: '700px',
      canvasReady: false
    }
  },

  computed: {
    topologyName() {
      return this.topologyData ? this.topologyData.topology_name : ''
    }
  },

  mounted() {
    this.loadTopologyData()
    document.addEventListener('click', this.hideContextMenu)
    window.addEventListener('resize', this.updateCanvasSize)

    this.$nextTick(() => {
      this.updateCanvasSize()
      // 尺寸计算完成后再显示画布
      setTimeout(() => {
        this.canvasReady = true
        this.$nextTick(() => {
          this.handleFocusCenter()
        })
      }, 100)
    })
  },

  beforeDestroy() {
    document.removeEventListener('click', this.hideContextMenu)
    window.removeEventListener('resize', this.updateCanvasSize)
  },

  methods: {
    loadTopologyData() {
      // TODO: 调用后端接口加载拓扑数据
      // 模拟数据
      this.nodes = [
        { id: '192.168.1.1', label: 'Core-SW-01', group: 'switch', x: 100, y: 100 },
        { id: '192.168.1.2', label: 'Core-SW-02', group: 'switch', x: 300, y: 100 },
        { id: '192.168.1.3', label: 'Access-SW-01', group: 'switch', x: 200, y: 300 }
      ]

      this.edges = [
        { from: '192.168.1.1', to: '192.168.1.2', label: '10G' },
        { from: '192.168.1.1', to: '192.168.1.3', label: '1G' },
        { from: '192.168.1.2', to: '192.168.1.3', label: '1G' }
      ]

      this.positions = {}
    },

    handleBack() {
      this.$emit('back')
    },

    updateCanvasSize() {
      // 根据窗口大小动态设置画布尺寸，填满容器
      const wrapper = this.$el.querySelector('.topology-canvas-wrapper')
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        this.canvasWidth = rect.width + 'px'
        this.canvasHeight = rect.height + 'px'
      }
    },

    handleFocusCenter() {
      // 调用NetworkTopology组件的fit方法聚焦画布
      if (this.$refs.topologyCanvas && this.$refs.topologyCanvas.network) {
        this.$refs.topologyCanvas.network.fit({
          animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
          }
        })
      }
    },

    handleSave() {
      this.saving = true

      const topologyData = {
        topology_id: this.topologyData.topology_id,
        topology_json: {
          config: {},
          nodes: this.nodes,
          edges: this.edges,
          groups: []
        },
        version: this.topologyData.version
      }

      this.$emit('save', topologyData)

      setTimeout(() => {
        this.saving = false
      }, 500)
    },

    handleSavePosition(positions) {
      console.log('保存节点位置', positions)
      this.positions = positions
    },

    handleNodeClick(node) {
      console.log('节点点击', node)
      this.$emit('node-click', node)
    },

    handleLinkClick() {
      console.log('连接点击')
      this.$emit('link-click')
    },

    handleRightClick(data) {
      console.log('右键点击', data)
      this.contextMenuTarget = data
    },

    showContextMenu(event) {
      this.contextMenuVisible = true
      this.contextMenuX = event.clientX
      this.contextMenuY = event.clientY
    },

    hideContextMenu() {
      this.contextMenuVisible = false
    },

    handleViewDetail() {
      this.$emit('view-detail', this.contextMenuTarget)
      this.hideContextMenu()
    },

    handleDeleteNode() {
      this.$emit('delete-node', this.contextMenuTarget)
      this.hideContextMenu()
    },

    handleAddNode() {
      this.nodeDialogMode = 'create'
      this.currentNode = null
      this.nodeDialogVisible = true
    },

    handleNodeSubmit(nodeData) {
      // 检查节点ID是否已存在
      const existingNode = this.nodes.find(n => n.id === nodeData.id)
      if (this.nodeDialogMode === 'create' && existingNode) {
        this.$message.error('节点ID已存在')
        return
      }

      if (this.nodeDialogMode === 'create') {
        // 添加新节点
        this.nodes.push(nodeData)
        this.$message.success('节点添加成功')
      } else {
        // 编辑节点
        const index = this.nodes.findIndex(n => n.id === nodeData.id)
        if (index !== -1) {
          this.$set(this.nodes, index, nodeData)
          this.$message.success('节点更新成功')
        }
      }

      this.nodeDialogVisible = false

      // 不要立即刷新，让Vue的响应式系统处理更新
      // 如果NetworkTopology使用的是普通数组而不是DataSet，需要强制重绘
      // 但不要频繁调用draw()，这会导致放大问题
    },

    handleAddLink() {
      this.$emit('add-link')
    },

    handleAutoLayout() {
      this.$emit('auto-layout')
    },

    handleBuildFromLLDP() {
      this.$emit('build-from-lldp')
    }
  },

  components: {
    NetworkTopology,
    NodeFormDialog
  }
}
</script>

<style scoped>
.topology-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-toolbar {
  background: #fff;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.topology-info {
  background: #f5f7fa;
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.description-row {
  margin-bottom: 8px;
}

.description-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.meta-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.info-label {
  color: #606266;
  margin-right: 8px;
  font-weight: 500;
}

.info-value {
  color: #303133;
}

.topology-canvas-wrapper {
  background: #fff;
  border-radius: 4px;
  flex: 1;
  min-height: 0;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 120px;
}

.menu-item {
  padding: 10px 15px;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background: #f5f5f5;
}
</style>
