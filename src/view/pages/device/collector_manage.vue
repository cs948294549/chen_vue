<template>
  <div class="cm-page">
    <!-- 标题栏 -->
    <div class="cm-header">
      <div class="cm-title">
        <i class="el-icon-s-platform"></i>采集设备管理
        <span class="cm-count">{{ filtered.length === rows.length ? rows.length : filtered.length + ' / ' + rows.length }}</span>
        <span class="cm-subtitle">管理 SNMP 采集的设备清单，屏蔽后该设备暂停采集</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="getIpList">刷新</el-button>
        <el-button size="small" icon="el-icon-download" :disabled="filtered.length === 0" @click="exportData">导出</el-button>
        <el-button size="small" type="primary" icon="el-icon-plus" @click="handleAdd">新增设备</el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="cm-filter">
      <el-radio-group v-model="filter_status" size="small">
        <el-radio-button label="">全部 {{ stats.total }}</el-radio-button>
        <el-radio-button label="0">正常 {{ stats.normal }}</el-radio-button>
        <el-radio-button label="1">屏蔽 {{ stats.blocked }}</el-radio-button>
      </el-radio-group>
      <el-input
        v-model="filter_search"
        class="cm-search"
        size="small"
        prefix-icon="el-icon-search"
        placeholder="IP 或设备名，空格分隔多个关键字"
        clearable></el-input>
      <el-input
        v-model="filter_community"
        class="cm-community"
        size="small"
        placeholder="Community"
        clearable></el-input>
      <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selection.length > 0" class="cm-batch">
      <span>已选 <b>{{ selection.length }}</b> 台设备</span>
      <el-button size="mini" type="text" icon="el-icon-turn-off" @click="handleBatchStatus('1')">批量屏蔽</el-button>
      <el-button size="mini" type="text" icon="el-icon-open" @click="handleBatchStatus('0')">批量恢复</el-button>
      <el-button size="mini" type="text" icon="el-icon-delete" class="danger-text" @click="handleBatchDelete">批量删除</el-button>
      <el-button size="mini" type="text" class="cm-batch-cancel" @click="clearSelection">取消选择</el-button>
    </div>

    <!-- 设备表格 -->
    <el-table
      ref="table"
      :data="pageRows"
      v-loading="loading"
      row-key="ip"
      size="small"
      stripe
      class="cm-table"
      @selection-change="handleSelectionChange"
      @sort-change="onSort">
      <template slot="empty">
        <el-empty :image-size="80" :description="rows.length ? '没有符合筛选条件的设备' : '暂无采集设备'"></el-empty>
      </template>
      <el-table-column type="selection" width="45" align="center" reserve-selection></el-table-column>
      <el-table-column prop="ip" label="IP地址" min-width="150" sortable="custom">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.ip }}</span>
          <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.ip)"></i>
        </template>
      </el-table-column>
      <el-table-column prop="sysname" label="设备名称" min-width="240" sortable="custom" show-overflow-tooltip>
        <template slot-scope="scope">
          <router-link v-if="scope.row.sysname" class="cm-link" :to="detailLink(scope.row.ip)">{{ scope.row.sysname }}</router-link>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="community" min-width="150">
        <template slot="header" slot-scope="head">
          Community
          <i
            :class="['cm-eye', showCommunity ? 'el-icon-view' : 'el-icon-lock']"
            :title="showCommunity ? '隐藏' : '显示'"
            @click.stop="showCommunity = !showCommunity"></i>
        </template>
        <template slot-scope="scope">
          <span class="mono">{{ showCommunity ? scope.row.community : maskText(scope.row.community) }}</span>
          <i v-if="scope.row.community" class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.community, 'Community 已复制')"></i>
        </template>
      </el-table-column>
      <el-table-column prop="admin_status" label="管理状态" width="110" align="center" sortable="custom">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.admin_status === '0'" size="mini" type="success">正常</el-tag>
          <el-tag v-else size="mini" type="info">屏蔽</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="timestamp" label="更新时间" width="170" sortable="custom">
        <template slot-scope="scope">{{ formatTimestamp(scope.row.timestamp) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            v-if="scope.row.admin_status === '0'"
            size="mini"
            type="text"
            icon="el-icon-turn-off"
            :loading="!!toggling[scope.row.ip]"
            @click="handleToggle(scope.row)">屏蔽</el-button>
          <el-button
            v-else
            size="mini"
            type="text"
            icon="el-icon-open"
            :loading="!!toggling[scope.row.ip]"
            @click="handleToggle(scope.row)">恢复</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" class="danger-text" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="cm-pager">
      <el-pagination
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        :current-page="currentPage"
        :page-sizes="[20, 50, 100, 200]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filtered.length"></el-pagination>
    </div>

    <!-- 新增设备 -->
    <el-dialog :visible.sync="addVisible" width="780px" :close-on-click-modal="false" @close="cancelDetect">
      <div slot="title" class="dialog-title"><i class="el-icon-circle-plus-outline"></i>新增采集设备</div>

      <el-steps :active="addStep" finish-status="success" simple class="cm-steps">
        <el-step title="填写 IP" icon="el-icon-edit-outline"></el-step>
        <el-step title="SNMP 检测" icon="el-icon-aim"></el-step>
        <el-step title="确认提交" icon="el-icon-upload2"></el-step>
      </el-steps>

      <!-- 第一步：填写 -->
      <el-form v-if="detectResults.length === 0" label-width="100px" size="small" @submit.native.prevent>
        <el-form-item label="IP地址" required>
          <el-input
            type="textarea"
            v-model="addForm.ip_text"
            :rows="7"
            placeholder="每行一个 IP，也支持逗号或空格分隔&#10;例如:&#10;192.168.1.1&#10;192.168.1.2"></el-input>
          <div class="parse-hint">
            <span>识别到 <b>{{ parsedIps.valid.length }}</b> 个 IP</span>
            <span v-if="parsedIps.dup > 0">，已忽略重复 {{ parsedIps.dup }} 个</span>
            <span v-if="parsedIps.existCount > 0">，其中 {{ parsedIps.existCount }} 个已在清单中</span>
          </div>
          <div v-if="parsedIps.invalid.length" class="parse-error">
            <i class="el-icon-warning"></i>格式错误：{{ parsedIps.invalid.slice(0, 10).join('、') }}<span v-if="parsedIps.invalid.length > 10"> 等 {{ parsedIps.invalid.length }} 项</span>
          </div>
        </el-form-item>
        <el-form-item label="Community" required>
          <el-input v-model="addForm.community" placeholder="默认: vdiannet" clearable></el-input>
        </el-form-item>
      </el-form>

      <!-- 第二、三步：检测结果 -->
      <div v-else>
        <div class="detect-summary">
          <div class="detect-info">
            <span>Community：<span class="mono">{{ maskText(detectCommunity) }}</span></span>
            <span class="sum-item">成功 <b class="c-success">{{ detectStats.success }}</b></span>
            <span class="sum-item">失败 <b class="c-danger">{{ detectStats.failed }}</b></span>
            <span class="sum-item">已存在 <b class="c-warning">{{ detectStats.exist }}</b></span>
          </div>
          <el-progress
            v-if="detecting"
            class="detect-progress"
            :percentage="detectPercent"
            :format="progressFormat"></el-progress>
        </div>
        <el-table
          ref="resultTable"
          :data="detectResults"
          size="mini"
          max-height="320"
          class="cm-table"
          @selection-change="handleResultSelection">
          <el-table-column type="selection" width="45" align="center" :selectable="resultSelectable"></el-table-column>
          <el-table-column prop="ip" label="IP地址" width="140">
            <template slot-scope="scope"><span class="mono">{{ scope.row.ip }}</span></template>
          </el-table-column>
          <el-table-column prop="sysname" label="设备名称（SNMP）" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              <span v-if="scope.row.sysname">{{ scope.row.sysname }}</span>
              <span v-else-if="scope.row.reason" class="c-danger">{{ scope.row.reason }}</span>
              <span v-else class="empty-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="检测结果" width="90" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.status === 'success'" size="mini" type="success">成功</el-tag>
              <el-tag v-else-if="scope.row.status === 'failed'" size="mini" type="danger">失败</el-tag>
              <span v-else-if="scope.row.status === 'pending'" class="c-primary"><i class="el-icon-loading"></i> 检测中</span>
              <span v-else class="empty-text">等待</span>
            </template>
          </el-table-column>
          <el-table-column label="提交后" width="150" align="center">
            <template slot-scope="scope">
              <template v-if="scope.row.exist">
                <el-tooltip :content="'当前名称：' + (scope.row.exist.sysname || '-')" placement="top">
                  <el-tag size="mini" type="warning">更新</el-tag>
                </el-tooltip>
                <el-tag size="mini" :type="scope.row.exist.admin_status === '0' ? 'success' : 'info'">
                  保持{{ scope.row.exist.admin_status === '0' ? '正常' : '屏蔽' }}
                </el-tag>
              </template>
              <el-tag v-else size="mini">新增</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="parse-hint">已存在的设备提交后会更新名称和 Community，管理状态保持不变</div>
      </div>

      <span slot="footer">
        <el-button size="small" @click="addVisible = false">取 消</el-button>
        <template v-if="detectResults.length === 0">
          <el-button
            size="small"
            type="primary"
            icon="el-icon-aim"
            :disabled="parsedIps.valid.length === 0 || parsedIps.invalid.length > 0"
            @click="handleDetect">开始检测 ({{ parsedIps.valid.length }})</el-button>
        </template>
        <template v-else>
          <el-button size="small" icon="el-icon-back" :disabled="submitLoading" @click="backToInput">上一步</el-button>
          <el-button
            size="small"
            icon="el-icon-refresh-right"
            :disabled="detecting || detectStats.failed === 0"
            @click="retryFailed">重试失败 ({{ detectStats.failed }})</el-button>
          <el-button
            size="small"
            type="primary"
            icon="el-icon-upload2"
            :disabled="detecting || resultSelection.length === 0"
            :loading="submitLoading"
            @click="handleBatchSubmit">提交选中 ({{ resultSelection.length }})</el-button>
        </template>
      </span>
    </el-dialog>

    <!-- 编辑设备 -->
    <el-dialog :visible.sync="editVisible" width="560px" :close-on-click-modal="false">
      <div slot="title" class="dialog-title"><i class="el-icon-edit-outline"></i>编辑设备</div>
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="100px" size="small" @submit.native.prevent>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="editForm.ip" disabled></el-input>
        </el-form-item>
        <el-form-item label="Community" prop="community">
          <el-input v-model="editForm.community" placeholder="默认: vdiannet" clearable></el-input>
        </el-form-item>
        <el-form-item label="设备名称" prop="sysname">
          <el-input v-model="editForm.sysname" placeholder="请输入设备名称" clearable>
            <el-button slot="append" :icon="fetchLoading ? 'el-icon-loading' : 'el-icon-aim'" :disabled="fetchLoading" @click="fetchSysname">SNMP获取</el-button>
          </el-input>
          <div class="parse-hint">用当前 Community 读取 sysName，可同时验证 Community 是否可用</div>
        </el-form-item>
        <el-form-item label="管理状态" prop="admin_status">
          <el-radio-group v-model="editForm.admin_status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">屏蔽（暂停采集）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="editVisible = false">取 消</el-button>
        <el-button size="small" type="primary" :loading="submitLoading" @click="handleEditSubmit">保 存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import XLSX from 'xlsx'
import iplist_api from "@/api/mapis/iplist_interface.js"
import collector_api from "@/api/mapis/collector_interface.js"

const DEFAULT_COMMUNITY = 'vdiannet'
const SYSNAME_OID = '1.3.6.1.2.1.1.5.0'
// SNMP 检测并发数
const DETECT_CONCURRENCY = 10
const IP_REG = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

const ipNum = ip => String(ip || '').split('.').reduce((a, b) => a * 256 + (parseInt(b) || 0), 0)
const nowTs = () => Math.floor(new Date().getTime() / 1000).toString()

export default {
  data() {
    return {
      rows: [],
      loading: false,

      // 筛选、排序、分页
      filter_search: "",
      filter_status: "",
      filter_community: "",
      sortProp: null,
      sortOrder: null,
      currentPage: 1,
      pageSize: 20,

      selection: [],
      toggling: {},
      showCommunity: false,

      // 新增
      addVisible: false,
      addForm: { ip_text: '', community: DEFAULT_COMMUNITY },
      detectResults: [],
      detectCommunity: '',
      detecting: false,
      detectToken: 0,
      resultSelection: [],

      // 编辑
      editVisible: false,
      editForm: { ip: '', sysname: '', community: '', admin_status: '0' },
      editRules: {
        sysname: [
          { required: true, message: '请输入设备名称', trigger: 'blur' },
          { min: 1, max: 300, message: '设备名称长度在1到300个字符', trigger: 'blur' }
        ],
        community: [
          { required: true, message: '请输入Community', trigger: 'blur' },
          { max: 100, message: 'Community长度不超过100个字符', trigger: 'blur' }
        ],
        admin_status: [
          { required: true, message: '请选择管理状态', trigger: 'change' }
        ]
      },
      fetchLoading: false,
      submitLoading: false,
    }
  },

  computed: {
    rowMap() {
      const map = {}
      this.rows.forEach(r => { map[r.ip] = r })
      return map
    },
    stats() {
      const normal = this.rows.filter(r => r.admin_status === '0').length
      return { total: this.rows.length, normal: normal, blocked: this.rows.length - normal }
    },
    filtered() {
      const words = this.filter_search.trim().toLowerCase().split(/\s+/).filter(Boolean)
      const community = this.filter_community.trim()
      let list = this.rows.filter(r => {
        if (this.filter_status !== "" && r.admin_status !== this.filter_status) {
          return false
        }
        if (community && String(r.community || '').indexOf(community) === -1) {
          return false
        }
        if (words.length) {
          const text = (r.ip + ' ' + (r.sysname || '')).toLowerCase()
          return words.every(w => text.indexOf(w) !== -1)
        }
        return true
      })
      if (this.sortProp && this.sortOrder) {
        const dir = this.sortOrder === 'ascending' ? 1 : -1
        const prop = this.sortProp
        list = list.slice().sort((a, b) => {
          if (prop === 'ip') {
            return (ipNum(a.ip) - ipNum(b.ip)) * dir
          }
          if (prop === 'timestamp') {
            return ((parseInt(a.timestamp) || 0) - (parseInt(b.timestamp) || 0)) * dir
          }
          return String(a[prop] || '').localeCompare(String(b[prop] || ''), 'zh-CN', { numeric: true }) * dir
        })
      }
      return list
    },
    pageRows() {
      return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
    },

    // 解析输入的 IP 列表：去重、校验格式、标记已存在
    parsedIps() {
      const items = this.addForm.ip_text.split(/[\s,，;；]+/).filter(Boolean)
      const seen = {}
      const valid = []
      const invalid = []
      let dup = 0
      items.forEach(ip => {
        if (seen[ip]) {
          dup++
          return
        }
        seen[ip] = true
        if (IP_REG.test(ip)) {
          valid.push(ip)
        } else {
          invalid.push(ip)
        }
      })
      const existCount = valid.filter(ip => this.rowMap[ip]).length
      return { valid: valid, invalid: invalid, dup: dup, existCount: existCount }
    },
    detectStats() {
      const s = { success: 0, failed: 0, exist: 0, done: 0 }
      this.detectResults.forEach(r => {
        if (r.status === 'success') { s.success++ }
        if (r.status === 'failed') { s.failed++ }
        if (r.status === 'success' || r.status === 'failed') { s.done++ }
        if (r.exist) { s.exist++ }
      })
      return s
    },
    detectPercent() {
      const total = this.detectResults.length
      return total ? Math.round(this.detectStats.done * 100 / total) : 0
    },
    addStep() {
      if (this.detectResults.length === 0) {
        return 0
      }
      return this.detecting ? 1 : 2
    },
  },

  watch: {
    // 筛选条件变化时清空勾选，避免批量操作命中看不到的设备
    filter_search() { this.onFilterChange() },
    filter_status() { this.onFilterChange() },
    filter_community() { this.onFilterChange() },
  },

  mounted() {
    this.getIpList()
  },

  methods: {
    // ==================== 列表 ====================
    getIpList() {
      this.loading = true
      iplist_api.getIpList({}, {}).then(response => {
        if (response.data.code === 0) {
          this.rows = Object.freeze(response.data.data || [])
          this.clearSelection()
          const maxPage = Math.max(1, Math.ceil(this.filtered.length / this.pageSize))
          if (this.currentPage > maxPage) {
            this.currentPage = maxPage
          }
        } else {
          this.$message({ type: 'error', message: '查询失败，请重试' })
        }
        this.loading = false
      }).catch(error => {
        console.log(error)
        this.loading = false
        this.$message({ type: 'error', message: '查询失败，请重试' })
      })
    },
    onFilterChange() {
      this.currentPage = 1
      this.clearSelection()
    },
    resetFilter() {
      this.filter_search = ""
      this.filter_status = ""
      this.filter_community = ""
    },
    handleSelectionChange(val) {
      this.selection = val
    },
    clearSelection() {
      if (this.$refs.table) {
        this.$refs.table.clearSelection()
      }
    },
    onSort({ prop, order }) {
      this.sortProp = order ? prop : null
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
    detailLink(ip) {
      return { path: "/pages/device/device_detail", query: { dev: ip } }
    },
    maskText(text) {
      return text ? '••••••' : '-'
    },

    // ==================== 屏蔽 / 恢复 ====================
    handleToggle(row) {
      const target = row.admin_status === '0' ? '1' : '0'
      const doIt = () => {
        this.$set(this.toggling, row.ip, true)
        iplist_api.updateIp({
          ip: row.ip,
          sysname: row.sysname,
          community: row.community || DEFAULT_COMMUNITY,
          admin_status: target,
          timestamp: nowTs()
        }, {}).then(response => {
          if (response.data.code === 0) {
            this.$message({ type: 'success', message: (target === '1' ? '已屏蔽 ' : '已恢复 ') + row.ip })
            this.getIpList()
          } else {
            this.$message({ type: 'error', message: response.data.message || '操作失败' })
          }
          this.$set(this.toggling, row.ip, false)
        }).catch(error => {
          console.log(error)
          this.$set(this.toggling, row.ip, false)
          this.$message({ type: 'error', message: '操作失败，请重试' })
        })
      }
      if (target === '0') {
        doIt()
        return
      }
      this.$confirm(`屏蔽后 ${row.sysname || row.ip} (${row.ip}) 将暂停采集，确认屏蔽吗？`, '屏蔽设备', {
        confirmButtonText: '屏蔽',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(doIt).catch(() => {})
    },
    handleBatchStatus(target) {
      const list = this.selection.filter(r => r.admin_status !== target)
      const word = target === '1' ? '屏蔽' : '恢复'
      if (list.length === 0) {
        this.$message({ type: 'info', message: `选中的设备都已是${target === '1' ? '屏蔽' : '正常'}状态` })
        return
      }
      this.$confirm(this.deviceListMessage(`确认${word}以下 ${list.length} 台设备？` + (target === '1' ? '屏蔽后将暂停采集。' : ''), list), '批量' + word, {
        confirmButtonText: word,
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ts = nowTs()
        const ip_list = list.map(r => ({
          ip: r.ip,
          sysname: r.sysname,
          community: r.community || DEFAULT_COMMUNITY,
          admin_status: target,
          timestamp: ts
        }))
        this.loading = true
        iplist_api.batchAddOrUpdateIp({ ip_list: ip_list }, {}).then(response => {
          if (response.data.code === 0) {
            this.$message({ type: 'success', message: `已${word} ${list.length} 台设备` })
            this.getIpList()
          } else {
            this.loading = false
            this.$message({ type: 'error', message: response.data.message || `批量${word}失败` })
          }
        }).catch(error => {
          console.log(error)
          this.loading = false
          this.$message({ type: 'error', message: `批量${word}失败，请重试` })
        })
      }).catch(() => {})
    },

    // ==================== 删除 ====================
    handleDelete(row) {
      this.$confirm(`确认删除设备 ${row.sysname || '-'} (${row.ip}) 吗？删除后将不再采集该设备。`, '删除设备', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning'
      }).then(() => {
        iplist_api.deleteIp({ ip: row.ip }, {}).then(response => {
          if (response.data.code === 0) {
            this.$message({ type: 'success', message: '删除成功' })
            this.getIpList()
          } else {
            this.$message({ type: 'error', message: response.data.message || '删除失败' })
          }
        }).catch(error => {
          console.log(error)
          this.$message({ type: 'error', message: '删除失败，请重试' })
        })
      }).catch(() => {})
    },
    handleBatchDelete() {
      const list = this.selection.slice()
      if (list.length === 0) {
        return
      }
      this.$confirm(this.deviceListMessage(`确认删除以下 ${list.length} 台设备？删除后将不再采集。`, list), '批量删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning'
      }).then(() => {
        iplist_api.batchDeleteIp({ ip_list: list.map(r => r.ip) }, {}).then(response => {
          if (response.data.code === 0) {
            this.$message({ type: 'success', message: `已删除 ${list.length} 台设备` })
            this.getIpList()
          } else {
            this.$message({ type: 'error', message: response.data.message || '批量删除失败' })
          }
        }).catch(error => {
          console.log(error)
          this.$message({ type: 'error', message: '批量删除失败，请重试' })
        })
      }).catch(() => {})
    },
    // 确认框中列出设备清单（VNode，避免设备名中的特殊字符被当作 HTML）
    deviceListMessage(title, list) {
      const h = this.$createElement
      const items = list.slice(0, 10).map(r => h('div', { key: r.ip }, r.ip + '    ' + (r.sysname || '-')))
      if (list.length > 10) {
        items.push(h('div', { style: 'color: #909399;' }, `… 共 ${list.length} 台`))
      }
      return h('div', null, [
        h('p', { style: 'margin: 0 0 8px;' }, title),
        h('div', {
          style: 'max-height: 200px; overflow: auto; padding: 6px 10px; border-radius: 4px; background: #f5f7fa; font-family: Menlo, Consolas, monospace; font-size: 12px; line-height: 20px;'
        }, items)
      ])
    },

    // ==================== 新增 ====================
    handleAdd() {
      this.addForm = { ip_text: '', community: DEFAULT_COMMUNITY }
      this.detectResults = []
      this.resultSelection = []
      this.addVisible = true
    },
    handleDetect() {
      const ips = this.parsedIps.valid
      if (ips.length === 0 || this.parsedIps.invalid.length > 0) {
        return
      }
      this.detectCommunity = this.addForm.community.trim() || DEFAULT_COMMUNITY
      this.detectResults = ips.map(ip => ({
        ip: ip,
        sysname: '',
        status: 'waiting',
        reason: '',
        exist: this.rowMap[ip] || null
      }))
      this.runDetect(this.detectResults)
    },
    retryFailed() {
      const list = this.detectResults.filter(r => r.status === 'failed')
      list.forEach(r => {
        r.status = 'waiting'
        r.sysname = ''
        r.reason = ''
      })
      this.runDetect(list)
    },
    // 限制并发逐个检测；关闭弹窗或返回上一步后旧的检测结果不再写入
    runDetect(items) {
      const token = ++this.detectToken
      const community = this.detectCommunity
      let idx = 0
      const next = () => {
        if (token !== this.detectToken || idx >= items.length) {
          return Promise.resolve()
        }
        const item = items[idx++]
        item.status = 'pending'
        return collector_api.getSNMPGET({ ip: item.ip, community: community, oid: SYSNAME_OID }, {}).then(response => {
          if (token !== this.detectToken) {
            return
          }
          if (response.data.code === 0 && response.data.data) {
            item.sysname = response.data.data
            item.status = 'success'
          } else {
            item.reason = 'SNMP 无响应或 Community 错误'
            item.status = 'failed'
          }
        }).catch(error => {
          console.log(error)
          if (token === this.detectToken) {
            item.reason = '请求异常'
            item.status = 'failed'
          }
        }).then(next)
      }

      this.detecting = true
      const workers = []
      for (let i = 0; i < Math.min(DETECT_CONCURRENCY, items.length); i++) {
        workers.push(next())
      }
      Promise.all(workers).then(() => {
        if (token !== this.detectToken) {
          return
        }
        this.detecting = false
        this.$message({
          type: this.detectStats.failed ? 'warning' : 'success',
          message: `检测完成，成功 ${this.detectStats.success}，失败 ${this.detectStats.failed}`
        })
        // 默认勾选全部检测成功的设备
        this.$nextTick(() => {
          const table = this.$refs.resultTable
          if (!table) {
            return
          }
          table.clearSelection()
          this.detectResults.forEach(r => {
            if (r.status === 'success') {
              table.toggleRowSelection(r, true)
            }
          })
        })
      })
    },
    cancelDetect() {
      this.detectToken++
      this.detecting = false
    },
    backToInput() {
      this.cancelDetect()
      this.detectResults = []
      this.resultSelection = []
    },
    resultSelectable(row) {
      return row.status === 'success'
    },
    handleResultSelection(val) {
      this.resultSelection = val
    },
    handleBatchSubmit() {
      const list = this.resultSelection.filter(r => r.status === 'success')
      if (list.length === 0) {
        return
      }
      const ts = nowTs()
      // 已存在的设备保留原管理状态，避免把屏蔽设备误恢复
      const ip_list = list.map(r => ({
        ip: r.ip,
        sysname: r.sysname,
        community: this.detectCommunity,
        admin_status: r.exist ? r.exist.admin_status : '0',
        timestamp: ts
      }))
      const addCount = list.filter(r => !r.exist).length
      this.submitLoading = true
      iplist_api.batchAddOrUpdateIp({ ip_list: ip_list }, {}).then(response => {
        if (response.data.code === 0) {
          this.$message({ type: 'success', message: `提交完成：新增 ${addCount} 台，更新 ${list.length - addCount} 台` })
          this.addVisible = false
          this.getIpList()
        } else {
          this.$message({ type: 'error', message: response.data.message || '批量处理失败' })
        }
        this.submitLoading = false
      }).catch(error => {
        console.log(error)
        this.submitLoading = false
        this.$message({ type: 'error', message: '批量处理失败，请重试' })
      })
    },
    progressFormat() {
      return this.detectStats.done + ' / ' + this.detectResults.length
    },

    // ==================== 编辑 ====================
    handleEdit(row) {
      this.editForm = {
        ip: row.ip,
        sysname: row.sysname,
        community: row.community,
        admin_status: row.admin_status
      }
      this.editVisible = true
      this.$nextTick(() => {
        if (this.$refs.editForm) {
          this.$refs.editForm.clearValidate()
        }
      })
    },
    fetchSysname() {
      const community = (this.editForm.community || '').trim() || DEFAULT_COMMUNITY
      this.fetchLoading = true
      collector_api.getSNMPGET({ ip: this.editForm.ip, community: community, oid: SYSNAME_OID }, {}).then(response => {
        if (response.data.code === 0 && response.data.data) {
          this.editForm.sysname = response.data.data
          this.$message({ type: 'success', message: 'SNMP 获取成功，Community 可用' })
        } else {
          this.$message({ type: 'error', message: 'SNMP 无响应或 Community 错误' })
        }
        this.fetchLoading = false
      }).catch(error => {
        console.log(error)
        this.fetchLoading = false
        this.$message({ type: 'error', message: 'SNMP 请求异常' })
      })
    },
    handleEditSubmit() {
      this.$refs.editForm.validate(valid => {
        if (!valid) {
          return
        }
        this.submitLoading = true
        iplist_api.updateIp({
          ip: this.editForm.ip,
          sysname: this.editForm.sysname,
          community: this.editForm.community || DEFAULT_COMMUNITY,
          admin_status: this.editForm.admin_status,
          timestamp: nowTs()
        }, {}).then(response => {
          if (response.data.code === 0) {
            this.$message({ type: 'success', message: '修改成功' })
            this.editVisible = false
            this.getIpList()
          } else {
            this.$message({ type: 'error', message: response.data.message || '修改失败' })
          }
          this.submitLoading = false
        }).catch(error => {
          console.log(error)
          this.submitLoading = false
          this.$message({ type: 'error', message: '修改失败，请重试' })
        })
      })
    },

    // ==================== 工具 ====================
    exportData() {
      const header = ['IP地址', '设备名称', 'Community', '管理状态', '更新时间']
      const body = this.filtered.map(r => [
        r.ip,
        r.sysname || '',
        r.community || '',
        r.admin_status === '0' ? '正常' : '屏蔽',
        this.formatTimestamp(r.timestamp)
      ])
      const sheet = XLSX.utils.aoa_to_sheet([header].concat(body))
      sheet['!cols'] = [{ wch: 16 }, { wch: 36 }, { wch: 16 }, { wch: 10 }, { wch: 20 }]
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, 'collector')
      const d = new Date()
      const pad = n => ('0' + n).slice(-2)
      XLSX.writeFile(book, `collector_list_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`)
    },
    copyText(text, msg) {
      if (!text) {
        return
      }
      const done = () => this.$message({ type: 'success', message: msg || ('已复制：' + text), duration: 1500 })
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done)
        return
      }
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      done()
    },
    formatTimestamp(timestamp) {
      if (!timestamp || timestamp === '0') {
        return '-'
      }
      // 秒级时间戳转毫秒
      let ts = parseInt(timestamp)
      if (ts < 10000000000) {
        ts = ts * 1000
      }
      const date = new Date(ts)
      if (isNaN(date.getTime())) {
        return '-'
      }
      const pad = n => ('0' + n).slice(-2)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }
  }
}
</script>

