<template>
  <div class="topology-editor">
    <!-- 头部：标题 + 操作 + 基础信息 -->
    <div class="editor-header">
      <div class="eh-main">
        <el-button size="small" icon="el-icon-back" @click="handleBack">返回</el-button>
        <div class="eh-title">
          <i class="el-icon-picture-outline"></i>
          <span class="eh-name" :title="topologyName">{{ topologyName }}</span>
          <span class="eh-version">v{{ topologyData.version || 1 }}</span>
          <span v-if="categoryPath" class="eh-path"><i class="el-icon-folder"></i>{{ categoryPath }}</span>
        </div>
        <div class="eh-stats">
          <span><i class="el-icon-cpu"></i>节点 <b>{{ nodesData.length }}</b></span>
          <span><i class="el-icon-connection"></i>连接 <b>{{ edgesData.length }}</b></span>
        </div>
        <div class="eh-actions">
          <el-button-group>
            <el-button size="small" icon="el-icon-aim" @click="handleFocusCenter" title="聚焦画布">聚焦</el-button>
            <el-button size="small" icon="el-icon-circle-plus-outline" @click="handleAddNode">添加节点</el-button>
            <el-button size="small" icon="el-icon-connection" @click="handleAddLink">添加连接</el-button>
          </el-button-group>
          <el-button type="primary" icon="el-icon-check" size="small" @click="handleSave" :loading="saving">保存</el-button>
        </div>
      </div>
      <div class="eh-meta">
        <span class="meta-desc" :title="topologyData.description || ''">
          <i class="el-icon-document"></i>{{ topologyData.description || '暂无描述' }}
        </span>
        <span class="meta-item"><i class="el-icon-user"></i>创建 {{ topologyData.created_by || '-' }} · {{ topologyData.created_at || '-' }}</span>
        <span class="meta-item"><i class="el-icon-edit-outline"></i>更新 {{ topologyData.updated_by || '-' }} · {{ topologyData.updated_at || '-' }}</span>
      </div>
    </div>

    <!-- 拓扑画布：画布尺寸自适应窗口，无需滚动 -->
    <div class="topology-canvas-wrapper" @contextmenu.capture.prevent="recordMousePos">
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

      <!-- 空画布引导 -->
      <div v-if="canvasReady && nodesData.length === 0" class="canvas-empty">
        <el-empty :image-size="90" description="画布中还没有节点">
          <el-button type="primary" size="small" icon="el-icon-circle-plus-outline" @click="handleAddNode">添加节点</el-button>
        </el-empty>
      </div>

      <!-- 操作提示 -->
      <div class="canvas-hint">
        <i class="el-icon-info"></i>右键节点 / 连线可查看详情、编辑或删除；拖动节点调整布局后请点击保存
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      @click.stop>
      <template v-if="contextMenuTarget && contextMenuTarget.click_type === 'node'">
        <div class="menu-head"><i :class="contextNodeIsCloud ? 'el-icon-cloudy' : 'el-icon-cpu'"></i>{{ contextTargetName }}</div>
        <div v-if="!contextNodeIsCloud" class="contextmenu__item" @click="handleViewNodeDetail"><i class="el-icon-view"></i>查看详情</div>
        <div class="contextmenu__item" @click="handleEditNode"><i class="el-icon-edit-outline"></i>编辑节点</div>
        <div class="menu-divider"></div>
        <div class="contextmenu__item danger" @click="handleDeleteNode"><i class="el-icon-delete"></i>删除节点</div>
      </template>
      <template v-else-if="contextMenuTarget && contextMenuTarget.click_type === 'link'">
        <div class="menu-head"><i class="el-icon-connection"></i>{{ contextTargetName }}</div>
        <div class="contextmenu__item" @click="handleViewLinkDetail"><i class="el-icon-view"></i>链路详情</div>
        <div class="contextmenu__item" @click="handleEditEdge"><i class="el-icon-edit-outline"></i>编辑连接</div>
        <div class="menu-divider"></div>
        <div class="contextmenu__item danger" @click="handleDeleteEdge"><i class="el-icon-delete"></i>删除连接</div>
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
      :visible.sync="deviceDetailVisible"
      direction="rtl"
      size="70%"
      custom-class="topo-device-drawer"
      :wrapperClosable="false"
      destroy-on-close
      append-to-body>
      <div slot="title" class="drawer-title">
        <i class="el-icon-monitor"></i>设备详情
        <span class="drawer-ip">{{ deviceDetailIp }}</span>
        <el-button type="text" size="mini" icon="el-icon-top-right" @click="openFullDetail">在新页面打开</el-button>
      </div>
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
      menuX: 0,
      menuY: 0,
      lastMouse: null, // 最近一次画布右键的鼠标位置，用于定位菜单

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
    },

    categoryPath() {
      const cats = (this.topologyData && this.topologyData.category_types) || []
      return cats.join(' / ')
    },

    // 右键菜单标题：节点显示名称，连接显示两端名称
    contextTargetName() {
      const target = this.contextMenuTarget
      if (!target || !target.detail) return ''
      const id = typeof target.detail === 'object' ? target.detail.id : target.detail
      if (target.click_type === 'node') {
        const node = this.findNodeData(id)
        return node ? (node.label || node.id) : id
      }
      const edge = this.findEdgeData(id)
      if (!edge) return id
      const from = this.findNodeData(edge.from)
      const to = this.findNodeData(edge.to)
      return (from ? from.label : edge.from) + ' ↔ ' + (to ? to.label : edge.to)
    },

    // 右键的节点是否为云节点（云节点没有设备详情）
    contextNodeIsCloud() {
      const target = this.contextMenuTarget
      if (!target || target.click_type !== 'node' || !target.detail) return false
      const id = typeof target.detail === 'object' ? target.detail.id : target.detail
      return this.isCloudNode(id)
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
    window.addEventListener('resize', this.hideContextMenu)

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
    window.removeEventListener('resize', this.hideContextMenu)
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

    isCloudNode(nodeId) {
      const node = this.findNodeData(nodeId)
      return !!node && node.group === 'cloud'
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
        // clientWidth/clientHeight 不含边框，避免画布被边框裁切
        this.canvasWidth = wrapper.clientWidth + 'px'
        this.canvasHeight = wrapper.clientHeight + 'px'
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

    // 画布右键（捕获阶段，先于拓扑组件的 oncontext 触发）：记录鼠标位置
    recordMousePos(e) {
      this.lastMouse = { x: e.clientX, y: e.clientY }
      // 右键空白处时关闭已打开的菜单；右键节点/连线会在随后的 rightclick 中重新打开
      this.contextMenuVisible = false
    },

    handleRightClick(data) {
      this.contextMenuVisible = false // 先关闭，确保第二次右键时重新定位
      this.contextMenuTarget = data
      this.$nextTick(() => {
        const pos = this.lastMouse || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        // 靠近窗口边缘时向内偏移，避免菜单被遮挡
        this.menuX = Math.min(pos.x, window.innerWidth - 170)
        this.menuY = Math.min(pos.y, window.innerHeight - 170)
        this.contextMenuVisible = true
      })
    },

    hideContextMenu() {
      this.contextMenuVisible = false
      this.contextMenuTarget = null
    },

    // 在新窗口打开完整设备详情页，避免离开当前未保存的拓扑
    openFullDetail() {
      if (!this.deviceDetailIp) return
      const route = this.$router.resolve({ path: '/pages/device/device_detail', query: { dev: this.deviceDetailIp } })
      window.open(route.href, '_blank')
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
        // 云节点没有 LLDP，除非某一端设备名按 设备名[接口名] 指定了接口
        const hasSpec = [edge.from, edge.to].some(id => {
          const node = this.findNodeData(id)
          return !!node && !!node.meta && /\[.+\]\s*$/.test(node.meta.sysname || '')
        })
        if ((this.isCloudNode(edge.from) || this.isCloudNode(edge.to)) && !hasSpec) {
          this.$message.info('云节点没有 LLDP 信息，可将对端设备名填写为 设备名[接口名] 以查看接口')
          this.hideContextMenu()
          return
        }
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

      // 新建节点后自动搜索LLDP邻居，若对端已在拓扑中则自动创建连接（云节点无 LLDP，跳过）
      if (isNewNode && nodeData.group !== 'cloud') {
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
            const targetName = item.rem_name

            // 跳过自己连接到自己的情况
            if (targetIp && targetIp === nodeData.id) {
              return
            }

            // 必须有 IP 或设备名其中之一
            if (!targetIp && !targetName) {
              return
            }

            // 使用 IP 或设备名作为 key（优先 IP）
            const key = targetIp || targetName
            if (!targetMap[key]) {
              targetMap[key] = { ip: targetIp, name: targetName, count: 0 }
            }
            targetMap[key].count++
          })

          let addedCount = 0
          Object.values(targetMap).forEach(target => {
            // 对端设备必须已存在于当前拓扑中才自动连接
            // 优先通过 IP 匹配，如果 IP 不存在则通过设备名（meta.sysname）匹配
            let targetNode = null

            if (target.ip) {
              targetNode = this.nodesData.find(n => n.id === target.ip)
            }

            // 如果通过 IP 没找到，且有设备名，则通过 meta.sysname 匹配
            if (!targetNode && target.name) {
              targetNode = this.nodesData.find(n =>
                n.meta && n.meta.sysname === target.name
              )
            }

            if (!targetNode) {
              return
            }

            // 双向检查连接是否已存在
            const existingEdge = this.edgesData.find(e =>
              (e.from === nodeData.id && e.to === targetNode.id) ||
              (e.from === targetNode.id && e.to === nodeData.id)
            )
            if (existingEdge) {
              return
            }

            this.edgesData.push({
              id: `${nodeData.id}@${targetNode.id}`,
              from: nodeData.id,
              to: targetNode.id,
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
  color: #303133;
}

/* 头部 */
.editor-header {
  flex-shrink: 0;
  margin-bottom: 10px;
  padding: 10px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.eh-main {
  display: flex;
  align-items: center;
}
.eh-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  margin-left: 14px;
}
.eh-title > i {
  flex-shrink: 0;
  margin-right: 6px;
  font-size: 18px;
  color: #409eff;
}
.eh-name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.eh-version {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  border-radius: 9px;
  color: #409eff;
  background-color: #ecf5ff;
}
.eh-path {
  flex-shrink: 1;
  min-width: 0;
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.eh-path i {
  margin-right: 3px;
}
.eh-stats {
  flex-shrink: 0;
  display: flex;
  margin: 0 16px;
  font-size: 12px;
  color: #909399;
}
.eh-stats span + span {
  margin-left: 14px;
}
.eh-stats i {
  margin-right: 3px;
}
.eh-stats b {
  font-size: 14px;
  color: #303133;
}
.eh-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.eh-actions .el-button-group {
  margin-right: 10px;
}
.eh-meta {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  font-size: 12px;
  color: #909399;
  border-top: 1px dashed #ebeef5;
}
.eh-meta i {
  margin-right: 4px;
}
.meta-desc {
  flex: 1;
  min-width: 0;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-item {
  flex-shrink: 0;
  margin-left: 20px;
}

/* 画布 */
.topology-canvas-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fff;
  background-image: radial-gradient(#e4e7ed 1px, transparent 1px);
  background-size: 18px 18px;
  overflow: hidden;
}
.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.canvas-empty /deep/ .el-button {
  pointer-events: auto;
}
.canvas-hint {
  position: absolute;
  left: 10px;
  bottom: 8px;
  padding: 3px 10px;
  font-size: 12px;
  color: #909399;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  pointer-events: none;
}
.canvas-hint i {
  margin-right: 4px;
  color: #409eff;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 150px;
  max-width: 260px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.menu-head {
  padding: 4px 14px 6px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-head i {
  margin-right: 4px;
}
.contextmenu__item {
  padding: 0 14px;
  line-height: 32px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}
.contextmenu__item i {
  margin-right: 8px;
}
.contextmenu__item:hover {
  color: #409eff;
  background: #ecf5ff;
}
.contextmenu__item.danger {
  color: #f56c6c;
}
.contextmenu__item.danger:hover {
  color: #f56c6c;
  background: #fef0f0;
}
.menu-divider {
  margin: 4px 0;
  border-top: 1px solid #ebeef5;
}

/* 设备详情抽屉 */
.drawer-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.drawer-title > i {
  margin-right: 6px;
  color: #409eff;
}
.drawer-ip {
  margin: 0 12px 0 10px;
  font-size: 13px;
  font-weight: normal;
  color: #606266;
  font-family: Menlo, Consolas, "Courier New", monospace;
}
</style>

<style>
/* 抽屉 append-to-body，需非 scoped 样式 */
.topo-device-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 14px 20px;
  border-bottom: 1px solid #ebeef5;
}
.topo-device-drawer .el-drawer__body {
  padding: 16px 20px;
  overflow-y: auto;
}
</style>
