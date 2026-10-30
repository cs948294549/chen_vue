<template>
  <div class="dq-panel">
    <!-- 查询条件 -->
    <div class="dq-search">
      <el-form class="dq-filter" size="small" label-width="84px" @submit.native.prevent>
        <el-form-item v-for="f in filters" :key="f.key" :label="f.label">
          <el-select
            v-if="f.type === 'select'"
            v-model="values[f.key]"
            :placeholder="f.placeholder || '请选择'"
            :clearable="f.clearable !== false">
            <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value"></el-option>
          </el-select>
          <el-input
            v-else
            v-model="values[f.key]"
            :placeholder="f.placeholder || f.label"
            clearable
            @keyup.enter.native="query"></el-input>
        </el-form-item>
        <div class="dq-actions">
          <el-button size="small" icon="el-icon-refresh-left" @click="reset">重置</el-button>
          <el-button size="small" type="primary" icon="el-icon-search" :loading="loading" @click="query">查询</el-button>
        </div>
      </el-form>
      <div v-if="tip" class="dq-tip"><i class="el-icon-info"></i>{{ tip }}</div>
    </div>

    <!-- 结果工具栏 -->
    <div class="dq-toolbar">
      <div class="dq-title">
        <i :class="icon"></i>{{ title }}
        <span v-if="searched" class="dq-count">{{ keyword ? filtered.length + ' / ' + rows.length : rows.length }}</span>
        <span v-if="searched && costMs !== null" class="dq-cost">耗时 {{ costMs }} ms</span>
      </div>
      <div class="dq-tools">
        <el-input
          v-model="keyword"
          class="dq-keyword"
          size="small"
          prefix-icon="el-icon-search"
          placeholder="在结果中筛选，空格分隔多个关键字"
          :disabled="rows.length === 0"
          clearable></el-input>
        <el-dropdown trigger="click" @command="exportData">
          <el-button size="small" icon="el-icon-download" :disabled="filtered.length === 0">
            导出<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="view">导出表格列（{{ filtered.length }} 条）</el-dropdown-item>
            <el-dropdown-item command="raw">导出全部原始字段（{{ filtered.length }} 条）</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 结果表格 -->
    <el-table :data="pageRows" v-loading="loading" size="small" stripe class="dq-table" @sort-change="onSort">
      <template slot="empty">
        <el-empty :image-size="80" :description="emptyText"></el-empty>
      </template>
      <el-table-column type="index" label="#" width="60" :index="indexMethod"></el-table-column>
      <el-table-column
        v-for="c in columns"
        :key="c.prop"
        :prop="c.prop"
        :label="c.label"
        :width="c.width"
        :min-width="c.minWidth || 120"
        :align="c.align || 'left'"
        sortable="custom"
        :show-overflow-tooltip="c.type !== 'status'">
        <template slot-scope="scope">
          <el-tag v-if="c.type === 'status'" size="mini" :type="c.status(scope.row).type">{{ c.status(scope.row).text }}</el-tag>
          <router-link
            v-else-if="c.type === 'device' && scope.row[c.ipProp || 'ip']"
            class="dq-link"
            :to="detailLink(scope.row[c.ipProp || 'ip'])">{{ cellText(c, scope.row) || scope.row[c.ipProp || 'ip'] }}</router-link>
          <span v-else-if="cellText(c, scope.row) === ''" class="dq-empty">-</span>
          <span v-else :class="{ mono: c.mono }">{{ cellText(c, scope.row) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="dq-pager">
      <el-pagination
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        :current-page="currentPage"
        :page-sizes="[20, 50, 100, 200, 500]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filtered.length"></el-pagination>
    </div>
  </div>
</template>

<script>
  import XLSX from 'xlsx'

  // 通用数据表查询面板：查询条件 + 结果内筛选 + 排序 + 分页 + 导出
  export default {
    name: "data_query_panel",
    props: {
      title: { type: String, default: "查询结果" },
      icon: { type: String, default: "el-icon-s-data" },
      // 查询条件：[{key, label, placeholder, type: 'input'|'select', options, default, clearable}]
      filters: { type: Array, default: () => [] },
      // 表格列：[{prop, label, width, minWidth, align, mono, type: 'device'|'status', ipProp, format(row), status(row), sortBy(row)}]
      columns: { type: Array, default: () => [] },
      // 查询前校验，返回错误提示字符串表示不通过
      validate: { type: Function, default: null },
      // 发起查询，入参为去除首尾空格后的条件，返回 axios Promise，响应格式 {code: 0, data: []}
      request: { type: Function, required: true },
      exportName: { type: String, default: "table" },
      tip: { type: String, default: "" },
    },
    data() {
      return {
        values: this.defaultValues(),
        rows: [],
        loading: false,
        searched: false,
        costMs: null,

        keyword: "",
        sortCol: null,
        sortOrder: null,
        currentPage: 1,
        pageSize: 20,
      }
    },
    computed: {
      filtered() {
        let list = this.rows
        const words = this.keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
        if (words.length) {
          list = list.filter(row => {
            const text = this.columns.map(c => this.cellText(c, row)).join("").toLowerCase()
            return words.every(w => text.indexOf(w) !== -1)
          })
        }
        if (this.sortCol && this.sortOrder) {
          const c = this.sortCol
          const dir = this.sortOrder === "ascending" ? 1 : -1
          const val = row => c.sortBy ? c.sortBy(row) : this.cellText(c, row)
          list = list.slice().sort((a, b) => {
            const va = val(a)
            const vb = val(b)
            if (typeof va === "number" && typeof vb === "number") {
              return (va - vb) * dir
            }
            return String(va).localeCompare(String(vb), "zh-CN", { numeric: true }) * dir
          })
        }
        return list
      },
      pageRows() {
        return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
      },
      emptyText() {
        if (!this.searched) {
          return "请输入查询条件后点击查询"
        }
        return this.keyword ? "没有匹配关键字的结果" : "未查询到数据"
      },
    },
    watch: {
      keyword() {
        this.currentPage = 1
      },
    },
    methods: {
      defaultValues() {
        const values = {}
        this.filters.forEach(f => {
          values[f.key] = f.default !== undefined ? f.default : ""
        })
        return values
      },
      reset() {
        this.values = this.defaultValues()
        this.keyword = ""
      },

      query() {
        const vals = {}
        Object.keys(this.values).forEach(k => {
          let v = this.values[k]
          if (typeof v === "string") {
            v = v.trim()
            this.values[k] = v
          }
          vals[k] = v
        })
        if (this.validate) {
          const err = this.validate(vals)
          if (err) {
            this.$message({ type: "warning", message: err })
            return
          }
        }

        this.loading = true
        const start = new Date().getTime()
        this.request(vals).then(response => {
          if (response.data && response.data.code === 0) {
            const list = response.data.data
            // 数据量可能较大，冻结后不做深度响应式
            this.rows = Object.freeze(Array.isArray(list) ? list : [])
            this.searched = true
            this.currentPage = 1
            this.costMs = new Date().getTime() - start
          } else {
            this.$message({ type: "error", message: "查询失败，请重试" })
          }
          this.loading = false
        }).catch(error => {
          console.log(error)
          this.loading = false
          this.$message({ type: "error", message: "查询失败，请重试" })
        })
      },

      cellText(c, row) {
        let v
        if (c.type === "status") {
          v = c.status(row).text
        } else if (c.format) {
          v = c.format(row)
        } else {
          v = row[c.prop]
        }
        return v === undefined || v === null ? "" : String(v)
      },
      detailLink(ip) {
        return { path: "/pages/device/device_detail", query: { dev: ip } }
      },
      indexMethod(i) {
        return (this.currentPage - 1) * this.pageSize + i + 1
      },
      onSort({ prop, order }) {
        this.sortCol = order ? this.columns.find(c => c.prop === prop) || null : null
        this.sortOrder = order
        this.currentPage = 1
      },
      handleCurrentChange(val) {
        this.currentPage = val
      },
      handleSizeChange(val) {
        this.pageSize = val
        this.currentPage = 1
      },

      // view：按表格列导出，表头为中文列名；raw：导出接口返回的全部字段
      exportData(mode) {
        if (this.filtered.length === 0) {
          return
        }
        let sheet
        if (mode === "raw") {
          sheet = XLSX.utils.json_to_sheet(this.filtered)
        } else {
          const header = this.columns.map(c => c.label)
          const body = this.filtered.map(row => this.columns.map(c => this.cellText(c, row)))
          sheet = XLSX.utils.aoa_to_sheet([header].concat(body))
          sheet["!cols"] = this.columns.map(c => ({ wch: Math.max(12, Math.round((c.width || c.minWidth || 120) / 8)) }))
        }
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book, sheet, "data")
        const d = new Date()
        const pad = n => ("0" + n).slice(-2)
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
        XLSX.writeFile(book, `${this.exportName}_${stamp}.xlsx`)
      },
    },
  }
</script>

<style scoped>
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.dq-empty {
  color: #c0c4cc;
}

/* 查询条件 */
.dq-search {
  padding: 14px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafbfc;
}
.dq-filter {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 16px;
}
.dq-filter /deep/ .el-form-item {
  margin-bottom: 10px;
}
.dq-filter /deep/ .el-select {
  width: 100%;
}
.dq-actions {
  grid-column-end: -1;
  justify-self: end;
  margin-bottom: 10px;
}
.dq-tip {
  margin-bottom: 10px;
  font-size: 12px;
  color: #909399;
}
.dq-tip i {
  margin-right: 4px;
  color: #409eff;
}

/* 结果工具栏 */
.dq-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 10px;
}
.dq-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}
.dq-title > i {
  margin-right: 6px;
  color: #409eff;
}
.dq-count {
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
.dq-cost {
  margin-left: 10px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.dq-tools {
  display: flex;
  align-items: center;
}
.dq-keyword {
  width: 280px;
  margin-right: 10px;
}

/* 表格 */
.dq-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.dq-link {
  font-weight: 500;
  color: #409eff;
  text-decoration: none;
}
.dq-link:hover {
  text-decoration: underline;
}
.dq-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
