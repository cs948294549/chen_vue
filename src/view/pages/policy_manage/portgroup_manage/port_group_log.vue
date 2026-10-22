<template>
  <div class="port-group-records-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="端口簿名称">
          <el-input
            v-model="filterForm.group_name"
            placeholder="输入端口簿名称"
            clearable
            style="width: 180px;">
          </el-input>
        </el-form-item>

        <el-form-item label="设备">
          <el-input
            v-model="filterForm.device"
            placeholder="IP或设备名"
            clearable
            style="width: 180px;">
          </el-input>
        </el-form-item>

        <el-form-item label="配置指纹">
          <el-input
            v-model="filterForm.fingerprint"
            placeholder="输入完整指纹"
            clearable
            style="width: 200px;">
          </el-input>
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
          <el-button size="small" icon="el-icon-refresh-right" @click="handleRefresh">刷新数据</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 按指纹分组视图 -->
    <div v-if="groupMode === 'fingerprint'" class="fingerprint-group-view">
      <el-collapse v-model="activeFingerprints" accordion>
        <el-collapse-item
          v-for="group in pagedFingerprintGroups"
          :key="group.fingerprint"
          :name="group.fingerprint">

          <template slot="title">
            <div class="collapse-title">
              <div class="title-left">
                <el-tag type="primary" size="medium">{{ group.group_name }}</el-tag>
                <el-tag type="primary" size="mini" effect="plain">{{ group.acl_type }}</el-tag>
                <span class="fingerprint-short">
                  指纹: {{ (group.fingerprint || '').substring(0, 16) }}...
                </span>
              </div>
              <div class="title-right">
                <el-tag type="success" size="mini" effect="plain">{{ group.device_count }} 台设备</el-tag>
                <el-tag type="info" size="mini" effect="plain">{{ group.entry_count }} 条条目</el-tag>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-view"
                  @click.stop="handleViewConfig(group)">
                  查看配置
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="group.hosts" border size="small" style="width: 100%;">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="device_ip" label="设备IP" width="150">
              <template slot-scope="scope">
                <span class="device-ip">{{ scope.row.device_ip }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="device_name" label="设备名称" min-width="200" />
            <el-table-column prop="vendor" label="厂商" width="120">
              <template slot-scope="scope">
                <el-tag :type="getVendorTagType(scope.row.vendor)" size="mini">{{ scope.row.vendor }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="collected_at" label="采集时间" width="160">
              <template slot-scope="scope">
                {{ formatTime(scope.row.collected_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-view" @click="handleViewDeviceConfig(scope.row, group)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <el-empty v-if="fingerprintTotal === 0" description="暂无数据"></el-empty>

      <el-pagination
        v-if="fingerprintTotal > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="fingerprintTotal"
        style="margin-top: 20px; text-align: right;">
      </el-pagination>
    </div>

    <!-- 按设备展示视图 -->
    <div v-if="groupMode === 'device'" class="device-list-view">
      <el-table :data="filteredDeviceRecords" border stripe style="width: 100%">
        <el-table-column prop="device_ip" label="设备IP" width="150" fixed>
          <template slot-scope="scope">
            <span class="device-ip">{{ scope.row.device_ip }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />

        <el-table-column prop="group_name" label="端口簿名称" width="180">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.group_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="acl_type" label="地址族" width="90" align="center">
          <template slot-scope="scope">
            <el-tag type="primary" size="mini">{{ scope.row.acl_type }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="vendor" label="厂商" width="120">
          <template slot-scope="scope">
            <el-tag :type="getVendorTagType(scope.row.vendor)" size="small">{{ scope.row.vendor }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fingerprint" label="配置指纹" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="fingerprint-text">{{ (scope.row.fingerprint || '').substring(0, 16) }}...</span>
          </template>
        </el-table-column>

        <el-table-column label="条目数量" width="100" align="center">
          <template slot-scope="scope">
            <el-tag type="info" size="small">{{ entryList(scope.row).length }} 条</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="collected_at" label="采集时间" width="160" sortable>
          <template slot-scope="scope">
            {{ formatTime(scope.row.collected_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button size="mini" type="text" icon="el-icon-view" @click="handleViewDeviceConfigFromList(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="deviceRecords.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredDeviceTotal"
        style="margin-top: 20px; text-align: right;">
      </el-pagination>
    </div>

    <!-- 配置详情对话框 -->
    <el-dialog title="配置详情" :visible.sync="configDialogVisible" width="900px">
      <div v-if="currentConfig" class="config-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="端口簿名称">
            <el-tag>{{ currentConfig.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="条目数量">
            <el-tag type="info">{{ entryList(currentConfig).length }} 条</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="地址族">
            <el-tag type="primary" size="mini">{{ currentConfig.acl_type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentConfig.device_count" label="关联设备数量">
            <el-tag type="success">{{ currentConfig.device_count }} 台</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="配置指纹" :span="2">
            <div style="display: flex; align-items: center;">
              <span class="fingerprint-text" style="flex: 1; font-size: 12px;">
                {{ currentConfig.fingerprint }}
              </span>
              <el-button size="mini" icon="el-icon-document-copy" @click="copyFingerprint(currentConfig.fingerprint)">复制</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentConfig.device_ip" label="设备信息" :span="2">
            <div>
              <div>IP: <span class="device-ip">{{ currentConfig.device_ip }}</span></div>
              <div>名称: {{ currentConfig.device_name }}</div>
              <div>
                厂商:
                <el-tag :type="getVendorTagType(currentConfig.device_vendor)" size="mini">
                  {{ currentConfig.device_vendor }}
                </el-tag>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">端口条目</el-divider>

        <el-table :data="entryList(currentConfig)" border size="small" max-height="400">
          <el-table-column type="index" label="序号" width="70" align="center" />
          <el-table-column label="运算符" width="110" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" effect="plain">{{ scope.row.op || '-' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="端口 / 引用" min-width="240">
            <template slot-scope="scope">
              <code class="mono">{{ entryText(scope.row) }}</code>
            </template>
          </el-table-column>
        </el-table>

        <template v-if="currentConfig.hosts && currentConfig.hosts.length > 0">
          <el-divider content-position="left">关联设备</el-divider>
          <el-table :data="currentConfig.hosts" border size="small" max-height="300">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="device_ip" label="设备IP" width="150" />
            <el-table-column prop="device_name" label="设备名称" min-width="200" />
            <el-table-column prop="collected_at" label="采集时间" width="160">
              <template slot-scope="scope">
                {{ formatTime(scope.row.collected_at) }}
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="createStandardFromConfig">创建为标准规则</el-button>
        <el-button size="small" @click="configDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import aclApi from '@/api/mapis/acl_interface'

export default {
  name: 'PortGroupRecords',

  data() {
    return {
      filterForm: {
        group_name: '',
        device: '',
        fingerprint: ''
      },

      groupMode: 'fingerprint',

      fingerprintGroups: [],
      pagedFingerprintGroups: [],
      fingerprintTotal: 0,
      activeFingerprints: [],

      deviceRecords: [],
      currentPage: 1,
      pageSize: 20,

      configDialogVisible: false,
      currentConfig: null
    }
  },

  computed: {
    // 记录表只支持 group_name / device_ip / fingerprint 精确过滤，
    // 没有传到后端的关键字在这里做本地模糊匹配
    deviceMatchedRecords() {
      let data = this.deviceRecords

      if (this.filterForm.group_name) {
        const keyword = this.filterForm.group_name.toLowerCase()
        data = data.filter(item => (item.group_name || '').toLowerCase().includes(keyword))
      }

      if (this.filterForm.device) {
        const keyword = this.filterForm.device.toLowerCase()
        data = data.filter(item =>
          (item.device_ip || '').includes(this.filterForm.device) ||
          (item.device_name || '').toLowerCase().includes(keyword)
        )
      }

      return data
    },

    filteredDeviceRecords() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.deviceMatchedRecords.slice(start, start + this.pageSize)
    },

    filteredDeviceTotal() {
      return this.deviceMatchedRecords.length
    },

    // 指纹视图：名称作用于分组，设备关键字作用于组内主机
    filteredFingerprintGroups() {
      let groups = this.fingerprintGroups

      if (this.filterForm.group_name) {
        const keyword = this.filterForm.group_name.toLowerCase()
        groups = groups.filter(group => (group.group_name || '').toLowerCase().includes(keyword))
      }

      if (this.filterForm.device) {
        const keyword = this.filterForm.device.toLowerCase()
        groups = groups.map(group => {
          const hosts = group.hosts.filter(host =>
            (host.device_ip || '').includes(this.filterForm.device) ||
            (host.device_name || '').toLowerCase().includes(keyword)
          )
          return { ...group, hosts, device_count: hosts.length }
        }).filter(group => group.hosts.length > 0)
      }

      return groups
    }
  },

  watch: {
    // 筛选结果变化后重算分页，页码越界时回到第一页
    filteredFingerprintGroups(val) {
      const maxPage = Math.max(1, Math.ceil(val.length / this.pageSize))
      if (this.currentPage > maxPage) {
        this.currentPage = 1
      }
      this.applyPagination()
    }
  },

  mounted() {
    this.loadData()
  },

  methods: {
    // ==================== 工具方法 ====================

    // 记录表里 entries 是裸数组，兼容包了一层的情况
    entryList(row) {
      if (!row || !row.entries) return []
      return Array.isArray(row.entries) ? row.entries : (row.entries.entries || [])
    },

    // 端口值可能是 int（数字端口）或 string（服务名别名）
    portsText(ports) {
      if (!Array.isArray(ports) || ports.length === 0) return '-'
      return ports.map(p => (p === null || p === undefined ? '' : String(p))).join(', ')
    },

    // 记录表条目是采集解析出的原始形态 {seq, op, ports, description}，没有 type/ref
    entryText(entry) {
      if (!entry) return '-'
      return this.portsText(entry.ports)
    },

    // 记录表不存 acl_type，端口簿固定作用于 IP 规则，指纹里带了但它不在列上
    inferAclType(entries) {
      return 'ipv4'
    },

    getVendorTagType(vendor) {
      const typeMap = {
        'cisco_nx': 'primary',
        'cisco_ios': 'success',
        'cisco_xr': 'warning',
        'h3c': 'info',
        'huawei': 'danger'
      }
      return typeMap[vendor] || ''
    },

    formatTime(timestamp) {
      if (!timestamp) return '-'
      const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
      const date = new Date(Number(time))
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },

    copyFingerprint(fingerprint) {
      const input = document.createElement('input')
      input.value = fingerprint || ''
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('指纹已复制到剪贴板')
    },

    isIpLike(value) {
      return !!value && /^[\d.:a-fA-F]+$/.test(value)
    },

    // ==================== 数据加载 ====================

    loadData() {
      const params = {
        group_name: this.filterForm.group_name || undefined,
        device_ip: this.isIpLike(this.filterForm.device) ? this.filterForm.device : undefined,
        fingerprint: this.filterForm.fingerprint || undefined
      }

      aclApi.getPortGroupRecordsList(params).then(response => {
        const res = response.data
        if (res.code === 0) {
          const records = res.data || []

          this.deviceRecords = records.map(record => ({
            device_ip: record.device_ip,
            device_name: record.device_name,
            vendor: record.vendor,
            group_name: record.group_name,
            fingerprint: record.fingerprint,
            acl_type: this.inferAclType(record.entries),
            entries: this.entryList(record),
            collected_at: record.collected_at
          }))

          this.buildFingerprintGroups(records)
          this.applyPagination()
        } else {
          this.$message.error(res.message || '加载数据失败')
        }
      }).catch(error => {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败')
      })
    },

    // 全量记录聚合为分组，分页在 applyPagination 中按分组维度切片
    buildFingerprintGroups(records) {
      const fingerprintMap = {}
      records.forEach(record => {
        const fp = record.fingerprint || `unknown-${record.device_ip}-${record.group_name}`
        if (!fingerprintMap[fp]) {
          fingerprintMap[fp] = {
            group_name: record.group_name,
            fingerprint: fp,
            acl_type: this.inferAclType(record.entries),
            entries: this.entryList(record),
            hosts: []
          }
        }
        fingerprintMap[fp].hosts.push({
          device_ip: record.device_ip,
          device_name: record.device_name,
          vendor: record.vendor,
          collected_at: record.collected_at
        })
      })

      this.fingerprintGroups = Object.values(fingerprintMap).map(group => ({
        ...group,
        device_count: group.hosts.length,
        entry_count: group.entries.length
      }))
    },

    applyPagination() {
      const groups = this.filteredFingerprintGroups
      this.fingerprintTotal = groups.length
      const start = (this.currentPage - 1) * this.pageSize
      const pageGroups = groups.slice(start, start + this.pageSize)
      if (this.activeFingerprints && !pageGroups.some(g => g.fingerprint === this.activeFingerprints)) {
        this.activeFingerprints = ''
      }
      this.pagedFingerprintGroups = pageGroups
    },

    // ==================== 操作方法 ====================

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filterForm = { group_name: '', device: '', fingerprint: '' }
      this.currentPage = 1
      this.loadData()
    },

    handleRefresh() {
      this.$message.info('正在刷新数据...')
      this.loadData()
    },

    handleGroupModeChange() {
      this.currentPage = 1
      this.applyPagination()
    },

    handleViewConfig(group) {
      this.currentConfig = {
        name: group.group_name,
        acl_type: group.acl_type,
        fingerprint: group.fingerprint,
        device_count: group.device_count,
        entries: group.entries,
        hosts: group.hosts
      }
      this.configDialogVisible = true
    },

    handleViewDeviceConfig(host, group) {
      this.currentConfig = {
        name: group.group_name,
        acl_type: group.acl_type,
        fingerprint: group.fingerprint,
        device_ip: host.device_ip,
        device_name: host.device_name,
        device_vendor: host.vendor,
        entries: group.entries,
        collected_at: host.collected_at
      }
      this.configDialogVisible = true
    },

    handleViewDeviceConfigFromList(row) {
      this.currentConfig = {
        name: row.group_name,
        acl_type: row.acl_type,
        fingerprint: row.fingerprint,
        device_ip: row.device_ip,
        device_name: row.device_name,
        device_vendor: row.vendor,
        entries: row.entries,
        collected_at: row.collected_at
      }
      this.configDialogVisible = true
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.applyPagination()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.applyPagination()
    },

    // ==================== 创建标准规则 ====================

    createStandardFromConfig() {
      if (!this.currentConfig || !this.currentConfig.name) {
        this.$message.error('配置信息不完整')
        return
      }

      this.$prompt('请输入标准规则的描述信息', '创建标准规则', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请描述该规则的用途和应用场景'
      }).then(({ value }) => {
        // 标准规则条目与设备记录条目同构 {seq, op, ports, description}，原样提交即可
        const rawEntries = this.entryList(this.currentConfig)
        const entries = rawEntries

        aclApi.createPortGroup({
          name: this.currentConfig.name,
          acl_type: this.currentConfig.acl_type || 'ipv4',
          entries: entries,
          description: value || '',
          is_active: 1
        }).then(response => {
          const res = response.data
          if (res.code === 0) {
            this.$message.success('标准规则创建成功')
            this.configDialogVisible = false
          } else {
            this.$message.error(res.message || '创建失败')
          }
        }).catch(error => {
          console.error('创建标准规则失败:', error)
          this.$message.error('创建失败，请重试')
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.port-group-records-page {
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 100px);
}

.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fingerprint-short {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}

.device-ip {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #409EFF;
}

.fingerprint-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
}

.mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.config-detail {
  max-height: 600px;
  overflow-y: auto;
}
</style>