<style scoped>
.cm-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.danger-text {
  color: #f56c6c;
}
.danger-text:hover,
.danger-text:focus {
  color: #f78989;
}
.c-success { color: #67c23a; }
.c-danger { color: #f56c6c; }
.c-warning { color: #e6a23c; }
.c-primary { color: #409eff; }

/* 标题栏 */
.cm-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cm-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.cm-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.cm-count {
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
.cm-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 筛选栏 */
.cm-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafbfc;
}
.cm-filter > * {
  margin-right: 12px;
}
.cm-search {
  width: 300px;
}
.cm-community {
  width: 160px;
}

/* 批量操作栏 */
.cm-batch {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 4px 16px;
  font-size: 13px;
  border-radius: 4px;
  color: #606266;
  background-color: #ecf5ff;
}
.cm-batch b {
  color: #409eff;
}
.cm-batch > span {
  margin-right: 16px;
}
.cm-batch-cancel {
  margin-left: auto !important;
  color: #909399;
}

/* 表格 */
.cm-table {
  margin-top: 12px;
}
.cm-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.cm-link {
  font-weight: 500;
  color: #409eff;
  text-decoration: none;
}
.cm-link:hover {
  text-decoration: underline;
}
.cm-eye {
  margin-left: 4px;
  color: #909399;
  cursor: pointer;
}
.cm-eye:hover {
  color: #409eff;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.cm-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.cm-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
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
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.cm-steps {
  margin-bottom: 18px;
}
.parse-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #909399;
}
.parse-hint b {
  color: #409eff;
}
.parse-error {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #f56c6c;
  word-break: break-all;
}
.parse-error i {
  margin-right: 4px;
}
.detect-summary {
  margin-bottom: 10px;
}
.detect-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #606266;
}
.sum-item {
  margin-left: 18px;
}
.detect-progress {
  margin-top: 8px;
}
.cm-table /deep/ .el-tag + .el-tag {
  margin-left: 4px;
}
</style>
