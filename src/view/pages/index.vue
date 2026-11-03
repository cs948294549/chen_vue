<template>
  <div class="home-page">
    <div class="page-header">
      <div class="page-title">
        <i class="el-icon-s-home"></i>
        网络运维概览
      </div>
      <div class="page-subtitle">实时监控网络设备状态、配置变更与工单处理</div>
    </div>

    <div class="dashboard-grid">
      <div class="grid-col-2">
        <DeviceStatCard />
      </div>
      <div class="grid-col-1">
        <ApStatusCard />
      </div>
      <div class="grid-col-1">
        <RecentChangesCard :days="2" />
      </div>
      <div class="grid-col-1">
        <PendingOrdersCard />
      </div>
    </div>
  </div>
</template>

<script>
import DeviceStatCard from './main_components/DeviceStatCard.vue'
import ApStatusCard from './main_components/ApStatusCard.vue'
import RecentChangesCard from './main_components/RecentChangesCard.vue'
import PendingOrdersCard from './main_components/PendingOrdersCard.vue'

export default {
  name: 'HomePage',
  components: {
    DeviceStatCard,
    ApStatusCard,
    RecentChangesCard,
    PendingOrdersCard
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.page-title > i {
  margin-right: 10px;
  font-size: 28px;
  color: #409eff;
}
.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin-left: 38px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.grid-col-1 {
  grid-column: span 1;
}
.grid-col-2 {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .grid-col-1,
  .grid-col-2 {
    grid-column: span 1;
  }
}
</style>

