<template>
  <div>
    <div style="display: flex;justify-content: end;">
      <div style="margin: 5px;">快捷搜索</div>
      <div style="margin-left: 5px;">
        <el-input v-model="query_filter" :placeholder="'请输入筛选条件'" size="small" @keyup.enter.native="getCommonDev" clearable></el-input>
      </div>
      <div style="margin-left: 5px;">
        <el-button icon="el-icon-search" size="small" :loading="loading" circle @click="getCommonDev()"></el-button>
      </div>
    </div>


    <div style="margin-top: 30px;border-top: #000000 solid 1px;">
      <el-collapse v-model="activeName">
        <el-collapse-item title="设备名称(最多展示5条)" name="1">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;">
            <template v-for="dev in dev_names">
              <div style="display: flex;margin: 20px;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
                <img src="/static/images/h3_switch_core.svg" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>资产号：{{dev.syscontact}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                  <span>---------------------</span>
                  <div style="white-space: inherit;">
                    <span>设备描述：{{dev.sysdesc}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="相关IP(最多展示5条)" name="2">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_gates">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>接口地址：{{dev.gateway}}/{{dev.mask}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>接口名称：{{dev.if_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span v-if="dev.oper_statu=='1'">接口状态：UP</span>
                    <span v-else style="color: red;">接口状态：Down</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="相关端口(最多展示20条)" name="3">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_ports">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>端口名：{{dev.if_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span v-if="dev.oper_statu=='1'">接口状态：UP</span>
                    <span v-else style="color: red;">接口状态：Down</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span v-if="dev.admin_statu=='1'">admin状态：UP</span>
                    <span v-else style="color: red;">admin状态：Down</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>端口描述：{{dev.alias}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>端口带宽：{{dev.speed}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="相关SN(最多展示10条)" name="4">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_sns">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>硬件名称：{{dev.sn_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>硬件描述：{{dev.sn_desc}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>SN序列号：{{dev.sn_number}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="相关ARP(最多展示10条)" name="5">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_arps">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>查询ARP：{{dev.arp_ip}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>MAC地址：{{dev.arp_mac}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>接口名称：{{dev.if_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>
        <el-collapse-item title="相关MAC(最多展示10条)" name="6">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_macs">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.sysname}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.ip}}">
                      <span>{{dev.ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>查询ARP：{{dev.arp_ip}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>MAC地址：{{dev.arp_mac}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>VLAN：VLAN {{dev.vlan_id}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>接口名称：{{dev.if_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>接口描述：{{dev.if_alias}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>

        <el-collapse-item title="相关LLDP(最多展示8条)" name="7">
          <div style="display: flex; margin: 20px;flex-wrap:wrap;align-items: center;border-bottom: gainsboro solid 1px;border-left: gainsboro solid 1px;border-top: gainsboro solid 1px;">
            <template v-for="dev in dev_lldps">
              <div style="display: flex;margin: 20px;align-items: center;">
                <img src="/static/images/gate_img.png" height="80" width="80"></img>
                <div style="display: flex;flex-direction: column; margin-left: 10px;width: 400px;">
                  <div style="white-space: nowrap;">
                    <span>设备名：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.loc_ip}}">
                      <span>{{dev.loc_name}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>设备IP：</span>
                    <router-link :to="{path: '/pages/device/device_detail', query:{dev:dev.loc_ip}}">
                      <span>{{dev.loc_ip}}</span>
                    </router-link>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>端口：{{dev.loc_portname}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>服务器名称：{{dev.rem_name}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>服务器端口：{{dev.rem_portalias}}</span>
                  </div>
                  <div style="white-space: nowrap;">
                    <span>采集时间：{{dev.timestamp}}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-collapse-item>

      </el-collapse>
    </div>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"


export default {
  data () {
    return {
      query_filter:"",
      dev_names:[],
      dev_gates:[],
      dev_ports:[],
      dev_sns:[],
      dev_arps:[],
      dev_macs:[],
      dev_lldps:[],
      activeName:"",
      result_cache: "",

      loading:false,
    }
  },
  mounted() {
    let cache = localStorage.getItem('fmManage_result')
    if(typeof(cache)!="string"){
      console.log("no cache")
    }else{
      this.result_cache = JSON.parse(cache)
      if(this.result_cache == ""){
        console.log("no cache")
      }else{
        this.query_filter = this.result_cache.search
        let result = this.result_cache.result

        this.activeName = []
        if(result.device_list.length>0){
          this.dev_names=result.device_list
          this.activeName.push("1")
        }
        if(result.gate_list.length>0||result.gatev6_list.length>0){
          this.dev_gates=result.gate_list.concat(result.gatev6_list)
          this.activeName.push("2")
        }
        if(result.port_list.length>0){
          this.dev_ports=result.port_list
          this.activeName.push("3")
        }
        if(result.sn_list.length>0){
          this.dev_sns=result.sn_list
          this.activeName.push("4")
        }
        if(result.arp_list.length>0){
          this.dev_arps=result.arp_list
          this.activeName.push("5")
        }
        if(result.mac_list.length>0){
          this.dev_macs=result.mac_list
          this.activeName.push("6")
        }
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    localStorage.setItem('fmManage_result', JSON.stringify(this.result_cache));
    next()
  },

  methods:{
    cleardata(){
      this.dev_names=[]
      this.dev_gates=[]
      this.dev_ports=[]
      this.dev_sns=[]
      this.dev_arps=[]
      this.dev_macs=[]
    },
    getCommonDev(){
      let query = this.query_filter.replace(/^\s*|\s*$/g,"")
      let that = this
      this.loading = true
      collector_api.findDevs({"query":query},{}).then(function(response){
        that.cleardata()
        that.activeName = []
        // 安全检查：确保数据存在且为数组
        const data = response.data.data || {}

        if(data.device_list && data.device_list.length>0){
          that.dev_names=data.device_list
          that.activeName.push("1")
        }
        if((data.gate_list && data.gate_list.length>0) || (data.gatev6_list && data.gatev6_list.length>0)){
          that.dev_gates=(data.gate_list || []).concat(data.gatev6_list || [])
          that.activeName.push("2")
        }
        if(data.port_list && data.port_list.length>0){
          that.dev_ports=data.port_list
          that.activeName.push("3")
        }
        if(data.sn_list && data.sn_list.length>0){
          that.dev_sns=data.sn_list
          that.activeName.push("4")
        }
        if(data.arp_list && data.arp_list.length>0){
          that.dev_arps=data.arp_list
          that.activeName.push("5")
        }
        if(data.mac_list && data.mac_list.length>0){
          that.dev_macs=data.mac_list
          that.activeName.push("6")
        }
        if(data.lldp_list && data.lldp_list.length>0){
          that.dev_lldps=data.lldp_list
          that.activeName.push("7")
        }

        that.result_cache = {}
        that.result_cache["search"] = query
        that.result_cache["result"] = response.data.data || {}

        that.loading = false
      }).catch(function (error) {
          console.log(error)
          that.loading = false
      })
    }
  },
  components:{
  }
}
</script>

<style>
</style>
