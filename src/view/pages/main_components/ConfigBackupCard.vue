<template>
  <div class="backup-card" v-loading="loading">
    <div class="card-header">
      <div class="card-title">
        <i class="el-icon-document-checked"></i>
        配置备份情况
      </div>
      <el-button type="text" size="small" @click="navigateToDeviceList">
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
          <div class="stat-value">{{ stats.normal }}</div>
          <div class="stat-label">备份正常</div>
        </div>
      </div>

      <div class="stat-item stat-danger" @click="showAbnormalDevices('never')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="el-icon-document-delete"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.never_backup }}</div>
          <div class="stat-label">从未备份</div>
        </div>
      </div>

      <div class="stat-item stat-warning" @click="showAbnormalDevices('expired')" style="cursor: pointer;">
        <div class="stat-icon">
          <i class="el-icon-time"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.expired }}</div>
          <div class="stat-label">备份超时</div>
        </div>
      </div>

      <div class="stat-item stat-info">
        <div class="stat-icon">
          <i class="el-icon-pie-chart"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ backupRate }}<small>%</small></div>
          <div class="stat-label">备份正常率</div>
        </div>
      </div>
    </div>

    <div class="backup-tip">
      <i class="el-icon-info"></i>
      <span>最近 {{ stats.max_idle_days }} 天内备份过的视为正常，超过 {{ stats.max_idle_days }} 天或从未备份过的视为异常</span>
    </div>
  </div>
</template>

<script>
import configApi from '@/api/mapis/config_interface.js'

const EMPTY_STATS = {
  total: 0,
  normal: 0,
  never_backup: 0,
  expired: 0,
  abnormal: 0,
  max_idle_days: 1
}

const REASON_TEXT = {
  never: '从未备份',
  expired: '备份超时'
}

const LIST_KEY = {
  never: 'neverBackupDevices',
  expired: 'expiredBackupDevices'
}

export default {
  name: 'ConfigBackupCard',
  props: {
    days: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      loading: false,
      stats: Object.assign({}, EMPTY_STATS),
      neverBackupDevices: [],
      expiredBackupDevices: []
    }
  },
  computed: {
    backupRate () {
      if (this.stats.total === 0) return '0.0'
      const rate = (this.stats.normal / this.stats.total) * 100
      return rate.toFixed(1)
    }
  },
  mounted () {
    this.loadBackupStatus()
  },
  methods: {
    loadBackupStatus () {
      this.loading = true
      configApi.getBackupStatus({ days: this.days }, {}).then(res => {
        if (!res.data || res.data.code !== 0) {
          this.loading = false
          return
        }

        const summary = res.data.data || {}
        this.stats = {
          total: summary.total || 0,
          normal: summary.normal || 0,
          never_backup: summary.never_backup || 0,
          expired: summary.expired || 0,
          abnormal: summary.abnormal || 0,
          max_idle_days: summary.max_idle_days || this.days
        }
        this.neverBackupDevices = summary.never_backup_devices || []
        this.expiredBackupDevices = summary.expired_devices || []

        this.loading = false
      }).catch(err => {
        console.error('加载配置备份统计失败:', err)
        this.loading = false
      })
    },

    showAbnormalDevices (reason) {
      const list = this[LIST_KEY[reason]] || []
      const title = REASON_TEXT[reason] || '异常'

      if (list.length === 0) {
        this.$message.success(`没有${title}的设备`)
        return
      }

      const deviceList = list.map(d => {
        const idle = d.idle_hours === null || d.idle_hours === undefined
          ? '从未备份'
          : d.idle_hours < 48 ? `${d.idle_hours} 小时前` : `${(d.idle_hours / 24).toFixed(1)} 天前`
        return `<tr>
          <td style="padding: 8px; border: 1px solid #ebeef5;">${d.sysname || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ebeef5; font-family: monospace;">${d.ip}</td>
          <td style="padding: 8px; border: 1px solid #ebeef5;">${d.sys_type || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ebeef5;">${d.last_backup || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ebeef5; color: #f56c6c;">${idle}</td>
        </tr>`
      }).join('')

      this.$alert(`
        <div style="max-height: 500px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f5f7fa;">
                <th style="padding: 8px; border: 1px solid #ebeef5; text-align: left;">设备名称</th>
                <th style="padding: 8px; border: 1px solid #ebeef5; text-align: left;">设备IP</th>
                <th style="padding: 8px; border: 1px solid #ebeef5; text-align: left;">厂商</th>
                <th style="padding: 8px; border: 1px solid #ebeef5; text-align: left;">最近备份时间</th>
                <th style="padding: 8px; border: 1px solid #ebeef5; text-align: left;">距上次备份</th>
              </tr>
            </thead>
            <tbody>
              ${deviceList}
            </tbody>
          </table>
        </div>
      `, `${title}设备 (${list.length})`, {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        customClass: 'config-backup-dialog'
      })
    },

    navigateToDeviceList () {
      this.$router.push({ path: '/pages/device/device_list' })
    }
  }
}
</script>

<style scoped>
.backup-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.backup-card:hover {
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
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
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
.stat-warning .stat-icon { color: #e6a23c; background: #fdf6ec; }
.stat-info .stat-icon { color: #909399; background: #f4f4f5; }
.stat-primary .stat-value { color: #409eff; }
.stat-success .stat-value { color: #67c23a; }
.stat-danger .stat-value { color: #f56c6c; }
.stat-warning .stat-value { color: #e6a23c; }
.stat-info .stat-value { color: #606266; }

.backup-tip {
  display: flex;
  align-items: flex-start;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
  line-height: 18px;
}
.backup-tip > i {
  margin-right: 6px;
  margin-top: 1px;
  color: #c0c4cc;
}
</style>

<style>
/* 弹窗挂载在 body 上，scoped 样式不生效，这里单独放开宽度 */
.el-message-box.config-backup-dialog {
  width: 860px;
  max-width: 94vw;
}
.config-backup-dialog .el-message-box__message {
  padding-right: 6px;
}
.config-backup-dialog .el-message-box__message table {
  table-layout: auto;
}
.config-backup-dialog .el-message-box__message th,
.config-backup-dialog .el-message-box__message td {
  white-space: nowrap;
}
/* 设备名过长时允许折行，避免把表格撑破 */
.config-backup-dialog .el-message-box__message td:first-child {
  white-space: normal;
  word-break: break-all;
}
</style>
