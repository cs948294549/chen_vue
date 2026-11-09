<template>
  <div class="stat-card" v-loading="loading">
    <div class="card-header">
      <div class="card-title">
        <i class="el-icon-s-grid"></i>
        设备统计
      </div>
      <el-button type="text" size="small" @click="$router.push('/pages/device/device_list')">
        查看详情 <i class="el-icon-arrow-right"></i>
      </el-button>
    </div>

    <div class="stat-row">
      <div class="stat-item stat-primary">
        <div class="stat-icon">
          <i class="el-icon-connection"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>

      <div class="stat-item stat-success">
        <div class="stat-icon">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.online }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>

      <div class="stat-item stat-danger" @click="showOfflineDevices" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="el-icon-circle-close"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.offline }}</div>
          <div class="stat-label">离线设备</div>
        </div>
      </div>

      <div class="stat-item stat-info">
        <div class="stat-icon">
          <i class="el-icon-pie-chart"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ onlineRate }}<small>%</small></div>
          <div class="stat-label">在线率</div>
        </div>
      </div>
    </div>

    <div class="vendor-dist" v-if="vendors.length > 0">
      <div class="dist-title">厂商分布</div>
      <div class="vendor-list">
        <div
          v-for="v in vendors"
          :key="v.name"
          class="vendor-tag"
          :class="'vendor-' + v.type">
          <span class="vendor-name">{{ v.name }}</span>
          <span class="vendor-count">{{ v.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import collectorApi from '@/api/mapis/collector_interface.js'

export default {
  name: 'DeviceStatCard',
  data () {
    return {
      loading: false,
      stats: {
        total: 0,
        online: 0,
        offline: 0
      },
      vendors: [],
      offlineDevices: []
    }
  },
  computed: {
    onlineRate () {
      if (this.stats.total === 0) return '0.0'
      const rate = (this.stats.online / this.stats.total) * 100
      return rate.toFixed(1)
    }
  },
  mounted () {
    this.loadStats()
  },
  methods: {
    loadStats () {
      this.loading = true
      collectorApi.getDeviceSummary({}, {}).then(res => {
        if (!res.data || res.data.code !== 0) {
          this.loading = false
          return
        }

        const summary = res.data.data
        this.stats.total = summary.total || 0
        this.stats.online = summary.online || 0
        this.stats.offline = summary.offline || 0
        this.offlineDevices = summary.offline_devices || []

        // 处理厂商列表，添加样式类型，default 改为"未分类"
        this.vendors = (summary.vendors || []).map(v => {
          const name = v.name === 'default' ? '未分类' : v.name
          return {
            ...v,
            name: name,
            type: this.getVendorType(v.name)
          }
        })

        this.loading = false
      }).catch(err => {
        console.error('加载设备统计失败:', err)
        this.loading = false
      })
    },

    getVendorType (vendor) {
      const lowerVendor = vendor.toLowerCase()
      if (lowerVendor.includes('cisco')) return 'primary'
      if (lowerVendor.includes('huawei') || lowerVendor.includes('huarong')) return 'danger'
      if (lowerVendor.includes('h3c')) return ''
      if (lowerVendor.includes('ruijie')) return 'warning'
      if (lowerVendor.includes('arista')) return 'success'
      if (lowerVendor.includes('juniper')) return 'info'
      return ''
    },

    // 弹框用 dangerouslyUseHTMLString 渲染，设备名等字段需转义
    escapeHtml (val) {
      if (val === null || val === undefined || val === '') return ''
      return String(val).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c])
    },

    showOfflineDevices () {
      if (this.stats.offline === 0) {
        this.$message.info('当前没有离线设备')
        return
      }

      const deviceList = this.offlineDevices.map(d => {
        return `<tr>
          <td class="col-name">${this.escapeHtml(d.sysname) || '-'}</td>
          <td class="col-ip">${this.escapeHtml(d.ip) || '-'}</td>
          <td class="col-vendor">${this.escapeHtml(d.sys_type) || '-'}</td>
          <td class="col-time">${this.escapeHtml(d.timestamp) || '-'}</td>
        </tr>`
      }).join('')

      this.$alert(`
        <div class="offline-table-wrapper">
          <table class="offline-table">
            <colgroup>
              <col class="col-name">
              <col class="col-ip">
              <col class="col-vendor">
              <col class="col-time">
            </colgroup>
            <thead>
              <tr>
                <th>设备名称</th>
                <th>设备IP</th>
                <th>厂商</th>
                <th>最后采集时间</th>
              </tr>
            </thead>
            <tbody>
              ${deviceList}
            </tbody>
          </table>
        </div>
      `, `离线设备列表 (${this.stats.offline})`, {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        customClass: 'offline-devices-dialog'
      })
    }
  }
}
</script>

