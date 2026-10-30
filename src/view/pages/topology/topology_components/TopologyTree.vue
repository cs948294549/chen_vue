<template>
  <div class="topology-tree">
    <!-- 头部工具栏 -->
    <div class="tree-header">
      <div class="tree-title">
        <i class="el-icon-share"></i>拓扑列表
        <span class="count-badge">{{ topologyList.length }}</span>
      </div>
      <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleCreate">新建</el-button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        placeholder="搜索拓扑名称或分类"
        prefix-icon="el-icon-search"
        size="small"
        clearable
        @input="handleSearch">
      </el-input>
    </div>

    <!-- 分类树 + 拓扑列表 -->
    <div class="tree-content" v-loading="loading">
      <el-tree
        v-show="treeData.length"
        :data="treeData"
        :props="treeProps"
        :filter-node-method="filterNode"
        node-key="id"
        default-expand-all
        highlight-current
        empty-text="没有匹配的拓扑"
        :expand-on-click-node="false"
        ref="tree"
        @node-click="handleNodeClick"
        @node-contextmenu="handleNodeRightClick">
        <span
          class="custom-tree-node"
          :class="{ 'is-leaf': data.type === 'topology' }"
          slot-scope="{ node, data }">
          <!-- 分类节点 -->
          <template v-if="data.type === 'category' || data.type === 'root'">
            <i
              :class="data.type === 'root' ? 'el-icon-folder-remove' : (node.expanded ? 'el-icon-folder-opened' : 'el-icon-folder')"
              :style="{ color: data.color || '#e6a23c' }"></i>
            <span class="node-label">{{ node.label }}</span>
            <span class="node-count" v-if="data.count > 0">{{ data.count }}</span>
          </template>

          <!-- 拓扑节点 -->
          <template v-else-if="data.type === 'topology'">
            <i class="el-icon-picture-outline topo-icon"></i>
            <span class="node-label" :title="node.label">{{ node.label }}</span>
            <span class="node-actions">
              <el-tooltip content="编辑" placement="top" :open-delay="400">
                <i class="el-icon-edit-outline act-icon" @click.stop="handleEdit(data)"></i>
              </el-tooltip>
              <el-tooltip content="删除" placement="top" :open-delay="400">
                <i class="el-icon-delete act-icon danger" @click.stop="handleDelete(data)"></i>
              </el-tooltip>
            </span>
          </template>
        </span>
      </el-tree>
      <el-empty
        v-if="!loading && treeData.length === 0"
        :image-size="70"
        description="暂无拓扑，点击右上角新建">
      </el-empty>
    </div>

    <!-- 右键菜单 -->
    <div v-show="contextMenuVisible" class="context-menu" :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}">
      <div class="menu-item" @click="handleContextOpen"><i class="el-icon-view"></i>打开</div>
      <div class="menu-item" @click="handleContextEdit"><i class="el-icon-edit-outline"></i>编辑</div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="handleContextDelete"><i class="el-icon-delete"></i>删除</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopologyTree',

  props: {
    topologyList: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    // 当前打开的拓扑ID，用于高亮
    activeId: {
      type: [Number, String],
      default: null
    }
  },

  data() {
    return {
      treeData: [],
      treeProps: {
        children: 'children',
        label: 'label'
      },
      searchText: '',

      // 右键菜单
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuTarget: null
    }
  },

  watch: {
    topologyList: {
      handler() {
        this.buildTree()
        // 数据重建后保持搜索与高亮状态
        this.$nextTick(() => {
          if (this.searchText) {
            this.handleSearch()
          }
          this.syncCurrent()
        })
      },
      immediate: true,
      deep: true
    },
    activeId() {
      this.syncCurrent()
    }
  },

  mounted() {
    document.addEventListener('click', this.hideContextMenu)
    window.addEventListener('scroll', this.hideContextMenu, true)
  },

  beforeDestroy() {
    document.removeEventListener('click', this.hideContextMenu)
    window.removeEventListener('scroll', this.hideContextMenu, true)
  },

  methods: {
    // 构建分类树（包含拓扑节点）
    buildTree() {
      const tree = []
      const pathMap = {}

      // 第一遍：构建分类结构
      this.topologyList.forEach(topo => {
        const categories = topo.category_types || []

        if (categories.length > 0) {
          let currentPath = ''
          let currentLevel = tree

          categories.forEach((cat, index) => {
            currentPath = currentPath ? `${currentPath}/${cat}` : cat

            if (!pathMap[currentPath]) {
              const node = {
                id: currentPath,
                label: cat,
                type: 'category',
                path: categories.slice(0, index + 1),
                children: [],
                count: 0
              }
              pathMap[currentPath] = node
              currentLevel.push(node)
            }

            currentLevel = pathMap[currentPath].children
          })
        }
      })

      // 第二遍：将拓扑添加到对应分类下
      this.topologyList.forEach(topo => {
        const categories = topo.category_types || []

        if (categories.length > 0) {
          // 有分类，添加到对应分类下
          const path = categories.join('/')
          if (pathMap[path]) {
            pathMap[path].children.push({
              id: `topology_${topo.topology_id}`,
              label: topo.topology_name,
              type: 'topology',
              data: topo
            })
            pathMap[path].count++
          }
        }
      })

      // 统计分类数量（包括子分类的拓扑）
      const updateCount = (nodes) => {
        nodes.forEach(node => {
          if (node.type === 'category' && node.children) {
            updateCount(node.children)
            // 累加子分类的拓扑数量
            node.children.forEach(child => {
              if (child.type === 'category') {
                node.count += child.count
              }
            })
          }
        })
      }
      updateCount(tree)

      // 添加"未分类"节点
      const uncategorizedList = this.topologyList.filter(t => !t.category_types || t.category_types.length === 0)
      if (uncategorizedList.length > 0) {
        const uncategorizedNode = {
          id: 'uncategorized',
          label: '未分类',
          type: 'root',
          color: '#909399',
          count: uncategorizedList.length,
          children: uncategorizedList.map(topo => ({
            id: `topology_${topo.topology_id}`,
            label: topo.topology_name,
            type: 'topology',
            data: topo
          }))
        }
        tree.push(uncategorizedNode)
      }

      this.treeData = tree
    },

    // 搜索过滤：按拓扑名称或所属分类路径匹配，分类节点随匹配的子节点自动显示
    filterNode(value, data) {
      if (!value) return true
      if (data.type !== 'topology') return false

      const kw = value.trim().toLowerCase()
      const path = (data.data.category_types || []).join('/')
      return (data.label || '').toLowerCase().indexOf(kw) !== -1 ||
        path.toLowerCase().indexOf(kw) !== -1
    },

    handleSearch() {
      if (this.$refs.tree) {
        this.$refs.tree.filter(this.searchText)
      }
    },

    syncCurrent() {
      if (!this.$refs.tree) return
      const key = this.activeId !== null && this.activeId !== undefined ? `topology_${this.activeId}` : null
      this.$refs.tree.setCurrentKey(key)
    },

    // 节点点击
    handleNodeClick(data, node) {
      if (data.type === 'topology') {
        // 点击拓扑，打开详情
        this.$emit('open', data.data)
      } else {
        // 点击分类，展开/折叠
        node.expanded ? node.collapse() : node.expand()
        this.$nextTick(this.syncCurrent)
      }
    },

    // 节点右键
    handleNodeRightClick(event, data) {
      if (data.type === 'topology') {
        event.preventDefault()
        this.contextMenuTarget = data
        this.contextMenuVisible = true
        // 靠近窗口边缘时向内偏移，避免菜单被遮挡
        this.contextMenuX = Math.min(event.clientX, window.innerWidth - 140)
        this.contextMenuY = Math.min(event.clientY, window.innerHeight - 130)
      }
    },

    // 隐藏右键菜单
    hideContextMenu() {
      this.contextMenuVisible = false
    },

    // 新建拓扑
    handleCreate() {
      this.$emit('create')
    },

    // 编辑拓扑
    handleEdit(data) {
      this.$emit('edit', data.data)
    },

    // 删除拓扑
    handleDelete(data) {
      this.$emit('delete', data.data)
    },

    // 右键菜单 - 打开
    handleContextOpen() {
      if (this.contextMenuTarget) {
        this.$emit('open', this.contextMenuTarget.data)
      }
      this.hideContextMenu()
    },

    // 右键菜单 - 编辑
    handleContextEdit() {
      if (this.contextMenuTarget) {
        this.$emit('edit', this.contextMenuTarget.data)
      }
      this.hideContextMenu()
    },

    // 右键菜单 - 删除
    handleContextDelete() {
      if (this.contextMenuTarget) {
        this.$emit('delete', this.contextMenuTarget.data)
      }
      this.hideContextMenu()
    }
  }
}
</script>

