<template>
  <div class="fm-manage">
    <!-- 搜索区 -->
    <div class="search-panel">
      <div class="search-title">
        <i class="el-icon-location-information"></i>
        <span>设备定位</span>
      </div>
      <div class="search-desc">输入设备名 / IP / MAC / SN / 端口描述等关键字，一次检索设备、接口、端口、ARP、MAC、LLDP 等多维信息</div>
      <div class="search-box">
        <el-input
          v-model="query_filter"
          placeholder="如：设备名、10.0.0.1、MAC 地址、SN 序列号"
          prefix-icon="el-icon-search"
          @keyup.enter.native="getCommonDev"
          clearable>
          <el-button slot="append" :loading="loading" @click="getCommonDev()">搜 索</el-button>
        </el-input>
      </div>
      <div class="search-history" v-if="history.length">
        <span class="history-label">最近搜索：</span>
        <el-tag
          v-for="h in history"
          :key="h"
          size="small"
          effect="plain"
          class="history-tag"
          @click="searchBy(h)">{{ h }}</el-tag>
        <el-button type="text" size="mini" icon="el-icon-delete" @click="clearHistory">清空</el-button>
      </div>
    </div>

    <!-- 结果概览 -->
    <div v-if="searched" class="summary">
      <div class="summary-head">
        关键字 <span class="summary-kw">{{ searched }}</span> 共命中 <b>{{ totalCount }}</b> 条结果
        <span v-if="costMs !== null" class="summary-cost">· 耗时 {{ costMs }} ms</span>
      </div>
      <div class="summary-grid">
        <div
          v-for="s in sections"
          :key="s.name"
          class="summary-item"
          :class="{ disabled: s.list.length === 0 }"
          @click="jumpTo(s)">
          <i :class="s.icon" class="summary-icon"></i>
          <div>
            <div class="summary-count">{{ s.list.length }}</div>
            <div class="summary-label">{{ s.title }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果明细 -->
    <div class="result-area" v-loading="loading" element-loading-text="正在检索...">
      <el-empty v-if="!searched" description="输入关键字开始定位设备" :image-size="110"></el-empty>
      <el-empty v-else-if="totalCount === 0" description="未找到相关信息，换个关键字试试" :image-size="110"></el-empty>

      <el-collapse v-else v-model="activeName" class="result-collapse">
        <el-collapse-item
          v-for="s in visibleSections"
          :key="s.name"
          :name="s.name"
          :id="'fm-sec-' + s.name">
          <template slot="title">
            <div class="sec-title">
              <i :class="s.icon" class="sec-icon"></i>
              <span class="sec-name">{{ s.title }}</span>
              <span class="sec-count">{{ s.list.length }}</span>
              <span class="sec-limit">最多展示 {{ s.limit }} 条</span>
            </div>
          </template>

          <!-- 设备名称：卡片展示 -->
          <div v-if="s.name === '1'" class="device-grid">
            <div class="device-card" v-for="(dev, i) in s.list" :key="i">
              <div class="device-card-head">
                <img src="/static/images/h3_switch_core.svg" class="device-img">
                <div class="device-head-info">
                  <router-link class="device-name" :to="detailLink(dev.ip)">
                    <span v-html="hl(dev.sysname)"></span>
                  </router-link>
                  <div class="device-ip">
                    <span class="mono" v-html="hl(dev.ip)"></span>
                    <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(dev.ip)"></i>
                  </div>
                </div>
                <el-button type="text" size="mini" @click="$router.push(detailLink(dev.ip))">详情<i class="el-icon-arrow-right el-icon--right"></i></el-button>
              </div>
              <div class="device-meta">
                <div class="meta-row">
                  <span class="meta-label">资产号</span>
                  <span class="meta-value" v-html="hl(dev.syscontact) || '-'"></span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">采集时间</span>
                  <span class="meta-value">{{ dev.timestamp || '-' }}</span>
                </div>
              </div>
              <div class="device-desc" :title="dev.sysdesc">{{ dev.sysdesc || '暂无设备描述' }}</div>
            </div>
          </div>

          <!-- 相关IP -->
          <el-table v-else-if="s.name === '2'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.ip)"><span v-html="hl(scope.row.sysname)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.ip }}</div>
              </template>
            </el-table-column>
            <el-table-column label="接口地址" min-width="180">
              <template slot-scope="scope">
                <span class="mono" v-html="hl(scope.row.gateway)"></span><span class="mono sub-text">/{{ scope.row.mask }}</span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.gateway)"></i>
              </template>
            </el-table-column>
            <el-table-column label="接口名称" min-width="160">
              <template slot-scope="scope"><span v-html="hl(scope.row.if_name)"></span></template>
            </el-table-column>
            <el-table-column label="接口状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="statusType(scope.row.oper_statu)">{{ statusText(scope.row.oper_statu) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>

          <!-- 相关端口 -->
          <el-table v-else-if="s.name === '3'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.ip)"><span v-html="hl(scope.row.sysname)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.ip }}</div>
              </template>
            </el-table-column>
            <el-table-column label="端口名" min-width="160">
              <template slot-scope="scope"><span v-html="hl(scope.row.if_name)"></span></template>
            </el-table-column>
            <el-table-column label="端口描述" min-width="200" show-overflow-tooltip>
              <template slot-scope="scope"><span v-html="hl(scope.row.alias) || '-'"></span></template>
            </el-table-column>
            <el-table-column label="运行状态" width="90" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="statusType(scope.row.oper_statu)">{{ statusText(scope.row.oper_statu) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="管理状态" width="90" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="statusType(scope.row.admin_statu)">{{ statusText(scope.row.admin_statu) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="speed" label="带宽" width="100"></el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>

          <!-- 相关SN -->
          <el-table v-else-if="s.name === '4'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.ip)"><span v-html="hl(scope.row.sysname)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.ip }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="sn_name" label="硬件名称" min-width="160" show-overflow-tooltip></el-table-column>
            <el-table-column prop="sn_desc" label="硬件描述" min-width="220" show-overflow-tooltip></el-table-column>
            <el-table-column label="SN 序列号" min-width="200">
              <template slot-scope="scope">
                <span class="mono" v-html="hl(scope.row.sn_number)"></span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.sn_number)"></i>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>

          <!-- 相关ARP -->
          <el-table v-else-if="s.name === '5'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.ip)"><span v-html="hl(scope.row.sysname)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.ip }}</div>
              </template>
            </el-table-column>
            <el-table-column label="IP 地址" min-width="150">
              <template slot-scope="scope">
                <span class="mono" v-html="hl(scope.row.arp_ip)"></span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.arp_ip)"></i>
              </template>
            </el-table-column>
            <el-table-column label="MAC 地址" min-width="160">
              <template slot-scope="scope">
                <span class="mono" v-html="hl(scope.row.arp_mac)"></span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.arp_mac)"></i>
              </template>
            </el-table-column>
            <el-table-column label="接口名称" min-width="160">
              <template slot-scope="scope"><span v-html="hl(scope.row.if_name)"></span></template>
            </el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>

          <!-- 相关MAC -->
          <el-table v-else-if="s.name === '6'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.ip)"><span v-html="hl(scope.row.sysname)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.ip }}</div>
              </template>
            </el-table-column>
            <el-table-column label="MAC 地址" min-width="160">
              <template slot-scope="scope">
                <span class="mono" v-html="hl(scope.row.arp_mac)"></span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.arp_mac)"></i>
              </template>
            </el-table-column>
            <el-table-column label="IP 地址" min-width="140">
              <template slot-scope="scope"><span class="mono" v-html="hl(scope.row.arp_ip) || '-'"></span></template>
            </el-table-column>
            <el-table-column label="VLAN" width="90" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.vlan_id" size="mini" type="info">VLAN {{ scope.row.vlan_id }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="接口名称" min-width="160">
              <template slot-scope="scope"><span v-html="hl(scope.row.if_name)"></span></template>
            </el-table-column>
            <el-table-column label="接口描述" min-width="180" show-overflow-tooltip>
              <template slot-scope="scope"><span v-html="hl(scope.row.if_alias) || '-'"></span></template>
            </el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>

          <!-- 相关LLDP -->
          <el-table v-else-if="s.name === '7'" :data="s.list" size="small" stripe class="result-table">
            <el-table-column label="本端设备" min-width="200">
              <template slot-scope="scope">
                <router-link class="dev-link" :to="detailLink(scope.row.loc_ip)"><span v-html="hl(scope.row.loc_name)"></span></router-link>
                <div class="sub-text mono">{{ scope.row.loc_ip }}</div>
              </template>
            </el-table-column>
            <el-table-column label="本端端口" min-width="150">
              <template slot-scope="scope"><span v-html="hl(scope.row.loc_portname)"></span></template>
            </el-table-column>
            <el-table-column width="50" align="center">
              <template>
                <i class="el-icon-sort lldp-arrow"></i>
              </template>
            </el-table-column>
            <el-table-column label="对端设备" min-width="200">
              <template slot-scope="scope"><span v-html="hl(scope.row.rem_name)"></span></template>
            </el-table-column>
            <el-table-column label="对端端口" min-width="150">
              <template slot-scope="scope"><span v-html="hl(scope.row.rem_portalias)"></span></template>
            </el-table-column>
            <el-table-column prop="timestamp" label="采集时间" width="170"></el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"

