<template>
  <div class="topology-tree">
    <!-- 头部工具栏 -->
    <div class="tree-header">
      <span style="font-weight: bold; font-size: 14px;">拓扑管理</span>
      <el-button type="text" icon="el-icon-plus" size="small" @click="handleCreate">新建</el-button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        placeholder="搜索拓扑"
        prefix-icon="el-icon-search"
        size="small"
        clearable
        @input="handleSearch">
      </el-input>
    </div>

    <!-- 分类树 + 拓扑列表 -->
    <div class="tree-content">
      <el-tree
        :data="treeData"
        :props="treeProps"
        :filter-node-method="filterNode"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
        ref="tree"
        @node-click="handleNodeClick"
        @node-contextmenu="handleNodeRightClick">
        <span class="custom-tree-node" slot-scope="{ node, data }">
          <!-- 分类节点 -->
          <template v-if="data.type === 'category' || data.type === 'root'">
            <i :class="data.icon || 'el-icon-folder'" :style="{color: data.color || '#1890ff'}"></i>
            <span style="margin-left: 5px;">{{ node.label }}</span>
            <span class="node-count" v-if="data.count > 0">({{ data.count }})</span>
          </template>

          <!-- 拓扑节点 -->
          <template v-else-if="data.type === 'topology'">
            <i class="el-icon-document" style="color: #52c41a;"></i>
            <span style="margin-left: 5px;">{{ node.label }}</span>
            <span class="node-actions">
              <el-button
                type="text"
                icon="el-icon-edit"
                size="mini"
                @click.stop="handleEdit(data)"
                style="padding: 2px;">
              </el-button>
              <el-button
                type="text"
                icon="el-icon-delete"
                size="mini"
                @click.stop="handleDelete(data)"
                style="padding: 2px; color: #f56c6c;">
              </el-button>
            </span>
          </template>
        </span>
      </el-tree>
    </div>

    <!-- 右键菜单 -->
    <div v-show="contextMenuVisible" class="context-menu" :style="{left: contextMenuX + 'px', top: contextMenuY + 'px'}">
      <div class="menu-item" @click="handleContextEdit">编辑</div>
      <div class="menu-item" @click="handleContextDelete" style="color: #f56c6c;">删除</div>
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
      },
      immediate: true,
      deep: true
    }
  },

  mounted() {
    document.addEventListener('click', this.hideContextMenu)
  },

  beforeDestroy() {
    document.removeEventListener('click', this.hideContextMenu)
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
            // 累加子节点的拓扑数量
            node.children.forEach(child => {
              if (child.type === 'topology') {
                // 已经计数了
              } else if (child.type === 'category') {
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
          icon: 'el-icon-document',
          color: '#999',
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

    // 搜索过滤
    filterNode(value, data) {
      if (!value) return true

      // 如果是拓扑节点，按名称搜索
      if (data.type === 'topology') {
        return data.label.toLowerCase().includes(value.toLowerCase())
      }

      // 如果是分类节点，检查是否有子节点匹配
      return true
    },

    handleSearch() {
      this.$refs.tree.filter(this.searchText)
    },

    // 节点点击
    handleNodeClick(data) {
      if (data.type === 'topology') {
        // 点击拓扑，打开详情
        this.$emit('open', data.data)
      } else {
        // 点击分类，展开/折叠（树组件自动处理）
      }
    },

    // 节点右键
    handleNodeRightClick(event, data) {
      if (data.type === 'topology') {
        event.preventDefault()
        this.contextMenuTarget = data
        this.contextMenuVisible = true
        this.contextMenuX = event.clientX
        this.contextMenuY = event.clientY
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
}

.tree-header {
  padding: 15px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  padding: 10px 15px;
  border-bottom: 1px solid #e8e8e8;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 8px;
}

.node-count {
  margin-left: 5px;
  color: #999;
  font-size: 12px;
}

.node-actions {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.3s;
}

.custom-tree-node:hover .node-actions {
  opacity: 1;
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