<style scoped>
.topology-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}
.tree-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}
.tree-title > i {
  margin-right: 6px;
  font-size: 16px;
  color: #409eff;
}
.count-badge {
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 9px;
  color: #409eff;
  background-color: #ecf5ff;
}

.search-box {
  padding: 10px 12px;
  border-bottom: 1px solid #f2f3f5;
}

.tree-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
}
.tree-content /deep/ .el-tree-node__content {
  height: 32px;
  border-radius: 4px;
}
.tree-content /deep/ .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
}
.tree-content /deep/ .el-tree-node.is-current > .el-tree-node__content .node-label {
  font-weight: 600;
  color: #409eff;
}

.custom-tree-node {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  font-size: 13px;
  padding-right: 6px;
}
.custom-tree-node > i {
  flex-shrink: 0;
  font-size: 15px;
}
.topo-icon {
  color: #67c23a;
}
.node-label {
  margin-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-count {
  flex-shrink: 0;
  margin-left: 6px;
  padding: 0 6px;
  height: 16px;
  line-height: 16px;
  font-size: 11px;
  border-radius: 8px;
  color: #909399;
  background: #f4f4f5;
}

.node-actions {
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}
.custom-tree-node:hover .node-actions {
  opacity: 1;
}
.act-icon {
  padding: 3px;
  font-size: 14px;
  color: #909399;
  border-radius: 3px;
  cursor: pointer;
}
.act-icon:hover {
  color: #409eff;
  background: #ecf5ff;
}
.act-icon.danger:hover {
  color: #f56c6c;
  background: #fef0f0;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 120px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.menu-item {
  padding: 0 14px;
  line-height: 32px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}
.menu-item i {
  margin-right: 8px;
}
.menu-item:hover {
  color: #409eff;
  background: #ecf5ff;
}
.menu-item.danger {
  color: #f56c6c;
}
.menu-item.danger:hover {
  color: #f56c6c;
  background: #fef0f0;
}
.menu-divider {
  margin: 4px 0;
  border-top: 1px solid #ebeef5;
}
</style>
