<template>
  <div class="acl-records-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="ACL名称">
          <el-input v-model="filterForm.acl_name" placeholder="输入ACL名称" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="filterForm.device" placeholder="IP或设备名" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="厂商">
          <el-select v-model="filterForm.vendor" placeholder="请选择" clearable style="width: 150px;">
            <el-option label="Cisco NX-OS" value="cisco_nx"></el-option>
            <el-option label="Cisco IOS" value="cisco_ios"></el-option>
            <el-option label="Cisco IOS-XR" value="cisco_xr"></el-option>
            <el-option label="H3C" value="h3c"></el-option>
            <el-option label="Huawei" value="huawei"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="地址族">
          <el-select v-model="filterForm.acl_type" placeholder="全部" clearable style="width: 100px;">
            <el-option label="IPv4" value="ipv4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分组方式">
          <el-radio-group v-model="groupMode" @change="handleGroupModeChange">
            <el-radio-button label="fingerprint">按指纹分组</el-radio-button>
            <el-radio-button label="device">按设备展示</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="groupMode === 'fingerprint'" class="fingerprint-group-view">
      <el-collapse v-model="activeFingerprints" accordion>
        <el-collapse-item v-for="group in fingerprintGroups" :key="group.fingerprint" :name="group.fingerprint">
          <template slot="title">
            <div class="collapse-title">
              <div class="title-left">
                <el-tag type="primary" size="medium">{{ group.acl_name }}</el-tag>
                <el-tag type="primary" size="mini" effect="plain">{{ group.acl_type }}</el-tag>
                <span class="fingerprint-short">指纹: {{ group.fingerprint.substring(0, 16) }}...</span>
              </div>
              <div class="title-right">
                <el-tag type="success" size="mini" effect="plain">{{ group.device_count }} 台设备</el-tag>
                <el-tag type="info" size="mini" effect="plain">{{ group.entry_count }} 条规则</el-tag>
                <el-button type="text" size="mini" icon="el-icon-view" @click.stop="handleViewConfig(group)">查看配置</el-button>
              </div>
            </div>
          </template>
          <el-table :data="group.records" border size="small" style="width:100%;">
            <el-table-column prop="device_ip" label="设备IP" width="140"><template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template></el-table-column>
            <el-table-column prop="device_name" label="设备名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
            <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
            <el-table-column label="操作" width="100" align="center"><template slot-scope="scope"><el-button type="text" size="mini" @click="handleViewDetail(scope.row)">查看详情</el-button></template></el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination background layout="total, prev, pager, next" :total="fingerprintTotal" :page-size="pageSize" :current-page.sync="currentPage" @current-change="loadData"></el-pagination>
      </div>
    </div>

    <div v-else class="device-flat-view">
      <el-table :data="flatRecords" border stripe style="width:100%;">
        <el-table-column prop="device_ip" label="设备IP" width="140"><template slot-scope="scope"><span class="device-ip">{{ scope.row.device_ip }}</span></template></el-table-column>
        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />
        <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
        <el-table-column prop="acl_name" label="ACL名称" width="180"><template slot-scope="scope"><el-tag>{{ scope.row.acl_name }}</el-tag></template></el-table-column>
        <el-table-column prop="acl_type" label="地址族" width="80" align="center"><template slot-scope="scope"><el-tag type="primary" size="mini">{{ scope.row.acl_type }}</el-tag></template></el-table-column>
        <el-table-column prop="rule_count" label="条目数" width="80" align="center" />
        <el-table-column prop="fingerprint" label="指纹(前16位)" width="160"><template slot-scope="scope"><span class="fingerprint-text">{{ scope.row.fingerprint.substring(0,16) }}</span></template></el-table-column>
        <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleViewDetail(scope.row)">查看详情</el-button>
            <el-button type="text" size="mini" @click="handleViewDeviceConfig(scope.row)">查看配置</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:16px;text-align:right;">
        <el-pagination background layout="total, prev, pager, next" :total="flatTotal" :page-size="pageSize" :current-page.sync="currentPage" @current-change="loadData"></el-pagination>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog title="ACL配置详情" :visible.sync="detailDialog.visible" width="860px">
      <el-descriptions :column="3" border size="small" style="margin-bottom:16px;" v-if="detailDialog.record">
        <el-descriptions-item label="设备IP">{{ detailDialog.record.device_ip }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ detailDialog.record.device_name }}</el-descriptions-item>
        <el-descriptions-item label="厂商">{{ detailDialog.record.vendor }}</el-descriptions-item>
        <el-descriptions-item label="ACL名称">{{ detailDialog.record.acl_name }}</el-descriptions-item>
        <el-descriptions-item label="地址族">{{ detailDialog.record.acl_type }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detailDialog.record.acl_kind }}</el-descriptions-item>
        <el-descriptions-item label="条目数量">{{ detailDialog.record.rule_count }}</el-descriptions-item>
        <el-descriptions-item label="采集时间">{{ formatTime(detailDialog.record.collected_at) }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailDialog.record" :data="detailDialog.record.entries" border size="small" style="width:100%;">
        <el-table-column prop="seq" label="Seq" width="70" align="center" />
        <el-table-column prop="action" label="动作" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.action==='deny'?'danger':'success'" size="mini">{{ scope.row.action }}</el-tag></template></el-table-column>
        <el-table-column prop="protocol" label="协议" width="80" align="center" />
        <el-table-column label="源地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.src) }}</template></el-table-column>
        <el-table-column label="目的地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.dst) }}</template></el-table-column>
        <el-table-column label="目的端口" width="130"><template slot-scope="scope">{{ formatPortSpec(scope.row.dst_port) }}</template></el-table-column>
        <el-table-column label="选项" width="100"><template slot-scope="scope">{{ scope.row.options && scope.row.options.log ? 'log' : '' }}</template></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button type="primary" size="small" @click="createStandardFromConfig">创建为标准规则</el-button>
        <el-button @click="detailDialog.visible=false" size="small">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 配置详情对话框（按指纹分组维度查看） -->
    <el-dialog title="配置详情" :visible.sync="configDialog.visible" width="900px">
      <div v-if="configDialog.config" class="config-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="ACL名称"><el-tag>{{ configDialog.config.name }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="条目数量"><el-tag type="info">{{ (configDialog.config.entries || []).length }} 条</el-tag></el-descriptions-item>
          <el-descriptions-item label="地址族"><el-tag type="primary" size="mini">{{ configDialog.config.acl_type }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="关联设备数量"><el-tag type="success">{{ configDialog.config.device_count }} 台</el-tag></el-descriptions-item>
          <el-descriptions-item label="配置指纹" :span="2">
            <div style="display:flex;align-items:center;">
              <span class="fingerprint-text" style="flex:1;font-size:12px;">{{ configDialog.config.fingerprint }}</span>
              <el-button size="mini" icon="el-icon-document-copy" @click="copyFingerprint(configDialog.config.fingerprint)">复制</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="configDialog.config.device_ip" label="设备信息" :span="2">
            <div>
              <div>IP: <span class="device-ip">{{ configDialog.config.device_ip }}</span></div>
              <div>名称: {{ configDialog.config.device_name }}</div>
              <div>厂商: <el-tag type="info" size="mini" effect="plain">{{ configDialog.config.device_vendor }}</el-tag></div>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">配置条目</el-divider>
        <el-table :data="configDialog.config.entries" border size="small" max-height="400" style="width:100%;">
          <el-table-column prop="seq" label="Seq" width="70" align="center" />
          <el-table-column prop="action" label="动作" width="80" align="center"><template slot-scope="scope"><el-tag :type="scope.row.action==='deny'?'danger':'success'" size="mini">{{ scope.row.action }}</el-tag></template></el-table-column>
          <el-table-column prop="protocol" label="协议" width="80" align="center" />
          <el-table-column label="源地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.src) }}</template></el-table-column>
          <el-table-column label="目的地址" min-width="150"><template slot-scope="scope">{{ formatAddrSpec(scope.row.dst) }}</template></el-table-column>
          <el-table-column label="目的端口" width="130"><template slot-scope="scope">{{ formatPortSpec(scope.row.dst_port) }}</template></el-table-column>
          <el-table-column label="选项" width="100"><template slot-scope="scope">{{ scope.row.options && scope.row.options.log ? 'log' : '' }}</template></el-table-column>
        </el-table>

        <template v-if="configDialog.config.devices && configDialog.config.devices.length > 0">
          <el-divider content-position="left">关联设备</el-divider>
          <el-table :data="configDialog.config.devices" border size="small" max-height="300" style="width:100%;">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="device_ip" label="设备IP" width="150" />
            <el-table-column prop="device_name" label="设备名称" min-width="200" />
            <el-table-column prop="vendor" label="厂商" width="120" align="center"><template slot-scope="scope"><el-tag type="info" size="mini" effect="plain">{{ scope.row.vendor }}</el-tag></template></el-table-column>
            <el-table-column prop="collected_at" label="采集时间" width="160" align="center"><template slot-scope="scope">{{ formatTime(scope.row.collected_at) }}</template></el-table-column>
          </el-table>
        </template>
      </div>

      <span slot="footer">
        <el-button type="primary" size="small" @click="createStandardFromConfig">创建为标准规则</el-button>
        <el-button size="small" @click="configDialog.visible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'

export default {
  name: 'AclLog',
  data() {
    return {
      filterForm: { acl_name: '', device: '', vendor: '', acl_type: '' },
      groupMode: 'fingerprint',
      fingerprintGroups: [],
      fingerprintTotal: 0,
      flatRecords: [],
      flatTotal: 0,
      currentPage: 1,
      pageSize: 20,
      activeFingerprints: '',
      detailDialog: { visible: false, record: null },
      configDialog: { visible: false, config: null }
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    loadData() {
      const params = { ...this.filterForm }
      aclApi.getRecordsList(params).then(res => {
        const list = res.data.data || []
        this.flatTotal = list.length
        const start = (this.currentPage - 1) * this.pageSize
        this.flatRecords = list.slice(start, start + this.pageSize)
        this.buildFingerprintGroups(list)
      })
    },
    buildFingerprintGroups(list) {
      const map = {}
      list.forEach(r => {
        if (!map[r.fingerprint]) {
          map[r.fingerprint] = { fingerprint: r.fingerprint, acl_name: r.acl_name, acl_type: r.acl_type, records: [], device_count: 0, entry_count: r.rule_count }
        }
        map[r.fingerprint].records.push(r)
        map[r.fingerprint].device_count++
      })
      this.fingerprintGroups = Object.values(map)
      this.fingerprintTotal = this.fingerprintGroups.length
    },
    handleGroupModeChange() { this.currentPage = 1; this.loadData() },
    handleSearch() { this.currentPage = 1; this.loadData() },
    handleReset() { this.filterForm = { acl_name: '', device: '', vendor: '', acl_type: '' }; this.currentPage = 1; this.loadData() },

    // 按指纹分组维度查看配置
    handleViewConfig(group) {
      const first = group.records[0] || {}
      this.configDialog.config = {
        name: group.acl_name,
        acl_number: first.acl_number || null,
        acl_kind: first.acl_kind,
        acl_type: group.acl_type,
        fingerprint: group.fingerprint,
        device_count: group.device_count,
        entries: first.entries || [],
        devices: group.records
      }
      this.configDialog.visible = true
    },

    // 单台设备维度查看配置
    handleViewDeviceConfig(row) {
      this.configDialog.config = {
        name: row.acl_name,
        acl_number: row.acl_number || null,
        acl_kind: row.acl_kind,
        acl_type: row.acl_type,
        fingerprint: row.fingerprint,
        device_ip: row.device_ip,
        device_name: row.device_name,
        device_vendor: row.vendor,
        entries: row.entries || []
      }
      this.configDialog.visible = true
    },

    copyFingerprint(fingerprint) {
      const input = document.createElement('input')
      input.value = fingerprint
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('指纹已复制到剪贴板')
    },

    handleViewDetail(row) { this.detailDialog.record = row; this.detailDialog.visible = true },
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
    },

    // ==================== 创建标准规则 ====================

    createStandardFromConfig() {
      // 配置详情弹窗优先，其次是从单条记录详情打开的场景
      const config = this.configDialog.config
      const record = this.detailDialog.record
      const source = (config && config.name) ? config : record
      if (!source || !source.name) {
        this.$message.error('配置信息不完整')
        return
      }

      this.$prompt('请输入标准规则的描述信息', '创建标准规则', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请描述该规则的用途和应用场景'
      }).then(({ value }) => {
        const params = {
          name: source.name,
          acl_number: source.acl_number || null,
          acl_type: source.acl_type,
          acl_kind: source.acl_kind === 'basic' ? 'basic' : 'advanced',
          entries: source.entries || [],
          description: value || ''
        }

        aclApi.createStandard(params).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('标准规则创建成功')
            this.configDialog.visible = false
            this.detailDialog.visible = false
          } else {
            this.$message.error(res.message || '创建失败')
          }
        }).catch(error => {
          console.error('创建标准规则失败:', error)
          this.$message.error('创建失败，请重试')
        })
      }).catch(() => {
        // 用户取消输入
      })
    }
  }
}
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.collapse-title { display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 16px; }
.title-left { display: flex; align-items: center; gap: 8px; }
.title-right { display: flex; align-items: center; gap: 8px; }
.fingerprint-short { font-family: monospace; font-size: 12px; color: #909399; }
.device-ip { font-family: monospace; }
.fingerprint-text { font-family: monospace; font-size: 12px; color: #606266; }
.diff-container { font-size: 12px; overflow-x: auto; }
.diff-container table { border-collapse: collapse; width: 100%; }
</style>