const HISTORY_KEY = "fmManage_history"
const HISTORY_MAX = 8

function escapeHtml (str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

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
      activeName:[],
      result_cache: "",

      searched: "",      // 当前结果对应的关键字
      costMs: null,
      history: [],

      loading:false,
    }
  },
  computed: {
    sections () {
      return [
        {name: "1", title: "设备名称", icon: "el-icon-cpu", limit: 5, list: this.dev_names},
        {name: "2", title: "相关IP", icon: "el-icon-s-grid", limit: 5, list: this.dev_gates},
        {name: "3", title: "相关端口", icon: "el-icon-connection", limit: 20, list: this.dev_ports},
        {name: "4", title: "相关SN", icon: "el-icon-price-tag", limit: 10, list: this.dev_sns},
        {name: "5", title: "相关ARP", icon: "el-icon-share", limit: 10, list: this.dev_arps},
        {name: "6", title: "相关MAC", icon: "el-icon-coin", limit: 10, list: this.dev_macs},
        {name: "7", title: "相关LLDP", icon: "el-icon-link", limit: 8, list: this.dev_lldps},
      ]
    },
    visibleSections () {
      return this.sections.filter(s => s.list.length > 0)
    },
    totalCount () {
      return this.sections.reduce((sum, s) => sum + s.list.length, 0)
    }
  },
  mounted() {
    try {
      this.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    } catch (e) {
      this.history = []
    }

    let cache = localStorage.getItem('fmManage_result')
    if(typeof(cache)!="string"){
      return
    }
    try {
      this.result_cache = JSON.parse(cache)
    } catch (e) {
      this.result_cache = ""
    }
    if(this.result_cache && this.result_cache.result){
      this.query_filter = this.result_cache.search
      this.searched = this.result_cache.search
      this.applyResult(this.result_cache.result)
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
      this.dev_lldps=[]
    },
    // 把接口返回的数据分发到各分类，并默认展开有结果的分类
    applyResult(data){
      data = data || {}
      const arr = key => (Array.isArray(data[key]) ? data[key] : [])
      this.dev_names = arr("device_list")
      this.dev_gates = arr("gate_list").concat(arr("gatev6_list"))
      this.dev_ports = arr("port_list")
      this.dev_sns = arr("sn_list")
      this.dev_arps = arr("arp_list")
      this.dev_macs = arr("mac_list")
      this.dev_lldps = arr("lldp_list")
      this.activeName = this.visibleSections.map(s => s.name)
    },
    getCommonDev(){
      let query = this.query_filter.replace(/^\s*|\s*$/g,"")
      if(!query){
        this.$message({type: 'warning', message: '请输入搜索关键字'})
        return
      }
      let that = this
      const start = Date.now()
      this.loading = true
      collector_api.findDevs({"query":query},{}).then(function(response){
        that.cleardata()
        const data = response.data.data || {}
        that.applyResult(data)

        that.searched = query
        that.costMs = Date.now() - start
        that.addHistory(query)

        that.result_cache = {}
        that.result_cache["search"] = query
        that.result_cache["result"] = data

        that.loading = false
      }).catch(function (error) {
          console.log(error)
          that.$message({type: 'error', message: '搜索失败，请重试'})
          that.loading = false
      })
    },
    searchBy(keyword){
      this.query_filter = keyword
      this.getCommonDev()
    },

    addHistory(keyword){
      const list = this.history.filter(h => h !== keyword)
      list.unshift(keyword)
      this.history = list.slice(0, HISTORY_MAX)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history))
    },
    clearHistory(){
      this.history = []
      localStorage.removeItem(HISTORY_KEY)
    },

    jumpTo(s){
      if(s.list.length === 0){
        return
      }
      if(this.activeName.indexOf(s.name) < 0){
        this.activeName.push(s.name)
      }
      this.$nextTick(() => {
        const el = document.getElementById('fm-sec-' + s.name)
        if(el){
          el.scrollIntoView({behavior: "smooth", block: "start"})
        }
      })
    },

    detailLink(ip){
      return {path: '/pages/device/device_detail', query: {dev: ip}}
    },
    statusType(val){
      return val == '1' ? 'success' : 'danger'
    },
    statusText(val){
      return val == '1' ? 'UP' : 'DOWN'
    },

    // 高亮关键字（先转义，避免设备回显里的内容被当成 HTML）
    hl(text){
      if(text === undefined || text === null || text === ""){
        return ""
      }
      const str = escapeHtml(String(text))
      if(!this.searched){
        return str
      }
      const re = new RegExp(escapeRegExp(escapeHtml(this.searched)), "gi")
      return str.replace(re, m => '<mark class="hl">' + m + '</mark>')
    },

    copyText(text){
      if(!text){
        return
      }
      const done = () => this.$message({type: 'success', message: '已复制：' + text, duration: 1500})
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
    }
  },
  components:{
  }
}
</script>

