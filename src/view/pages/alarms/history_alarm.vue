<template>
  <div class="parent-nested-page">
    <!-- 搜索菜单栏 -->
    <div>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item label="设备IP">
            <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="searchKey" clearable></el-input>
          </el-form-item>
          <el-form-item label="设备名">
            <el-input placeholder="设备名" v-model="filter_hostname" @keyup.enter.native="searchKey" clearable></el-input>
          </el-form-item>
          <el-form-item label="告警对象">
            <el-input placeholder="告警对象" v-model="filter_object" @keyup.enter.native="searchKey" clearable></el-input>
          </el-form-item>
          <el-form-item label="关键字">
            <el-input placeholder="关键字" v-model="filter_keyword" @keyup.enter.native="searchKey" clearable></el-input>
          </el-form-item>
        </el-form>
      </el-row>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="filter_start_time"
              type="datetime"
              placeholder="选择日期时间"
              align="right"
              format="yyyy年MM月dd HH:mm:ss"
              value-format="timestamp"
              :picker-options="pickerOptions">
            </el-date-picker>
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="filter_end_time"
              type="datetime"
              placeholder="选择日期时间"
              align="right"
              format="yyyy年MM月dd HH:mm:ss"
              value-format="timestamp"
              :picker-options="pickerOptions">
            </el-date-picker>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>
    <!-- 级别统计条。统计的是本次查出来的这批历史告警，点卡片在结果里再筛 -->
    <AlarmStatsBar
      v-if="rawAlarmData.length > 0"
      :groups="rawAlarmData"
      :active-severity="filter_severity"
      :active-status="filter_status"
      :active-muted="filter_muted"
      :has-filter="hasFilter"
      @pick="handleStatPick"
    />

    <!-- 操作按钮栏 -->
    <div class="global-operation-bar">
      <el-button type="success" @click="extractLog" :loading="isload" size="mini">导出告警数据</el-button>
      <el-button @click="expandAll" size="mini">全部展开</el-button>
      <el-button @click="collapseAll" size="mini">全部折叠</el-button>
      <span class="op-spacer"></span>
      <span class="refresh-tip" v-if="rawAlarmData.length > 0">
        共 {{ rawAlarmData.length }} 台设备，筛出 {{ nestedAlarmListData.length }} 台
      </span>
    </div>

    <!-- 引入嵌套折叠列表组件 -->
    <NestedCollapseAlarmList
      :list-data="nestedAlarmListData"
      :collapsedStateCache="collapsedStateCache"
      :menuList="alarmMenu"
      v-if="nestedAlarmListData.length > 0"
      @all-select-change="changeData"
      @collapsed-state-change="handleCollapsedStateChange"
      @bnt_event="handleEvent"
      @view-device-logs="showDeviceLogs"
    />
    <!-- 空态：区分"没查过"、"查了没结果"和"筛选条件没匹配上" -->
    <div class="loading-tip" v-else>
      {{ rawAlarmData.length > 0 ? '当前筛选条件下没有告警，换个条件试试' : '设置条件后点筛选查询历史告警' }}
    </div>

    <el-dialog title="查看详情" :visible.sync="diag_detail_show" width="60%" append-to-body>
      <!-- 引入日志展示组件，传入日志数据 -->
      <LogDisplay
        :log-data="serverLogData"
        :expired="serverLogExpired"
        card-title="系统运行日志"
        container-height="700px"
      />
    </el-dialog>

    <!-- 设备级全部日志：不限指纹，含没产生告警的日志 -->
    <el-dialog :title="deviceLogTitle" :visible.sync="diag_device_log_show" width="70%" append-to-body>
      <div class="device-log-tip" v-if="deviceLogTruncated">
        日志条数超过上限，只显示最早的 500 条。要看全部请收窄时间范围或去 ES 查
      </div>
      <LogDisplay
        :log-data="deviceLogData"
        card-title="设备日志（按时间排序）"
        container-height="700px"
      />
    </el-dialog>

    <el-dialog title="查看详情" :visible.sync="diag_handle_show" width="60%" append-to-body>
      <!-- 引入日志展示组件，传入日志数据 -->
      <HandleLogDisplay
        :log-data="handleLogData"
        card-title="运维操作日志"
        container-height="700px"
      />
    </el-dialog>




  </div>
</template>

