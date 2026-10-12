<template>
  <div class="acl-issues-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="标准规则">
          <el-select v-model="filterForm.standard_id" placeholder="请选择" clearable style="width: 200px;">
            <el-option v-for="item in standardOptions" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="filterForm.device" placeholder="IP或设备名" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待处理" value="pending"></el-option>
            <el-option label="处理中" value="processing"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已忽略" value="ignored"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="never" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span style="font-weight: bold;">处理记录列表</span>
        <div style="float: right;">
          <el-button type="success" size="mini" icon="el-icon-plus" @click="handleCreateRecord">新建处理记录</el-button>
          <el-button v-if="selectedRecords.length > 0" type="primary" size="mini" icon="el-icon-document-add" @click="handleBatchCreateTickets">
            批量创建工单 ({{ selectedRecords.length }})
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" border stripe @selection-change="handleSelectionChange" style="width: 100%">
        <el-table-column type="selection" width="55" :selectable="checkSelectable"></el-table-column>
        <el-table-column prop="id" label="记录ID" width="80" align="center" />
        <el-table-column prop="standard_name" label="标准规则" width="160">
          <template slot-scope="scope"><el-tag type="primary" size="small">{{ scope.row.standard_name }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="device_ip" label="设备IP" width="140">
          <template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template>
        </el-table-column>
        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />
        <el-table-column prop="issue_type" label="问题类型" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="issueTypeTag(scope.row.issue_type)" size="small">{{ issueTypeLabel(scope.row.issue_type) }}</el-tag>
            <el-tag v-if="scope.row.dangling_refs && scope.row.dangling_refs.length" type="danger" size="mini" effect="plain" style="margin-left:4px;">悬空×{{ scope.row.dangling_refs.length }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template slot-scope="scope">
            <el-dropdown size="mini" @command="cmd => handleStatusChange(scope.row, cmd)">
              <el-tag :type="statusTag(scope.row.status)" size="small" style="cursor:pointer;">{{ statusLabel(scope.row.status) }} <i class="el-icon-arrow-down"></i></el-tag>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="pending">待处理</el-dropdown-item>
                <el-dropdown-item command="processing">处理中</el-dropdown-item>
                <el-dropdown-item command="completed">已完成</el-dropdown-item>
                <el-dropdown-item command="ignored">已忽略</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column prop="change_ticket_id" label="工单" width="140">
          <template slot-scope="scope">
            <span v-if="scope.row.change_ticket_id" class="ticket-link">{{ scope.row.change_ticket_id }}</span>
            <span v-else style="color:#C0C4CC;">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="155" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleViewDetail(scope.row)">查看</el-button>
            <el-button type="text" size="mini" style="color:#F56C6C;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="pageSize" :current-page.sync="currentPage" @current-change="loadData"></el-pagination>
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog title="处理记录详情" :visible.sync="detailDialog.visible" width="900px" :close-on-click-modal="false">
      <el-descriptions v-if="detailDialog.record" :column="3" border size="small" style="margin-bottom:16px;">
        <el-descriptions-item label="记录ID">{{ detailDialog.record.id }}</el-descriptions-item>
        <el-descriptions-item label="问题类型"><el-tag :type="issueTypeTag(detailDialog.record.issue_type)" size="small">{{ issueTypeLabel(detailDialog.record.issue_type) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusTag(detailDialog.record.status)" size="small">{{ statusLabel(detailDialog.record.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="标准规则">{{ detailDialog.record.standard_name }}</el-descriptions-item>
        <el-descriptions-item label="设备IP">{{ detailDialog.record.device_ip }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detailDialog.record.device_name }}</el-descriptions-item>
        <el-descriptions-item label="工单" :span="2">{{ detailDialog.record.change_ticket_id || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailDialog.record.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-tabs v-if="detailDialog.record">
        <el-tab-pane label="差异对比">
          <div v-if="detailDialog.diffHtml" class="diff-container" v-html="detailDialog.diffHtml"></div>
          <el-button v-else type="primary" size="small" @click="loadDiff(detailDialog.record)">加载差异对比</el-button>
        </el-tab-pane>
        <el-tab-pane label="标准配置">
          <el-table :data="detailDialog.record.standard_entries" border size="small" style="width:100%;">
            <el-table-column prop="seq" label="Seq" width="70" align="center" />
            <el-table-column prop="action" label="动作" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.action==='deny'?'danger':'success'" size="mini">{{ scope.row.action }}</el-tag></template></el-table-column>
            <el-table-column prop="protocol" label="协议" width="80" align="center" />
            <el-table-column label="源地址" min-width="140"><template slot-scope="scope">{{ formatAddrSpec(scope.row.src) }}</template></el-table-column>
            <el-table-column label="目的地址" min-width="140"><template slot-scope="scope">{{ formatAddrSpec(scope.row.dst) }}</template></el-table-column>
            <el-table-column label="目的端口" width="120"><template slot-scope="scope">{{ formatPortSpec(scope.row.dst_port) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="设备配置">
          <el-table :data="detailDialog.record.device_entries" border size="small" style="width:100%;">
            <el-table-column prop="seq" label="Seq" width="70" align="center" />
            <el-table-column prop="action" label="动作" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.action==='deny'?'danger':'success'" size="mini">{{ scope.row.action }}</el-tag></template></el-table-column>
            <el-table-column prop="protocol" label="协议" width="80" align="center" />
            <el-table-column label="源地址" min-width="140"><template slot-scope="scope">{{ formatAddrSpec(scope.row.src) }}</template></el-table-column>
            <el-table-column label="目的地址" min-width="140"><template slot-scope="scope">{{ formatAddrSpec(scope.row.dst) }}</template></el-table-column>
            <el-table-column label="目的端口" width="120"><template slot-scope="scope">{{ formatPortSpec(scope.row.dst_port) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <span slot="footer">
        <el-button @click="detailDialog.visible = false" size="small">关闭</el-button>
        <el-button v-if="detailDialog.record && !detailDialog.record.change_ticket_id" type="primary" size="small" @click="handleCreateTicketSingle(detailDialog.record)">创建工单</el-button>
      </span>
    </el-dialog>

    <!-- New Issue Dialog -->
    <el-dialog title="新建处理记录" :visible.sync="newIssueDialog.visible" width="500px" :close-on-click-modal="false">
      <el-form :model="newIssueForm" :rules="newIssueRules" ref="newIssueFormRef" label-width="90px" size="small">
        <el-form-item label="标准规则" prop="standard_id">
          <el-select v-model="newIssueForm.standard_id" style="width:100%;" placeholder="请选择标准规则">
            <el-option v-for="item in standardOptions" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备IP" prop="device_ip">
          <el-input v-model="newIssueForm.device_ip" placeholder="如 10.1.1.1"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="newIssueForm.remark" :rows="3" placeholder="可选"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="newIssueDialog.visible = false" size="small">取消</el-button>
        <el-button type="primary" size="small" :loading="newIssueDialog.loading" @click="submitNewIssue">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'

export default {
  name: 'AclIssue',
  data() {
    return {
      filterForm: { standard_id: '', device: '', status: '' },
      standardOptions: [],
      tableData: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      selectedRecords: [],
      detailDialog: { visible: false, record: null, diffHtml: '' },
      newIssueDialog: { visible: false, loading: false },
      newIssueForm: { standard_id: '', device_ip: '', remark: '' },
      newIssueRules: {
        standard_id: [{ required: true, message: '请选择标准规则', trigger: 'change' }],
        device_ip: [{ required: true, message: '请输入设备IP', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadStandardOptions()
    this.loadData()
  },
  methods: {
    loadStandardOptions() {
      aclApi.getStandardsList({}).then(res => { this.standardOptions = res.data.data || [] })
    },
    loadData() {
      const params = { ...this.filterForm }
      aclApi.getIssueRecordsList(params).then(res => {
        const list = res.data.data || []
        this.total = list.length
        const start = (this.currentPage - 1) * this.pageSize
        this.tableData = list.slice(start, start + this.pageSize)
      })
    },
    handleSearch() { this.currentPage = 1; this.loadData() },
    handleReset() { this.filterForm = { standard_id: '', device: '', status: '' }; this.currentPage = 1; this.loadData() },
    handleSelectionChange(val) { this.selectedRecords = val },
    checkSelectable(row) { return row.status === 'pending' },
    handleViewDetail(row) { this.detailDialog.record = row; this.detailDialog.diffHtml = ''; this.detailDialog.visible = true },
    loadDiff(record) {
      aclApi.compareTextDiff({ standard_id: record.standard_id, device_ip: record.device_ip }).then(res => {
        this.detailDialog.diffHtml = res.data.data.diff_html
      })
    },
    handleStatusChange(row, status) {
      aclApi.updateIssueStatus({ id: row.id, status }).then(() => { row.status = status; this.$message.success('状态已更新') })
    },
    handleDelete(row) {
      this.$confirm('确定删除该处理记录？', '提示', { type: 'warning' }).then(() => {
        aclApi.deleteIssueRecord({ id: row.id }).then(() => { this.$message.success('删除成功'); this.loadData() })
      }).catch(() => {})
    },
    handleBatchCreateTickets() {
      aclApi.batchCreateIssueRecords({ issue_ids: this.selectedRecords.map(r => r.id) }).then(res => {
        this.$message.success(`已为 ${res.data.data.created} 条记录创建工单`); this.loadData()
      })
    },
    handleCreateTicketSingle(record) {
      aclApi.createChangeOrder({ standard_id: record.standard_id, device_ip: record.device_ip }).then(res => {
        this.$message.success(res.data.data.message)
        record.change_ticket_id = res.data.data.order_id
        this.detailDialog.visible = false
        this.loadData()
      })
    },
    handleCreateRecord() { this.newIssueForm = { standard_id: '', device_ip: '', remark: '' }; this.newIssueDialog.visible = true },
    submitNewIssue() {
      this.$refs.newIssueFormRef.validate(valid => {
        if (!valid) return
        this.newIssueDialog.loading = true
        aclApi.createNewIssue(this.newIssueForm).then(() => {
          this.$message.success('处理记录已创建'); this.newIssueDialog.visible = false; this.loadData()
        }).finally(() => { this.newIssueDialog.loading = false })
      })
    },
    issueTypeLabel(t) { return { drifted: '配置漂移', missing: '缺少配置', dangling: '悬空引用' }[t] || t },
    issueTypeTag(t) { return { drifted: 'warning', missing: 'danger', dangling: 'info' }[t] || '' },
    statusLabel(s) { return { pending: '待处理', processing: '处理中', completed: '已完成', ignored: '已忽略' }[s] || s },
    statusTag(s) { return { pending: 'warning', processing: 'primary', completed: 'success', ignored: 'info' }[s] || '' },
    formatTime(ts) {
      if (!ts) return '-'
      const d = new Date(Number(ts) * 1000)
      return d.toLocaleString('zh-CN', { hour12: false })
    },
    formatAddrSpec(spec) {
      if (!spec) return '-'
      if (spec.type === 'any') return 'any'
      if (spec.type === 'addrgroup') return `group:${spec.name}`
      return spec.address || '-'
    },
    formatPortSpec(spec) {
      if (!spec) return 'any'
      if (spec.type === 'portgroup') return `group:${spec.name}`
      if (spec.type === 'direct') return `${spec.op} ${spec.ports.join('-')}`
      return '-'
    }
  }
}
</script>

<style scoped>
.filter-bar { margin-bottom: 8px; }
.device-ip { font-family: monospace; }
.ticket-link { font-family: monospace; color: #409EFF; }
.diff-container { font-size: 12px; overflow-x: auto; }
.diff-container table { border-collapse: collapse; width: 100%; }
</style>
