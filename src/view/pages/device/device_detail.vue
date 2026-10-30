<template>
  <div class="device-detail">
    <!-- 设备概览 -->
    <div class="dev-header" v-loading="devLoading">
      <div class="dev-header-main">
        <img src="/static/images/h3_switch_core.svg" class="dev-img">
        <div class="dev-info">
          <div class="dev-name-row">
            <span class="dev-name">{{ device_info.sysname || '未知设备' }}</span>
            <el-tag v-if="vendor" size="mini" effect="dark" class="vendor-tag">{{ vendor }}</el-tag>
          </div>
          <div class="dev-meta">
            <span class="meta-item">
              <i class="el-icon-place"></i>
              <span class="mono">{{ device_info.ip || '-' }}</span>
              <i v-if="device_info.ip" class="el-icon-document-copy copy-btn" title="复制" @click="copyText(device_info.ip)"></i>
            </span>
            <span class="meta-item">
              <i class="el-icon-time"></i>采集时间：{{ device_info.timestamp || '-' }}
            </span>
          </div>
        </div>
        <div class="dev-actions">
          <el-button size="small" icon="el-icon-refresh" :disabled="!device_info.ip" @click="refresh">刷新</el-button>
          <el-button size="small" icon="el-icon-share" :loading="isload1" :disabled="!device_info.ip" @click="showtopo()">相关设备</el-button>
          <el-button size="small" icon="el-icon-edit-outline" :disabled="!device_info.ip" @click="diy_exec">自定义查询</el-button>
          <el-button size="small" type="primary" icon="el-icon-monitor" :disabled="!device_info.ip" @click="showXterm">远程连接</el-button>
        </div>
      </div>
      <div class="dev-desc" :title="device_info.sysdesc">{{ device_info.sysdesc || '暂无设备描述' }}</div>

      <!-- 端口统计，点击快速筛选 -->
      <div class="stat-grid">
        <div class="stat-item" :class="{ active: filter_portstatu === '' }" @click="quickStatus('')">
          <div class="stat-value">{{ portStats.total }}</div>
          <div class="stat-label">端口总数</div>
        </div>
        <div class="stat-item stat-up" :class="{ active: filter_portstatu === '1' }" @click="quickStatus('1')">
          <div class="stat-value">{{ portStats.up }}</div>
          <div class="stat-label">UP</div>
        </div>
        <div class="stat-item stat-down" :class="{ active: filter_portstatu === '2' }" @click="quickStatus('2')">
          <div class="stat-value">{{ portStats.down }}</div>
          <div class="stat-label">Down</div>
        </div>
        <div class="stat-item stat-admin" :class="{ active: filter_portstatu === '3' }" @click="quickStatus('3')">
          <div class="stat-value">{{ portStats.adminDown }}</div>
          <div class="stat-label">Admin Down</div>
        </div>
        <div class="stat-item stat-plain">
          <div class="stat-value">{{ portStats.lldp }}</div>
          <div class="stat-label">有 LLDP 邻居</div>
        </div>
        <div class="stat-item stat-plain">
          <div class="stat-value">{{ portStats.withIp }}</div>
          <div class="stat-label">有接口 IP</div>
        </div>
      </div>
    </div>

    <!-- 设备快捷查询 -->
    <div class="panel">
      <div class="panel-title"><i class="el-icon-s-data"></i>设备查询</div>
      <div class="quick-groups">
        <div class="quick-group" v-for="g in quick_groups" :key="g.title">
          <span class="quick-group-title">{{ g.title }}</span>
          <el-button
            v-for="q in g.items"
            :key="q.key"
            size="mini"
            plain
            :icon="loadingKey === q.key ? '' : q.icon"
            :loading="loadingKey === q.key"
            :disabled="!device_info.ip"
            @click="runQuick(q)">{{ q.label }}</el-button>
        </div>
      </div>
    </div>

    <!-- 端口列表 -->
    <div class="panel">
      <div class="port-toolbar">
        <div class="panel-title">
          <i class="el-icon-connection"></i>端口列表
          <span class="port-count">{{ port_total }} / {{ port_info.length }}</span>
        </div>
        <el-form class="port-filter" size="mini" :inline="true" @submit.native.prevent>
          <el-form-item>
            <el-input placeholder="端口名称" v-model="filter_portname" @keyup.enter.native="filter_ports" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-input placeholder="端口描述" v-model="filter_portalias" @keyup.enter.native="filter_ports" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="filter_portstatu" placeholder="端口状态" clearable @change="filter_ports" style="width: 120px;">
              <el-option label="UP" value="1"></el-option>
              <el-option label="Down" value="2"></el-option>
              <el-option label="Admin Down" value="3"></el-option>
              <el-option label="Unknown" value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input placeholder="接口IP" v-model="filter_ip" @keyup.enter.native="filter_ports" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-input placeholder="LLDP 邻居" v-model="filter_lldp" @keyup.enter.native="filter_ports" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="filter_ports()">筛选</el-button>
            <el-button icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
            <el-tooltip placement="top" content="支持正则匹配；端口名称、端口描述以 ~ 开头表示排除匹配项">
              <i class="el-icon-question filter-help"></i>
            </el-tooltip>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="port_info_show"
        v-loading="portLoading"
        size="small"
        stripe
        class="port-table">
        <el-table-column prop="if_name" label="端口名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="port-name">{{ scope.row.if_name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="statusTagType(scope.row)">{{ statuFormat(scope.row) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="speed" label="带宽" width="80" align="center" :formatter="speedFormat"></el-table-column>

        <el-table-column prop="alias" label="描述" min-width="220" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.alias">{{ scope.row.alias }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="接口IP" min-width="170">
          <template slot-scope="scope">
            <template v-if="ipLines(scope.row.gw_ips).length">
              <span class="mono">{{ ipLines(scope.row.gw_ips)[0] }}</span>
              <el-popover v-if="ipLines(scope.row.gw_ips).length > 1" placement="bottom-start" trigger="hover" :open-delay="300" width="320">
                <div class="ip-pop">
                  <div class="mono" v-for="(ip, i) in ipLines(scope.row.gw_ips)" :key="i">{{ ip }}</div>
                </div>
                <el-tag slot="reference" size="mini" type="info" class="more-tag">+{{ ipLines(scope.row.gw_ips).length - 1 }}</el-tag>
              </el-popover>
            </template>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="LLDP 邻居" min-width="200">
          <template slot-scope="scope">
            <template v-if="lldpLines(scope.row.lldp).length">
              <div class="lldp-line" v-for="(n, i) in lldpLines(scope.row.lldp)" :key="i">
                <span v-if="!n.ip">{{ n.raw }}</span>
                <template v-else>
                  <router-link class="lldp-link" :to="detailLink(n.ip)" :title="n.ip">{{ n.name }}</router-link>
                  <span v-if="n.port" class="lldp-port">{{ n.port }}</span>
                </template>
              </div>
            </template>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="timestamp" label="采集时间" width="160"></el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" :loading="loadingKey === scope.row.if_name + '|cfg'" @click="disconfig(scope.row)">配置</el-button>
            <el-button size="mini" type="text" :loading="loadingKey === scope.row.if_name + '|int'" @click="disinterface(scope.row)">状态</el-button>
            <el-button size="mini" type="text" :loading="loadingKey === scope.row.if_name + '|trans'" @click="distransceiver(scope.row)">光衰</el-button>
            <el-button size="mini" type="text" @click="showEchartFlow(scope.row)">流量</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
          :current-page="port_currentPage"
          :page-sizes="[50, 100, 300, 500, 1000]"
          :page-size="port_pageSize"
          layout="total, sizes, prev, pager, next"
          :total="port_total"></el-pagination>
      </div>
    </div>

    <!-- 查询结果 -->
    <el-dialog :title="dialog_title" :visible.sync="dialog_Visible" :width="dialog_width" class="output-dialog">
      <el-input
        class="output-box"
        type="textarea"
        :rows="dialog_rows"
        resize="none"
        readonly
        v-model="dialog_infos">
      </el-input>
      <div slot="footer">
        <el-button size="small" icon="el-icon-document-copy" @click="copyText(dialog_infos, true)">复制结果</el-button>
        <el-button size="small" type="primary" @click="dialog_Visible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="'相关设备 - ' + (device_info.sysname || '')" :visible.sync="dialog_topo" width="80%">
      <topo_div
        v-bind:toponame="'test'"
        v-bind:position="topo_position"
        v-bind:node_list="topo_nodes"
        v-bind:link_list="topo_links"
        v-bind:chartswidth="'1200px'"
        v-bind:chartsheight="'800px'"
      ></topo_div>
    </el-dialog>

    <el-dialog :title="'自定义查询 - ' + (device_info.sysname || '') + ' ' + (device_info.ip || '')" :visible.sync="dialog_cmd_exec" width="75%">
      <div class="cmd-layout">
        <div class="cmd-main">
          <div class="cmd-input">
            <el-input placeholder="输入查询命令，回车执行" v-model="cmd_exec_str" size="small" clearable @keyup.enter.native="run_dev_cmds">
              <template slot="prepend"><i class="el-icon-arrow-right"></i></template>
            </el-input>
            <el-button type="primary" size="small" icon="el-icon-video-play" :loading="loading_exec" @click="run_dev_cmds">执行</el-button>
          </div>
          <el-input
            class="output-box"
            type="textarea"
            placeholder="执行结果"
            v-model="cmd_exec_ret"
            :rows="26"
            resize="none"
            :readonly="true"
          ></el-input>
        </div>
        <div class="cmd-hints">
          <div class="cmd-hints-title">常用命令参考<span>（点击填入）</span></div>
          <div class="cmd-hints-list">
            <template v-for="(h, i) in cmdHints">
              <div v-if="h.header" :key="'h' + i" class="hint-header">{{ h.text.replace(/^#+\s*/, '') }}</div>
              <div v-else-if="h.text.trim()" :key="'l' + i" class="hint-line" :title="h.text" @click="cmd_exec_str = h.cmd">{{ h.text }}</div>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog :title="'远程连接 - ' + webssh_target" :visible.sync="dialog_webssh" width="60%">
      <ssh_card
        v-if="dialog_webssh"
        v-bind:target_ip="webssh_target"
        @close_session="closeWebsshSession"
      ></ssh_card>
    </el-dialog>

    <el-dialog :title="'实时流量 - ' + (flow_p_info.sysname || device_info.sysname || '') + ' ' + (flow_p_info.if_name || '')" :visible.sync="dialog_flow" width="80%">
      <div class="flow-tip"><i class="el-icon-info"></i>采集间隔 <b>{{ flow_interval }}</b> 秒<span v-if="flow_p_info.alias">，端口描述：{{ flow_p_info.alias }}</span></div>
      <div v-if="dialog_flow" class="flow-charts">
        <div class="flow-chart">
          <echart_flow ref="device_sss1"
            v-bind:chartsname="'flow_band'"
            v-bind:port_info="flow_p_info"
            v-bind:chartsType="'line'"
            v-bind:chartswidth="'600px'"
            v-bind:chartsheight="'300px'"
            v-bind:interval="flow_interval"
            ></echart_flow>
        </div>
        <div class="flow-chart">
          <echart_error ref="device_sss2"
            v-bind:chartsname="'flow_error'"
            v-bind:port_info="flow_p_info"
            v-bind:chartsType="'line'"
            v-bind:chartswidth="'600px'"
            v-bind:chartsheight="'300px'"
            v-bind:interval="flow_interval"
            ></echart_error>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"
import topo_div from "@/components/topology/NetworkTopology.vue"
import ssh_card from "./components/xterm_window.vue"

import echart_flow from "@/components/echarts/echart_single_flow.vue"
import echart_error from "@/components/echarts/echart_single_error.vue"


export default {
  components:{
    topo_div,echart_flow,echart_error, ssh_card
  },
  data () {
    return {
      port_total: 0,
      port_currentPage: 1,
      port_pageSize:50,
      query_filter:"",
      device_info:{},
      lldp_info:"",
      port_info:[],
      port_filtered:[],
      port_info_show:[],
      filter_portname:"",
      filter_portalias:"",
      filter_portstatu:"",
      filter_ip:"",
      filter_lldp:"",
      devLoading:false,
      portLoading:false,

      //设备快捷查询，action 为空的走 disCommonFunc 模板查询
      quick_groups:[
        {title: "基础信息", items: [
          {key: "dis_cu", label: "当前配置", icon: "el-icon-document", title: "当前配置", width: "60%"},
          {key: "log", label: "最近日志", icon: "el-icon-tickets", action: "dislogging"},
          {key: "dis_inventory", label: "序列号", icon: "el-icon-price-tag", title: "序列号", width: "60%"},
          {key: "dis_board", label: "板卡", icon: "el-icon-files", title: "板卡信息", width: "60%"},
        ]},
        {title: "硬件状态", items: [
          {key: "dis_cpu", label: "CPU", icon: "el-icon-cpu", title: "CPU信息", width: "60%"},
          {key: "dis_mem", label: "内存", icon: "el-icon-coin", title: "内存信息", width: "60%"},
          {key: "dis_fan", label: "风扇", icon: "el-icon-wind-power", title: "风扇信息", width: "60%"},
          {key: "dis_power", label: "电源", icon: "el-icon-lightning", title: "电源信息", width: "60%"},
        ]},
        {title: "表项协议", items: [
          {key: "dis_vlans", label: "VLAN", icon: "el-icon-collection-tag", title: "VLAN详情", width: "60%"},
          {key: "arp", label: "ARP", icon: "el-icon-sort", action: "disarps"},
          {key: "route", label: "路由表", icon: "el-icon-guide", action: "disroutes"},
          {key: "dis_link_aggr", label: "聚合口", icon: "el-icon-connection", title: "聚合口信息", width: "60%"},
          {key: "dis_bgp_peer_v4", label: "BGP", icon: "el-icon-share", title: "BGP状态", width: "70%"},
        ]},
      ],
      loadingKey:"",

      //查询信息展示窗口
      dialog_title:"",
      dialog_Visible:false,
      dialog_width: "30%",
      dialog_rows: 30,
      dialog_infos:"",


      //拓扑信息展示窗口
      isload1:false,
      dialog_topo:false,
      topo_position:{},
      topo_nodes:[
        {"id":"1","label":"t1","title":"隐藏t1","group":"router","x":0, "y":0},
        {"id":"2","label":"t2","title":"隐藏t2","group":"router","x":100, "y":100},
        {"id":"3","label":"t3","title":"隐藏t3","group":"router","x":100, "y":0},
        {"id":"4","label":"t4","title":"隐藏t4","group":"router","x":-100, "y":0},
      ],
      topo_links:[
        {"id":"1","from":"1","to":"2","label":"test","color":{"color":"#333"}},
        {"id":"2","from":"1","to":"3","label":"test","color":{"color":"#333"}},
        {"id":"3","from":"1","to":"4","label":"test","color":{"color":"#333"}},
      ],
      lldp_data:{},

      //执行命令
      dialog_cmd_exec:false,
      cmd_exec_str:"",
      cmd_exec_ret:"",
      cmd_promot:"",
      loading_exec:false,

      //webssh
      dialog_webssh:false,
      webssh_target:"",

      //实时流量
      dialog_flow:false,
      flow_p_info:{},
      flow_interval: 5,

      cli_load:false,
    }
  },
  computed: {
    vendor () {
      const desc = this.device_info.sysdesc || ""
      if(/h3c/i.test(desc)) return "H3C"
      if(/huawei|huarong/i.test(desc)) return "Huawei"
      if(/cisco/i.test(desc)) return "Cisco"
      if(/ruijie/i.test(desc)) return "Ruijie"
      if(/arista/i.test(desc)) return "Arista"
      if(/juniper/i.test(desc)) return "Juniper"
      return ""
    },
    portStats () {
      const stats = {total: this.port_info.length, up: 0, down: 0, adminDown: 0, lldp: 0, withIp: 0}
      for(let i=0;i<this.port_info.length;i++){
        const row = this.port_info[i]
        const code = this.portStatusCode(row)
        if(code === 1) stats.up++
        else if(code === 2) stats.down++
        else if(code === 3) stats.adminDown++
        if(row.lldp && String(row.lldp).trim()) stats.lldp++
        if(row.gw_ips && String(row.gw_ips).trim()) stats.withIp++
      }
      return stats
    },
    cmdHints () {
      return (this.cmd_promot || "").split("\n").map(line => {
        const m = line.match(/^[\x20-\x7e]+/)
        return {text: line, header: /^#/.test(line), cmd: m ? m[0].trim() : line.trim()}
      })
    }
  },
  watch: {
    // 在详情页内点击 LLDP 邻居跳转时，组件复用，需要重新加载
    "$route.query.dev" (val) {
      if(typeof(val)=="string" && val){
        this.loadDevice(val)
      }
    }
  },
  mounted() {
    let query = this.$route.query;
    if(typeof(query.dev)!="string"){
      let cache = localStorage.getItem('fmManage_dev')
      if(typeof(cache)=="string"){
        //未带请求，使用缓存
        try {
          let cache_info = JSON.parse(cache)
          this.device_info = cache_info["device_info"] || {}
          this.setPorts(cache_info["port_info"])
        } catch (e) {
          console.log("缓存解析失败", e)
        }
      }
    }else{
      // 带请求的直接刷新
      this.loadDevice(query.dev)
    }
  },
  beforeRouteLeave(to, from, next) {
    let cache = {}
    cache["port_info"] = this.port_info
    cache["device_info"] = this.device_info
    localStorage.setItem('fmManage_dev', JSON.stringify(cache));
    next()
  },
  methods:{
    loadDevice(ip){
      this.getDeviceInfo(ip)
      this.getPorts(ip)
    },
    refresh(){
      if(this.device_info.ip){
        this.loadDevice(this.device_info.ip)
      }
    },
    //查询操作
    getDeviceInfo(ip){
      let that = this
      this.devLoading = true
      collector_api.getDevs({"ip":"^"+ip+"$"},{}).then(function(response){
        that.device_info = (response.data["data"] || [])[0] || {"ip": ip}
        that.devLoading = false
      }).catch(function (error) {
          console.log(error)
          that.devLoading = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    getPorts(ip){
      let that = this
      this.portLoading = true
      collector_api.getPorts_ex({"ip":"^"+ip+"$"},{}).then(function(response){
        if(response.data!="failed"){
          that.setPorts(response.data["data"])
        }
        that.portLoading = false
      }).catch(function (error) {
          console.log(error)
          that.portLoading = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    setPorts(list){
      this.port_info = Array.isArray(list) ? list : []
      this.filter_ports()
    },

    //页面数据转换
    speedFormat(row, column){
      // speed 单位为 Mbps
      const speed = parseInt(row.speed)
      if(!speed){
        return "-"
      }
      if(speed >= 1000){
        return parseFloat((speed / 1000).toFixed(1)) + "G"
      }
      return speed + "M"
    },
    // 1:UP 2:Down 3:Admin Down 4:Unknown
    portStatusCode(row){
      if(row.oper_statu=="1"){
        return 1
      }else if(row.admin_statu=="1"){
        return 2
      }else if(row.admin_statu=="2"){
        return 3
      }
      return 4
    },
    statuFormat(row, column){
      return ["", "UP", "Down", "Admin Down", "Unknown"][this.portStatusCode(row)]
    },
    statusTagType(row){
      return ["", "success", "danger", "info", "warning"][this.portStatusCode(row)]
    },
    ipLines(str){
      return (str || "").split("\n").map(s => s.trim()).filter(Boolean)
    },
    // lldp 每行格式：邻居IP/邻居名称[/邻居端口]
    lldpLines(str){
      return (str || "").split("\n").filter(s => s.trim()).map(line => {
        const parts = line.split("/")
        return {raw: line, ip: parts[0], name: parts[1] || line, port: parts.slice(2).join("/")}
      })
    },
    detailLink(ip){
      return {path: '/pages/device/device_detail', query: {dev: ip}}
    },

    //弹出对话框展示查询信息
    dialog_show(title, msg, width="60%",rows=20){
      msg = msg === undefined || msg === null ? "" : String(msg)
      this.dialog_title = title
      this.dialog_width = width
      let arrys = msg.split("\n")
      this.dialog_rows = Math.max(Math.min(arrys.length, 30), 5)
      this.dialog_infos = msg
      this.dialog_Visible = true
      this.loadingKey = ""
    },
    // 通用：发起查询并弹窗展示结果
    fetchAndShow(key, request, title, width){
      let that = this
      this.loadingKey = key
      request().then(function(response){
        that.dialog_show(title, response.data["data"], width)
      }).catch(function (error) {
          console.log(error)
          that.loadingKey = ""
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    runQuick(q){
      if(q.action){
        this[q.action]()
      }else{
        this.disCommonFunc(q.key, q.title, q.width)
      }
    },

    //表格操作
    updatePage(){
      this.port_total = this.port_filtered.length
      this.port_info_show = this.port_filtered.slice((this.port_currentPage-1)*this.port_pageSize,this.port_currentPage*this.port_pageSize)
    },
    //修改页码
    handleCurrentChange (val) {
      this.port_currentPage = val
      this.updatePage()
    },
    //修改一页总数
    handleSizeChange(val){
      this.port_pageSize = val
      this.port_currentPage = 1
      this.updatePage()
    },
    quickStatus(code){
      this.filter_portstatu = code
      this.filter_ports()
    },
    resetFilter(){
      this.filter_portname = ""
      this.filter_portalias = ""
      this.filter_portstatu = ""
      this.filter_ip = ""
      this.filter_lldp = ""
      this.filter_ports()
    },
    //筛选过滤，各条件之间为“且”的关系
    filter_ports(){
      // 以 ~ 开头表示取反
      const buildReg = (str, allowNeg) => {
        str = (str || "").replace(/^\s*|\s*$/g,"")
        let neg = false
        if(allowNeg && str[0]=="~"){
          neg = true
          str = str.substring(1)
        }
        return str ? {reg: RegExp(str, "i"), neg: neg} : null
      }

      let f_name, f_alias, f_gw, f_lldp
      try {
        f_name = buildReg(this.filter_portname, true)
        f_alias = buildReg(this.filter_portalias, true)
        f_gw = buildReg(this.filter_ip, false)
        f_lldp = buildReg(this.filter_lldp, false)
      } catch (e) {
        this.$message({type: 'warning', message: '筛选条件不是合法的正则表达式'})
        return
      }
      const match = (f, val) => !f || (f.reg.test(val || "") !== f.neg)
      const status = this.filter_portstatu

      this.port_filtered = this.port_info.filter(row => {
        if(!match(f_name, row.if_name)) return false
        if(!match(f_alias, row.alias)) return false
        if(status && String(this.portStatusCode(row)) !== String(status)) return false
        if(!match(f_gw, row.gw_ips)) return false
        if(!match(f_lldp, row.lldp)) return false
        return true
      })
      this.port_currentPage = 1
      this.updatePage()
    },
    //配置操作
    disconfig(row){
      this.fetchAndShow(row.if_name + "|cfg", () => collector_api.getCurrentInterface({"ip":row.ip,"if_name":row.if_name},{}), "接口配置 - " + row.if_name, "60%")
    },
    //查看端口状态
    disinterface(row){
      this.fetchAndShow(row.if_name + "|int", () => collector_api.getInterface({"ip":row.ip,"if_name":row.if_name},{}), "接口状态 - " + row.if_name, "50%")
    },
    //查看端口光衰
    distransceiver(row){
      this.fetchAndShow(row.if_name + "|trans", () => collector_api.getTransceiver({"ip":row.ip,"if_name":row.if_name},{}), "接口光衰信息 - " + row.if_name, "50%")
    },

    //查看日志
    dislogging(){
      this.$prompt('请输入日志长度，默认200', '最近日志', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /(\d+)|(\s*)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
        this.fetchAndShow("log", () => collector_api.getLogging({"ip":this.device_info.ip,"size":value},{}), "设备日志", "80%")
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
      });
    },

    //查看arp信息
    disarps(){
      this.$prompt('请输入地址所在VLAN或明细地址，默认全部展示', 'ARP 查询', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /(\d+)|(\s*)|([\d.]+)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
        let ipReg=/^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/;
        let params = {"ip":this.device_info.ip,"vlan_id":"","arp_ip":""}
        if(ipReg.test(value)){
          params["arp_ip"] = value
        }else if(/\d+/.test(value)){
          params["vlan_id"] = value
        }
        this.fetchAndShow("arp", () => collector_api.getARPs(params,{}), "设备ARP", "50%")
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
      });
    },

    //查询路由表
    disroutes(){
      this.$prompt('请输入IP地址，默认为127.0.0.1', '路由表查询', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /([\d.]+)|(\s*)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
        this.fetchAndShow("route", () => collector_api.getRoutes({"ip":this.device_info.ip,"route":value},{}), "设备路由", "80%")
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
      });
    },

    disCommonFunc(temp,title,width){
      this.fetchAndShow(temp, () => collector_api.getCommonFunction({"ip":this.device_info.ip, "template_name":temp},{}), title || "信息展示", width || "50%")
    },


    //显示相关拓扑
    showtopo(){
      let that = this
      this.isload1 = true
      if(this.device_info.ip){
        collector_api.getLLDPS({"loc_ip":"^"+this.device_info.ip+"$"},{}).then(function(response){
          if(response.data["code"]===0){
            let topo_info = []
            let lldp_data = response.data["data"]
            for(let i=0;i<lldp_data.length;i++){
              let dev_info = {}
              dev_info["loc_ip"] = lldp_data[i].loc_ip
              dev_info["loc_name"] = lldp_data[i].loc_name
              dev_info["loc_portname"] = lldp_data[i].loc_portname
              dev_info["loc_alias"] = lldp_data[i].loc_portalias
              dev_info["rem_ip"] = lldp_data[i].rem_ip
              dev_info["rem_name"] = lldp_data[i].rem_name
              dev_info["rem_portname"] = lldp_data[i].rem_portname
              topo_info.push(dev_info)
            }
            that.create_topo(topo_info)
          }else{
            collector_api.getLLDPS({"rem_ip":"^"+that.device_info.ip+"$"},{}).then(function(response){
              if(response.data["code"]===0){
                let topo_info = []
                let lldp_data = response.data["data"]
                for(let i=0;i<lldp_data.length;i++){
                  let dev_info = {}
                  dev_info["loc_ip"] = lldp_data[i].rem_ip
                  dev_info["loc_name"] = lldp_data[i].rem_name
                  dev_info["loc_portname"] = lldp_data[i].rem_portname
                  dev_info["loc_alias"] = lldp_data[i].rem_portalias
                  dev_info["rem_ip"] = lldp_data[i].loc_ip
                  dev_info["rem_name"] = lldp_data[i].loc_name
                  dev_info["rem_portname"] = lldp_data[i].loc_portname
                  topo_info.push(dev_info)
                }
                that.create_topo(topo_info)
              }else{
                that.$message({
                  type: 'error',
                  message: '查询失败，请重试'
                });
              }
            }).catch(function (error) {
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
            })
          }
          that.isload1 = false
        }).catch(function (error) {
            console.log(error)
            that.isload1 = false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      }else{
        this.isload1 = false
      }
    },

    //创建拓扑
    create_topo(topo_info){
      this.lldp_data = {}
      for(let i=0;i<topo_info.length;i++){
        if(topo_info[i].rem_ip==""){
          continue
        }
        if(this.lldp_data[topo_info[i].rem_ip]){
          this.lldp_data[topo_info[i].rem_ip]["ports"].push({"local":topo_info[i].loc_portname,"remote":topo_info[i].rem_portname})
        }else{
          this.lldp_data[topo_info[i].rem_ip] = {}
          this.lldp_data[topo_info[i].rem_ip]["name"] = topo_info[i].rem_name
          if(/uT:/.test(topo_info[i].loc_alias)){
            this.lldp_data[topo_info[i].rem_ip]["dev_type"] = "ut"
          }else if(/dT:/.test(topo_info[i].loc_alias)){
            this.lldp_data[topo_info[i].rem_ip]["dev_type"] = "dt"
          }else{
            this.lldp_data[topo_info[i].rem_ip]["dev_type"] = "pt"
          }
          this.lldp_data[topo_info[i].rem_ip]["ports"] = []
          this.lldp_data[topo_info[i].rem_ip]["ports"].push({"local":topo_info[i].loc_portname,"remote":topo_info[i].rem_portname})
        }
      }

      let neighbors = Object.keys(this.lldp_data)


      //创建节点
      this.topo_nodes = [{"id":this.device_info.ip,"label":this.device_info.sysname,"title":this.device_info.ip,"group":"switch","x":0,"y":0}]
      this.topo_links = []

      //ut 上联一排，pt 平行一排，dt 下联多排
      let ut_position = 0
      let pt_position = 0
      let dt_position = 0
      let dt_row =0
      for(let i=0;i<neighbors.length;i++){
        if(this.device_info.ip == neighbors[i]){
          continue
        }
        let node_label = {}
        node_label["id"] = neighbors[i]
        node_label["label"] = this.lldp_data[neighbors[i]]["name"]+"_"+neighbors[i]
        node_label["title"] = neighbors[i]
        node_label["group"] = "switch"
        if(this.lldp_data[neighbors[i]]["dev_type"]=="ut"){
          node_label["x"] = ut_position
          node_label["y"] = -400
          if(ut_position>0){
            ut_position = -(ut_position)
          }else{
            ut_position = -ut_position + 300
          }
        }else if(this.lldp_data[neighbors[i]]["dev_type"]=="pt"){
          node_label["x"] = pt_position
          node_label["y"] = -200
          if(pt_position>0){
            pt_position = -(pt_position)
          }else{
            pt_position = -pt_position + 300
          }
        }else{
          node_label["x"] = dt_position
          node_label["y"] = 200 + dt_row*200
          if(dt_position>0){
            dt_position = -(dt_position)
          }else{
            dt_position = -dt_position + 300
          }
          if(dt_position>1000){
            dt_position=0
            dt_row = dt_row +1
          }
        }

        this.topo_nodes.push(node_label)

        let link_label = {}
        link_label["id"] = this.device_info.ip+"@"+neighbors[i]
        link_label["from"] = this.device_info.ip
        link_label["to"] = neighbors[i]
        let link_labels = []
        for(let l=0;l<this.lldp_data[neighbors[i]]["ports"].length;l++){
          link_labels.push(this.lldp_data[neighbors[i]]["ports"][l].local)
        }

        link_label["label"] = link_labels.join(",")
        link_label["color"] = {"color":"#333"}
        this.topo_links.push(link_label)
      }
      this.dialog_topo = true
    },

    diy_exec(){
      this.dialog_cmd_exec=true;

      let exec_promot_dict = {
        "h3c":"##华为华三\ndis dev\ndis health 板卡电源 温度\ndis device manu 硬件sn\ndis device power system 丨 exclude power not available 华为看电源以及板卡信息\ndis board reset 4 重启记录\ndis device temperature slot 1\ndis sn / dis power manufacture-info slot 25\ndis trans int verbose交换机华为\ndis elabel optical-module int NE40E\ndis elabel NE5000\n## 风扇\ndis device fan\ndis sn\n## 华三光模块信息\n## 收发光 \ndis trans dia int\ndis int crc\ndis trans int   Port\ndis lacp statistics eth-trunk 7 聚合口交互信息\ndis dhcp relay statistics\ndis bgp vpnv4 all peer\ndis bgp peer ipv4 bgp从ipv4学到的路由\ndis bgp routing-table peer 1.1.1.1 received-routes 丨 in 2.2",
        "huawei":"##华为华三\ndis dev\ndis health 板卡电源 温度\ndis device manu 硬件sn\ndis device power system 丨 exclude power not available 华为看电源以及板卡信息\ndis board reset 4 重启记录\ndis device temperature slot 1\ndis sn / dis power manufacture-info slot 25\ndis trans int verbose交换机华为\ndis elabel optical-module int NE40E\ndis elabel NE5000\n## 风扇\ndis device fan\ndis sn\n## 华三光模块信息\n## 收发光 \ndis trans dia int\ndis int crc\ndis trans int   Port\ndis lacp statistics eth-trunk 7 聚合口交互信息\ndis dhcp relay statistics\ndis bgp vpnv4 all peer\ndis bgp peer ipv4 bgp从ipv4学到的路由\ndis bgp routing-table peer 1.1.1.1 received-routes 丨 in 2.2",
        "cisco":"## 思科锐捷\nshow platform\nshow int e1/1 trans detail\nshow controllers \nshow environment power/fan\nshow module\nshow running-config prefix-set 丨 in 11.112.208",
        "cisco-xr":"## 思科锐捷\nshow platform\nshow int e1/1 trans detail\nshow controllers \nshow environment power/fan\nshow module\nshow running-config prefix-set 丨 in 11.112.208",
        "ruijie":"## 思科锐捷\nshow platform\nshow int e1/1 trans detail\nshow controllers \nshow environment power/fan\nshow module\nshow running-config prefix-set 丨 in 11.112.208",
        "arista": "## arista\nshow int 接口 trans csv收发光\nshow inventory 查sn\nshow ip bgp summary vrf all 查bgp vrf邻居\nshow ip bgp neighbors 1.1.1.1 advertised-routes\nshow environment power电源\nshow system envir cooling风扇",
        "juniper": "## Juniper\nshow chassis hardware detail 查sn\nshow chassis fpc\n"
      }
      const vendorKey = this.vendor ? this.vendor.toLowerCase() : "h3c"
      this.cmd_promot = exec_promot_dict[vendorKey] || exec_promot_dict["h3c"]
    },

    run_dev_cmds(){
      let that = this
      let cmds = this.cmd_exec_str.replace(/^\s*|\s*$/g,"")
      if(!cmds){
        this.$message({type: 'warning', message: '请输入命令'})
        return
      }
      let post_data = {
        "ip": this.device_info["ip"],
        "cmds": cmds
      }

      this.loading_exec = true
      collector_api.execDiyCmds(post_data,{}).then(function(response){
        that.cmd_exec_ret=response.data["data"];
        that.loading_exec = false
      }).catch(function (error) {
          console.log(error)
          that.loading_exec = false
          that.$message({
            type: 'error',
            message: '操作失败，请重试'
          });
      })

    },

    showEchartFlow(row){
      let temp = {
        "ip":row["ip"],
        "if_name":row["if_name"],
        "port_id":row["port_id"],
        "sysname":row["sysname"],
        "alias": row["alias"],
      }
      this.dialog_flow=false
      this.flow_p_info=temp
      if(/(h3c)|(huawei)|(huarong)/i.test(this.device_info["sysdesc"])){
        this.flow_interval=6
      }else{
        this.flow_interval=16
      }
      this.dialog_flow=true
    },
    showXterm(){
      this.webssh_target = this.device_info["ip"]
      this.dialog_webssh=true;
    },
    closeWebsshSession(){
      this.dialog_webssh=false;
    },

    copyText(text, showShort){
      if(!text){
        return
      }
      const done = () => this.$message({type: 'success', message: showShort ? '已复制' : '已复制：' + text, duration: 1500})
      if(navigator.clipboard && window.isSecureContext){
        navigator.clipboard.writeText(text).then(done)
        return
      }
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      done()
    },
  }

}
</script>

<style scoped>
.device-detail {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}

/* 设备概览 */
.dev-header {
  padding: 18px 20px 16px;
  border-radius: 6px;
  border: 1px solid #e3eefc;
  background: linear-gradient(135deg, #eef5ff 0%, #f7fbff 60%, #ffffff 100%);
}
.dev-header-main {
  display: flex;
  align-items: center;
}
.dev-img {
  width: 60px;
  height: 60px;
  padding: 6px;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}
.dev-info {
  flex: 1;
  min-width: 0;
  margin-left: 16px;
}
.dev-name-row {
  display: flex;
  align-items: center;
}
.dev-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vendor-tag {
  margin-left: 10px;
}
.dev-meta {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
}
.meta-item {
  margin-right: 24px;
  line-height: 22px;
}
.meta-item > i:first-child {
  margin-right: 4px;
  color: #909399;
}
.dev-actions {
  flex-shrink: 0;
  margin-left: 16px;
}
.dev-desc {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 18px;
  color: #606266;
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 端口统计 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.stat-item {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  border-left: 3px solid #409eff;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.stat-item:hover,
.stat-item.active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #b3d8ff;
  border-left-color: #409eff;
}
.stat-item.active {
  background-color: #ecf5ff;
}
.stat-up { border-left-color: #67c23a !important; }
.stat-down { border-left-color: #f56c6c !important; }
.stat-admin { border-left-color: #909399 !important; }
.stat-plain {
  border-left-color: #c0c4cc !important;
  cursor: default;
}
.stat-plain:hover {
  box-shadow: none;
  border-color: #ebeef5;
}
.stat-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}
.stat-up .stat-value { color: #67c23a; }
.stat-down .stat-value { color: #f56c6c; }
.stat-label {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

/* 面板 */
.panel {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fff;
}
.panel-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}
.panel-title > i {
  margin-right: 6px;
  color: #409eff;
}

/* 快捷查询 */
.quick-groups {
  margin-top: 10px;
}
.quick-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 6px 0;
}
.quick-group + .quick-group {
  border-top: 1px dashed #ebeef5;
}
.quick-group-title {
  width: 72px;
  flex-shrink: 0;
  font-size: 13px;
  color: #909399;
}
.quick-group .el-button {
  margin: 3px 8px 3px 0;
}

/* 端口列表 */
.port-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
.port-count {
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 9px;
  color: #409eff;
  background-color: #ecf5ff;
}
.port-filter {
  margin-top: 6px;
}
.port-filter /deep/ .el-form-item {
  margin-bottom: 6px;
  margin-right: 8px;
}
.port-filter /deep/ .el-input {
  width: 140px;
}
.filter-help {
  margin-left: 8px;
  color: #909399;
  cursor: help;
}
.port-table {
  margin-top: 6px;
}
.port-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.port-name {
  font-weight: 500;
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.more-tag {
  margin-left: 6px;
  cursor: pointer;
}
.ip-pop {
  max-height: 300px;
  overflow-y: auto;
  line-height: 22px;
}
.lldp-line {
  line-height: 20px;
}
.lldp-link {
  color: #409eff;
  text-decoration: none;
}
.lldp-link:hover {
  text-decoration: underline;
}
.lldp-port {
  margin-left: 6px;
  font-size: 12px;
  color: #909399;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* 复制按钮 */
.copy-btn {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
}

/* 命令输出：终端风格 */
.output-box /deep/ .el-textarea__inner {
  padding: 10px 12px;
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #d4d4d4;
  background-color: #1e1e1e;
  border-color: #1e1e1e;
}
.output-box /deep/ .el-textarea__inner::placeholder {
  color: #6a6a6a;
}
.output-dialog /deep/ .el-dialog__body {
  padding: 10px 20px;
}

/* 自定义查询 */
.cmd-layout {
  display: flex;
}
.cmd-main {
  flex: 1;
  min-width: 0;
}
.cmd-input {
  display: flex;
  margin-bottom: 10px;
}
.cmd-input .el-input {
  flex: 1;
  margin-right: 8px;
}
.cmd-input /deep/ .el-input__inner {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.cmd-hints {
  width: 300px;
  flex-shrink: 0;
  margin-left: 14px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}
.cmd-hints-title {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.cmd-hints-title span {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}
.cmd-hints-list {
  flex: 1;
  max-height: 560px;
  overflow-y: auto;
  padding: 4px 0;
}
.hint-header {
  padding: 8px 12px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
}
.hint-line {
  padding: 3px 12px;
  font-size: 12px;
  font-family: Menlo, Consolas, "Courier New", monospace;
  color: #606266;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hint-line:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

/* 实时流量 */
.flow-tip {
  margin-bottom: 10px;
  font-size: 13px;
  color: #606266;
}
.flow-tip i {
  margin-right: 4px;
  color: #409eff;
}
.flow-tip b {
  color: #f56c6c;
}
.flow-charts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.flow-chart {
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
</style>
