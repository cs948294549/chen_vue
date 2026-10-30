<template>
  <div class="device-panel">
    <!-- 设备信息 -->
    <div class="dev-card">
      <div class="dev-icon">
        <img src="/static/images/h3_switch_core.svg" alt="">
      </div>
      <div class="dev-main">
        <div class="dev-title">
          <span class="dev-name" :title="device_info.sysname">{{ device_info.sysname || '-' }}</span>
          <span v-if="vendorText" class="vendor-tag">{{ vendorText }}</span>
        </div>
        <div class="dev-sub">
          <span><i class="el-icon-location-outline"></i><span class="mono">{{ device_info.ip || ip }}</span></span>
          <span><i class="el-icon-time"></i>采集于 {{ device_info.timestamp || '-' }}</span>
        </div>
        <div class="dev-desc" :title="device_info.sysdesc">{{ device_info.sysdesc || '暂无设备描述' }}</div>
      </div>
      <div class="dev-stats">
        <div class="stat">
          <b>{{ port_info.length }}</b><span>端口</span>
        </div>
        <div class="stat up">
          <b>{{ portStats.up }}</b><span>UP</span>
        </div>
        <div class="stat down">
          <b>{{ portStats.down }}</b><span>Down</span>
        </div>
      </div>
    </div>

    <!-- 设备操作 -->
    <div class="action-bar">
      <el-dropdown trigger="click" @command="handleQuery">
        <el-button size="small" type="primary" plain icon="el-icon-search" :loading="isload || isload1">
          设备查询<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="(m, i) in queryMenus"
            :key="m.key"
            :command="m.key"
            :icon="m.icon"
            :divided="i > 0 && m.group !== queryMenus[i - 1].group">{{ m.label }}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-button size="small" icon="el-icon-edit-outline" @click="diy_exec">自定义查询</el-button>
      <el-button size="small" icon="el-icon-monitor" @click="showXterm">SSH 远程连接</el-button>
    </div>

    <!-- 端口列表 -->
    <div class="port-toolbar">
      <div class="section-title">
        <i class="el-icon-s-operation"></i>端口列表
        <span class="count-badge">
          {{ port_total }}<template v-if="port_total !== port_info.length"> / {{ port_info.length }}</template>
        </span>
      </div>
      <div class="filter-bar">
        <el-input class="f-item" size="small" placeholder="端口名称" v-model="filter_portname" @keyup.enter.native="filter_ports" clearable></el-input>
        <el-input class="f-item" size="small" placeholder="端口描述" v-model="filter_portalias" @keyup.enter.native="filter_ports" clearable></el-input>
        <el-select class="f-item f-status" size="small" v-model="filter_portstatu" placeholder="端口状态" clearable @change="filter_ports">
          <el-option label="UP" value="1"></el-option>
          <el-option label="Down" value="2"></el-option>
          <el-option label="Admin Down" value="3"></el-option>
          <el-option label="Unknown" value="4"></el-option>
        </el-select>
        <el-input class="f-item" size="small" placeholder="接口IP" v-model="filter_ip" @keyup.enter.native="filter_ports" clearable></el-input>
        <el-input class="f-item" size="small" placeholder="LLDP 邻居" v-model="filter_lldp" @keyup.enter.native="filter_ports" clearable></el-input>
        <el-button size="small" type="primary" icon="el-icon-search" @click="filter_ports">筛选</el-button>
        <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
        <el-tooltip placement="top" content="端口名称 / 描述支持正则，以 ~ 开头表示取反">
          <i class="el-icon-question filter-help"></i>
        </el-tooltip>
      </div>
    </div>

    <el-table
      :data="port_info_show"
      v-loading="port_loading"
      :default-sort="{prop: 'port_id'}"
      size="small"
      stripe
      class="port-table">
      <template slot="empty">
        <el-empty :image-size="70" :description="port_info.length ? '没有匹配筛选条件的端口' : '暂无端口数据'"></el-empty>
      </template>

      <el-table-column prop="if_name" label="端口名称" show-overflow-tooltip min-width="150">
        <template slot-scope="scope">
          <span class="mono port-name">{{ scope.row.if_name }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="speed" label="带宽" width="72" align="center">
        <template slot-scope="scope">{{ speedFormat(scope.row) }}</template>
      </el-table-column>

      <el-table-column prop="statu" label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="statuType(scope.row)" disable-transitions>{{ statuFormat(scope.row) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="alias" label="描述" show-overflow-tooltip min-width="200">
        <template slot-scope="scope">
          <span v-if="scope.row.alias">{{ scope.row.alias }}</span>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="gw_ips" label="接口IP" min-width="140">
        <template slot-scope="scope">
          <el-popover v-if="scope.row.gw_ips" placement="bottom-start" width="420" trigger="hover" :open-delay="300">
            <pre class="pop-pre">{{ scope.row.gw_ips }}</pre>
            <span slot="reference" class="ip-ref">
              <span class="mono">{{ ipLines(scope.row.gw_ips)[0] }}</span>
              <span v-if="ipLines(scope.row.gw_ips).length > 1" class="more-badge">+{{ ipLines(scope.row.gw_ips).length - 1 }}</span>
            </span>
          </el-popover>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="lldp" label="LLDP 邻居" min-width="160">
        <template slot-scope="scope">
          <template v-if="lldpLines(scope.row).length">
            <div v-for="(line, i) in lldpLines(scope.row)" :key="i" class="lldp-line" :title="line">
              <i class="el-icon-connection"></i>{{ line }}
            </div>
          </template>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="timestamp" label="采集时间" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="time-text">{{ scope.row.timestamp }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="176" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="mini" :disabled="isload" @click="disconfig(scope.row)">配置</el-button>
          <el-button type="text" size="mini" :disabled="isload" @click="disinterface(scope.row)">状态</el-button>
          <el-button type="text" size="mini" :disabled="isload" @click="distransceiver(scope.row)">光衰</el-button>
          <el-button type="text" size="mini" @click="showEchartFlow(scope.row)">流量</el-button>
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
        :total="port_total">
      </el-pagination>
    </div>

    <!-- 查询结果 -->
    <el-dialog :visible.sync="dialog_Visible" :width="dialog_width" top="6vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-document"></i>{{ dialog_title }}
        <span class="dt-sub">{{ device_info.sysname }}<span class="mono"> {{ device_info.ip }}</span></span>
      </div>
      <el-input
        type="textarea"
        class="result-text"
        :rows="dialog_rows"
        resize="none"
        readonly
        v-model="dialog_infos">
      </el-input>
    </el-dialog>

    <!-- 相关设备拓扑 -->
    <el-dialog :visible.sync="dialog_topo" width="80%" top="5vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-share"></i>相关设备
        <span class="count-badge">{{ topo_nodes.length > 0 ? topo_nodes.length - 1 : 0 }} 个邻居</span>
        <span class="dt-sub">基于 LLDP 邻居关系生成</span>
      </div>
      <div class="topo-box">
        <topo_div
          v-if="dialog_topo"
          v-bind:toponame="'device_detail_topo'"
          v-bind:position="topo_position"
          v-bind:node_list="topo_nodes"
          v-bind:link_list="topo_links"
          v-bind:chartswidth="'1200px'"
          v-bind:chartsheight="'800px'"
        ></topo_div>
      </div>
    </el-dialog>

    <!-- 自定义查询 -->
    <el-dialog :visible.sync="dialog_cmd_exec" width="60%" top="6vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-edit-outline"></i>自定义查询
        <span class="dt-sub">{{ device_info.sysname }}<span class="mono"> {{ device_info.ip }}</span></span>
      </div>
      <div class="cmd-bar">
        <el-input
          v-model="cmd_exec_str"
          class="cmd-input"
          size="small"
          placeholder="输入查询命令，回车执行"
          clearable
          @keyup.enter.native="run_dev_cmds">
          <template slot="prepend"><i class="el-icon-arrow-right"></i></template>
        </el-input>
        <el-button size="small" type="primary" icon="el-icon-video-play" :loading="loading_exec" @click="run_dev_cmds">执行</el-button>
        <el-popover placement="left-start" width="440" trigger="hover">
          <pre class="pop-pre cmd-ref">{{ cmd_promot }}</pre>
          <el-button slot="reference" size="small" icon="el-icon-reading">命令参考</el-button>
        </el-popover>
      </div>
      <div class="cmd-result" v-loading="loading_exec" element-loading-background="rgba(30, 30, 30, 0.6)">
        <pre v-if="cmd_exec_ret">{{ cmd_exec_ret }}</pre>
        <div v-else class="cmd-placeholder">执行结果将显示在这里</div>
      </div>
    </el-dialog>

    <!-- SSH -->
    <el-dialog :visible.sync="dialog_webssh" width="60%" top="6vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-monitor"></i>SSH 远程连接
        <span class="dt-sub mono">{{ webssh_target }}</span>
      </div>
      <ssh_card
        v-if="dialog_webssh"
        v-bind:target_ip="webssh_target"
        @close_session="closeWebsshSession"
      ></ssh_card>
    </el-dialog>

    <!-- 实时流量 -->
    <el-dialog :visible.sync="dialog_flow" width="1280px" top="8vh" append-to-body>
      <div slot="title" class="dialog-title">
        <i class="el-icon-data-line"></i>实时流量
        <span class="dt-sub">
          {{ flow_p_info.sysname || device_info.sysname }}
          <span class="mono">{{ flow_p_info.if_name }}</span>
        </span>
        <span class="interval-tag">采集间隔 {{ flow_interval }}s</span>
      </div>
      <div v-if="flow_p_info.alias" class="flow-alias"><i class="el-icon-price-tag"></i>{{ flow_p_info.alias }}</div>
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
import ssh_card from "@/view/pages/device/components/xterm_window.vue"

import echart_flow from "@/components/echarts/echart_single_flow.vue"
import echart_error from "@/components/echarts/echart_single_error.vue"

// 设备查询菜单：带 tpl 的走 getCommonFunction 模板，其余为专用查询
const QUERY_MENUS = [
  { key: "topo", label: "相关设备", icon: "el-icon-share", group: "base" },
  { key: "dis_cu", label: "当前配置", icon: "el-icon-document", group: "base", tpl: "dis_cu", title: "当前配置", width: "60%" },
  { key: "logging", label: "最近日志", icon: "el-icon-tickets", group: "base" },
  { key: "dis_vlans", label: "VLAN详情", icon: "el-icon-menu", group: "net", tpl: "dis_vlans", title: "VLAN详情", width: "60%" },
  { key: "arp", label: "ARP详情", icon: "el-icon-connection", group: "net" },
  { key: "route", label: "路由表", icon: "el-icon-guide", group: "net" },
  { key: "dis_link_aggr", label: "聚合口信息", icon: "el-icon-copy-document", group: "net", tpl: "dis_link_aggr", title: "聚合口信息", width: "60%" },
  { key: "dis_bgp_peer_v4", label: "BGP状态", icon: "el-icon-place", group: "net", tpl: "dis_bgp_peer_v4", title: "BGP状态", width: "70%" },
  { key: "dis_fan", label: "风扇", icon: "el-icon-wind-power", group: "hw", tpl: "dis_fan", title: "风扇信息", width: "60%" },
  { key: "dis_power", label: "电源", icon: "el-icon-lightning", group: "hw", tpl: "dis_power", title: "电源信息", width: "60%" },
  { key: "dis_cpu", label: "CPU", icon: "el-icon-cpu", group: "hw", tpl: "dis_cpu", title: "CPU信息", width: "60%" },
  { key: "dis_mem", label: "内存", icon: "el-icon-coin", group: "hw", tpl: "dis_mem", title: "内存信息", width: "60%" },
  { key: "dis_board", label: "板卡", icon: "el-icon-s-grid", group: "hw", tpl: "dis_board", title: "板卡信息", width: "60%" },
  { key: "dis_inventory", label: "序列号", icon: "el-icon-postcard", group: "hw", tpl: "dis_inventory", title: "序列号", width: "60%" }
]

export default {
  components:{
    topo_div,echart_flow,echart_error, ssh_card
  },
  props: {
    ip: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      queryMenus: QUERY_MENUS,

      port_total: 0,
      port_currentPage: 1,
      port_pageSize:50,
      port_loading: false,
      device_info:{},
      port_info:[],
      port_filtered:[],
      port_info_show:[],
      filter_portname:"",
      filter_portalias:"",
      filter_portstatu:"",
      filter_ip:"",
      filter_lldp:"",

      //查询信息展示窗口
      dialog_title:"",
      dialog_Visible:false,
      dialog_width: "30%",
      dialog_rows: 30,
      dialog_infos:"",
      isload:false,


      //拓扑信息展示窗口
      isload1:false,
      dialog_topo:false,
      topo_position:{},
      topo_nodes:[],
      topo_links:[],
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
    }
  },
  computed: {
    vendorText() {
      const desc = this.device_info.sysdesc || ""
      const list = [
        [/h3c/i, "H3C"], [/huawei/i, "Huawei"], [/huarong/i, "Huarong"], [/cisco/i, "Cisco"],
        [/ruijie/i, "Ruijie"], [/arista/i, "Arista"], [/juniper/i, "Juniper"]
      ]
      for (let i = 0; i < list.length; i++) {
        if (list[i][0].test(desc)) {
          return list[i][1]
        }
      }
      return ""
    },
    portStats() {
      let up = 0
      let down = 0
      this.port_info.forEach(p => {
        if (p.oper_statu == "1") {
          up++
        } else if (p.admin_statu == "1") {
          down++
        }
      })
      return { up, down }
    }
  },
  watch: {
    ip: {
      handler(newIp) {
        if (newIp) {
          this.getDeviceInfo(newIp)
          this.getPorts(newIp)
        }
      },
      immediate: true
    }
  },
  methods:{
    //查询操作
    getDeviceInfo(ip){
      let that = this
      collector_api.getDevs({"ip":"^"+ip+"$"},{}).then(function(response){
        let list = response.data && response.data["data"]
        if(list && list.length){
          that.device_info = list[0]
        }else{
          // 未采集到设备信息时保留 ip，保证其它查询仍可使用
          that.device_info = {"ip": ip}
          that.$message({
            type: 'warning',
            message: '未查询到设备基础信息'
          });
        }
      }).catch(function (error) {
          console.error(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    getPorts(ip){
      let that = this
      this.port_loading = true
      collector_api.getPorts_ex({"ip":"^"+ip+"$"},{}).then(function(response){
        if(response.data!="failed"){
          that.port_info = response.data["data"] || []
          that.filter_ports()
        }
      }).catch(function (error) {
          console.error(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      }).finally(function () {
          that.port_loading = false
      })
    },

    //设备查询菜单
    handleQuery(key){
      const menu = this.queryMenus.find(m => m.key === key)
      if(!menu){
        return
      }
      if(menu.tpl){
        this.disCommonFunc(menu.tpl, menu.title, menu.width)
      }else if(key === "topo"){
        this.showtopo()
      }else if(key === "logging"){
        this.dislogging()
      }else if(key === "arp"){
        this.disarps()
      }else if(key === "route"){
        this.disroutes()
      }
    },

    //页面数据转换（speed 单位为 Mbps）
    speedFormat(row){
      let speed = Number(row.speed)
      if(!speed){
        return "-"
      }
      if(speed >= 1000){
        return Number((speed/1000).toFixed(1)) + "G"
      }
      return speed + "M"
    },
    statuFormat(row){
      if(row.oper_statu=="1"){
        return "UP"
      }else if(row.admin_statu=="1"){
        return "Down"
      }else if(row.admin_statu=="2"){
        return "Admin Down"
      }else{
        return "Unknown"
      }
    },
    statuType(row){
      if(row.oper_statu=="1"){
        return "success"
      }else if(row.admin_statu=="1"){
        return "danger"
      }else if(row.admin_statu=="2"){
        return "info"
      }else{
        return "warning"
      }
    },
    ipLines(text){
      return String(text || "").split(/\r?\n/).filter(s => s.trim() !== "")
    },
    lldpLines(row){
      return String(row.lldp || "").split("\n").map(line => {
        return line.split("/")[0] == "" ? line : line.split("/")[1]
      }).filter(s => s && s.trim() !== "")
    },
    //弹出对话框展示查询信息
    dialog_show(title, msg, width="60%",rows=20){
      msg = msg == null ? "" : String(msg)
      this.dialog_title = title
      this.dialog_width = width
      let arrys = msg.split("\n")
      if(arrys.length<=30){
        this.dialog_rows = Math.max(arrys.length, 6)
      }else{
        this.dialog_rows = 30
      }
      this.dialog_infos = msg
      this.dialog_Visible = true
      this.isload = false
    },

    //表格操作
    refreshPage(){
      this.port_total = this.port_filtered.length
      this.port_info_show = this.port_filtered.slice((this.port_currentPage-1)*this.port_pageSize,this.port_currentPage*this.port_pageSize)
    },
    //修改页码
    handleCurrentChange (val) {
      this.port_currentPage = val
      this.refreshPage()
    },
    //修改一页总数
    handleSizeChange(val){
      this.port_pageSize = val
      this.port_currentPage = 1
      this.refreshPage()
    },
    resetFilter(){
      this.filter_portname = ""
      this.filter_portalias = ""
      this.filter_portstatu = ""
      this.filter_ip = ""
      this.filter_lldp = ""
      this.filter_ports()
    },
    //筛选过滤（结果写入 port_filtered，再由分页切片展示）
    filter_ports(){
      let port_name = this.filter_portname.replace(/^\s*|\s*$/g,"")
      let port_alias =this.filter_portalias.replace(/^\s*|\s*$/g,"")
      let status = this.filter_portstatu
      let gw_ip = this.filter_ip.replace(/^\s*|\s*$/g,"")
      let f_lldp = this.filter_lldp.replace(/^\s*|\s*$/g,"")

      let reg_name = ""
      let reg_name_flag = false
      if(port_name[0]=="~"){
        reg_name_flag = true
        port_name = port_name.substring(1)
      }

      let reg_alias = ""
      let reg_alias_flag = false
      if(port_alias[0]=="~"){
        reg_alias_flag = true
        port_alias = port_alias.substring(1)
      }

      let reg_gw = ""
      let reg_lldp = ""

      let reg_status = ""
      try{
        if(port_name){
          reg_name = RegExp(port_name, "i")
        }
        if(port_alias){
          reg_alias = RegExp(port_alias, "i")
        }
        if(gw_ip){
          reg_gw = RegExp(gw_ip, "i")
        }
        if(f_lldp){
          reg_lldp = RegExp(f_lldp, "i")
        }
      }catch(e){
        this.$message({
          type: 'warning',
          message: '筛选条件不是合法的正则表达式'
        });
        return
      }
      if(status){
        reg_status = status
      }

      let result = []
      for(let i=0;i<this.port_info.length;i++){
        let port = this.port_info[i]
        let add_flag = true
        // 命中且非取反、或未命中且取反，才保留
        if(reg_name!="" && reg_name.test(port.if_name) === reg_name_flag){
          add_flag = false
        }
        if(reg_alias!="" && reg_alias.test(port.alias) === reg_alias_flag){
          add_flag = false
        }
        if(reg_status!=""){
          let change_flag=0
          if(port.oper_statu=='1'){
            change_flag=1
          }else if(port.admin_statu=='1'){
            change_flag=2
          }else if(port.admin_statu=='2'){
            change_flag=3
          }else{
            change_flag=4
          }
          if(reg_status!=change_flag){
            add_flag = false
          }
        }

        if(reg_gw!="" && !reg_gw.test(port.gw_ips)){
          add_flag = false
        }

        if(reg_lldp!="" && !reg_lldp.test(port.lldp)){
          add_flag = false
        }

        if(add_flag===true){
          result.push(port)
        }
      }
      this.port_filtered = result
      this.port_currentPage = 1
      this.refreshPage()
    },
    //配置操作
    disconfig(row){
      let that =this
      this.isload = true
      collector_api.getCurrentInterface({"ip":row.ip,"if_name":row.if_name},{}).then(function(response){
        that.dialog_show("接口配置 · " + row.if_name, response.data["data"])
      }).catch(function (error) {
          console.error(error)
          that.isload = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    //查看端口状态
    disinterface(row){
      let that =this
      this.isload = true
      collector_api.getInterface({"ip":row.ip,"if_name":row.if_name},{}).then(function(response){
        that.dialog_show("接口状态 · " + row.if_name, response.data["data"], "50%")
      }).catch(function (error) {
          console.error(error)
          that.isload = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    //查看端口光衰
    distransceiver(row){
      let that =this
      this.isload = true
      collector_api.getTransceiver({"ip":row.ip,"if_name":row.if_name},{}).then(function(response){
        that.dialog_show("接口光衰信息 · " + row.if_name, response.data["data"], "50%")
      }).catch(function (error) {
          console.error(error)
          that.isload = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },

    //查看日志
    dislogging(){
      let that =this
      this.isload = true
      this.$prompt('请输入日志长度，默认200', '选项', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /(\d+)|(\s*)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
          collector_api.getLogging({"ip":that.device_info.ip,"size":value},{}).then(function(response){
            that.dialog_show("设备日志", response.data["data"], "80%")
          }).catch(function (error) {
              console.error(error)
              that.isload = false
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
          })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
        that.isload = false
      });
    },

    //查看arp信息
    disarps(){
      let that =this
      this.isload = true
      this.$prompt('请输入地址所在VLAN或明细地址，默认全部展示', '选项', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /(\d+)|(\s*)|([\d.]+)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
        let ipReg=/^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/;
        let params = {"ip":this.device_info.ip,"vlan_id":"","arp_ip":""}
        if(ipReg.test(value)){
          params.arp_ip = value
        }else if(/\d+/.test(value)){
          params.vlan_id = value
        }
        collector_api.getARPs(params,{}).then(function(response){
          that.dialog_show("设备ARP", response.data["data"], "50%")
        }).catch(function (error) {
            console.error(error)
            that.isload = false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
        that.isload = false
      });
    },

    //查询路由表
    disroutes(){
      let that =this
      this.isload = true
      this.$prompt('请输入IP地址，默认为127.0.0.1', '选项', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /([\d.]+)|(\s*)/,
        inputErrorMessage: '格式不正确'
      }).then(({ value }) => {
          collector_api.getRoutes({"ip":that.device_info.ip,"route":value},{}).then(function(response){
            that.dialog_show("设备路由", response.data["data"], "80%")
          }).catch(function (error) {
              console.error(error)
              that.isload = false
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
          })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消输入'
        });
        that.isload = false
      });
    },

    disCommonFunc(temp,title,width){
      let width_local = "50%"
      if(width){
        width_local = width
      }
      let title_local = "信息展示"
      if(title){
        title_local = title
      }
      let that =this
      this.isload = true
      collector_api.getCommonFunction({"ip":this.device_info.ip, "template_name":temp},{}).then(function(response){
        that.dialog_show(title_local, response.data["data"], width_local)
      }).catch(function (error) {
          console.error(error)
          that.isload = false
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
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
              that.isload1 = false
            }).catch(function (error) {
              that.isload1 = false
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
            })
            return
          }
          that.isload1 = false
        }).catch(function (error) {
            console.error(error)
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

      //ut 0
      //dt
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
            pt_position = pt_position + 300
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
      if(/h3c/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["h3c"]
      }else if(/huawei/ig.test(this.device_info["sysdesc"])|/huarong/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["huawei"]
      }else if(/cisco/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["cisco"]
      }else if(/ruijie/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["ruijie"]
      }else if(/arista/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["arista"]
      }else if(/juniper/ig.test(this.device_info["sysdesc"])){
        this.cmd_promot=exec_promot_dict["juniper"]
      }else{
        this.cmd_promot=exec_promot_dict["h3c"]
      }
    },

    run_dev_cmds(){
      let that = this
      if(this.loading_exec){
        return
      }
      let cmds = this.cmd_exec_str.replace(/^\s*|\s*$/g,"")
      if(!cmds){
        this.$message({
          type: 'warning',
          message: '请输入要执行的命令'
        });
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
          console.error(error)
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
  }

}
</script>

<style scoped>
.device-panel {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.count-badge {
  flex-shrink: 0;
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

/* 设备信息卡片 */
.dev-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.dev-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}
.dev-icon img {
  width: 48px;
  height: 48px;
}
.dev-main {
  flex: 1;
  min-width: 0;
  margin-left: 14px;
}
.dev-title {
  display: flex;
  align-items: center;
}
.dev-name {
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vendor-tag {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  border-radius: 3px;
  color: #409eff;
  background: #ecf5ff;
}
.dev-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}
.dev-sub > span + span {
  margin-left: 16px;
}
.dev-sub i {
  margin-right: 4px;
  color: #909399;
}
.dev-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: #909399;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  word-break: break-all;
}
.dev-stats {
  flex-shrink: 0;
  display: flex;
  margin-left: 16px;
}
.stat {
  min-width: 64px;
  padding: 0 12px;
  text-align: center;
}
.stat + .stat {
  border-left: 1px solid #ebeef5;
}
.stat b {
  display: block;
  font-size: 20px;
  line-height: 26px;
  color: #303133;
}
.stat span {
  font-size: 12px;
  color: #909399;
}
.stat.up b {
  color: #67c23a;
}
.stat.down b {
  color: #f56c6c;
}

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  margin-top: 12px;
}
.action-bar > .el-button {
  margin-left: 10px;
}

/* 端口列表 */
.port-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
}
.section-title {
  display: flex;
  align-items: center;
  margin: 4px 16px 4px 0;
  font-size: 15px;
  font-weight: 600;
}
.section-title > i {
  margin-right: 6px;
  font-size: 16px;
  color: #409eff;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.f-item {
  width: 140px;
  margin: 4px 8px 4px 0;
}
.f-status {
  width: 120px;
}
.filter-help {
  margin-left: 10px;
  font-size: 15px;
  color: #c0c4cc;
  cursor: help;
}
.filter-help:hover {
  color: #409eff;
}

.port-table {
  margin-top: 10px;
}
.port-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.port-name {
  font-weight: 500;
}
.ip-ref {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  cursor: default;
}
.ip-ref .mono {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-badge {
  flex-shrink: 0;
  margin-left: 6px;
  padding: 0 6px;
  height: 16px;
  line-height: 16px;
  font-size: 11px;
  border-radius: 8px;
  color: #409eff;
  background: #ecf5ff;
}
.lldp-line {
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lldp-line i {
  margin-right: 4px;
  color: #c0c4cc;
}
.time-text {
  font-size: 12px;
  color: #909399;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* 弹窗 */
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
.dt-sub {
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
.result-text /deep/ textarea {
  font-size: 12px;
  line-height: 1.6;
  font-family: Menlo, Consolas, "Courier New", monospace;
  color: #303133;
  background: #fafbfc;
}
.pop-pre {
  margin: 0;
  max-height: 360px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  font-family: Menlo, Consolas, "Courier New", monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
}
.topo-box {
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

/* 自定义查询 */
.cmd-bar {
  display: flex;
  align-items: center;
}
.cmd-input {
  flex: 1;
  margin-right: 10px;
}
.cmd-input /deep/ input {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.cmd-bar > span {
  margin-left: 10px;
}
.cmd-ref {
  max-height: 480px;
}
.cmd-result {
  margin-top: 12px;
  min-height: 320px;
  max-height: 60vh;
  overflow: auto;
  padding: 12px 14px;
  border-radius: 6px;
  background: #1e1e1e;
}
.cmd-result pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  font-family: Menlo, Consolas, "Courier New", monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #d4d4d4;
}
.cmd-placeholder {
  font-size: 12px;
  color: #6b6b6b;
}

/* 实时流量 */
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