<style scoped>
.stat-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.card-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background: #fafafa;
  transition: all 0.2s;
}
.stat-item:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin-right: 10px;
  font-size: 18px;
  border-radius: 6px;
}
.stat-body {
  flex: 1;
}
.stat-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
}
.stat-value small {
  margin-left: 1px;
  font-size: 12px;
  font-weight: normal;
}
.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.stat-primary .stat-icon { color: #409eff; background: #ecf5ff; }
.stat-success .stat-icon { color: #67c23a; background: #f0f9eb; }
.stat-danger .stat-icon { color: #f56c6c; background: #fef0f0; }
.stat-info .stat-icon { color: #909399; background: #f4f4f5; }
.stat-primary .stat-value { color: #409eff; }
.stat-success .stat-value { color: #67c23a; }
.stat-danger .stat-value { color: #f56c6c; }
.stat-info .stat-value { color: #606266; }

.vendor-dist {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
.dist-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}
.vendor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.vendor-tag {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #f4f4f5;
  font-size: 12px;
}
.vendor-name {
  margin-right: 6px;
  color: #606266;
}
.vendor-count {
  font-weight: 600;
  color: #909399;
}
.vendor-primary { border-color: #b3d8ff; background: #ecf5ff; }
.vendor-primary .vendor-name { color: #409eff; }
.vendor-danger { border-color: #fbc4c4; background: #fef0f0; }
.vendor-danger .vendor-name { color: #f56c6c; }
.vendor-warning { border-color: #f5dab1; background: #fdf6ec; }
.vendor-warning .vendor-name { color: #e6a23c; }
.vendor-success { border-color: #c2e7b0; background: #f0f9eb; }
.vendor-success .vendor-name { color: #67c23a; }
.vendor-info { border-color: #d3d4d6; background: #f4f4f5; }
.vendor-info .vendor-name { color: #909399; }
</style>

<!-- MessageBox 挂载在 body 下，不能用 scoped -->
<style>
.offline-devices-dialog {
  width: 900px;
  max-width: 92vw;
}
.offline-devices-dialog .el-message-box__content {
  padding: 10px 15px;
}
.offline-devices-dialog .el-message-box__message {
  width: 100%;
}
.offline-devices-dialog .offline-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}
.offline-devices-dialog .offline-table th,
.offline-devices-dialog .offline-table td {
  padding: 8px;
  border: 1px solid #ebeef5;
  text-align: left;
  overflow-wrap: break-word;
  word-break: break-all;
}
.offline-devices-dialog .offline-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}
.offline-devices-dialog .offline-table td.col-ip {
  font-family: Menlo, Consolas, monospace;
}
.offline-devices-dialog .offline-table .col-name { width: 30%; }
.offline-devices-dialog .offline-table .col-ip { width: 20%; }
.offline-devices-dialog .offline-table .col-vendor { width: 20%; }
.offline-devices-dialog .offline-table .col-time { width: 30%; }
.offline-devices-dialog .offline-table-wrapper {
  max-height: 55vh;
  overflow-y: auto;
}
</style>