<script>
// 局部引入嵌套折叠列表组件
import NestedCollapseAlarmList from './alarm_sub/NestedCollapseAlarmList.vue';
// 引入日志展示组件
import LogDisplay from './alarm_sub/LogDisplay.vue';
import HandleLogDisplay from './alarm_sub/HandleLogDisplay.vue';
// 级别统计条，和当前告警页共用
import AlarmStatsBar from './alarm_sub/AlarmStatsBar.vue';
import alarm_api from "@/api/mapis/alarm_interface.js"
import { downloadFile } from '@/utils/downloadUtil';

export default {
  name: 'HistoryAlarm',
  components: {
    NestedCollapseAlarmList,LogDisplay,HandleLogDisplay,AlarmStatsBar
  },
  data() {
    return {
      //时间选择器选项
      pickerOptions: {
        shortcuts: [{
          text: '此刻',
          onClick(picker) {
            picker.$emit('pick', new Date());
          }
        },{
          text: '1小时前',
          onClick(picker) {
            const date = new Date();
            date.setTime(date.getTime() - 3600 * 1000 * 1);
            picker.$emit('pick', date);
          }
        }, {
          text: '3小时前',
          onClick(picker) {
            const date = new Date();
            date.setTime(date.getTime() - 3600 * 1000 * 3);
            picker.$emit('pick', date);
          }
        }]
      },



      diag_detail_show:false,
      diag_handle_show:false,
      // 核心：折叠状态缓存对象（{ "ip地址": 折叠状态, ... }）
      collapsedStateCache: {},

      //日志详情
      serverLogData: [],
      serverLogExpired: false,

      // 设备级全部日志
      diag_device_log_show: false,
      deviceLogData: [],
      deviceLogTruncated: false,
      deviceLogTitle: '设备日志',

      //操作历史记录
      handleLogData: [],
      // 接口返回的原始分组数据。展示用的 nestedAlarmListData 由它过滤出来，
      // 点统计条在已查出的结果里再筛，不重新打接口
      rawAlarmData: [],

      // 统计条上的前端筛选（服务端筛选是上面那套表单，两者独立）
      filter_severity:"",
      filter_status:"",
      filter_muted:"",

      alarmMenu:[
        {"name": "show_detail",'icon':"el-icon-view",'type':"primary"},
        {"name": "show_handle",'icon':"el-icon-tickets",'type':"info"},
      ],


      isload:false,
      hanld_cache:[],


      //筛选条件变量
      filter_ip:"",
      filter_hostname:"",
      filter_object:"",
      filter_keyword:"",
      filter_start_time:"",
      filter_end_time:"",



    };
  },
  computed: {
    // 在已查出的结果里按统计条的条件再筛，子项全被滤掉的设备整组不显示。
    // 只认级别/处理状态/静默这三项——IP、设备名、对象、关键字、时间范围
    // 都是服务端筛的，在这儿再做一遍没意义
    nestedAlarmListData() {
      const groups = [];
      this.rawAlarmData.forEach(group => {
        const children = (group.children || []).filter(item => {
          if (this.filter_severity && String(item.severity) !== this.filter_severity) return false;
          if (this.filter_status && String(item.status) !== this.filter_status) return false;
          if (this.filter_muted && String(Number(item.muted)) !== this.filter_muted) return false;
          return true;
        });
        if (children.length > 0) {
          groups.push({ ...group, children: children });
        }
      });
      return groups;
    },
    hasFilter() {
      return !!(this.filter_severity || this.filter_status || this.filter_muted);
    }
  },
  methods:{
    /**
     * 处理子组件上报的折叠状态变化（核心事件处理方法）
     * @param {Object} payload 子组件传递的载荷对象 { ip, isExpanded }
     */
    handleCollapsedStateChange(payload) {
      // 1. 解构载荷数据，做容错处理（避免子组件传递数据异常导致报错）
      const { ip, isExpanded } = payload || {};
      if (!ip || isExpanded === undefined) {
        console.warn('折叠状态更新失败：缺少有效参数');
        return;
      }

      // 2. 核心：使用 $set 更新缓存对象，保证 Vue 响应式更新
      // 原因：Vue 2 无法检测对象属性的新增/修改，$set 可触发视图更新，同步到子组件
      this.$set(this.collapsedStateCache, ip, isExpanded);

      // 3. 可选：打印日志，便于调试
      // console.log(`设备 ${ip} 折叠状态更新：`, isExpanded ? '展开' : '折叠');
    },

    changeData(val){
      // console.log("变更了数据===", val)
      this.hanld_cache = val["inner"]
    },

    handleEvent(key, data){
      if(key=="show_detail"){
        this.showDetail(data)
      }else if(key=="show_handle"){
        this.getHistoryHandle(data)
      }
    },
    getHistoryHandle(item){
      console.log("查询历史操作", item)
      let that = this
      alarm_api.getHandleLog({"alarm_id": item["alarm_id"]},{}).then(function (response) {
        // console.log("handle===",response.data)
        if(response.data.code==0){
          that.handleLogData=response.data["data"]
          that.diag_handle_show=true
        }else{
          that.$message({
            type: 'error',
            message: '查询失败，请重试'+response.data.message
          });
        }
      })
      .catch(function (error) {
        console.log(error)
      })


    },
    showDetail(item){
      // console.log("查看日志详情==", item)
      let that = this
      let post_data = {}
      post_data["alarm_id"]=item["alarm_id"]

      this.serverLogData=[]
      this.serverLogExpired=false
      alarm_api.getAlarmLogDetail(post_data,{}).then(function (response) {
        if(response.data.code==0){
          const detail = response.data["data"] || {}
          that.serverLogData=detail["logs"] || []
          that.serverLogExpired=!!detail["expired"]
          that.diag_detail_show=true
        }else{
          that.$message({
            type: 'error',
            message: '查询失败，请重试'+response.data.message
          });
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    },

    /**
     * 设备级全部日志：这台设备在告警窗口内的所有日志，不限指纹
     * @param {Object} payload { ip, hostname, start_ts, end_ts }
     */
    showDeviceLogs(payload){
      let that = this
      this.deviceLogData = []
      this.deviceLogTruncated = false
      this.deviceLogTitle = '设备日志 - ' + (payload.hostname || payload.ip)

      alarm_api.getDeviceLogDetail({
        ip: payload.ip,
        start_ts: payload.start_ts,
        end_ts: payload.end_ts
      }, {}).then(function (response) {
        if(response.data.code==0){
          const detail = response.data["data"] || {}
          that.deviceLogData = detail["logs"] || []
          that.deviceLogTruncated = !!detail["truncated"]
          that.diag_device_log_show = true
          if(that.deviceLogData.length === 0){
            that.$message({
              type: 'info',
              message: '这段时间内没有日志记录（alarm_log 只留 7 天）'
            });
          }
        }else{
          // 历史页能筛出跨度很大的结果，窗口超过 1 天后端会拒绝
          that.$message({
            type: 'error',
            message: '查询失败：'+response.data.message
          });
        }
      })
      .catch(function (error) {
        console.log(error)
        that.$message({ type: 'error', message: '查询异常，请重试' })
      })
    },

    searchKey(){
      let that = this
      let post_data={
        "start_time": parseInt(new Date().getTime()/1000-86400),
        "end_time": parseInt(new Date().getTime()/1000),
      }

      this.filter_ip = this.filter_ip.replace(/^\s*|\s*$/g,"")
      if(this.filter_ip!=""){
        post_data["ip_reg"] = this.filter_ip
      }

      this.filter_hostname = this.filter_hostname.replace(/^\s*|\s*$/g,"")
      if(this.filter_hostname!=""){
        post_data["hostname_reg"] = this.filter_hostname
      }

      this.filter_object = this.filter_object.replace(/^\s*|\s*$/g,"")
      if(this.filter_object!=""){
        post_data["alarm_object_reg"] = this.filter_object
      }

      this.filter_keyword = this.filter_keyword.replace(/^\s*|\s*$/g,"")
      if(this.filter_keyword!=""){
        post_data["keyword_reg"] = this.filter_keyword
      }

      if(this.filter_start_time){
        post_data["start_time"]=parseInt(this.filter_start_time/1000)
      }

      if(this.filter_end_time){
        post_data["end_time"]=parseInt(this.filter_end_time/1000)
      }

      this.isload=true
      alarm_api.getHistoryAlarm(post_data,{}).then(function (response) {
        if(response.data.code==0){
          const newData = response.data["data"] || [];
          // 保留数组引用，仅清空内容并添加新数据（避免子组件整体重渲染）
          that.rawAlarmData.splice(0);
          that.rawAlarmData.push(...newData);
          // 换了查询条件就把统计条上的前端筛选清掉，否则新结果会被上一次
          // 选的级别挡住，看着像"查出来是空的"
          that.resetStatFilter();
        }else{
          that.$message({
            type: 'error',
            message: '查询失败，请重试'+response.data.message
          });
        }
        that.isload=false
      })
      .catch(function (error) {
        console.log(error)
        that.isload=false
      })
    },

    /**
     * 统计条点击：再点一次同一张卡取消该筛选
     * @param {Object} payload { type: reset/severity/status/muted, value }
     */
    handleStatPick({ type, value }){
      if(type === 'reset'){
        this.resetStatFilter()
        return
      }
      const field = { severity: 'filter_severity', status: 'filter_status', muted: 'filter_muted' }[type]
      if(!field) return
      this[field] = this[field] === value ? '' : value
    },
    resetStatFilter(){
      this.filter_severity = ''
      this.filter_status = ''
      this.filter_muted = ''
    },

    /** 全部展开/折叠：把当前可见设备的 ip 一次性写进折叠状态缓存 */
    expandAll(){
      this.nestedAlarmListData.forEach(group => {
        this.$set(this.collapsedStateCache, group.ip, true)
      })
    },
    collapseAll(){
      this.nestedAlarmListData.forEach(group => {
        this.$set(this.collapsedStateCache, group.ip, false)
      })
    },
    extractLog(){
      // console.log("导出选中日志==", this.hanld_cache)
      let that = this
      if(this.hanld_cache.length<=0){
        this.$message({
          type: 'error',
          message: '未选中日志'
        });
        return
      }
      this.isload=true
      alarm_api.getAlarmByIds({"alarm_ids":this.hanld_cache},{}).then(function (response) {
        // console.log("log extract===",response.data)
        if(response.data.code==0){
          const newData = response.data["data"] || [];
          that.getExportContent(newData)
        }else{
          that.$message({
            type: 'error',
            message: '查询失败，请重试'+response.data.message
          });
        }
        that.isload=false
      })
      .catch(function (error) {
        console.log(error)
      })
    },
    getExportContent(alarm_datas){
      const device_log = {}
      alarm_datas.forEach((alarm, index) => {
        let label = `[${alarm["ip"]}]${alarm["hostname"]}`
        if(!device_log[label]){
          device_log[label]=[]
        }
        device_log[label].push(alarm)
      });
      let exportContent = '';

      // 2. 遍历顶层对象（获取 hostname 和对应的聚合告警数组）
      const hostnameEntries = Object.entries(device_log);
      for (const [hostname, hostnameAlarms] of hostnameEntries) {
        // 2.1 拼接 hostname 分隔符（格式：=======hostname=========）
        const separator = `\n=======${hostname}=========\n`;
        exportContent += separator;

        // 2.3 拼接当前 hostname 下的所有聚合告警，一行一条
        hostnameAlarms.forEach((alarm, index) => {
          const logLine = `[P${alarm.severity}][${alarm.state}] ${alarm.keyword} ${alarm.alarm_object} 条数:${alarm.counter} ${alarm.msg}\n`;
          exportContent += logLine;
        });
      }

      // 3. 生成带时间戳的文件名
      const now = new Date();
      const timeStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `switch_log_${timeStr}.log`;

      // 3. 调用下载工具函数
      downloadFile(exportContent, fileName, 'text/plain');
    },


  },
};
</script>

<style scoped>
/* 原来写死 max-height:600px，告警一多就全挤在一个小滚动框里，
   外面大片空白。改成跟着内容走，页面自己滚 */
.parent-nested-page {
  width: 95%;
  max-width: 1600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.loading-tip {
  font-size: 14px;
  color: #606266;
  padding: 50px 30px;
  text-align: center;
  background-color: #ffffff;
  border: 1px dashed #e4e7ed;
  border-radius: 8px;
}

/* 设备日志超上限的提示 */
.device-log-tip {
  margin-bottom: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #e6a23c;
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
}

/* 操作按钮栏 */
.global-operation-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.op-spacer {
  flex: 1;
  min-width: 10px;
}

.refresh-tip {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
</style>
