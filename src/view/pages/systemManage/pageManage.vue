<template>
  <div class="pm-page">
    <!-- 标题栏 -->
    <div class="pm-header">
      <div class="pm-title">
        <i class="el-icon-menu"></i>页面管理
        <span class="pm-count">{{ stats.dirs }} 目录 · {{ stats.routes }} 路由</span>
        <span class="pm-subtitle">维护侧边栏菜单与路由，点击「接口」配置页面的接口权限</span>
      </div>
      <div>
        <el-button size="small" :icon="allExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" @click="toggleExpandAll">{{ allExpanded ? '全部收起' : '全部展开' }}</el-button>
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="getList">刷新</el-button>
        <el-button size="small" type="primary" icon="el-icon-plus" @click="openCreate()">添加菜单</el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="pm-filter">
      <el-radio-group v-model="filterType" size="small">
        <el-radio-button label="">全部 {{ stats.dirs + stats.routes }}</el-radio-button>
        <el-radio-button label="0">目录 {{ stats.dirs }}</el-radio-button>
        <el-radio-button label="1">路由 {{ stats.routes }}</el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="filterHide" size="small">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">显示</el-radio-button>
        <el-radio-button label="1">隐藏 {{ stats.hidden }}</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="keyword"
        size="small"
        class="pm-search"
        prefix-icon="el-icon-search"
        placeholder="搜索名称 / 路径 / 分组 / 描述"
        clearable></el-input>
      <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
    </div>

    <!-- 菜单树 -->
    <el-table
      ref="table"
      :data="filteredTree"
      v-loading="loading"
      row-key="page_id"
      :tree-props="{ children: 'children' }"
      :row-class-name="rowClassName"
      size="small"
      class="pm-table">
      <template slot="empty">
        <el-empty :image-size="80" :description="routerTableData.length ? '没有符合筛选条件的菜单' : '暂无菜单数据'"></el-empty>
      </template>
      <el-table-column label="菜单名称" min-width="220">
        <template slot-scope="scope">
          <span class="name-cell">
            <span :class="['menu-icon', isDir(scope.row) ? 'icon-dir' : 'icon-route']">
              <i :class="scope.row.icon || (isDir(scope.row) ? 'el-icon-folder' : 'el-icon-document')"></i>
            </span>
            <span :class="['menu-name', { 'is-dir': isDir(scope.row) }]">{{ scope.row.name }}</span>
            <span v-if="isDir(scope.row) && scope.row.children && scope.row.children.length" class="child-count">{{ scope.row.children.length }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="page_id" label="ID" width="70">
        <template slot-scope="scope">
          <span class="mono sub-text">{{ scope.row.page_id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template slot-scope="scope">
          <span :class="['type-tag', isDir(scope.row) ? 'type-dir' : 'type-route']">{{ isDir(scope.row) ? '目录' : '路由' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路由路径" min-width="260">
        <template slot-scope="scope">
          <span v-if="scope.row.path" key="path">
            <span class="mono path-text" :title="scope.row.path">{{ scope.row.path }}</span>
            <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.path)"></i>
          </span>
          <span v-else key="no-path" class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="classify" label="分组" min-width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.classify" class="chip">{{ scope.row.classify }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_num" label="顺序" width="70" align="center">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.sort_num === '' || scope.row.sort_num === undefined ? '-' : scope.row.sort_num }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template slot-scope="scope">
          <span v-if="scope.row.hide === '1'" class="hide-tag"><i class="el-icon-view"></i>隐藏</span>
          <span v-else class="show-tag">显示</span>
        </template>
      </el-table-column>
      <el-table-column prop="descr" label="描述" min-width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.descr" class="sub-text">{{ scope.row.descr }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="290" fixed="right" class-name="op-col">
        <template slot-scope="scope">
          <el-button type="text" size="mini" icon="el-icon-link" @click="handleUri(scope.row)">接口</el-button>
          <el-button v-if="isDir(scope.row) && scope.row.parent_id == 0" type="text" size="mini" icon="el-icon-plus" @click="openCreate(scope.row)">子菜单</el-button>
          <el-button type="text" size="mini" icon="el-icon-edit-outline" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" icon="el-icon-delete" class="danger-btn" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 编辑 -->
    <el-dialog
      :visible.sync="formVisible"
      width="600px"
      top="8vh"
      :close-on-click-modal="false"
      append-to-body>
      <div slot="title" class="dialog-title">
        <i :class="formMode === 'create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>
        {{ formMode === 'create' ? '添加菜单' : '编辑菜单' }}
        <span v-if="formMode === 'edit'" class="title-id mono">ID {{ editForm.page_id }}</span>
      </div>
      <el-form ref="pageForm" :model="editForm" :rules="form_rules" label-width="90px" size="small">
        <el-form-item label="类型" prop="p_type">
          <el-radio-group v-model="editForm.p_type">
            <el-radio-button label="dir"><i class="el-icon-folder"></i> 目录</el-radio-button>
            <el-radio-button label="router"><i class="el-icon-document"></i> 路由</el-radio-button>
          </el-radio-group>
          <div class="form-tip">类型以「路径」为准：填写路径保存为路由，路径为空保存为目录</div>
        </el-form-item>
        <el-form-item v-if="editForm.p_type === 'router'" key="parent" label="父级目录">
          <el-select v-model="editForm.parent_id" placeholder="不选则为顶级路由" clearable filterable style="width: 100%;">
            <el-option v-for="item in PDirOptions" :key="item.value" :label="item.label" :value="item.value">
              <i class="el-icon-folder opt-icon"></i>{{ item.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="nameLabel" prop="name">
          <el-input v-model="editForm.name" maxlength="40" :placeholder="isFormDir ? '如：设备管理' : '如：设备列表'"></el-input>
        </el-form-item>
        <el-form-item v-if="editForm.p_type === 'router'" key="path" label="路由路径">
          <el-input v-model="editForm.path" class="mono-input" maxlength="100" placeholder="如：pages/device/device_list"></el-input>
          <div class="form-tip">相对 <span class="mono">src/view/</span> 的组件路径，不含 <span class="mono">.vue</span> 后缀</div>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="14">
            <el-form-item label="分组">
              <el-input v-model="editForm.classify" maxlength="40" :placeholder="isFormDir ? '顶部菜单分组，如：运维数据' : '子路由一般留空'"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="顺序" label-width="56px">
              <el-input v-model="editForm.sort_num" class="mono-input" maxlength="10" placeholder="越小越靠前"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="图标">
          <el-input v-model="editForm.icon" class="mono-input" placeholder="Element 图标类名，如：el-icon-monitor" clearable>
            <template slot="prepend">
              <span class="icon-preview"><i :class="editForm.icon || 'el-icon-picture-outline'"></i></span>
            </template>
            <el-popover slot="append" v-model="iconPickerVisible" placement="bottom-end" width="372" trigger="click">
              <div class="icon-grid">
                <span
                  v-for="ic in iconOptions"
                  :key="ic"
                  :class="['icon-item', { active: editForm.icon === ic }]"
                  :title="ic"
                  @click="pickIcon(ic)">
                  <i :class="ic"></i>
                </span>
              </div>
              <el-button slot="reference" icon="el-icon-s-grid">选择</el-button>
            </el-popover>
          </el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.descr" type="textarea" :rows="2" maxlength="300" resize="none" placeholder="可选"></el-input>
        </el-form-item>
        <el-form-item label="隐藏页面">
          <el-switch v-model="editForm.hide"></el-switch>
          <span class="form-tip inline-tip">隐藏后不在侧边栏显示，但仍可通过路由访问（如详情页）</span>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button v-if="formMode === 'create'" size="small" @click="resetForm">重 置</el-button>
        <el-button size="small" @click="formVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="isload" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 页面接口 -->
    <el-drawer :visible.sync="dialog_uri_flag" direction="rtl" size="60%" destroy-on-close append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-link"></i>接口列表
        <span class="drawer-page">{{ uri_title }}</span>
        <span v-if="page_info_cache.path" class="drawer-path mono">{{ page_info_cache.path }}</span>
      </div>
      <Card_uri
        v-if="dialog_uri_flag"
        class="drawer-body"
        v-bind:page_info="page_info_cache"
      ></Card_uri>
    </el-drawer>
  </div>
</template>

<script>
import page_api from "@/api/mapis/user_interface.js"
import Card_uri from './pageManage_sub/uri_manage_sub.vue'

// 图标选择器候选（Element UI 2.x 内置图标）
const ICON_OPTIONS = [
  'el-icon-s-home', 'el-icon-menu', 'el-icon-s-grid', 'el-icon-s-platform', 'el-icon-monitor', 'el-icon-cpu',
  'el-icon-connection', 'el-icon-share', 'el-icon-link', 'el-icon-position', 'el-icon-place', 'el-icon-location-outline',
  'el-icon-data-line', 'el-icon-data-analysis', 'el-icon-data-board', 'el-icon-pie-chart', 'el-icon-s-data', 'el-icon-odometer',
  'el-icon-bell', 'el-icon-warning-outline', 'el-icon-message-solid', 'el-icon-alarm-clock', 'el-icon-timer', 'el-icon-time',
  'el-icon-s-tools', 'el-icon-setting', 'el-icon-s-operation', 'el-icon-s-management', 'el-icon-s-order', 'el-icon-s-claim',
  'el-icon-document', 'el-icon-tickets', 'el-icon-notebook-2', 'el-icon-folder', 'el-icon-folder-opened', 'el-icon-files',
  'el-icon-user', 'el-icon-s-custom', 'el-icon-lock', 'el-icon-key', 'el-icon-unlock', 'el-icon-s-check',
  'el-icon-search', 'el-icon-view', 'el-icon-edit-outline', 'el-icon-mobile-phone', 'el-icon-phone-outline', 'el-icon-cloudy',
  'el-icon-map-location', 'el-icon-guide', 'el-icon-coin', 'el-icon-box', 'el-icon-suitcase', 'el-icon-magic-stick',
]

function emptyForm() {
  return {
    p_type: 'dir',
    parent_id: '',
    name: '',
    classify: '',
    path: '',
    icon: '',
    sort_num: '',
    descr: '',
    hide: false
  }
}

export default {
  components: {
    Card_uri
  },
  data () {
    return {
      routerTableData: [],
      loading: false,
      allExpanded: false,

      // 前端筛选
      keyword: '',
      filterType: '',
      filterHide: '',

      form_rules: {
        p_type: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ],
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' }
        ]
      },

      // 父级目录
      PDirOptions: [],
      iconOptions: ICON_OPTIONS,
      iconPickerVisible: false,

      isload: false,

      // 新增 / 编辑
      formVisible: false,
      formMode: 'create',
      editForm: emptyForm(),

      // 页面接口管理
      dialog_uri_flag: false,
      uri_title: '',
      page_info_cache: {}
    }
  },
  computed: {
    isFormDir () {
      return this.editForm.p_type === 'dir'
    },
    nameLabel () {
      return this.isFormDir ? '目录名称' : '路由名称'
    },
    flatList () {
      const list = []
      this.routerTableData.forEach(item => {
        list.push(item)
        ;(item.children || []).forEach(c => list.push(c))
      })
      return list
    },
    stats () {
      let dirs = 0
      let routes = 0
      let hidden = 0
      this.flatList.forEach(item => {
        if (this.isDir(item)) dirs++
        else routes++
        if (item.hide === '1') hidden++
      })
      return { dirs: dirs, routes: routes, hidden: hidden }
    },
    hasFilter () {
      return !!(this.keyword.trim() || this.filterType || this.filterHide)
    },
    // 父级命中保留全部子项；仅子项命中时保留父级 + 命中的子项
    filteredTree () {
      if (!this.hasFilter) return this.routerTableData
      const result = []
      this.routerTableData.forEach(item => {
        const children = item.children || []
        if (this.matchRow(item)) {
          const kept = this.keyword.trim() ? children : children.filter(c => this.matchRow(c))
          result.push(Object.assign({}, item, { children: kept }))
          return
        }
        const hit = children.filter(c => this.matchRow(c))
        if (hit.length) {
          result.push(Object.assign({}, item, { children: hit }))
        }
      })
      return result
    }
  },
  watch: {
    // 筛选时自动展开，便于查看命中的子菜单
    filteredTree () {
      if (this.hasFilter) {
        this.$nextTick(() => this.setExpand(true))
      }
    }
  },
  mounted () {
    this.getList()
  },
  methods: {
    isDir (row) {
      return String(row.p_type) === '0'
    },
    matchRow (row) {
      if (this.filterType && String(row.p_type) !== this.filterType) return false
      if (this.filterHide && String(row.hide) !== this.filterHide) return false
      const kw = this.keyword.trim().toLowerCase()
      if (!kw) return true
      return [row.name, row.path, row.classify, row.descr, String(row.page_id)]
        .some(v => String(v || '').toLowerCase().indexOf(kw) !== -1)
    },
    rowClassName ({ row }) {
      const cls = []
      if (row.hide === '1') cls.push('row-hidden')
      if (this.isDir(row) && row.parent_id == 0) cls.push('row-dir')
      return cls.join(' ')
    },
    resetFilter () {
      this.keyword = ''
      this.filterType = ''
      this.filterHide = ''
    },
    setExpand (expanded) {
      const table = this.$refs.table
      if (!table) return
      this.filteredTree.forEach(row => {
        if (row.children && row.children.length) {
          table.toggleRowExpansion(row, expanded)
        }
      })
      this.allExpanded = expanded
    },
    toggleExpandAll () {
      this.setExpand(!this.allExpanded)
    },

    // ==================== 新增 / 编辑 ====================
    openCreate (parentRow) {
      this.formMode = 'create'
      this.editForm = emptyForm()
      if (parentRow) {
        // 在目录下添加子路由
        this.editForm.p_type = 'router'
        this.editForm.parent_id = parentRow.page_id
        this.editForm.sort_num = String(((parentRow.children || []).length) + 1)
      }
      this.formVisible = true
      this.clearValidate()
    },
    handleEdit (row) {
      this.formMode = 'edit'
      this.editForm = {
        page_id: row.page_id,
        p_type: this.isDir(row) ? 'dir' : 'router',
        parent_id: row.parent_id == 0 ? '' : row.parent_id,
        name: row.name,
        classify: row.classify,
        path: row.path,
        icon: row.icon,
        sort_num: row.sort_num,
        descr: row.descr,
        hide: row.hide !== '0'
      }
      this.formVisible = true
      this.clearValidate()
    },
    resetForm () {
      const keepParent = this.editForm.parent_id
      const keepType = this.editForm.p_type
      this.editForm = emptyForm()
      this.editForm.p_type = keepType
      this.editForm.parent_id = keepParent
      this.clearValidate()
    },
    clearValidate () {
      this.$nextTick(() => {
        if (this.$refs.pageForm) this.$refs.pageForm.clearValidate()
      })
    },
    pickIcon (ic) {
      this.editForm.icon = ic
      this.iconPickerVisible = false
    },
    submitForm () {
      this.$refs.pageForm.validate(valid => {
        if (!valid) return
        if (this.formMode === 'create') {
          this.submitCreateForm()
        } else {
          this.submitUpdateForm()
        }
      })
    },
    // 目录不保存路径：切到目录类型时清空路径，类型最终由路径是否为空决定
    normalize (post_data) {
      if (post_data.p_type === 'dir') {
        post_data.path = ''
      }
      post_data.path = String(post_data.path || '').trim()
      post_data.name = String(post_data.name || '').trim()

      post_data.parent_id = parseInt(post_data.parent_id)
      if (Number.isNaN(post_data.parent_id)) {
        post_data.parent_id = 0
      }
      if (post_data.parent_id != 0 && post_data.classify == '默认分组') {
        post_data.classify = ''
      }
      post_data.p_type = post_data.path == '' ? '0' : '1'
      post_data.hide = post_data.hide === true ? '1' : '0'
      return post_data
    },
    submitCreateForm () {
      const base_data = {
        name: '',
        classify: '默认分组',
        sort_num: '1',
        path: '',
        p_type: 'dir',
        descr: '',
        hide: false,
        parent_id: 0,
        icon: ''
      }
      const form = {}
      // 空值不覆盖默认值（如分组、顺序）
      Object.keys(this.editForm).forEach(k => {
        const v = this.editForm[k]
        if (v !== '' && v !== null && v !== undefined) form[k] = v
      })
      const post_data = this.normalize({ ...base_data, ...form })

      this.isload = true
      page_api.addPage(post_data, {}).then(response => {
        if (response.data.code == 0) {
          this.$message.success('添加成功')
          this.formVisible = false
          this.getList()
        } else {
          this.$message.error('添加失败：' + response.data.message)
        }
      }).catch(error => {
        console.log(error)
        this.$message.error('添加失败，请重试')
      }).finally(() => {
        this.isload = false
      })
    },
    submitUpdateForm () {
      const post_data = this.normalize({ ...this.editForm })

      this.isload = true
      page_api.updatePage(post_data, {}).then(response => {
        if (response.data.code == 0) {
          this.$message.success('更新成功')
          this.formVisible = false
          this.getList()
        } else {
          this.$message.error('更新失败：' + response.data.message)
        }
      }).catch(error => {
        console.log(error)
        this.$message.error('更新失败，请重试')
      }).finally(() => {
        this.isload = false
      })
    },

    handleDelete (row) {
      // 筛选时表格里的 children 只含命中项，按原始数据判断
      const origin = this.routerTableData.find(r => r.page_id === row.page_id) || row
      const childCount = (origin.children || []).length
      if (childCount) {
        this.$message.warning('「' + row.name + '」下还有 ' + childCount + ' 个子菜单，请先删除或移走子菜单')
        return
      }
      this.$confirm('确定删除「' + row.name + '」？该页面关联的接口权限也会一并删除。', '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning'
      }).then(() => {
        page_api.delPage({ page_id: row.page_id }, {}).then(response => {
          if (response.data.code == 0) {
            this.$message.success('删除成功')
            this.getList()
          } else {
            this.$message.error('删除失败：' + response.data.message)
          }
        }).catch(error => {
          console.log(error)
          this.$message.error('删除失败，请重试')
        })
      }).catch(() => {})
    },

    getList () {
      this.loading = true
      page_api.getPageList({}, {}).then(response => {
        const res = response.data
        this.routerTableData = (res && Array.isArray(res.data)) ? res.data : []
        this.PDirOptions = []
        this.routerTableData.forEach(item => {
          if (item.path === '') this.PDirOptions.push({ label: item.name, value: item.page_id })
        })
        // 刷新后保持之前的展开状态
        if (this.allExpanded) {
          this.$nextTick(() => this.setExpand(true))
        }
      }).catch(error => {
        console.log(error)
        this.$message.error('查询菜单列表失败')
      }).finally(() => {
        this.loading = false
      })
    },

    handleUri (row) {
      this.uri_title = row.name
      this.page_info_cache = row
      this.dialog_uri_flag = true
    },

    copyText (text) {
      if (!text) return
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制')
      } catch (e) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(ta)
    }
  }
}
</script>

<style scoped>
.pm-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ input {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}

/* 标题栏 */
.pm-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.pm-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.pm-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.pm-count {
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
.pm-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 筛选栏 */
.pm-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafbfc;
}
.pm-filter > * {
  margin: 0 12px 8px 0;
}
.pm-search {
  width: 260px;
}

/* 表格 */
.pm-table {
  margin-top: 12px;
}
.pm-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.pm-table /deep/ .row-dir td {
  background-color: #fcfdff;
}
.pm-table /deep/ .row-hidden .menu-name,
.pm-table /deep/ .row-hidden .path-text {
  color: #a8abb2;
}
.name-cell {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  font-size: 14px;
  border-radius: 5px;
}
.menu-icon.icon-dir {
  color: #409eff;
  background: #ecf5ff;
}
.menu-icon.icon-route {
  color: #67c23a;
  background: #f0f9eb;
}
.menu-name.is-dir {
  font-weight: 600;
}
.child-count {
  margin-left: 6px;
  padding: 0 6px;
  height: 16px;
  line-height: 16px;
  font-size: 12px;
  border-radius: 8px;
  color: #909399;
  background: #f4f4f5;
}
.type-tag {
  display: inline-block;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
}
.type-dir {
  color: #409eff;
  background: #ecf5ff;
}
.type-route {
  color: #67c23a;
  background: #f0f9eb;
}
.path-text {
  font-size: 12px;
  color: #606266;
}
.chip {
  display: inline-block;
  max-width: 100%;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
  color: #606266;
  background: #f4f4f5;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.show-tag {
  font-size: 12px;
  color: #67c23a;
}
.hide-tag {
  font-size: 12px;
  color: #909399;
}
.hide-tag i {
  margin-right: 3px;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.pm-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.pm-table /deep/ .op-col .cell {
  white-space: nowrap;
}
.pm-table /deep/ .op-col .el-button + .el-button {
  margin-left: 8px;
}
.danger-btn {
  color: #f56c6c;
}
.danger-btn:hover,
.danger-btn:focus {
  color: #f78989;
}

/* 弹窗 */
.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dialog-title > i {
  margin-right: 6px;
  color: #409eff;
}
.title-id {
  margin-left: 10px;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 10px;
  color: #909399;
  background: #f4f4f5;
}
.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}
.form-tip .mono {
  color: #606266;
}
.inline-tip {
  display: inline;
  margin-left: 10px;
}
.opt-icon {
  margin-right: 6px;
  color: #409eff;
}
.icon-preview {
  display: inline-block;
  width: 16px;
  text-align: center;
  font-size: 16px;
  color: #409eff;
}
.icon-grid {
  display: flex;
  flex-wrap: wrap;
}
.icon-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 3px;
  font-size: 18px;
  color: #606266;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all .15s;
}
.icon-item:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}
.icon-item.active {
  color: #fff;
  border-color: #409eff;
  background: #409eff;
}

/* 抽屉 */
.drawer-page {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}
.drawer-path {
  margin-left: 10px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.drawer-body {
  padding: 0 20px 20px;
}
</style>
