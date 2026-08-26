<template>
  <el-dialog
    title="连接详情"
    :visible.sync="dialogVisible"
    width="70%"
    @close="handleClose">
    <div v-loading="loading">
      <div class="port-section">
        <div class="section-title">本端</div>
        <el-table :data="localPorts" border size="small" style="width: 100%;">
          <el-table-column prop="name" label="设备名" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="ip" label="IP" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="portname" label="端口" min-width="110" show-overflow-tooltip></el-table-column>
          <el-table-column prop="portalias" label="端口描述" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="remName" label="对端设备名" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="remPortname" label="对端端口名" min-width="110" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template v-slot="scope">
              <el-dropdown>
                <span style="cursor: pointer;">
                  查询菜单<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item>
                    <el-button size="small" type="text" @click="showEchartFlow(scope.row)">实时流量</el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="port-section">
        <div class="section-title">对端</div>
        <el-table :data="remotePorts" border size="small" style="width: 100%;">
          <el-table-column prop="name" label="设备名" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="ip" label="IP" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="portname" label="端口" min-width="110" show-overflow-tooltip></el-table-column>
          <el-table-column prop="portalias" label="端口描述" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="remName" label="对端设备名" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="remPortname" label="对端端口名" min-width="110" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template v-slot="scope">
              <el-dropdown>
                <span style="cursor: pointer;">
                  查询菜单<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item>
                    <el-button size="small" type="text" @click="showEchartFlow(scope.row)">实时流量</el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="!loading && portList.length === 0" style="text-align: center; color: #909399; padding: 20px 0;">
        未通过LLDP检索到端口信息
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">关 闭</el-button>
    </span>

    <el-dialog title="实时流量窗口" :visible.sync="dialogFlowVisible" width="80%" append-to-body>
      <div>采集间隔<span style="color: red;">{{ flowInterval }}</span>秒</div>
      <div v-if="dialogFlowVisible" style="display: flex;">
        <div>
          <echart_flow
            v-bind:chartsname="'edge_flow_band'"
            v-bind:port_info="flowPortInfo"
            v-bind:chartsType="'line'"
            v-bind:chartswidth="'600px'"
            v-bind:chartsheight="'300px'"
            v-bind:interval="flowInterval">
          </echart_flow>
        </div>
        <div>
          <echart_error
            v-bind:chartsname="'edge_flow_error'"
            v-bind:port_info="flowPortInfo"
            v-bind:chartsType="'line'"
            v-bind:chartswidth="'600px'"
            v-bind:chartsheight="'300px'"
            v-bind:interval="flowInterval">
          </echart_error>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import collectorApi from '@/api/mapis/collector_interface'
import echart_flow from '@/components/echarts/echart_single_flow.vue'
import echart_error from '@/components/echarts/echart_single_error.vue'

export default {
  name: 'EdgeDetailDialog',

  components: {
    echart_flow,
    echart_error
  },

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    edgeData: {
      type: Object,
      default: null
    },
    nodeList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      dialogVisible: false,
      loading: false,
      portList: [],

      // 实时流量
      dialogFlowVisible: false,
      flowPortInfo: {},
      flowInterval: 5
    }
  },

  computed: {
    localPorts() {
      return this.portList.map(row => ({
        name: row.loc_name,
        ip: row.loc_ip,
        portname: row.loc_portname,
        portalias: row.loc_portalias,
        portid: row.loc_portid,
        remName: row.rem_name,
        remPortname: row.rem_portname
      }))
    },
    remotePorts() {
      return this.portList.map(row => ({
        name: row.rem_name,
        ip: row.rem_ip,
        portname: row.rem_portname,
        portalias: row.rem_portalias,
        portid: row.rem_portid,
        remName: row.loc_name,
        remPortname: row.loc_portname
      }))
    }
  },

  watch: {
    visible(val) {
      this.dialogVisible = val
      if (val) {
        this.loadPortDetail()
      }
    },
    dialogVisible(val) {
      if (!val) {
        this.$emit('update:visible', false)
      }
    }
  },

  methods: {
    loadPortDetail() {
      this.portList = []
      if (!this.edgeData || !this.edgeData.from || !this.edgeData.to) {
        return
      }

      const from = this.edgeData.from
      const to = this.edgeData.to
      const fromNode = this.nodeList.find(n => n.id === from)
      const toNode = this.nodeList.find(n => n.id === to)

      // 使用 meta.sysname 而不是 label，因为 label 可能被用户修改为友好名称
      const fromName = fromNode && fromNode.meta && fromNode.meta.sysname ? fromNode.meta.sysname : (fromNode ? fromNode.label : '')
      const toName = toNode && toNode.meta && toNode.meta.sysname ? toNode.meta.sysname : (toNode ? toNode.label : '')

      this.loading = true

      Promise.all([
        collectorApi.getLLDPS({ ip: from, rem_name: `^${toName}$` }),
        collectorApi.getLLDPS({ ip: to, rem_name: `^${fromName}$` })
      ]).then(([res1, res2]) => {
        const rows = []

        const data1 = res1.data && res1.data.code === 0 ? (res1.data.data || []) : []
        data1.forEach(item => {
          rows.push({
            loc_name: item.loc_name,
            loc_ip: item.loc_ip,
            loc_portname: item.loc_portname,
            loc_portalias: item.loc_portalias,
            loc_portid: item.loc_portid,
            rem_name: item.rem_name,
            rem_ip: item.rem_ip,
            rem_portname: item.rem_portname,
            rem_portalias: item.rem_portalias
          })
        })

        const data2 = res2.data && res2.data.code === 0 ? (res2.data.data || []) : []
        data2.forEach(item => {
          // 统一方向：本端始终为edge.from
          rows.push({
            loc_name: item.rem_name,
            loc_ip: item.rem_ip,
            loc_portname: item.rem_portname,
            loc_portalias: item.rem_portalias,
            loc_portid: item.rem_portid,
            rem_name: item.loc_name,
            rem_ip: item.loc_ip,
            rem_portname: item.loc_portname,
            rem_portalias: item.loc_portalias
          })
        })

        // 去重（同一对端口只保留一条）
        const seen = new Set()
        this.portList = rows.filter(row => {
          const key = `${row.loc_portname}@${row.rem_portname}`
          if (seen.has(key)) {
            return false
          }
          seen.add(key)
          return true
        })
      }).catch(error => {
        console.error('查询LLDP端口详情失败:', error)
        this.$message.error('查询LLDP端口详情失败')
      }).finally(() => {
        this.loading = false
      })
    },

    handleClose() {
      this.dialogVisible = false
    },

    showEchartFlow(row) {
      this.dialogFlowVisible = false
      this.flowPortInfo = {
        ip: row.ip,
        if_name: row.portname,
        port_id: row.portid,
        sysname: row.name,
        alias: row.portalias
      }
      this.flowInterval = 15
      this.dialogFlowVisible = true
    }
  }
}
</script>

<style scoped>
.port-section {
  margin-bottom: 16px;
}
.port-section .section-title {
  font-size: 13px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 8px;
}
</style>
