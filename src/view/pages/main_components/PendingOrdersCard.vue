<template>
  <div class="orders-card" v-loading="loading">
    <div class="card-header">
      <div class="card-title">
        <i class="el-icon-document-checked"></i>
        待处理工单
      </div>
      <el-button type="text" size="small" @click="$router.push('/pages/alteration/alteration_manage')">
        查看全部 <i class="el-icon-arrow-right"></i>
      </el-button>
    </div>

    <div class="stat-row">
      <div
        v-for="s in statList"
        :key="s.key"
        class="stat-box"
        :class="'stat-' + s.type">
        <div class="stat-num">{{ s.count }}</div>
        <div class="stat-text">{{ s.label }}</div>
      </div>
    </div>

    <div v-if="orders.length === 0 && !loading" class="empty-hint">
      <i class="el-icon-circle-check"></i>
      <span>暂无待处理工单</span>
    </div>

    <el-table
      v-else
      :data="orders"
      size="small"
      style="width: 100%"
      :show-header="true"
      max-height="280">
      <el-table-column prop="op_id" label="ID" width="60" align="center"></el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <a
            :href="`#/pages/alteration/alteration_detail?op_id=${scope.row.op_id}`"
            class="order-link"
            @click.prevent="goToDetail(scope.row.op_id)">
            {{ scope.row.title }}
          </a>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="statusType(scope.row.status)">
            {{ statusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="创建人" width="90" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import alterationApi from '@/api/mapis/alteration_interface.js'

export default {
  name: 'PendingOrdersCard',
  data () {
    return {
      loading: false,
      orders: [],
      allOrders: []
    }
  },
  computed: {
    statList () {
      const counts = {
        draft: 0,
        pending: 0,
        approved: 0,
        changing: 0
      }
      this.allOrders.forEach(o => {
        const s = o.status
        if (s === '00') counts.draft++
        else if (s === '01' || s === '02') counts.pending++
        else if (s === '10' || s === '20') counts.approved++
        else if (s === '21') counts.changing++
      })
      return [
        { key: 'draft', label: '草稿', count: counts.draft, type: 'info' },
        { key: 'pending', label: '待审批', count: counts.pending, type: 'warning' },
        { key: 'approved', label: '已通过', count: counts.approved, type: 'success' },
        { key: 'changing', label: '变更中', count: counts.changing, type: 'primary' }
      ]
    }
  },
  mounted () {
    this.loadOrders()
  },
  methods: {
    loadOrders () {
      this.loading = true
      const params = { status: ['00', '01', '02', '10', '20', '21'] }
      alterationApi.getOrderList(params, {}).then(res => {
        if (res.data && res.data.code === 0) {
          const list = res.data.data || []
          this.allOrders = list
          this.orders = list.slice(0, 8)
        } else {
          this.allOrders = []
          this.orders = []
        }
        this.loading = false
      }).catch(err => {
        console.error('加载工单列表失败:', err)
        this.loading = false
      })
    },

    statusText (status) {
      const map = {
        '00': '草稿',
        '01': '待接手',
        '02': '待审批',
        '10': '已通过',
        '20': '待变更',
        '21': '变更中',
        '90': '已完成',
        '91': '失败',
        '92': '拒绝',
        '93': '取消'
      }
      return map[status] || status
    },

    statusType (status) {
      const map = {
        '00': 'info',
        '01': 'warning',
        '02': 'warning',
        '10': 'success',
        '20': 'primary',
        '21': 'primary',
        '90': 'success',
        '91': 'danger',
        '92': 'danger',
        '93': 'info'
      }
      return map[status] || 'info'
    },

    goToDetail (opId) {
      this.$router.push({ path: '/pages/alteration/alteration_detail', query: { op_id: opId } })
    }
  }
}
</script>

<style scoped>
.orders-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.orders-card:hover {
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
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.stat-box {
  text-align: center;
  padding: 10px 8px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background: #fafafa;
  transition: all 0.2s;
}
.stat-box:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.stat-num {
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
  margin-bottom: 2px;
}
.stat-text {
  font-size: 12px;
  color: #909399;
}
.stat-info { border-color: #e9e9eb; }
.stat-info .stat-num { color: #909399; }
.stat-warning { border-color: #f5dab1; background: #fdf6ec; }
.stat-warning .stat-num { color: #e6a23c; }
.stat-success { border-color: #c2e7b0; background: #f0f9eb; }
.stat-success .stat-num { color: #67c23a; }
.stat-primary { border-color: #b3d8ff; background: #ecf5ff; }
.stat-primary .stat-num { color: #409eff; }

.empty-hint {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 13px;
}
.empty-hint > i {
  display: block;
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.order-link {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s;
}
.order-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
