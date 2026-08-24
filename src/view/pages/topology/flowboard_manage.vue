<template>
  <div class="flow-board-page">
    <!-- 左侧分类树 -->
    <div class="left-panel" v-show="search_panel_visible">
      <div class="tree-header">
        <span style="font-weight: bold; font-size: 14px;">看板管理</span>
        <el-button type="text" icon="el-icon-plus" size="small" @click="handleNewBoard">新建</el-button>
      </div>

      <div class="search-box">
        <el-input
          v-model="tree_search_text"
          placeholder="搜索看板"
          prefix-icon="el-icon-search"
          size="small"
          clearable
          @input="handleTreeSearch">
        </el-input>
      </div>

      <div class="tree-content">
        <el-tree
          :data="flow_tree_data"
          :props="{children:'children', label:'label'}"
          :filter-node-method="filterTreeNode"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          ref="flowTree"
          @node-click="handleTreeNodeClick">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <template v-if="data.type === 'category' || data.type === 'root'">
              <i :class="data.icon || 'el-icon-folder'" :style="{color: data.color || '#1890ff'}"></i>
              <span style="margin-left: 5px;">{{ node.label }}</span>
              <span class="node-count" v-if="data.count > 0">({{ data.count }})</span>
            </template>
            <template v-else-if="data.type === 'flow'">
              <i class="el-icon-data-line" style="color: #52c41a;"></i>
              <span style="margin-left: 5px;">{{ node.label }}</span>
              <span class="node-actions">
                <el-button type="text" icon="el-icon-edit" size="mini" @click.stop="handleEditMeta(data.data)" style="padding: 2px;"></el-button>
                <el-button type="text" icon="el-icon-delete" size="mini" @click.stop="handleDeleteBoard(data.data)" style="padding: 2px; color: #f56c6c;"></el-button>
              </span>
            </template>
          </span>
        </el-tree>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="right-panel">
      <div class="board-toolbar">
        <span class="board-title">{{current_flow.flow_id ? current_flow.flow_name : '未保存的看板'}}</span>
        <div>
          <el-button size="mini" plain :icon="search_panel_visible ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" @click="search_panel_visible=!search_panel_visible">
            {{search_panel_visible ? '隐藏搜索' : '显示搜索'}}
          </el-button>
          <el-button size="mini" type="primary" :loading="board_saving" @click="handleSaveBoard">保存看板</el-button>
        </div>
      </div>

      <el-card v-show="search_panel_visible" shadow="never" class="search-card">
        <el-form :inline="true" size="mini" @submit.native.prevent>
          <el-form-item label="设备IP">
            <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="searchPorts" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="isload" @click="searchPorts">搜索</el-button>
          </el-form-item>
        </el-form>

        <el-form v-if="port_list.length>0" :inline="true" size="mini" class="table-filter-form">
          <el-form-item label="端口名">
            <el-input placeholder="端口名过滤" v-model="table_filter_ifname" clearable></el-input>
          </el-form-item>
          <el-form-item label="端口描述">
            <el-input placeholder="端口描述过滤" v-model="table_filter_alias" clearable></el-input>
          </el-form-item>
        </el-form>

        <el-table
          v-if="port_list.length>0"
          :data="filtered_port_list"
          border
          size="mini"
          max-height="300"
          style="width: 100%;">
          <el-table-column prop="sysname" label="设备名" show-overflow-tooltip min-width="15" align="center"></el-table-column>
          <el-table-column prop="ip" label="设备IP" show-overflow-tooltip min-width="12" align="center"></el-table-column>
          <el-table-column prop="if_name" label="端口名" show-overflow-tooltip min-width="10" align="center"></el-table-column>
          <el-table-column prop="alias" label="描述" show-overflow-tooltip min-width="15" align="center"></el-table-column>
          <el-table-column prop="oper_statu" label="物理状态" :formatter="transOperStatu" min-width="8" align="center"></el-table-column>
          <el-table-column label="操作" min-width="8" align="center">
            <template v-slot="scope">
              <el-button size="mini" type="success" plain @click="addCard(scope.row)">添加看板</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <div class="card-grid">
        <el-card v-for="card in cards" :key="board_switch_seq + '_' + card.key" shadow="hover" class="flow-card">
          <div slot="header" class="flow-card-header">
            <span>{{card.port_info.sysname}} - {{card.port_info.if_name}}</span>
            <el-button type="text" icon="el-icon-close" @click="removeCard(card.key)"></el-button>
          </div>
          <echart_flow
            :chartsname="board_switch_seq + '_' + card.key"
            :port_info="card.port_info"
            :chartswidth="'100%'"
            :chartsheight="'260px'"
            :interval="card.interval">
          </echart_flow>
        </el-card>
      </div>

      <el-empty v-if="cards.length===0" description="暂无看板，从上方搜索结果中添加"></el-empty>
    </div>

    <!-- 添加卡片时设置采集间隔 -->
    <el-dialog title="设置采集间隔" :visible.sync="interval_dialog_visible" width="360px">
      <el-form label-width="90px" size="mini">
        <el-form-item label="设备名">
          <span>{{pending_row.sysname}}</span>
        </el-form-item>
        <el-form-item label="端口名">
          <span>{{pending_row.if_name}}</span>
        </el-form-item>
        <el-form-item label="采集间隔(秒)">
          <el-input-number v-model="pending_interval" :min="1" :max="300" size="mini"></el-input-number>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="mini" @click="interval_dialog_visible=false">取消</el-button>
        <el-button size="mini" type="primary" @click="confirmAddCard">确定</el-button>
      </span>
    </el-dialog>

    <!-- 看板信息（名称/分类/描述）对话框 -->
    <el-dialog :title="meta_dialog_mode==='create' ? '新建看板' : '编辑看板信息'" :visible.sync="meta_dialog_visible" width="600px" :close-on-click-modal="false">
      <el-form ref="metaForm" :model="meta_form" :rules="meta_rules" label-width="100px" size="small">
        <el-form-item label="看板名称" prop="flow_name">
          <el-input v-model="meta_form.flow_name" placeholder="请输入看板名称"></el-input>
        </el-form-item>
        <el-form-item label="分类路径">
          <el-select
            v-model="meta_category_input"
            placeholder="输入分类路径，如：按机房/IDC-A/核心网络"
            clearable
            filterable
            allow-create
            style="width: 100%;"
            @change="handleMetaCategoryChange">
            <el-option v-for="item in category_path_options" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
          <div style="margin-top: 5px; color: #999; font-size: 12px;">
            提示：使用"/"分隔多级分类，例如：按机房/IDC-A/核心网络
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="meta_form.description" type="textarea" :rows="3" placeholder="请输入看板描述"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="mini" @click="meta_dialog_visible=false">取消</el-button>
        <el-button size="mini" type="primary" :loading="board_saving" @click="handleSubmitMeta">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"