<style scoped>
.fm-manage {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}

/* 搜索区 */
.search-panel {
  padding: 28px 24px 20px;
  text-align: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #eef5ff 0%, #f7fbff 60%, #ffffff 100%);
  border: 1px solid #e3eefc;
}
.search-title {
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
}
.search-title i {
  color: #409eff;
  margin-right: 6px;
}
.search-desc {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}
.search-box {
  max-width: 680px;
  margin: 18px auto 0;
}
.search-box /deep/ .el-input__inner {
  height: 42px;
  line-height: 42px;
  font-size: 15px;
}
.search-box /deep/ .el-input-group__append {
  padding: 0 28px;
  color: #fff;
  background-color: #409eff;
  border-color: #409eff;
}
.search-box /deep/ .el-input-group__append:hover {
  background-color: #66b1ff;
}
.search-box /deep/ .el-input-group__append .el-button {
  color: #fff;
}
.search-history {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  max-width: 680px;
  margin: 12px auto 0;
}
.history-label {
  font-size: 12px;
  color: #909399;
}
.history-tag {
  margin: 4px;
  cursor: pointer;
}
.history-tag:hover {
  color: #fff;
  background-color: #409eff;
}

/* 概览 */
.summary {
  margin-top: 16px;
}
.summary-head {
  font-size: 13px;
  color: #606266;
}
.summary-kw {
  padding: 1px 6px;
  border-radius: 3px;
  color: #409eff;
  background-color: #ecf5ff;
}
.summary-cost {
  color: #909399;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.summary-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.summary-item:hover {
  border-color: #b3d8ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}
.summary-item.disabled {
  cursor: default;
  opacity: 0.5;
}
.summary-item.disabled:hover {
  border-color: #ebeef5;
  box-shadow: none;
}
.summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-right: 10px;
  border-radius: 8px;
  font-size: 18px;
  color: #409eff;
  background-color: #ecf5ff;
}
.summary-count {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}
.summary-label {
  font-size: 12px;
  color: #909399;
}

