<template>
  <div>
    <div style="display: flex;align-items: center;">
      <div>
        <div style="display: flex;margin: 20px;padding: 10px;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
          <img src="/static/images/h3_switch_core.svg" height="80" width="80"></img>
          <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
            <div style="white-space: nowrap;">
              <span>设备名：</span>
              <router-link :to="{path: '/dailyManage/fmManageModule/device_detail', query:{dev:device_info.ip}}">
                <span>{{device_info.sysname}}</span>
              </router-link>
            </div>
            <div style="white-space: nowrap;">
              <span>设备IP：</span>
              <router-link :to="{path: '/dailyManage/fmManageModule/device_detail', query:{dev:device_info.ip}}">
                <span>{{device_info.ip}}</span>
              </router-link>
            </div>
            <div style="white-space: nowrap;">
              <span>采集时间：{{device_info.timestamp}}</span>
            </div>
            <span>---------------------</span>
            <div style="white-space: inherit;">
              <span>设备描述：{{device_info.sysdesc}}</span>
            </div>
          </div>
        </div>
        <div style="margin: 10px; display: flex; align-items: center;">
          <div style="margin-top: 1px;">
            <el-dropdown>
              <span style="cursor: pointer;">
                设备查询菜单<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item>
                  <el-button type="text" :loading="isload1" @click="showtopo()" plain>相关设备</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_cu','当前配置','60%')" plain>当前配置</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="dislogging()" plain>最近日志</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_vlans','VLAN详情','60%')" plain>VLAN详情</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disarps()" plain>ARP详情</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disroutes()" plain>路由表</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_fan','风扇信息','60%')" plain>风扇</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_power','电源信息','60%')" plain>电源</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_cpu','CPU信息','60%')" plain>CPU</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_mem','内存信息','60%')" plain>内存</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_board','板卡信息','60%')" plain>板卡</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_inventory','序列号','60%')" plain>序列号</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_link_aggr','聚合口信息','60%')" plain>聚合口信息</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button type="text" :loading="isload" @click="disCommonFunc('dis_bgp_peer_v4','BGP状态','70%')" plain>BGP状态</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <div style="margin-top: 1px;margin-left: 20px;">
            <el-button type="text" size="mini" style="padding: 7px 15px;border: 1px solid #dcdfe6;" @click="diy_exec" plain>自定义查询</el-button>
          </div>
          
          <div style="margin-top: 1px;margin-left: 20px;">
            <el-button type="primary" size="mini" @click="showXterm" plain>Xtern远程连接</el-button>
          </div>

        </div>
      </div>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item>
              <el-input placeholder="端口名称" v-model="filter_portname" @keyup.enter.native="filter_ports" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-input placeholder="端口描述" v-model="filter_portalias" @keyup.enter.native="filter_ports" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-select v-model="filter_portstatu" placeholder="端口状态" clearable>
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
              <el-input placeholder="LLDP" v-model="filter_lldp" @keyup.enter.native="filter_ports" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="filter_ports()">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <el-table border :data.sync='port_info_show' @selection-change="handleSelectionChange" :default-sort = "{prop: 'port_id'}" size="mini">
        <el-table-column type='selection' width='40'></el-table-column>
        <!-- <el-table-column prop='port_id' label='端口ID' show-overflow-tooltip min-width='10' align='center'>
        </el-table-column> -->

        <el-table-column prop='if_name' label='端口名称' show-overflow-tooltip min-width='20' align='center'>
        </el-table-column>

        <el-table-column prop='speed' label='带宽' :formatter="speedFormat" show-overflow-tooltip min-width='10' align='center'>
        </el-table-column>

        <el-table-column prop='statu' label='状态' :formatter="statuFormat" show-overflow-tooltip min-width='10' align='center'>
        </el-table-column>

        <el-table-column prop='alias' label='描述' show-overflow-tooltip min-width='50' align='center'>
        </el-table-column>

        <el-table-column prop='gw_ips' label='接口ip' show-overflow-tooltip min-width='13' align='center'>
          <template v-slot="scope">
            <el-popover v-if="scope.row.gw_ips!=''" placement="bottom-start" width="800" trigger="hover" :open-delay="600">
              <el-input type="textarea" v-model="scope.row.gw_ips" :autosize="{ minRows: 5, maxRows: 20 }"></el-input>
              <el-button size="mini" type="info" plain slot="reference">接口IP</el-button>
            </el-popover>
          </template>
        </el-table-column>

        <el-table-column prop='lldp' label='lldp' show-overflow-tooltip min-width='20' align='center'>
          <template v-slot="scope">
            <div v-for='lldp in scope.row.lldp.split("\n")'>
              <span v-if="lldp.split('/')[0]==''">{{lldp}}</span>
              <el-link v-else :href="'/dailyManage/fmManageModule/device_detail?dev='+lldp.split('/')[0]" target="_blank">{{lldp.split("/")[1]}}</el-link>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop='timestamp' label='采集时间' show-overflow-tooltip min-width='15' align='center'>
        </el-table-column>

        <el-table-column label='操作' show-overflow-tooltip min-width='20' align='center'>
          <template v-slot='scope'>
            <div style="margin: 5px;">
              <el-dropdown>
                <span style="cursor: pointer;">
                  查询菜单<i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item>
                    <el-button size='small' type='text' :loading="isload" @click="disconfig(scope.row)">查看配置</el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button size='small' type='text' :loading="isload" @click="disinterface(scope.row)">查看状态</el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button size='small' type='text' :loading="isload" @click="distransceiver(scope.row)">查看光衰</el-button>
                  </el-dropdown-item>

                  <el-dropdown-item>
                    <el-button size='small' type='text' :loading="isload" @click="showEchartFlow(scope.row)">实时流量</el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination @current-change='handleCurrentChange' :current-page='port_currentPage'  @size-change="handleSizeChange"
      :page-sizes="[50, 100, 300, 500, 1000]" :page-size="50" layout='total, sizes, prev, pager, next' :total='port_total' style='float: right'></el-pagination><br/>

    </div>
    <el-dialog :title="dialog_title" :visible.sync="dialog_Visible" :width="dialog_width">
      <el-input
        type="textarea"
        :rows='dialog_rows'
        resize="none"
        readonly
        v-model="dialog_infos">
      </el-input>
    </el-dialog>
    <el-dialog title="拓扑信息" :visible.sync="dialog_topo" width="80%">
      <div>拓扑信息</div>
      <topo_div
        v-bind:toponame="'test'"
        v-bind:position="topo_position"
        v-bind:node_list="topo_nodes"
        v-bind:link_list="topo_links"
        v-bind:chartswidth="'1200px'"
        v-bind:chartsheight="'800px'"
      ></topo_div>
    </el-dialog>

    <el-dialog title="执行命令窗口" :visible.sync="dialog_cmd_exec" width="60%">
      <el-form size="mini">
        <el-form-item label="命令">
          <div>
            <el-input style="width: 500px;" placeholder="命令" v-model="cmd_exec_str" clearable></el-input>
            <el-button type="primary" :loading="loading_exec" @click="run_dev_cmds">执行</el-button>
          </div>
          <el-popover
            placement="right"
            width="400"
            trigger="hover">
            <div>
              <el-input
                type="textarea"
                placeholder=""
                v-model="cmd_promot"
                rows="20"
                :readonly="true"
              ></el-input>
            </div>
            <el-button slot="reference" size="mini" icon="el-icon-warning-outline" circle></el-button>
          </el-popover>

        </el-form-item>
        <el-form-item label="结果">
          <el-input
            type="textarea"
            placeholder=""
            v-model="cmd_exec_ret"
            rows="30"
            :readonly="true"
          ></el-input>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="SSH窗口" :visible.sync="dialog_webssh" width="60%">
      <ssh_card
        style="margin: 10px;"
        v-if="dialog_webssh"
        v-bind:target_ip="webssh_target"
        @close_session="closeWebsshSession"
      ></ssh_card>
    </el-dialog>

    <el-dialog title="实时流量窗口" :visible.sync="dialog_flow" width="80%">
      <div>采集间隔<span style="color: red;">{{flow_interval}}</span>秒</div>
      <div v-if="dialog_flow" style="display: flex;">
        <div>
          <echart_flow ref="device_sss1"
          	v-bind:chartsname="'flow_band'"
          	v-bind:port_info="flow_p_info"
          	v-bind:chartsType="'line'"
          	v-bind:chartswidth="'600px'"
          	v-bind:chartsheight="'300px'"
          	v-bind:interval="flow_interval"
          	></echart_flow>
        </div>
        <div>
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
      port_currentPage: 0,
      port_pageSize:50,
      query_filter:"",
      device_info:{},
      lldp_info:"",
      port_info:[],
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
  mounted() {
    let query = this.$route.query;
    console.log(this.$store.getters.info)
    if(typeof(query.dev)!="string"){
      let cache = localStorage.getItem('fmManage_dev')
      if(typeof(cache)!="string"){
        console.log("no data")
      }else{
        //未带请求，使用缓存
        let cache_info = JSON.parse(cache)
        this.device_info = cache_info["device_info"]
        this.port_info = cache_info["port_info"]
        //加载数据
        this.port_total = this.port_info.length
        this.port_currentPage = 1
        this.port_info_show = this.port_info.slice((this.port_currentPage-1)*this.port_pageSize,this.port_currentPage*this.port_pageSize)
      }
    }else{
      let dev_ip = query.dev
      // 带请求的直接刷新
      this.getDeviceInfo(dev_ip)
      this.getPorts(dev_ip)
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
    //查询操作
    getDeviceInfo(ip){
      let that = this
      collector_api.getDevs({"ip":"^"+ip+"$"},{}).then(function(response){
        that.device_info = response.data["data"][0]
      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    getPorts(ip){
      let that = this
      collector_api.getPorts_ex({"ip":"^"+ip+"$"},{}).then(function(response){
        if(response.data!="failed"){
          that.port_info = response.data["data"]
          //获取lldp
          //获取ip地址

          that.port_total = that.port_info.length
          that.port_currentPage = 1
          that.port_info_show = that.port_info.slice((that.port_currentPage-1)*that.port_pageSize,that.port_currentPage*that.port_pageSize)
        }
      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },

    //页面数据转换
    speedFormat(row, column){
      return parseInt(row.speed/1000)+"G"
    },
    statuFormat(row, column){
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
    //弹出对话框展示查询信息
    dialog_show(title, msg, width="60%",rows=20){
      this.dialog_title = title
      this.dialog_width = width
      let arrys = msg.split("\n")
      if(arrys.length<=30){
        this.dialog_rows = arrys.length
      }else{
        this.dialog_rows = 30
      }
      this.dialog_infos = msg
      this.dialog_Visible = true
      this.isload = false
    },

    //表格操作
    //多选
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    //修改页码
    handleCurrentChange (val) {
      this.port_currentPage = val
      this.port_info_show = this.port_info.slice((this.port_currentPage-1)*this.port_pageSize,this.port_currentPage*this.port_pageSize)
    },
    //修改一页总数
    handleSizeChange(val){
      this.port_pageSize = val
      this.port_info_show = this.port_info.slice((this.port_currentPage-1)*this.port_pageSize,this.port_currentPage*this.port_pageSize)
    },
    //筛选过滤
    filter_ports(){
      let port_name = this.filter_portname.replace(/^\s*|\s*$/g,"")
      let port_alias =this.filter_portalias.replace(/^\s*|\s*$/g,"")
      let status = this.filter_portstatu
      let gw_ip = this.filter_ip
      let f_lldp = this.filter_lldp

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
      if(port_name){
        reg_name = RegExp(port_name, "i")
      }
      if(port_alias){
        reg_alias = RegExp(port_alias, "i")
      }
      if(status){
        reg_status = status
      }
      if(gw_ip){
        reg_gw = RegExp(gw_ip, "i")
      }
      if(f_lldp){
        reg_lldp = RegExp(f_lldp, "i")
      }

      this.port_info_show = []
      for(let i=0;i<this.port_info.length;i++){
        let add_flag = true
        if(reg_name!=""){
          if(reg_name.test(this.port_info[i].if_name)){
            if(reg_name_flag==true){
              add_flag = false
            }
          }else{
            if(reg_name_flag==true){
              add_flag = true
            }else{
              add_flag = false
            }
          }
        }
        if(reg_alias!=""){
          if(reg_alias.test(this.port_info[i].alias)){
            if(reg_alias_flag==true){
              add_flag = false
            }
          }else{
            if(reg_alias_flag==true){
              add_flag = true
            }else{
              add_flag = false
            }
          }
        }
        if(reg_status!=""){
          let change_flag=0
          if(this.port_info[i].oper_statu=='1'){
            change_flag=1
          }else if(this.port_info[i].admin_statu=='1'){
            change_flag=2
          }else if(this.port_info[i].admin_statu=='2'){
            change_flag=3
          }else{
            change_flag=4
          }
          if(reg_status==change_flag){

          }else{
            add_flag = false
          }
        }

        if(reg_gw!=""){
          if(reg_gw.test(this.port_info[i].gw_ips)){
            add_flag = true
          }else{
            add_flag = false
          }
        }

        if(reg_lldp!=""){
          if(reg_lldp.test(this.port_info[i].lldp)){
            add_flag = true
          }else{
            add_flag = false
          }
        }


        if(add_flag===true){
          this.port_info_show.push(this.port_info[i])
        }
      }
    },
    //配置操作
    disconfig(row){
      let that =this
      this.isload = true
      collector_api.getCurrentInterface({"ip":row.ip,"if_name":row.if_name},{}).then(function(response){
        that.dialog_show("接口配置", response.data["data"])
      }).catch(function (error) {
          console.log(error)
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
        that.dialog_show("接口状态", response.data["data"], "50%")
      }).catch(function (error) {
          console.log(error)
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
        that.dialog_show("接口光衰信息", response.data["data"], "50%")
      }).catch(function (error) {
          console.log(error)
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
              console.log(error)
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
        if(ipReg.test(value)){
          collector_api.getARPs({"ip":this.device_info.ip,"vlan_id":"","arp_ip":value},{}).then(function(response){
            that.dialog_show("设备ARP", response.data["data"], "50%")
          }).catch(function (error) {
              console.log(error)
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
          })
        }else if(/\d+/.test(value)){
          collector_api.getARPs({"ip":this.device_info.ip,"vlan_id":value,"arp_ip":""},{}).then(function(response){
            that.dialog_show("设备ARP", response.data["data"], "50%")
          }).catch(function (error) {
              console.log(error)
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
          })
        }else{
          collector_api.getARPs({"ip":this.device_info.ip,"vlan_id":"","arp_ip":""},{}).then(function(response){
            that.dialog_show("设备ARP", response.data["data"], "50%")
          }).catch(function (error) {
              console.log(error)
              that.$message({
                type: 'error',
                message: '查询失败，请重试'
              });
          })
        }
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
              console.log(error)
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
        that.dialog_show(title, response.data["data"], width_local)
      }).catch(function (error) {
          console.log(error)
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
          console.log("lldp===",response.data)
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
            collector_api.getLLDPS({"rem_ip":"^"+this.device_info.ip+"$"},{}).then(function(response){
              console.log("lldp===",response.data)
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
        //{"id":"1","label":"t1","title":"隐藏t1","group":"router","x":0, "y":0},
        //{"id":"1","from":"1","to":"2","label":"test","color":{"color":"#333"}},
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
      let cmds = this.cmd_exec_str.replace(/^\s*|\s*$/g,"")
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
      // console.log("展示实时流量图", row, this.device_info)
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
      // console.log("当前设备===", this.device_info)
      this.webssh_target = this.device_info["ip"]
      this.dialog_webssh=true;
    },
    closeWebsshSession(){
      this.dialog_webssh=false;
    },
  }
  
}
</script>

<style>
</style>