import flowboard_api from "@/api/mapis/flowboard_interface.js"
import echart_flow from "@/components/echarts/echart_single_flow.vue"

export default {
  components: {
    echart_flow
  },
  computed: {
    filtered_port_list() {
      let ifname_kw = this.table_filter_ifname.trim().toLowerCase()
      let alias_kw = this.table_filter_alias.trim().toLowerCase()
      return this.port_list.filter(function (row) {
        if (ifname_kw !== "" && !(row.if_name || "").toLowerCase().includes(ifname_kw)) {
          return false
        }
        if (alias_kw !== "" && !(row.alias || "").toLowerCase().includes(alias_kw)) {
          return false
        }
        return true
      })
    }
  },
  data() {
    return {
      filter_ip: "",

      search_panel_visible: true,

      isload: false,
      port_list: [],
      table_filter_ifname: "",
      table_filter_alias: "",

      cards: [],
      card_seq: 0,
      board_switch_seq: 0,

      interval_dialog_visible: false,
      pending_row: {},
      pending_interval: 15,

      // 看板列表与分类树
      flow_list: [],
      flow_tree_data: [],
      tree_search_text: "",
      category_path_options: [],

      // 当前看板（已保存的元信息，未保存时为空对象）
      current_flow: {},
      board_saving: false,

      // 新建/编辑看板信息对话框
      meta_dialog_visible: false,
      meta_dialog_mode: "create", // create | edit
      meta_form: {
        flow_name: "",
        category_types: [],
        description: "",
      },
      meta_category_input: "",
      meta_rules: {
        flow_name: [
          { required: true, message: "请输入看板名称", trigger: "blur" }
        ]
      },
    };
  },
  mounted() {
    this.loadFlowList()
  },
  methods: {
    // ==================== 端口搜索 ====================
    searchPorts() {
      this.filter_ip = this.filter_ip.trim()
      if (this.filter_ip === "") {
        this.$message({
          type: 'error',
          message: '请输入设备IP'
        });
        return
      }

      let that = this
      this.isload = true
      collector_api.getPorts_ex({ ip: this.filter_ip }, {}).then(function (response) {
        if (response.data["code"] === 0) {
          that.port_list = response.data["data"]
          if (that.port_list.length === 0) {
            that.$message({
              type: 'warning',
              message: '未查询到匹配的端口'
            });
          }
        } else {
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
        }
        that.isload = false
      }).catch(function (error) {
        console.log(error)
        that.isload = false
        that.$message({
          type: 'error',
          message: '查询失败，请重试'
        });
      })
    },

    transOperStatu(row) {
      return row.oper_statu === '1' ? "up" : "down"
    },

    // ==================== 卡片管理 ====================
    addCard(row) {
      this.pending_row = row
      this.pending_interval = 15
      this.interval_dialog_visible = true
    },

    confirmAddCard() {
      this.card_seq += 1
      let row = this.pending_row
      this.cards.push({
        key: "flow_board_card_" + this.card_seq,
        interval: this.pending_interval,
        port_info: {
          ip: row["ip"],
          if_name: row["if_name"],
          port_id: row["port_id"],
          sysname: row["sysname"],
          alias: row["alias"] || "-",
        }
      })
      this.interval_dialog_visible = false
    },

    removeCard(key) {
      this.cards = this.cards.filter(function (card) {
        return card.key !== key
      })
    },

    // ==================== 看板列表 / 分类树 ====================
    loadFlowList() {
      let that = this
      flowboard_api.getFlowList({}).then(function (response) {
        let res = response.data
        if (res.code === 0) {
          that.flow_list = res.data || []
          that.buildFlowTree()
          that.buildCategoryPathOptions()
        } else {
          that.$message.error('加载看板列表失败: ' + res.message)
        }
      }).catch(function (error) {
        console.log(error)
        that.$message.error('加载看板列表失败')
      })
    },

    buildCategoryPathOptions() {
      let pathSet = new Set()
      this.flow_list.forEach(function (flow) {
        let categories = flow.category_types || []
        if (categories.length > 0) {
          pathSet.add(categories.join('/'))
        }
      })
      this.category_path_options = Array.from(pathSet).map(function (path) {
        return { label: path, value: path }
      })
    },

    buildFlowTree() {
      let tree = []
      let pathMap = {}

      this.flow_list.forEach(function (flow) {
        let categories = flow.category_types || []
        if (categories.length > 0) {
          let currentPath = ''
          let currentLevel = tree
          categories.forEach(function (cat, index) {
            currentPath = currentPath ? (currentPath + '/' + cat) : cat
            if (!pathMap[currentPath]) {
              let node = {
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

      this.flow_list.forEach(function (flow) {
        let categories = flow.category_types || []
        if (categories.length > 0) {
          let path = categories.join('/')
          if (pathMap[path]) {
            pathMap[path].children.push({
              id: 'flow_' + flow.flow_id,
              label: flow.flow_name,
              type: 'flow',
              data: flow
            })
            pathMap[path].count++
          }
        }
      })

      let updateCount = function (nodes) {
        nodes.forEach(function (node) {
          if (node.type === 'category' && node.children) {
            updateCount(node.children)
            node.children.forEach(function (child) {
              if (child.type === 'category') {
                node.count += child.count
              }
            })
          }
        })
      }
      updateCount(tree)

      let uncategorizedList = this.flow_list.filter(function (f) {
        return !f.category_types || f.category_types.length === 0
      })
      if (uncategorizedList.length > 0) {
        tree.push({
          id: 'uncategorized',
          label: '未分类',
          type: 'root',
          icon: 'el-icon-data-line',
          color: '#999',
          count: uncategorizedList.length,
          children: uncategorizedList.map(function (flow) {
            return { id: 'flow_' + flow.flow_id, label: flow.flow_name, type: 'flow', data: flow }
          })
        })
      }

      this.flow_tree_data = tree
    },

    filterTreeNode(value, data) {
      if (!value) return true
      if (data.type === 'flow') {
        return data.label.toLowerCase().includes(value.toLowerCase())
      }
      return true
    },

    handleTreeSearch() {
      this.$refs.flowTree.filter(this.tree_search_text)
    },

    handleTreeNodeClick(data) {
      if (data.type === 'flow') {
        this.handleOpenBoard(data.data)
      }
    },

    // ==================== 看板加载 / 新建 ====================
    clearBoard() {
      this.current_flow = {}
      this.cards = []
      this.card_seq = 0
      this.board_switch_seq++
    },

    handleNewBoard() {
      this.clearBoard()

      this.meta_dialog_mode = 'create'
      this.meta_form = { flow_name: '', category_types: [], description: '' }
      this.meta_category_input = ''
      this.meta_dialog_visible = true
      this.$nextTick(() => {
        if (this.$refs.metaForm) {
          this.$refs.metaForm.clearValidate()
        }
      })
    },

    handleOpenBoard(row) {
      let that = this
      flowboard_api.getFlowDetail({ flow_id: row.flow_id }).then(function (response) {
        let res = response.data
        if (res.code === 0) {
          let detail = res.data
          that.current_flow = {
            flow_id: detail.flow_id,
            flow_name: detail.flow_name,
            category_types: detail.category_types || [],
            description: detail.description || '',
            version: detail.version
          }
          let flow_json = detail.flow_json || {}
          let loaded_cards = flow_json.cards || []
          that.cards = loaded_cards
          that.board_switch_seq++
          let maxSeq = 0
          loaded_cards.forEach(function (card) {
            let m = /flow_board_card_(\d+)/.exec(card.key || '')
            if (m) {
              maxSeq = Math.max(maxSeq, parseInt(m[1]))
            }
          })
          that.card_seq = maxSeq
        } else {
          that.$message.error('加载看板失败: ' + res.message)
        }
      }).catch(function (error) {
        console.log(error)
        that.$message.error('加载看板失败')
      })
    },

    // ==================== 保存看板 ====================
    handleSaveBoard() {
      if (!this.current_flow.flow_id) {
        this.$message.error('请先点击"新建"创建看板')
        return
      }

      let that = this
      this.board_saving = true
      flowboard_api.updateFlow({
        flow_id: this.current_flow.flow_id,
        version: this.current_flow.version,
        flow_json: { cards: this.cards }
      }).then(function (response) {
        let res = response.data
        if (res.code === 0) {
          that.$message.success('保存成功')
          if (res.data) {
            that.current_flow.version = res.data.version
          }
          that.loadFlowList()
        } else if (res.message === '数据已被他人修改，请刷新后重试') {
          that.$message.error('看板已被他人修改，请重新打开后再保存')
        } else {
          that.$message.error('保存失败: ' + res.message)
        }
        that.board_saving = false
      }).catch(function (error) {
        console.log(error)
        that.$message.error('保存失败')
        that.board_saving = false
      })
    },

    // ==================== 看板信息编辑（重命名/改分类/改描述）====================
    handleEditMeta(row) {
      this.meta_dialog_mode = 'edit'
      this.meta_form = {
        flow_id: row.flow_id,
        flow_name: row.flow_name,
        category_types: row.category_types || [],
        description: row.description || '',
        version: row.version
      }
      this.meta_category_input = (row.category_types && row.category_types.length > 0) ? row.category_types.join('/') : ''
      this.meta_dialog_visible = true
      this.$nextTick(() => {
        if (this.$refs.metaForm) {
          this.$refs.metaForm.clearValidate()
        }
      })
    },

    handleMetaCategoryChange(value) {
      if (value) {
        this.meta_form.category_types = value.split('/').map(function (s) { return s.trim() }).filter(function (s) { return s !== '' })
      } else {
        this.meta_form.category_types = []
      }
    },

    handleSubmitMeta() {
      let that = this
      this.$refs.metaForm.validate(function (valid) {
        if (!valid) return

        that.board_saving = true

        if (that.meta_dialog_mode === 'create') {
          flowboard_api.createFlow({
            flow_name: that.meta_form.flow_name,
            category_types: that.meta_form.category_types,
            description: that.meta_form.description,
            flow_json: { cards: that.cards }
          }).then(function (response) {
            let res = response.data
            if (res.code === 0) {
              that.$message.success('创建成功')
              that.current_flow = {
                flow_id: res.data.flow_id,
                flow_name: that.meta_form.flow_name,
                category_types: that.meta_form.category_types,
                description: that.meta_form.description,
                version: res.data.version
              }
              that.meta_dialog_visible = false
              that.loadFlowList()
            } else {
              that.$message.error(res.message || '创建失败')
            }
            that.board_saving = false
          }).catch(function (error) {
            console.log(error)
            that.$message.error('创建失败')
            that.board_saving = false
          })
        } else {
          flowboard_api.updateFlow({
            flow_id: that.meta_form.flow_id,
            version: that.meta_form.version,
            flow_name: that.meta_form.flow_name,
            category_types: that.meta_form.category_types,
            description: that.meta_form.description
          }).then(function (response) {
            let res = response.data
            if (res.code === 0) {
              that.$message.success('更新成功')
              if (that.current_flow.flow_id === that.meta_form.flow_id) {
                that.current_flow.flow_name = that.meta_form.flow_name
                that.current_flow.category_types = that.meta_form.category_types
                that.current_flow.description = that.meta_form.description
                that.current_flow.version = res.data ? res.data.version : that.current_flow.version
              }
              that.meta_dialog_visible = false
              that.loadFlowList()
            } else if (res.message === '数据已被他人修改，请刷新后重试') {
              that.$message.error('看板已被他人修改，请刷新后重试')
              that.loadFlowList()
            } else {
              that.$message.error(res.message || '更新失败')
            }
            that.board_saving = false
          }).catch(function (error) {
            console.log(error)
            that.$message.error('更新失败')
            that.board_saving = false
          })
        }
      })
    },

    // ==================== 删除看板 ====================
    handleDeleteBoard(row) {
      let that = this
      this.$confirm('确定删除看板"' + row.flow_name + '"吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function () {
        flowboard_api.deleteFlow({ flow_id: row.flow_id }).then(function (response) {
          let res = response.data
          if (res.code === 0) {
            that.$message.success('删除成功')
            if (that.current_flow.flow_id === row.flow_id) {
              that.clearBoard()
            }
            that.loadFlowList()
          } else {
            that.$message.error(res.message || '删除失败')
          }
        }).catch(function (error) {
          console.log(error)
          that.$message.error('删除失败')
        })
      }).catch(function () {})
    },
  }
};
</script>

<style lang="scss" scoped>
.flow-board-page {
  display: flex;
  height: calc(100vh - 100px);
  background: #f0f2f5;

  .left-panel {
    width: 260px;
    background: #fff;
    border-right: 1px solid #e8e8e8;
    display: flex;
    flex-direction: column;

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
  }

  .right-panel {
    flex: 1;
    padding: 10px;
    overflow-y: auto;

    .board-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .board-title {
        font-weight: bold;
        font-size: 15px;
      }
    }

    .search-card {
      margin-bottom: 10px;
    }

    .card-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .flow-card {
      width: 480px;

      ::v-deep .el-card__header {
        padding: 6px 10px;
      }

      ::v-deep .el-card__body {
        padding: 6px;
      }
    }

    .flow-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .el-button {
        padding: 0;
      }
    }
  }
}
</style>