/* 结果区 */
.result-area {
  margin-top: 16px;
  min-height: 200px;
}
.result-collapse {
  border: none;
}
.result-collapse /deep/ .el-collapse-item {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}
.result-collapse /deep/ .el-collapse-item__header {
  height: 44px;
  line-height: 44px;
  padding: 0 16px;
  background-color: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}
.result-collapse /deep/ .el-collapse-item__header:not(.is-active) {
  border-bottom-color: transparent;
}
.result-collapse /deep/ .el-collapse-item__wrap {
  border-bottom: none;
}
.result-collapse /deep/ .el-collapse-item__content {
  padding: 12px 16px;
}
.sec-title {
  display: flex;
  align-items: center;
  flex: 1;
}
.sec-icon {
  font-size: 16px;
  color: #409eff;
  margin-right: 8px;
}
.sec-name {
  font-size: 14px;
  font-weight: 600;
}
.sec-count {
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  border-radius: 9px;
  color: #fff;
  background-color: #409eff;
}
.sec-limit {
  margin-left: 10px;
  font-size: 12px;
  color: #c0c4cc;
}

/* 设备卡片 */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}
.device-card {
  padding: 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fff;
  transition: all 0.2s;
}
.device-card:hover {
  border-color: #b3d8ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
}
.device-card-head {
  display: flex;
  align-items: center;
}
.device-img {
  width: 44px;
  height: 44px;
  padding: 4px;
  border-radius: 8px;
  background-color: #f2f6fc;
}
.device-head-info {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}
.device-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.device-name:hover {
  color: #409eff;
}
.device-ip {
  margin-top: 2px;
  font-size: 13px;
  color: #606266;
}
.device-meta {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}
.meta-row {
  display: flex;
  font-size: 13px;
  line-height: 24px;
}
.meta-label {
  width: 70px;
  flex-shrink: 0;
  color: #909399;
}
.meta-value {
  color: #303133;
  word-break: break-all;
}
.device-desc {
  margin-top: 8px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 18px;
  color: #606266;
  background-color: #f7f8fa;
  border-radius: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 表格 */
.result-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.dev-link {
  color: #409eff;
  text-decoration: none;
}
.dev-link:hover {
  text-decoration: underline;
}
.lldp-arrow {
  transform: rotate(90deg);
  color: #909399;
}

/* 复制按钮：悬停行/卡片时显示 */
.copy-btn {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}
.device-card:hover .copy-btn,
.result-table /deep/ .el-table__row:hover .copy-btn {
  opacity: 1;
}

/* 关键字高亮 */
.fm-manage /deep/ .hl {
  padding: 0 1px;
  color: #e6a23c;
  background-color: #fdf6ec;
  border-radius: 2px;
}
</style>
