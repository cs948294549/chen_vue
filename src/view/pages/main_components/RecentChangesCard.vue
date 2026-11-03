<template>
  <div class="changes-card" v-loading="loading">
    <div class="card-header">
      <div class="card-title">
        <i class="el-icon-refresh-left"></i>
        最近{{ days }} 天内配置变更
      </div>
      <el-button type="text" size="small" @click="navigateToDeviceList">
        查看全部 <i class="el-icon-arrow-right"></i>
      </el-button>
    </div>

    <div v-if="devices.length === 0 && !loading" class="empty-hint">
      <i class="el-icon-info"></i>
      <span>最近 {{ days }} 天内无设备配置变更</span>
    </div>

    <el-table
      v-else
      :data="devices"
      size="small"
      style="width: 100%"
      :show-header="true"
      max-height="320">
      <el-table-column prop="sysname" label="设备名" min-width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <a
            :href="`#/pages/device/device_detail?dev=${scope.row.ip}`"
            class="device-link"
            @click.prevent="goToDetail(scope.row.ip)">
            {{ scope.row.sysname }}
          </a>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.ip }}</span>
        </template>
      </el-table-column>
      <el-table-column label="厂商" width="80">
        <template slot-scope="scope">
          <el-tag
            v-if="vendorOf(scope.row)"
            size="mini"
            :type="vendorOf(scope.row).type">
            {{ vendorOf(scope.row).name }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import configApi from '@/api/mapis/config_interface.js'

export default {
  name: 'RecentChangesCard',
  props: {
    days: {
      type: Number,
      default: 2
    }
  },
  data () {
    return {
      loading: false,
      devices: []
    }
  },
  mounted () {
    this.loadChanges()
  },
  methods: {
    loadChanges () {
      this.loading = true
      configApi.getChangedDevices({ days: this.days }, {}).then(res => {
        if (res.data && res.data.code === 0) {
          const list = res.data.data || []
          this.devices = list.slice(0, 10)
        } else {
          this.devices = []
        }
        this.loading = false
      }).catch(err => {
        console.error('加载变更设备列表失败:', err)
        this.loading = false
      })
    },

    vendorOf (row) {
      const vendorDefs = [
        { reg: /h3c/i, name: 'H3C', type: '' },
        { reg: /huawei|huarong/i, name: 'Huawei', type: 'danger' },
        { reg: /cisco/i, name: 'Cisco', type: 'primary' },
        { reg: /ruijie/i, name: 'Ruijie', type: 'warning' },
        { reg: /arista/i, name: 'Arista', type: 'success' },
        { reg: /juniper/i, name: 'Juniper', type: 'info' }
      ]
      const desc = row.sysdesc || ''
      for (let i = 0; i < vendorDefs.length; i++) {
        if (vendorDefs[i].reg.test(desc)) {
          return vendorDefs[i]
        }
      }
      return null
    },

    goToDetail (ip) {
      this.$router.push({ path: '/pages/device/device_detail', query: { dev: ip } })
    },

    navigateToDeviceList () {
      this.$router.push({ path: '/pages/device/device_list', query: { changed: String(this.days) } })
    }
  }
}
</script>

<style scoped>
.changes-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.changes-card:hover {
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
.device-link {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s;
}
.device-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
}
</style>
