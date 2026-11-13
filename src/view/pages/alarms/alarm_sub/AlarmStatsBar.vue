<template>
  <div class="stats-bar">
    <div
      class="stat-card"
      v-for="card in cards"
      :key="card.key"
      :class="[card.cls, { active: card.active }]"
      @click="$emit('pick', { type: card.type, value: card.value })"
    >
      <div class="stat-num">{{ card.num }}</div>
      <div class="stat-label">{{ card.label }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AlarmStatsBar',
  props: {
    // 接口返回的分组数据：[{ip, hostname, children:[告警...]}]
    groups: {
      type: Array,
      default: () => []
    },
    // 当前生效的筛选值，用来高亮对应的卡片
    activeSeverity: { type: String, default: '' },
    activeStatus: { type: String, default: '' },
    activeMuted: { type: String, default: '' },
    // 有没有任何筛选在生效。由父组件给——它还有本组件不展示的筛选项
    // （告警状态、关键字等），"全部告警"要不要高亮只有父组件知道
    hasFilter: { type: Boolean, default: false },
    // 要不要显示"待处理"卡片。告警页传 false：那一页后端就按 status=0
    // 过滤，这张卡的数字恒等于总数，点它也筛不掉任何东西。
    // 历史页传默认值 true —— 那里 status 什么值都有，这张卡有意义
    showPending: { type: Boolean, default: true }
  },
  computed: {
    // 统计取全量、不受筛选影响：筛了 P1 之后其它级别全变 0，
    // 统计条就失去"一眼看全局"的意义了
    stats() {
      const stats = { total: 0, p1: 0, p2: 0, p3: 0, pending: 0, muted: 0 };
      this.groups.forEach(group => {
        (group.children || []).forEach(item => {
          stats.total += 1;
          const key = 'p' + (Number(item.severity) || 3);
          if (stats[key] !== undefined) stats[key] += 1;
          if (String(item.status) === '0') stats.pending += 1;
          if (Number(item.muted) === 1) stats.muted += 1;
        });
      });
      return stats;
    },
    cards() {
      const list = [
        { key: 'total', cls: 'stat-total', label: '全部告警', num: this.stats.total,
          active: !this.hasFilter, type: 'reset', value: '' },
        { key: 'p1', cls: 'stat-p1', label: 'P1 紧急', num: this.stats.p1,
          active: this.activeSeverity === '1', type: 'severity', value: '1' },
        { key: 'p2', cls: 'stat-p2', label: 'P2 重要', num: this.stats.p2,
          active: this.activeSeverity === '2', type: 'severity', value: '2' },
        { key: 'p3', cls: 'stat-p3', label: 'P3 次要', num: this.stats.p3,
          active: this.activeSeverity === '3', type: 'severity', value: '3' }
      ];
      if (this.showPending) {
        list.push({ key: 'pending', cls: 'stat-pending', label: '待处理', num: this.stats.pending,
          active: this.activeStatus === '0', type: 'status', value: '0' });
      }
      list.push({ key: 'muted', cls: 'stat-muted', label: '静默中', num: this.stats.muted,
        active: this.activeMuted === '1', type: 'muted', value: '1' });
      return list;
    }
  }
};
</script>

<style scoped>
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 110px;
  padding: 12px 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-left: 3px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* 选中的筛选项要能看出来，否则点完不知道当前在筛什么 */
.stat-card.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.stat-num {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  color: #303133;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.stat-total { border-left-color: #409eff; }
.stat-p1 { border-left-color: #f56c6c; }
.stat-p1 .stat-num { color: #f56c6c; }
.stat-p2 { border-left-color: #e6a23c; }
.stat-p2 .stat-num { color: #e6a23c; }
.stat-p3 { border-left-color: #909399; }
.stat-pending { border-left-color: #e6a23c; }
.stat-muted { border-left-color: #c0c4cc; }
</style>
