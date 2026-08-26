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
    <div class="topology-canvas-wrapper" @contextmenu.prevent.capture>
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
        @rightclick="handleRightClick">
      </NetworkTopology>
    </div>

    <!-- 右键菜单 -->
    <div id="contextmenu" v-show="contextMenuVisible" class="context-menu">
      <template v-if="contextMenuTarget && contextMenuTarget.click_type === 'node'">
        <div class="contextmenu__item" @click="handleViewNodeDetail">查看详情</div>
        <div class="contextmenu__item" @click="handleEditNode">编辑</div>
        <div class="contextmenu__item danger" @click="handleDeleteNode">删除</div>
      </template>
      <template v-else-if="contextMenuTarget && contextMenuTarget.click_type === 'link'">
        <div class="contextmenu__item" @click="handleViewLinkDetail">查看详情</div>
        <div class="contextmenu__item" @click="handleEditEdge">编辑</div>
        <div class="contextmenu__item danger" @click="handleDeleteEdge">删除</div>
      </template>
    </div>

    <!-- 节点表单对话框 -->
    <NodeFormDialog
      :visible.sync="nodeDialogVisible"
      :mode="nodeDialogMode"
      :nodeData="currentNode"
      @submit="handleNodeSubmit">
    </NodeFormDialog>

    <!-- 连接表单对话框 -->
    <EdgeFormDialog
      :visible.sync="edgeDialogVisible"
      :mode="edgeDialogMode"
      :edgeData="currentEdge"
      :nodeList="nodesData"
      @submit="handleEdgeSubmit">
    </EdgeFormDialog>

    <!-- 连接详情对话框 -->
    <EdgeDetailDialog
      :visible.sync="edgeDetailVisible"
      :edgeData="currentEdge"
      :nodeList="nodesData">
    </EdgeDetailDialog>

    <!-- 设备详情抽屉：只能通过关闭按钮关闭 -->
    <el-drawer
      title="设备详情"
      :visible.sync="deviceDetailVisible"
      direction="rtl"
      size="70%"
      :wrapperClosable="false"
      destroy-on-close
      append-to-body>
      <DeviceDetailPanel v-if="deviceDetailVisible" :ip="deviceDetailIp"></DeviceDetailPanel>
    </el-drawer>
  </div>
</template>

