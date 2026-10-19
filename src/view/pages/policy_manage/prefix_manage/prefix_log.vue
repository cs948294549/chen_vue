<template>
  <div class="prefix-list-records-page">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="前缀名称">
          <el-input
            v-model="filterForm.pl_name"
            placeholder="输入前缀列表名称"
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

        <el-form-item label="厂商类型">
          <el-select
            v-model="filterForm.vendor_type"
            placeholder="请选择"
            clearable
            style="width: 150px;">
            <el-option label="Cisco NX-OS" value="cisco_nx"></el-option>
            <el-option label="Cisco IOS" value="cisco_ios"></el-option>
            <el-option label="Cisco IOS-XR" value="cisco_xr"></el-option>
            <el-option label="H3C" value="h3c"></el-option>
            <el-option label="Huawei" value="huawei"></el-option>
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
          <el-button size="small" icon="el-icon-refresh-right" @click="handleRefresh">刷新数据</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 按指纹分组视图 -->
    <div v-if="groupMode === 'fingerprint'" class="fingerprint-group-view">
      <el-collapse v-model="activeFingerprints" accordion>
        <el-collapse-item
          v-for="(group, index) in fingerprintGroups"
          :key="group.fingerprint"
          :name="group.fingerprint">

          <template slot="title">
            <div class="collapse-title">
              <div class="title-left">
                <el-tag type="primary" size="medium">{{ group.pl_name }}</el-tag>
                <span class="fingerprint-short">
                  指纹: {{ group.fingerprint.substring(0, 16) }}...
                </span>
              </div>
              <div class="title-right">
                <el-tag type="success" size="mini" effect="plain">{{ group.device_count }} 台设备</el-tag>
                <el-tag type="info" size="mini" effect="plain">{{ group.entry_count }} 条配置</el-tag>
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

          <!-- 设备列表 -->
          <el-table
            :data="group.hosts"
            border
            size="small"
            style="width: 100%;">

            <el-table-column type="index" label="#" width="50" align="center" />

            <el-table-column prop="device_ip" label="设备IP" width="150">
              <template slot-scope="scope">
                <span class="device-ip">{{ scope.row.device_ip }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="device_name" label="设备名称" min-width="200" />

            <el-table-column prop="vendor_type" label="厂商类型" width="120">
              <template slot-scope="scope">
                <el-tag :type="getVendorTagType(scope.row.vendor_type)" size="mini">
                  {{ scope.row.vendor_type }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="collected_at" label="采集时间" width="160">
              <template slot-scope="scope">
                {{ formatTime(scope.row.collected_at) }}
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" align="center">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-view"
                  @click="handleViewDeviceConfig(scope.row, group)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>

      <el-empty v-if="fingerprintGroups.length === 0" description="暂无数据"></el-empty>
    </div>

    <!-- 按设备展示视图 -->
    <div v-if="groupMode === 'device'" class="device-list-view">
      <el-table
        :data="filteredDeviceRecords"
        border
        stripe
        style="width: 100%">

        <el-table-column prop="device_ip" label="设备IP" width="150" fixed>
          <template slot-scope="scope">
            <span class="device-ip">{{ scope.row.device_ip }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="device_name" label="设备名称" width="200" show-overflow-tooltip />

        <el-table-column prop="pl_name" label="前缀列表名称" width="150">
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.pl_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fingerprint" label="配置指纹" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="fingerprint-text">{{ scope.row.fingerprint.substring(0, 16) }}...</span>
          </template>
        </el-table-column>

        <el-table-column prop="vendor_type" label="厂商类型" width="120">
          <template slot-scope="scope">
            <el-tag :type="getVendorTagType(scope.row.vendor_type)" size="small">
              {{ scope.row.vendor_type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="entry_count" label="条目数量" width="100" align="center">
          <template slot-scope="scope">
            <el-tag type="info" size="small">
              {{ scope.row.entries.entries.length }} 条
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="collected_at" label="采集时间" width="160" sortable>
          <template slot-scope="scope">
            {{ formatTime(scope.row.collected_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleViewDeviceConfigFromList(scope.row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="deviceRecords.length > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="deviceRecords.length"
        style="margin-top: 20px; text-align: right;">
      </el-pagination>
    </div>

    <!-- 配置详情对话框 -->
    <el-dialog
      title="配置详情"
      :visible.sync="configDialogVisible"
      width="900px">

      <div v-if="currentConfig" class="config-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="前缀列表名称">
            <el-tag>{{ currentConfig.name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="条目数量">
            <el-tag type="info">{{ currentConfig.entries.length }} 条</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="配置指纹" :span="2">
            <div style="display: flex; align-items: center;">
              <span class="fingerprint-text" style="flex: 1; font-size: 12px;">
                {{ currentConfig.fingerprint }}
              </span>
              <el-button
                size="mini"
                icon="el-icon-document-copy"
                @click="copyFingerprint(currentConfig.fingerprint)">
                复制
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentConfig.device_count" label="关联设备数量">
            <el-tag type="success">{{ currentConfig.device_count }} 台</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentConfig.device_ip" label="设备信息">
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

        <el-divider content-position="left">配置条目</el-divider>

        <el-table
          :data="currentConfig.entries"
          border
          size="small"
          max-height="400">

          <el-table-column prop="seq" label="序号" width="80" align="center" />

          <el-table-column prop="action" label="动作" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.action === 'permit' ? 'success' : 'danger'" size="mini">
                {{ scope.row.action }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="prefix" label="前缀" min-width="180" />

          <el-table-column prop="ge" label="GE" width="80" align="center">
            <template slot-scope="scope">
              {{ scope.row.ge || '-' }}
            </template>
          </el-table-column>

          <el-table-column prop="le" label="LE" width="80" align="center">
            <template slot-scope="scope">
              {{ scope.row.le || '-' }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 如果是分组视图，显示关联的设备列表 -->
        <template v-if="currentConfig.hosts && currentConfig.hosts.length > 0">
          <el-divider content-position="left">关联设备</el-divider>
          <el-table
            :data="currentConfig.hosts"
            border
            size="small"
            max-height="300">

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
import prefixListApi from '@/api/mapis/prefix_list_interface'

export default {
  name: 'PrefixListRecords',

  data() {
    return {
      // 筛选条件
      filterForm: {
        pl_name: '',
        device: '',
        vendor_type: ''
      },

      // 分组模式
      groupMode: 'fingerprint', // 'fingerprint' | 'device'

      // 按指纹分组数据
      fingerprintGroups: [],
      activeFingerprints: [],

      // 按设备展示数据
      deviceRecords: [],
      currentPage: 1,
      pageSize: 20,

      // 配置详情对话框
      configDialogVisible: false,
      currentConfig: null
    }
  },

  computed: {
    filteredDeviceRecords() {
      let data = this.deviceRecords

      if (this.filterForm.pl_name) {
        data = data.filter(item =>
          item.pl_name.toLowerCase().includes(this.filterForm.pl_name.toLowerCase())
        )
      }

      if (this.filterForm.device) {
        data = data.filter(item =>
          item.device_ip.includes(this.filterForm.device) ||
          item.device_name.toLowerCase().includes(this.filterForm.device.toLowerCase())
        )
      }

      if (this.filterForm.vendor_type) {
        data = data.filter(item => item.vendor_type === this.filterForm.vendor_type)
      }

      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return data.slice(start, end)
    }
  },

  mounted() {
    this.loadData()
  },

  methods: {
    // ==================== 工具方法 ====================

    formatTime(timestamp) {
      if (!timestamp) return '-'
      // 10位时间戳转换为毫秒
      const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
      const date = new Date(time)

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    // ==================== 数据加载 ====================

    loadData() {
      const params = {
        pl_name: this.filterForm.pl_name || undefined,
        device: this.filterForm.device || undefined,
        vendor: this.filterForm.vendor_type || undefined
      }

      prefixListApi.getRecordsList(params).then(response => {
        const res = response.data
        if (res.code === 0) {
          const records = res.data || []

          if (this.groupMode === 'fingerprint') {
            // 按指纹分组
            const fingerprintMap = {}
            records.forEach(record => {
              if (!fingerprintMap[record.fingerprint]) {
                fingerprintMap[record.fingerprint] = {
                  pl_name: record.pl_name,
                  fingerprint: record.fingerprint,
                  entries: record.entries,
                  hosts: []
                }
              }
              fingerprintMap[record.fingerprint].hosts.push({
                device_ip: record.device_ip,
                device_name: record.device_name,
                vendor_type: record.vendor,
                collected_at: record.collected_at
              })
            })

            this.fingerprintGroups = Object.values(fingerprintMap).map(group => ({
              ...group,
              device_count: group.hosts.length,
              entry_count: group.entries.length
            }))
          } else {
            // 按设备展示
            this.deviceRecords = records.map(record => ({
              device_ip: record.device_ip,
              device_name: record.device_name,
              vendor_type: record.vendor,
              pl_name: record.pl_name,
              fingerprint: record.fingerprint,
              entries: record.entries,
              collected_at: record.collected_at
            }))
          }
        } else {
          this.$message.error(res.message || '加载数据失败')
        }
      }).catch(error => {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败')
      })
    },

    // ==================== 操作方法 ====================

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filterForm = {
        pl_name: '',
        device: '',
        vendor_type: ''
      }
      this.currentPage = 1
      this.loadData()
    },

    handleRefresh() {
      this.$message.info('正在刷新数据...')
      this.loadData()
    },

    handleGroupModeChange() {
      this.currentPage = 1
    },

    handleViewConfig(group) {
      this.currentConfig = {
        name: group.pl_name,
        fingerprint: group.fingerprint,
        device_count: group.device_count,
        entries: group.entries,
        hosts: group.hosts
      }
      this.configDialogVisible = true
    },

    handleViewDeviceConfig(host, group) {
      this.currentConfig = {
        name: group.pl_name,
        fingerprint: group.fingerprint,
        device_ip: host.device_ip,
        device_name: host.device_name,
        device_vendor: host.vendor_type,
        entries: group.entries,
        collected_at: host.collected_at
      }
      this.configDialogVisible = true
    },

    handleViewDeviceConfigFromList(row) {
      this.currentConfig = {
        name: row.pl_name,
        fingerprint: row.fingerprint,
        device_ip: row.device_ip,
        device_name: row.device_name,
        device_vendor: row.vendor_type,
        entries: row.entries,
        collected_at: row.collected_at
      }
      this.configDialogVisible = true
    },

    // ==================== 工具方法 ====================

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

    copyFingerprint(fingerprint) {
      const input = document.createElement('input')
      input.value = fingerprint
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('指纹已复制到剪贴板')
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },

    handleCurrentChange(val) {
      this.currentPage = val
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
        const params = {
          name: this.currentConfig.name,
          fingerprint: this.currentConfig.fingerprint,
          entries: this.currentConfig.entries,
          description: value || '',
          is_active: 1
        }

        prefixListApi.createStandard(params).then(response => {
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
      }).catch(() => {
        // 用户取消输入
      })
    }
  }
}
</script>

<style scoped>
.prefix-list-records-page {
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

.config-detail {
  max-height: 600px;
  overflow-y: auto;
}
</style>
