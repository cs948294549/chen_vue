<template>
  <div class="flow-board-page">
    <!-- 左侧分类树 -->
    <div class="left-panel" v-show="search_panel_visible">
      <div class="tree-header">
        <div class="tree-title">
          <i class="el-icon-data-board"></i>看板列表
          <span class="count-badge">{{ flow_list.length }}</span>
        </div>
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleNewBoard">新建</el-button>
      </div>

      <div class="search-box">
        <el-input
          v-model="tree_search_text"
          placeholder="搜索看板名称或分类"
          prefix-icon="el-icon-search"
          size="small"
          clearable
          @input="handleTreeSearch">
        </el-input>
      </div>

      <div class="tree-content" v-loading="list_loading">
        <el-tree
          v-show="flow_tree_data.length"
          :data="flow_tree_data"
          :props="{children:'children', label:'label'}"
          :filter-node-method="filterTreeNode"
          node-key="id"
          default-expand-all
          highlight-current
          empty-text="没有匹配的看板"
          :expand-on-click-node="false"
          ref="flowTree"
          @node-click="handleTreeNodeClick">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <template v-if="data.type === 'category' || data.type === 'root'">
              <i
                :class="data.type === 'root' ? 'el-icon-folder-remove' : (node.expanded ? 'el-icon-folder-opened' : 'el-icon-folder')"
                :style="{ color: data.color || '#e6a23c' }"></i>
              <span class="node-label">{{ node.label }}</span>
              <span class="node-count" v-if="data.count > 0">{{ data.count }}</span>
            </template>
            <template v-else-if="data.type === 'flow'">
              <i class="el-icon-data-line flow-icon"></i>
              <span class="node-label" :title="node.label">{{ node.label }}</span>
              <span class="node-actions">
                <el-tooltip content="编辑信息" placement="top" :open-delay="400">
                  <i class="el-icon-edit-outline act-icon" @click.stop="handleEditMeta(data.data)"></i>
                </el-tooltip>
                <el-tooltip content="删除" placement="top" :open-delay="400">
                  <i class="el-icon-delete act-icon danger" @click.stop="handleDeleteBoard(data.data)"></i>
                </el-tooltip>
              </span>
            </template>
          </span>
        </el-tree>
        <el-empty
          v-if="!list_loading && flow_tree_data.length === 0"
          :image-size="70"
          description="暂无看板，点击右上角新建">
        </el-empty>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="right-panel">
      <!-- 看板头部 -->
      <div class="board-header">
        <div class="bh-title">
          <i class="el-icon-data-line"></i>
          <span class="bh-name">{{ current_flow.flow_id ? current_flow.flow_name : '未保存的看板' }}</span>
          <span class="count-badge">{{ cards.length }} 个监控</span>
          <span v-if="!current_flow.flow_id" class="state-tag warn">未保存</span>
          <span v-else-if="is_dirty" class="state-tag warn">有未保存的修改</span>
          <span v-if="current_flow.flow_id && currentPath" class="bh-path"><i class="el-icon-folder"></i>{{ currentPath }}</span>
        </div>
        <div class="bh-actions">
          <el-button
            size="small"
            :icon="search_panel_visible ? 'el-icon-s-fold' : 'el-icon-s-unfold'"
            @click="togglePanel">
            {{ search_panel_visible ? '收起面板' : '展开面板' }}
          </el-button>
          <el-button v-if="current_flow.flow_id" size="small" icon="el-icon-edit-outline" @click="handleEditMeta(current_flow)">编辑信息</el-button>
          <el-button size="small" type="primary" icon="el-icon-check" :loading="board_saving" @click="handleSaveBoard">保存看板</el-button>
        </div>
      </div>
      <div v-if="current_flow.flow_id && current_flow.description" class="board-desc">
        <i class="el-icon-document"></i>{{ current_flow.description }}
      </div>

      <!-- 端口搜索 -->
      <div v-show="search_panel_visible" class="search-panel">
        <div class="sp-row">
          <el-input
            v-model="filter_ip"
            class="sp-ip"
            size="small"
            placeholder="输入设备IP查询端口"
            prefix-icon="el-icon-monitor"
            clearable
            @keyup.enter.native="searchPorts"></el-input>
          <el-button size="small" type="primary" icon="el-icon-search" :loading="isload" @click="searchPorts">查询端口</el-button>
          <template v-if="port_list.length > 0">
            <span class="sp-divider"></span>
            <el-input v-model="table_filter_ifname" class="sp-filter" size="small" placeholder="端口名过滤" clearable></el-input>
            <el-input v-model="table_filter_alias" class="sp-filter" size="small" placeholder="端口描述过滤" clearable></el-input>
            <span class="sp-count">{{ filtered_port_list.length }} / {{ port_list.length }}</span>
          </template>
          <span v-else class="sp-tip"><i class="el-icon-info"></i>查询设备端口后，点击「添加」把端口实时流量加入看板</span>
        </div>

        <el-table
          v-if="port_list.length>0"
          :data="filtered_port_list"
          size="small"
          stripe
          max-height="300"
          class="port-table">
          <template slot="empty">
            <el-empty :image-size="60" description="没有匹配过滤条件的端口"></el-empty>
          </template>
          <el-table-column prop="sysname" label="设备名" show-overflow-tooltip min-width="180"></el-table-column>
          <el-table-column prop="ip" label="设备IP" show-overflow-tooltip min-width="130">
            <template slot-scope="scope"><span class="mono">{{ scope.row.ip }}</span></template>
          </el-table-column>
          <el-table-column prop="if_name" label="端口名" show-overflow-tooltip min-width="150">
            <template slot-scope="scope"><span class="mono">{{ scope.row.if_name }}</span></template>
          </el-table-column>
          <el-table-column label="带宽" width="80" align="center">
            <template slot-scope="scope">{{ speedText(scope.row) || '-' }}</template>
          </el-table-column>
          <el-table-column prop="oper_statu" label="物理状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.oper_statu === '1' ? 'success' : 'danger'">{{ transOperStatu(scope.row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="alias" label="描述" show-overflow-tooltip min-width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.alias">{{ scope.row.alias }}</span>
              <span v-else class="empty-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template slot-scope="scope">
              <span v-if="isCardAdded(scope.row)" class="added-text"><i class="el-icon-check"></i>已添加</span>
              <el-button v-else size="mini" type="text" icon="el-icon-plus" @click="addCard(scope.row)">添加</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 流量卡片 -->
      <div class="card-grid" v-if="cards.length > 0">
        <div v-for="card in cards" :key="board_switch_seq + '_' + card.key" class="flow-card">
          <div class="flow-card-header">
            <div class="fc-main">
              <div class="fc-title">
                <span class="fc-dev" :title="card.port_info.sysname">{{ card.port_info.sysname }}</span>
                <span class="fc-port mono">{{ card.port_info.if_name }}</span>
              </div>
              <div class="fc-sub">
                <span class="mono">{{ card.port_info.ip }}</span>
                <span v-if="card.port_info.alias && card.port_info.alias !== '-'" :title="card.port_info.alias"> · {{ card.port_info.alias }}</span>
              </div>
            </div>
            <span class="interval-tag">{{ card.interval }}s</span>
            <el-tooltip content="移除" placement="top" :open-delay="400">
              <i class="el-icon-close fc-close" @click="removeCard(card.key)"></i>
            </el-tooltip>
          </div>
          <div class="flow-card-body">
            <echart_flow
              :chartsname="board_switch_seq + '_' + card.key"
              :port_info="card.port_info"
              :chartswidth="'100%'"
              :chartsheight="'260px'"
              :interval="card.interval">
            </echart_flow>
          </div>
        </div>
      </div>

      <div v-else class="board-empty">
        <el-empty :image-size="90" description="看板中还没有监控卡片">
          <div class="board-empty-tip">在上方输入设备IP查询端口，点击「添加」即可加入实时流量监控</div>
          <el-button v-if="!search_panel_visible" size="small" icon="el-icon-s-unfold" @click="togglePanel">展开面板</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 添加卡片时设置采集间隔 -->
    <el-dialog :visible.sync="interval_dialog_visible" width="420px" append-to-body>
      <div slot="title" class="dialog-title"><i class="el-icon-plus"></i>添加流量监控</div>
      <div class="pending-info">
        <div class="pi-row"><em>设备</em>{{ pending_row.sysname }}<span class="mono pi-ip">{{ pending_row.ip }}</span></div>
        <div class="pi-row"><em>端口</em><span class="mono">{{ pending_row.if_name }}</span></div>
        <div v-if="pending_row.alias" class="pi-row"><em>描述</em>{{ pending_row.alias }}</div>
      </div>
      <el-form label-width="90px" size="small">
        <el-form-item label="采集间隔">
          <el-input-number v-model="pending_interval" :min="1" :max="300" size="small"></el-input-number>
          <span class="unit-text">秒</span>
          <div class="interval-presets">
            <span
              v-for="n in [5, 15, 30, 60]"
              :key="n"
              class="preset"
              :class="{ active: pending_interval === n }"
              @click="pending_interval = n">{{ n }}s</span>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="interval_dialog_visible=false">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmAddCard">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 看板信息（名称/分类/描述）对话框 -->
    <el-dialog :visible.sync="meta_dialog_visible" width="560px" :close-on-click-modal="false" append-to-body>
      <div slot="title" class="dialog-title">
        <i :class="meta_dialog_mode==='create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>
        {{ meta_dialog_mode==='create' ? '新建看板' : '编辑看板信息' }}
      </div>
      <el-form ref="metaForm" :model="meta_form" :rules="meta_rules" label-width="90px" size="small">
        <el-form-item label="看板名称" prop="flow_name">
          <el-input v-model="meta_form.flow_name" placeholder="请输入看板名称" maxlength="64" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="分类路径">
          <el-select
            v-model="meta_category_input"
            placeholder="选择已有分类，或直接输入新路径"
            clearable
            filterable
            allow-create
            default-first-option
            style="width: 100%;"
            @change="handleMetaCategoryChange">
            <el-option v-for="item in category_path_options" :key="item.value" :label="item.label" :value="item.value">
              <i class="el-icon-folder opt-icon"></i>{{ item.label }}
            </el-option>
          </el-select>
          <div v-if="meta_form.category_types.length" class="path-preview">
            <span v-for="(c, i) in meta_form.category_types" :key="i" class="path-item">
              <i v-if="i > 0" class="el-icon-arrow-right path-sep"></i>
              <span class="path-chip">{{ c }}</span>
            </span>
          </div>
          <div class="form-tip">使用"/"分隔多级分类，例如：按机房/IDC-A/核心网络；留空则归入"未分类"</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="meta_form.description" type="textarea" :rows="3" placeholder="请输入看板描述（可选）"></el-input>
        </el-form-item>
        <div v-if="meta_dialog_mode==='create' && cards.length > 0" class="form-tip create-tip">
          <i class="el-icon-info"></i>当前看板中的 {{ cards.length }} 个监控卡片将一并保存
        </div>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="meta_dialog_visible=false">取 消</el-button>
        <el-button size="small" type="primary" :loading="board_saving" @click="handleSubmitMeta">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"
import flowboard_api from "@/api/mapis/flowboard_interface.js"
import echart_flow from "@/components/echarts/echart_single_flow.vue"
import echarts from "echarts"

// 卡片内容签名，用于判断看板是否有未保存的修改
const cardsSig = function (cards) {
  return JSON.stringify(cards || [])
}

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
    },
    currentPath() {
      return (this.current_flow.category_types || []).join(' / ')
    },
    is_dirty() {
      return cardsSig(this.cards) !== this.saved_cards_sig
    }
  },
  watch: {
    "current_flow.flow_id"() {
      this.$nextTick(this.syncTreeCurrent)
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
      saved_cards_sig: "[]",
      card_seq: 0,
      board_switch_seq: 0,

      interval_dialog_visible: false,
      pending_row: {},
      pending_interval: 15,

      // 看板列表与分类树
      flow_list: [],
      list_loading: false,
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
    window.addEventListener("resize", this.resizeCharts)
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeCharts)
    clearTimeout(this.resize_timer)
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
      return row.oper_statu === '1' ? "UP" : "DOWN"
    },

    // speed 单位为 Mbps
    speedText(row) {
      let speed = parseInt(row.speed)
      if (!speed) {
        return ""
      }
      return speed >= 1000 ? parseFloat((speed / 1000).toFixed(1)) + "G" : speed + "M"
    },

    isCardAdded(row) {
      return this.cards.some(function (card) {
        return card.port_info && card.port_info.ip === row.ip && card.port_info.if_name === row.if_name
      })
    },

    // 收起/展开左侧看板树和端口搜索区，卡片宽度随之变化，需要重算图表尺寸
    togglePanel() {
      this.search_panel_visible = !this.search_panel_visible
      this.resizeCharts()
    },

    // 卡片宽度自适应，图表组件本身不监听尺寸变化，这里统一触发 resize
    resizeCharts() {
      clearTimeout(this.resize_timer)
      this.resize_timer = setTimeout(() => {
        this.cards.forEach(card => {
          let dom = document.getElementById(this.board_switch_seq + '_' + card.key)
          let chart = dom ? echarts.getInstanceByDom(dom) : null
          if (chart) {
            chart.resize()
          }
        })
      }, 150)
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
      // 移除后同一行其余卡片会变宽
      this.$nextTick(this.resizeCharts)
    },

    // ==================== 看板列表 / 分类树 ====================
    loadFlowList() {
      let that = this
      this.list_loading = true
      flowboard_api.getFlowList({}).then(function (response) {
        let res = response.data
        if (res.code === 0) {
          that.flow_list = res.data || []
          that.buildFlowTree()
          that.buildCategoryPathOptions()
          // 树重建后保持搜索与高亮状态
          that.$nextTick(function () {
            if (that.tree_search_text) {
              that.handleTreeSearch()
            }
            that.syncTreeCurrent()
          })
        } else {
          that.$message.error('加载看板列表失败: ' + res.message)
        }
        that.list_loading = false
      }).catch(function (error) {
        console.log(error)
        that.list_loading = false
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
          color: '#909399',
          count: uncategorizedList.length,
          children: uncategorizedList.map(function (flow) {
            return { id: 'flow_' + flow.flow_id, label: flow.flow_name, type: 'flow', data: flow }
          })
        })
      }

      this.flow_tree_data = tree
    },

    // 按看板名称或分类路径匹配，分类节点随匹配的子节点自动显示
    filterTreeNode(value, data) {
      if (!value) return true
      if (data.type !== 'flow') return false
      let kw = value.trim().toLowerCase()
      let path = (data.data.category_types || []).join('/').toLowerCase()
      return (data.label || '').toLowerCase().indexOf(kw) !== -1 || path.indexOf(kw) !== -1
    },

    handleTreeSearch() {
      if (this.$refs.flowTree) {
        this.$refs.flowTree.filter(this.tree_search_text)
      }
    },

    syncTreeCurrent() {
      if (!this.$refs.flowTree) return
      this.$refs.flowTree.setCurrentKey(this.current_flow.flow_id ? 'flow_' + this.current_flow.flow_id : null)
    },

    handleTreeNodeClick(data, node) {
      if (data.type === 'flow') {
        if (data.data.flow_id === this.current_flow.flow_id) {
          return
        }
        this.confirmDiscard().then(() => {
          this.handleOpenBoard(data.data)
        }).catch(() => {
          this.syncTreeCurrent()
        })
      } else {
        node.expanded ? node.collapse() : node.expand()
        this.$nextTick(this.syncTreeCurrent)
      }
    },

    // 当前看板有未保存的卡片修改时，切换/新建前二次确认
    confirmDiscard() {
      if (!this.is_dirty) {
        return Promise.resolve()
      }
      return this.$confirm('当前看板有未保存的修改，继续操作将丢失这些修改，确定继续吗？', '提示', {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      })
    },

    // ==================== 看板加载 / 新建 ====================
    clearBoard() {
      this.current_flow = {}
      this.cards = []
      this.saved_cards_sig = '[]'
      this.card_seq = 0
      this.board_switch_seq++
    },

    handleNewBoard() {
      this.confirmDiscard().then(() => {
        this.clearBoard()
        this.openCreateDialog()
      }).catch(function () {})
    },

    // 打开新建看板对话框，当前卡片会随 createFlow 一并保存
    openCreateDialog() {
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
          that.saved_cards_sig = cardsSig(loaded_cards)
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
      // 未保存的看板：直接弹出新建对话框，保留已添加的卡片
      if (!this.current_flow.flow_id) {
        if (this.cards.length === 0) {
          this.$message.warning('请先添加监控卡片，或点击左侧"新建"创建看板')
          return
        }
        this.openCreateDialog()
        return
      }

      let saving_sig = cardsSig(this.cards)

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
          that.saved_cards_sig = saving_sig
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
          let creating_sig = cardsSig(that.cards)
          flowboard_api.createFlow({
            flow_name: that.meta_form.flow_name,
            category_types: that.meta_form.category_types,
            description: that.meta_form.description,
            flow_json: { cards: that.cards }
          }).then(function (response) {
            let res = response.data
            if (res.code === 0) {
              that.$message.success('创建成功')
              that.saved_cards_sig = creating_sig
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
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.count-badge {
  flex-shrink: 0;
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

/* 根节点同时带有布局的 page-container 类，这里改为撑满内容区高度 */
.flow-board-page {
  display: flex;
  height: 100%;
  min-height: 560px;
  overflow: hidden;
  color: #303133;

  /* 左侧看板树 */
  .left-panel {
    flex-shrink: 0;
    width: 270px;
    margin-right: 12px;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;

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

      > i {
        margin-right: 6px;
        font-size: 16px;
        color: #409eff;
      }
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

      ::v-deep .el-tree-node__content {
        height: 32px;
        border-radius: 4px;
      }

      ::v-deep .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
        background-color: #ecf5ff;

        .node-label {
          font-weight: 600;
          color: #409eff;
        }
      }
    }

    .custom-tree-node {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      font-size: 13px;
      padding-right: 6px;

      > i {
        flex-shrink: 0;
        font-size: 15px;
      }
    }

    .flow-icon {
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

      &:hover {
        color: #409eff;
        background: #ecf5ff;
      }

      &.danger:hover {
        color: #f56c6c;
        background: #fef0f0;
      }
    }
  }

  /* 右侧内容 */
  .right-panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }

  .board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fafbfc;
  }

  .bh-title {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;

    > i {
      flex-shrink: 0;
      margin-right: 6px;
      font-size: 18px;
      color: #409eff;
    }
  }

  .bh-name {
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .state-tag {
    flex-shrink: 0;
    margin-left: 8px;
    padding: 0 8px;
    height: 18px;
    line-height: 18px;
    font-size: 12px;
    border-radius: 9px;

    &.warn {
      color: #e6a23c;
      background: #fdf6ec;
    }
  }

  .bh-path {
    min-width: 0;
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    i {
      margin-right: 3px;
    }
  }

  .bh-actions {
    flex-shrink: 0;
    margin-left: 12px;
  }

  .board-desc {
    margin-top: 8px;
    padding: 0 2px;
    font-size: 12px;
    color: #909399;

    i {
      margin-right: 4px;
    }
  }

  /* 端口搜索 */
  .search-panel {
    margin-top: 12px;
    padding: 12px 16px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fafbfc;
  }

  .sp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .sp-ip {
    width: 240px;
    margin-right: 10px;
  }

  .sp-divider {
    height: 20px;
    margin: 0 14px;
    border-left: 1px solid #dcdfe6;
  }

  .sp-filter {
    width: 180px;
    margin-right: 10px;
  }

  .sp-count {
    font-size: 12px;
    color: #909399;
  }

  .sp-tip {
    margin-left: 14px;
    font-size: 12px;
    color: #909399;

    i {
      margin-right: 4px;
      color: #409eff;
    }
  }

  .port-table {
    margin-top: 12px;
    border-radius: 4px;

    ::v-deep th {
      color: #606266;
      background-color: #f5f7fa !important;
    }
  }

  .added-text {
    font-size: 12px;
    color: #67c23a;

    i {
      margin-right: 2px;
    }
  }

  /* 流量卡片 */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
    grid-gap: 12px;
    margin-top: 12px;
  }

  .flow-card {
    min-width: 0;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fff;
    overflow: hidden;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

      .fc-close {
        opacity: 1;
      }
    }
  }

  .flow-card-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #f2f3f5;
    background: #fafbfc;
  }

  .fc-main {
    flex: 1;
    min-width: 0;
  }

  .fc-title {
    display: flex;
    align-items: baseline;
    font-size: 13px;
  }

  .fc-dev {
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fc-port {
    flex-shrink: 0;
    margin-left: 8px;
    color: #409eff;
  }

  .fc-sub {
    margin-top: 2px;
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .interval-tag {
    flex-shrink: 0;
    margin-left: 10px;
    padding: 0 8px;
    height: 20px;
    line-height: 20px;
    font-size: 12px;
    border-radius: 10px;
    color: #e6a23c;
    background: #fdf6ec;
  }

  .fc-close {
    flex-shrink: 0;
    margin-left: 8px;
    padding: 3px;
    font-size: 14px;
    color: #909399;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0.4;
    transition: opacity 0.2s;

    &:hover {
      color: #f56c6c;
      background: #fef0f0;
    }
  }

  .flow-card-body {
    padding: 6px 8px;
  }

  .board-empty {
    margin-top: 12px;
    padding: 30px 0;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
  }

  .board-empty-tip {
    margin-bottom: 12px;
    font-size: 12px;
    color: #909399;
  }
}

/* 弹窗（append-to-body 后仍受 scoped 作用，类名直接写在弹窗模板内） */
.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;

  i {
    margin-right: 6px;
    color: #409eff;
  }
}

.pending-info {
  margin-bottom: 16px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 24px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;

  em {
    display: inline-block;
    width: 40px;
    font-style: normal;
    color: #909399;
  }
}

.pi-ip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.unit-text {
  margin-left: 8px;
  color: #909399;
}

.interval-presets {
  margin-top: 8px;
  line-height: 1;
}

.preset {
  display: inline-block;
  margin-right: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    color: #409eff;
    border-color: #c6e2ff;
  }

  &.active {
    color: #409eff;
    border-color: #409eff;
    background: #ecf5ff;
  }
}

.opt-icon {
  margin-right: 6px;
  color: #e6a23c;
}

.path-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}

.path-item {
  display: inline-flex;
  align-items: center;
  margin-bottom: 4px;
}

.path-chip {
  padding: 0 8px;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  border-radius: 4px;
  color: #409eff;
  background: #ecf5ff;
}

.path-sep {
  margin: 0 4px;
  font-size: 12px;
  color: #c0c4cc;
}

.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}

.create-tip {
  margin: -6px 0 0 90px;

  i {
    margin-right: 4px;
    color: #409eff;
  }
}
</style>
