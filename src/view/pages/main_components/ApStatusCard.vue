<template>
  <div class="ap-card" v-loading="loading">
    <div class="card-header">
      <div class="card-title">
        <i class="el-icon-connection"></i>
        无线 AP 状态
      </div>
      <el-button type="text" size="small" @click="$router.push('/pages/wireless/ap_list')">
        查看详情 <i class="el-icon-arrow-right"></i>
      </el-button>
    </div>

    <div class="stat-row">
      <div class="stat-item stat-primary">
        <div class="stat-icon">
          <i class="el-icon-connection"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ summary.total }}</div>
          <div class="stat-label">AP 总数</div>
        </div>
      </div>

      <div class="stat-item stat-success">
        <div class="stat-icon">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ summary.online }}</div>
          <div class="stat-label">在线</div>
        </div>
      </div>

      <div class="stat-item stat-danger">
        <div class="stat-icon">
          <i class="el-icon-circle-close"></i>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ summary.offline }}</div>
          <div class="stat-label">离线</div>
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

    <div class="client-stat">
      <div class="client-icon">
        <i class="el-icon-mobile-phone"></i>
      </div>
      <div class="client-body">
        <div class="client-num">{{ summary.clients }}</div>
        <div class="client-text">接入终端</div>
      </div>
    </div>
  </div>
</template>

<script>
import wifiApi from '@/api/mapis/wifi_interface.js'

const EMPTY_SUMMARY = { total: 0, online: 0, offline: 0, unknown: 0, clients: 0 }

export default {
  name: 'ApStatusCard',
  data () {
    return {
      loading: false,
      summary: Object.assign({}, EMPTY_SUMMARY)
    }
  },
  computed: {
    onlineRate () {
      if (this.summary.total === 0) return 0
      return Math.round((this.summary.online / this.summary.total) * 100)
    }
  },
  mounted () {
    this.loadApStats()
  },
  methods: {
    loadApStats () {
      this.loading = true
      wifiApi.getApList({}).then(res => {
        this.summary = (res && res.summary) || Object.assign({}, EMPTY_SUMMARY)
        this.loading = false
      }).catch(err => {
        console.error('加载 AP 统计失败:', err)
        this.loading = false
      })
    }
  }
}
</script>

<style scoped>
.ap-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.ap-card:hover {
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

.client-stat {
  display: flex;
  align-items: center;
  margin-top: auto;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #b3d8ff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5faff 100%);
}
.client-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  font-size: 22px;
  color: #409eff;
  background: #fff;
  border-radius: 8px;
}
.client-body {
  flex: 1;
}
.client-num {
  font-size: 24px;
  font-weight: 600;
  line-height: 28px;
  color: #409eff;
}
.client-text {
  font-size: 13px;
  color: #606266;
  margin-top: 2px;
}
</style>
