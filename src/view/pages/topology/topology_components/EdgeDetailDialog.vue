<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="900px"
    top="8vh"
    @close="handleClose">
    <div slot="title" class="dialog-title">
      <i class="el-icon-connection"></i>链路详情
    </div>

    <!-- 链路两端概览 -->
    <div class="link-summary">
      <div class="ls-end">
        <div class="ls-tag">A 端</div>
        <div class="ls-name" :title="endInfo.from.label">{{ endInfo.from.label || '-' }}</div>
        <div class="ls-sub">
          <span class="mono">{{ endInfo.from.ip || '-' }}</span>
          <span v-if="endInfo.from.sysname && endInfo.from.sysname !== endInfo.from.label"> · {{ endInfo.from.sysname }}</span>
        </div>
      </div>
      <div class="ls-mid">
        <div class="ls-count">
          {{ loading ? '查询中' : portList.length + ' 条链路' }}
          <span :class="['mode-tag', searchMode === 'port' ? 'mode-port' : '']">{{ searchMode === 'port' ? '接口指定' : 'LLDP' }}</span>
        </div>
        <div class="ls-line"><i class="el-icon-sort ls-arrow"></i></div>
        <div class="ls-label">{{ (edgeData && edgeData.label) || (searchMode === 'port' ? '指定接口' : 'LLDP 邻居') }}</div>
      </div>
      <div class="ls-end">
        <div class="ls-tag">B 端</div>
        <div class="ls-name" :title="endInfo.to.label">{{ endInfo.to.label || '-' }}</div>
        <div class="ls-sub">
          <span class="mono">{{ endInfo.to.ip || '-' }}</span>
          <span v-if="endInfo.to.sysname && endInfo.to.sysname !== endInfo.to.label"> · {{ endInfo.to.sysname }}</span>
        </div>
      </div>
    </div>

    <!-- 端口对应关系 -->
    <el-table :data="portList" v-loading="loading" size="small" stripe class="link-table" max-height="420">
      <template slot="empty">
        <el-empty :image-size="70" :description="searchMode === 'port' ? '未找到指定的接口' : '未通过 LLDP 检索到端口信息'"></el-empty>
      </template>
      <el-table-column type="index" label="#" width="50" align="center"></el-table-column>
      <el-table-column label="A 端端口" min-width="200">
        <template slot-scope="scope">
          <div class="port-cell">
            <span class="port-line">
              <span class="mono port-name">{{ scope.row.loc_portname || '-' }}</span>
              <el-tag v-if="scope.row.loc_statu" size="mini" :type="scope.row.loc_statu === 'UP' ? 'success' : 'danger'" disable-transitions>{{ scope.row.loc_statu }}</el-tag>
            </span>
            <span class="port-alias" :title="scope.row.loc_portalias">{{ scope.row.loc_portalias || '无描述' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column width="50" align="center">
        <template slot-scope="scope">
          <i class="el-icon-sort link-icon" :key="scope.$index"></i>
        </template>
      </el-table-column>
      <el-table-column label="B 端端口" min-width="200">
        <template slot-scope="scope">
          <div class="port-cell">
            <span class="port-line">
              <span class="mono port-name">{{ scope.row.rem_portname || '-' }}</span>
              <el-tag v-if="scope.row.rem_statu" size="mini" :type="scope.row.rem_statu === 'UP' ? 'success' : 'danger'" disable-transitions>{{ scope.row.rem_statu }}</el-tag>
            </span>
            <span class="port-alias" :title="scope.row.rem_portalias">{{ scope.row.rem_portalias || '无描述' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="实时流量" width="180" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="mini" icon="el-icon-data-line" :disabled="!scope.row.loc_portname" @click="showEchartFlow(localPorts[scope.$index])">A 端</el-button>
          <el-button type="text" size="mini" icon="el-icon-data-line" :disabled="!scope.row.rem_portname" @click="showEchartFlow(remotePorts[scope.$index])">B 端</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer" class="dialog-footer">
      <span class="footer-tip">
        <i class="el-icon-info"></i>节点设备名填写为 <span class="mono">设备名[接口名]</span>（如 <span class="mono">CORE-01[GigabitEthernet1/0/24]</span>）时，跳过 LLDP 直接按接口查询
      </span>
      <el-button @click="handleClose" size="small">关 闭</el-button>
    </div>

    <el-dialog :visible.sync="dialogFlowVisible" width="1280px" top="8vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-data-line"></i>实时流量
        <span class="flow-target">
          {{ flowPortInfo.sysname }}
          <span class="mono">{{ flowPortInfo.if_name }}</span>
        </span>
        <span class="interval-tag">采集间隔 {{ flowInterval }}s</span>
      </div>
      <div v-if="flowPortInfo.alias" class="flow-alias"><i class="el-icon-price-tag"></i>{{ flowPortInfo.alias }}</div>
      <div v-if="dialogFlowVisible" class="flow-charts">
        <div class="flow-chart">
          <echart_flow
            v-bind:chartsname="'edge_flow_band'"
            v-bind:port_info="flowPortInfo"
            v-bind:chartsType="'line'"
            v-bind:chartswidth="'600px'"
            v-bind:chartsheight="'300px'"
            v-bind:interval="flowInterval">
          </echart_flow>
        </div>
        <div class="flow-chart">
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

// 设备名[接口名]，如 CORE-01[GigabitEthernet1/0/24]
const SPEC_RE = /^\s*(.+?)\s*\[\s*(.+?)\s*\]\s*$/

function parseSpec(str) {
  const m = SPEC_RE.exec(str || '')
  return m ? { name: m[1], ifName: m[2] } : null
}

function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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
      searchMode: 'lldp', // 'lldp' | 'port'（设备名[接口名]）

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
    // 概览中两端节点信息（A 端始终为 edge.from）
    endInfo() {
      const pick = id => {
        const node = id ? this.nodeList.find(n => n.id === id) : null
        return {
          ip: id || '',
          label: node ? node.label : (id || ''),
          sysname: node && node.meta ? node.meta.sysname : ''
        }
      }
      const edge = this.edgeData || {}
      return { from: pick(edge.from), to: pick(edge.to) }
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
      this.searchMode = 'lldp'
      if (!this.edgeData || !this.edgeData.from || !this.edgeData.to) {
        return
      }

      const from = this.edgeData.from
      const to = this.edgeData.to
      const fromNode = this.nodeList.find(n => n.id === from)
      const toNode = this.nodeList.find(n => n.id === to)

      // 使用 meta.sysname 而不是 label，因为 label 可能被用户修改为友好名称；云节点不回退到 label
      const nameOf = node => {
        if (!node) return ''
        if (node.meta && node.meta.sysname) return node.meta.sysname
        return node.group === 'cloud' ? '' : node.label
      }
      const fromName = nameOf(fromNode)
      const toName = nameOf(toNode)

      // 任一端填写了 设备名[接口名]，直接按接口查询，不依赖 LLDP
      const fromSpec = parseSpec(fromName)
      const toSpec = parseSpec(toName)
      if (fromSpec || toSpec) {
        this.searchMode = 'port'
        this.loadBySpec(fromSpec, toSpec)
        return
      }

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
            rem_portalias: item.rem_portalias,
            rem_portid: item.rem_portid
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
            rem_portalias: item.loc_portalias,
            rem_portid: item.loc_portid
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

    // 按 设备名[接口名] 直接查询接口，A 端始终为 edge.from
    loadBySpec(fromSpec, toSpec) {
      this.loading = true
      Promise.all([
        fromSpec ? this.findSpecPort(fromSpec) : Promise.resolve(null),
        toSpec ? this.findSpecPort(toSpec) : Promise.resolve(null)
      ]).then(([a, b]) => {
        const errors = [a, b].filter(r => r && r.error).map(r => r.error)
        if (errors.length) {
          this.$message.warning(errors.join('；'))
        }
        const portA = a && a.port
        const portB = b && b.port
        if (!portA && !portB) return
        this.portList = [Object.assign({}, this.portFields('loc', portA), this.portFields('rem', portB))]
      }).catch(error => {
        console.error('查询接口信息失败:', error)
        this.$message.error('查询接口信息失败')
      }).finally(() => {
        this.loading = false
      })
    },

    // 按设备名查出管理IP → 拉取接口列表 → 按接口名匹配；结果为 { port } 或 { error }
    findSpecPort(spec) {
      return collectorApi.getDevs({ sysname: `^${escapeReg(spec.name)}$` }).then(response => {
        const res = response.data
        const list = res && res.code === 0 && Array.isArray(res.data) ? res.data : []
        const dev = list.find(d => d.sysname === spec.name)
        if (!dev) {
          return { error: `未找到设备 ${spec.name}` }
        }
        return collectorApi.getPorts_ex({ ip: dev.ip }, {}).then(resp => {
          const r = resp.data
          const ports = r && r.code === 0 && Array.isArray(r.data) ? r.data : []
          const port = ports.find(p => p.if_name === spec.ifName)
          return port ? { port: port } : { error: `${spec.name} 上未找到接口 ${spec.ifName}` }
        })
      })
    },

    portFields(prefix, port) {
      const p = port || {}
      let statu = ''
      if (port) {
        statu = String(p.oper_statu) === '1' ? 'UP' : 'DOWN'
      }
      return {
        [prefix + '_name']: p.sysname || '',
        [prefix + '_ip']: p.ip || '',
        [prefix + '_portname']: p.if_name || '',
        [prefix + '_portalias']: p.alias || '',
        [prefix + '_portid']: p.port_id,
        [prefix + '_statu']: statu
      }
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
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dialog-title > i {
  margin-right: 6px;
  color: #409eff;
}

/* 两端概览 */
.link-summary {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 14px 18px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.ls-end {
  flex: 1;
  min-width: 0;
}
.ls-end + .ls-mid + .ls-end {
  text-align: right;
}
.ls-tag {
  display: inline-block;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  border-radius: 3px;
  color: #409eff;
  background: #ecf5ff;
}
.ls-name {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ls-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ls-mid {
  flex-shrink: 0;
  width: 200px;
  margin: 0 16px;
  text-align: center;
}
.ls-count {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}
.mode-tag {
  margin-left: 6px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 9px;
  color: #909399;
  background: #f4f4f5;
}
.mode-tag.mode-port {
  color: #e6a23c;
  background: #fdf6ec;
}
.ls-line {
  position: relative;
  height: 20px;
}
.ls-line::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: 2px solid #c6e2ff;
}
.ls-arrow {
  position: relative;
  padding: 0 6px;
  line-height: 20px;
  font-size: 14px;
  color: #409eff;
  background: #fafbfc;
  transform: rotate(90deg);
}
.ls-label {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格 */
.link-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.port-cell {
  display: flex;
  flex-direction: column;
  line-height: 18px;
}
.port-line {
  display: flex;
  align-items: center;
}
.port-line .el-tag {
  margin-left: 6px;
}
.port-name {
  font-weight: 500;
  color: #303133;
}
.port-alias {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-icon {
  color: #c0c4cc;
  transform: rotate(90deg);
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-tip {
  margin-right: 12px;
  font-size: 12px;
  color: #909399;
  text-align: left;
}
.footer-tip i {
  margin-right: 4px;
}

/* 流量弹窗 */
.flow-target {
  margin-left: 12px;
  font-size: 13px;
  font-weight: normal;
  color: #606266;
}
.interval-tag {
  margin-left: 10px;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 10px;
  color: #e6a23c;
  background: #fdf6ec;
}
.flow-alias {
  margin: -6px 0 10px;
  font-size: 12px;
  color: #909399;
}
.flow-alias i {
  margin-right: 4px;
}
.flow-charts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.flow-chart {
  margin-bottom: 10px;
  padding: 6px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
</style>