<script>
import NetworkTopology from '@/components/topology/NetworkTopology.vue'
import NodeFormDialog from './NodeFormDialog.vue'
import EdgeFormDialog from './EdgeFormDialog.vue'
import EdgeDetailDialog from './EdgeDetailDialog.vue'
import DeviceDetailPanel from './DeviceDetailPanel.vue'
import collectorApi from '@/api/mapis/collector_interface'

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
      // 完整数据（包含meta元数据）
      nodesData: [],  // 完整节点数据: [{id, label, group, title, x, y, meta: {model, ip, vendor, ...}}]
      edgesData: [],  // 完整连接数据: [{id, from, to, label, color, meta: {bandwidth, ports, ...}}]

      // 传递给NetworkTopology组件的纯展示数据（不含meta）
      nodes: [],  // 展示节点: [{id, label, group, title, x, y}]
      edges: [],  // 展示连接: [{id, from, to, label, color}]
      positions: {},
      saving: false,

      // 右键菜单
      contextMenuVisible: false,
      contextMenuTarget: null,

      // 节点对话框
      nodeDialogVisible: false,
      nodeDialogMode: 'create', // 'create' | 'edit'
      currentNode: null,

      // 设备详情抽屉
      deviceDetailVisible: false,
      deviceDetailIp: '',

      // 连接对话框
      edgeDialogVisible: false,
      edgeDialogMode: 'create', // 'create' | 'edit'
      currentEdge: null,
      edgeDetailVisible: false,

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

  watch: {
    'topologyData.topology_json': {
      handler(newVal) {
        // 当 topology_json 有值时（详情接口返回），重新加载数据并重绘
        if (newVal) {
          this.loadTopologyData()

          // 强制重绘画布
          this.$nextTick(() => {
            if (this.$refs.topologyCanvas) {
              this.$refs.topologyCanvas.draw()
            }
          })
        }
      },
      immediate: false
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
    // 将完整数据转换为展示数据（去除meta）
    nodeDataToDisplay(nodeData) {
      const { meta, ...displayData } = nodeData
      return displayData
    },

    edgeDataToDisplay(edgeData) {
      const { meta, ...displayData } = edgeData
      return displayData
    },

    // 同步展示数据：从完整数据生成展示数据
    syncDisplayData() {
      this.nodes = this.nodesData.map(node => this.nodeDataToDisplay(node))
      this.edges = this.edgesData.map(edge => this.edgeDataToDisplay(edge))
    },

    // 根据ID查找完整的节点数据
    findNodeData(nodeId) {
      return this.nodesData.find(n => n.id === nodeId)
    },

    // 根据ID查找完整的连接数据
    findEdgeData(edgeId) {
      return this.edgesData.find(e => e.id === edgeId)
    },

    loadTopologyData() {
      // 从 topologyData prop 加载实际保存的拓扑数据
      if (this.topologyData && this.topologyData.topology_json) {
        let topoJson = this.topologyData.topology_json

        // 如果 topology_json 是字符串，需要先解析
        if (typeof topoJson === 'string') {
          try {
            topoJson = JSON.parse(topoJson)
          } catch (e) {
            console.error('解析 topology_json 失败:', e)
            this.nodesData = []
            this.edgesData = []
            this.nodes = []
            this.edges = []
            this.positions = {}
            return
          }
        }

        // 加载节点数据（完整数据，包含meta）
        if (topoJson.nodes && Array.isArray(topoJson.nodes)) {
          this.nodesData = topoJson.nodes
        } else {
          this.nodesData = []
        }

        // 加载连线数据（完整数据，包含meta）
        if (topoJson.edges && Array.isArray(topoJson.edges)) {
          this.edgesData = topoJson.edges
        } else {
          this.edgesData = []
        }

        // 加载位置信息
        this.positions = topoJson.positions || {}

        // 生成展示数据（去除meta）
        this.syncDisplayData()
      } else {
        // 如果没有保存的数据，使用空数据
        this.nodesData = []
        this.edgesData = []
        this.nodes = []
        this.edges = []
        this.positions = {}
      }
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

      // 保存前从network实例获取所有节点的当前位置
      let currentPositions = {}
      if (this.$refs.topologyCanvas && this.$refs.topologyCanvas.network) {
        const network = this.$refs.topologyCanvas.network
        const nodeIds = this.nodesData.map(n => n.id)
        currentPositions = network.getPositions(nodeIds)

        // 更新nodesData中的位置信息
        this.nodesData.forEach(node => {
          if (currentPositions[node.id]) {
            node.x = currentPositions[node.id].x
            node.y = currentPositions[node.id].y
          }
        })
      }

      const topologyData = {
        topology_id: this.topologyData.topology_id,
        topology_json: {
          config: {},
          nodes: this.nodesData,  // 保存完整数据（包含meta）
          edges: this.edgesData,  // 保存完整数据（包含meta）
          positions: currentPositions,
          groups: []
        },
        version: this.topologyData.version || 1
      }

      this.$emit('save', topologyData)
    },

    handleSavePosition(positions) {
      this.positions = positions
    },

    handleRightClick(data) {
      this.contextMenuVisible = false // 先关闭，确保第二次右键时重新定位
      this.contextMenuTarget = data
      this.$nextTick(() => {
        this.contextMenuVisible = true // 显示菜单
        var menu = document.getElementById('contextmenu')
        this.styleMenu(menu)
      })
    },

    styleMenu(menu) {
      // 根据鼠标位置设置菜单位置
      if (event.clientX > window.innerWidth - 150) {
        menu.style.left = event.clientX - 120 + 'px'
      } else {
        menu.style.left = event.clientX + 'px'
      }

      if (event.clientY > window.innerHeight - 200) {
        menu.style.top = event.clientY - 120 + 'px'
      } else {
        menu.style.top = event.clientY + 'px'
      }

      // 添加点击事件监听，点击其他地方关闭菜单
      document.addEventListener('click', this.hideContextMenu)
    },

    hideContextMenu() {
      this.contextMenuVisible = false
      this.contextMenuTarget = null
      // 移除点击事件监听
      document.removeEventListener('click', this.hideContextMenu)
    },

    // 节点右键菜单操作
    handleViewNodeDetail() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }
      const nodeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const node = this.findNodeData(nodeId)
      if (node) {
        this.deviceDetailIp = node.id
        this.deviceDetailVisible = true
      } else {
        this.$message.error('节点不存在')
      }
      this.hideContextMenu()
    },

    handleEditNode() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }
      // detail 可能是对象或字符串，需要兼容处理
      const nodeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const node = this.findNodeData(nodeId)
      if (node) {
        this.nodeDialogMode = 'edit'
        this.currentNode = { ...node } // 使用浅拷贝避免直接修改原对象
        this.nodeDialogVisible = true
      } else {
        this.$message.error('节点不存在')
      }
      this.hideContextMenu()
    },

    handleDeleteNode() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }

      const nodeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const node = this.nodesData.find(n => n.id === nodeId)

      if (!node) {
        this.$message.error('节点不存在')
        this.hideContextMenu()
        return
      }

      this.$confirm(`确定删除节点 "${node.label}" 吗？删除后将同时删除与该节点相关的所有连接。`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除节点
        const nodeIndex = this.nodesData.findIndex(n => n.id === nodeId)
        if (nodeIndex !== -1) {
          this.nodesData.splice(nodeIndex, 1)
        }

        // 删除与该节点相关的所有连接
        this.edgesData = this.edgesData.filter(e => e.from !== nodeId && e.to !== nodeId)

        this.$message.success('节点删除成功')

        // 同步展示数据
        this.syncDisplayData()

        // 重绘画布
        this.$nextTick(() => {
          if (this.$refs.topologyCanvas) {
            this.$refs.topologyCanvas.draw()
          }
        })
      }).catch(() => {
        // 取消删除
      })

      this.hideContextMenu()
    },

    // 连接右键菜单操作
    handleViewLinkDetail() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }
      // 连接的detail通常是edge的id字符串
      const edgeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const edge = this.findEdgeData(edgeId)
      if (edge) {
        this.currentEdge = { ...edge }
        this.edgeDetailVisible = true
      } else {
        this.$message.error('连接不存在')
      }
      this.hideContextMenu()
    },

    handleEditEdge() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }
      const edgeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const edge = this.findEdgeData(edgeId)
      if (edge) {
        this.edgeDialogMode = 'edit'
        this.currentEdge = { ...edge } // 使用浅拷贝
        this.edgeDialogVisible = true
      } else {
        this.$message.error('连接不存在')
      }
      this.hideContextMenu()
    },

    handleDeleteEdge() {
      if (!this.contextMenuTarget || !this.contextMenuTarget.detail) {
        this.hideContextMenu()
        return
      }

      const edgeId = typeof this.contextMenuTarget.detail === 'object'
        ? this.contextMenuTarget.detail.id
        : this.contextMenuTarget.detail

      const edge = this.findEdgeData(edgeId)

      if (!edge) {
        this.$message.error('连接不存在')
        this.hideContextMenu()
        return
      }

      this.$confirm(`确定删除连接 "${edge.label || '无描述'}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除连接
        const edgeIndex = this.edgesData.findIndex(e => e.id === edgeId)
        if (edgeIndex !== -1) {
          this.edgesData.splice(edgeIndex, 1)
        }

        this.$message.success('连接删除成功')

        // 同步展示数据
        this.syncDisplayData()

        // 重绘画布
        this.$nextTick(() => {
          if (this.$refs.topologyCanvas) {
            this.$refs.topologyCanvas.draw()
          }
        })
      }).catch(() => {
        // 取消删除
      })

      this.hideContextMenu()
    },

    handleAddNode() {
      this.nodeDialogMode = 'create'
      this.currentNode = null
      this.nodeDialogVisible = true
    },

    handleNodeSubmit(nodeData) {
      // 检查节点ID是否已存在
      const existingNode = this.nodesData.find(n => n.id === nodeData.id)
      if (this.nodeDialogMode === 'create' && existingNode) {
        this.$message.error('节点ID已存在')
        return
      }

      if (this.nodeDialogMode === 'create') {
        // 添加新节点到完整数据（包含meta）
        this.nodesData.push(nodeData)
        this.$message.success('节点添加成功')
      } else {
        // 编辑节点
        const index = this.nodesData.findIndex(n => n.id === nodeData.id)
        if (index !== -1) {
          this.$set(this.nodesData, index, nodeData)
          this.$message.success('节点更新成功')
        }
      }

      const isNewNode = this.nodeDialogMode === 'create'

      this.nodeDialogVisible = false

      // 同步展示数据
      this.syncDisplayData()

      // 强制重绘画布
      this.$nextTick(() => {
        if (this.$refs.topologyCanvas) {
          this.$refs.topologyCanvas.draw()
        }
      })

      // 新建节点后自动搜索LLDP邻居，若对端已在拓扑中则自动创建连接
      if (isNewNode) {
        this.autoConnectFromLLDP(nodeData)
      }
    },

    autoConnectFromLLDP(nodeData) {
      collectorApi.getLLDPS({ loc_ip: `^${nodeData.id}$` })
        .then(response => {
          const res = response.data
          if (res.code !== 0) {
            return
          }

          const lldpList = res.data || []
          if (lldpList.length === 0) {
            return
          }

          // 按对端设备聚合线路数量
          const targetMap = {}
          lldpList.forEach(item => {
            const targetIp = item.rem_ip
            if (!targetIp || targetIp === nodeData.id) {
              return
            }
            if (!targetMap[targetIp]) {
              targetMap[targetIp] = { ip: targetIp, name: item.rem_name, count: 0 }
            }
            targetMap[targetIp].count++
          })

          let addedCount = 0
          Object.values(targetMap).forEach(target => {
            // 对端设备必须已存在于当前拓扑中才自动连接
            const targetNode = this.nodesData.find(n => n.id === target.ip)
            if (!targetNode) {
              return
            }

            // 双向检查连接是否已存在
            const existingEdge = this.edgesData.find(e =>
              (e.from === nodeData.id && e.to === target.ip) ||
              (e.from === target.ip && e.to === nodeData.id)
            )
            if (existingEdge) {
              return
            }

            this.edgesData.push({
              id: `${nodeData.id}@${target.ip}`,
              from: nodeData.id,
              to: target.ip,
              label: target.count > 1 ? `${target.count}条线路` : '',
              color: { color: '#333333' }
            })
            addedCount++
          })

          if (addedCount > 0) {
            this.$message.success(`根据LLDP自动创建了 ${addedCount} 条连接`)
            this.syncDisplayData()
            this.$nextTick(() => {
              if (this.$refs.topologyCanvas) {
                this.$refs.topologyCanvas.draw()
              }
            })
          }
        })
        .catch(error => {
          console.error('自动搜索LLDP连接失败:', error)
        })
    },

    handleAddLink() {
      this.edgeDialogMode = 'create'
      this.currentEdge = null
      this.edgeDialogVisible = true
    },

    handleEdgeSubmit(edgesArray) {
      let addedCount = 0
      let duplicateCount = 0

      edgesArray.forEach(edgeData => {
        // 检查连接是否已存在（双向检查）
        const existingEdge = this.edgesData.find(e =>
          (e.from === edgeData.from && e.to === edgeData.to) ||
          (e.from === edgeData.to && e.to === edgeData.from)
        )

        if (this.edgeDialogMode === 'create' && existingEdge) {
          duplicateCount++
          return
        }

        // 检查源节点和目标节点是否都存在
        const fromNode = this.nodesData.find(n => n.id === edgeData.from)
        const toNode = this.nodesData.find(n => n.id === edgeData.to)

        if (!fromNode) {
          this.$message.warning(`源节点 ${edgeData.from} 不存在，跳过该连接`)
          return
        }
        if (!toNode) {
          this.$message.warning(`目标节点 ${edgeData.to} 不存在，跳过该连接`)
          return
        }

        if (this.edgeDialogMode === 'create') {
          // 添加新连接到完整数据（包含meta）
          this.edgesData.push(edgeData)
          addedCount++
        } else {
          // 编辑连接：支持双向查找
          const index = this.edgesData.findIndex(e =>
            e.id === edgeData.id ||
            (e.from === edgeData.from && e.to === edgeData.to) ||
            (e.from === edgeData.to && e.to === edgeData.from)
          )
          if (index !== -1) {
            this.$set(this.edgesData, index, edgeData)
            addedCount++
          }
        }
      })

      this.edgeDialogVisible = false

      if (this.edgeDialogMode === 'create') {
        if (addedCount > 0) {
          this.$message.success(`成功添加 ${addedCount} 条连接` + (duplicateCount > 0 ? `，${duplicateCount} 条重复已跳过` : ''))

          // 同步展示数据
          this.syncDisplayData()

          // 强制重绘画布以显示新连接
          this.$nextTick(() => {
            if (this.$refs.topologyCanvas) {
              this.$refs.topologyCanvas.draw()
            }
          })
        } else if (duplicateCount > 0) {
          this.$message.warning('所有连接均已存在')
        }
      } else {
        // 编辑模式
        this.$message.success('连接更新成功')
        // 同步展示数据
        this.syncDisplayData()
        // 强制重绘画布
        this.$nextTick(() => {
          if (this.$refs.topologyCanvas) {
            this.$refs.topologyCanvas.draw()
          }
        })
      }
    }
  },

  components: {
    NetworkTopology,
    NodeFormDialog,
    EdgeFormDialog,
    EdgeDetailDialog,
    DeviceDetailPanel
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
  position: absolute;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 120px;
  padding: 5px 0;
}

.contextmenu__item {
  display: block;
  line-height: 20px;
  text-align: center;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
}

.contextmenu__item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.contextmenu__item:hover {
  background: #f5f5f5;
}

.contextmenu__item.danger {
  color: #f56c6c;
}

.contextmenu__item.danger:hover {
  background: #fef0f0;
}
</style>
