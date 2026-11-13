<template>
  <div class="parent-nested-page">
    <!-- 级别统计条：告警页最该一眼看到的信息，点一下就按它筛选。
         show-pending=false：这一页全是待处理的，那张卡等于重复显示总数 -->
    <AlarmStatsBar
      :groups="rawAlarmData"
      :active-severity="filter_severity"
      :active-status="filter_status"
      :active-muted="filter_muted"
      :has-filter="hasFilter"
      :show-pending="false"
      @pick="handleStatPick"
    />

    <!-- 操作栏：批量处理 + 筛选 + 展开折叠 + 刷新状态 -->
    <div class="global-operation-bar">
      <el-button type="primary" @click="handle_syslog" size="mini">处理选中告警</el-button>
      <el-button type="success" :loading="isload" @click="extractLog" size="mini">导出告警数据</el-button>
      <el-button @click="expandAll" size="mini">全部展开</el-button>
      <el-button @click="collapseAll" size="mini">全部折叠</el-button>

      <el-select v-model="filter_state" placeholder="告警状态" size="mini" clearable class="filter-select">
        <el-option label="告警" value="open"></el-option>
        <el-option label="恢复" value="clear"></el-option>
      </el-select>
      <!-- 没有"处理状态"筛选框：这一页只有待处理的（后端按 status=0 过滤），
           筛也筛不出别的。要看已处理/已忽略的去历史告警页 -->
      <el-input v-model="filter_keyword" placeholder="事件码/对象" size="mini" clearable class="filter-input"></el-input>

      <span class="op-spacer"></span>
      <span class="refresh-tip">{{ lastRefreshText }}</span>
      <el-button :type="autoRefresh ? 'warning' : 'info'" @click="toggleAutoRefresh" size="mini" plain>
        {{ autoRefresh ? '暂停自动刷新' : '恢复自动刷新' }}
      </el-button>
      <el-button type="success" @click="fresh_alarm" size="mini" icon="el-icon-refresh">刷新</el-button>
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
    <!-- 空态：区分"真没告警"和"筛选条件没匹配上" -->
    <div class="loading-tip" v-else>
      {{ rawAlarmData.length > 0 ? '当前筛选条件下没有告警，换个条件试试' : '暂无告警' }}
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

    <el-dialog title="处理告警" width="50%" :visible.sync="diag_handle_show" destroy-on-close :close-on-click-modal="false" append-to-body>
      <el-form label-width="100px" ref="handle_form" :model="handle_feature">
        <el-form-item label="选中告警数量" prop="selected_count">
          <el-input style="width: 500px;" placeholder="选中告警数量" v-model="handle_feature.selected_count" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="p_type">
          <el-select v-model="handle_feature.status" placeholder="请选择类型">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input v-model="handle_feature.descr"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submitHandleForm" size="small">确定</el-button>
          <el-button type="info" @click="diag_handle_show=false" size="small">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


  </div>
</template>

<script>
// 局部引入嵌套折叠列表组件
import NestedCollapseAlarmList from './alarm_sub/NestedCollapseAlarmList.vue';
// 引入日志展示组件
import LogDisplay from './alarm_sub/LogDisplay.vue';
// 级别统计条，和历史告警页共用
import AlarmStatsBar from './alarm_sub/AlarmStatsBar.vue';
import alarm_api from "@/api/mapis/alarm_interface.js"
import { downloadFile } from '@/utils/downloadUtil';

export default {
  name: 'ParentNestedAlarm',
  components: {
    NestedCollapseAlarmList,LogDisplay,AlarmStatsBar
  },
  data() {
    return {
      // 定时器实例（必须保存，用于后续销毁）
      updateTimer: null,


      diag_detail_show:false,
      // 核心：折叠状态缓存对象（{ "ip地址": 折叠状态, ... }）
      collapsedStateCache: {},

      serverLogData: [],
      serverLogExpired: false,

      // 设备级全部日志
      diag_device_log_show: false,
      deviceLogData: [],
      deviceLogTruncated: false,
      deviceLogTitle: '设备日志',
      // 接口返回的原始分组数据。页面展示的 nestedAlarmListData 由它过滤出来，
      // 筛选条件变化时不用重新请求
      rawAlarmData: [],

      alarmMenu:[
        {"name": "show_detail",'icon':"el-icon-view",'type':"primary"},
      ],

      // 筛选条件
      filter_severity:"",
      filter_state:"",
      filter_status:"",
      filter_muted:"",
      filter_keyword:"",

      // 自动刷新
      autoRefresh:true,
      lastRefreshAt:0,

      isload:false,
      hanld_cache:"",
      diag_handle_show:false,
      handle_feature:{},
      // 没有 statusOptions：这一页后端按 status=0 过滤，没有处理状态筛选框。
      // 要按处理状态筛去历史告警页
      //
      // typeOptions 是人工处理表单可选值，不加 5——系统判定忽略是 L5
      // 定级规则自动产生的，不是人能手动选的操作
      typeOptions:[{"label":"已确认", "value": "1"},{"label":"已处理", "value": "2"},{"label":"忽略", "value": "3"},{"label":"屏蔽", "value": "4"}]

    };
  },
  computed: {
    // 按筛选条件过滤，子项全被滤掉的设备整组不显示
    nestedAlarmListData() {
      const kw = this.filter_keyword.trim().toLowerCase();
      const groups = [];
      this.rawAlarmData.forEach(group => {
        const children = (group.children || []).filter(item => {
          if (this.filter_severity && String(item.severity) !== this.filter_severity) return false;
          if (this.filter_state && item.state !== this.filter_state) return false;
          if (this.filter_status && String(item.status) !== this.filter_status) return false;
          if (this.filter_muted && String(Number(item.muted)) !== this.filter_muted) return false;
          if (kw) {
            const hay = `${item.keyword || ''} ${item.alarm_object || ''}`.toLowerCase();
            if (hay.indexOf(kw) === -1) return false;
          }
          return true;
        });
        if (children.length > 0) {
          groups.push({ ...group, children: children });
        }
      });
      return groups;
    },
    lastRefreshText() {
      if (!this.lastRefreshAt) return '尚未刷新';
      const d = new Date(this.lastRefreshAt);
      const pad = (n) => n.toString().padStart(2, '0');
      return `更新于 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
    hasFilter() {
      return !!(this.filter_severity || this.filter_state || this.filter_status
        || this.filter_muted || this.filter_keyword.trim());
    }
  },
  created() {
    // 1. 组件创建时，初始化定时任务（每 30 秒执行一次）
    this.initUpdateTimer();
  },
  mounted() {
    this.fresh_alarm();
  },
  beforeDestroy() {
    // 定时器之前只建不收，离开页面后还在后台每 30 秒打一次接口
    this.clearUpdateTimer();
  },
  methods:{
    /**
     * 初始化 30 秒定时更新定时器
     */
    initUpdateTimer() {
      // 先清理已有定时器（避免重复创建）
      this.clearUpdateTimer();

      // 2. 创建定时任务，每 30000 毫秒（30 秒）执行一次 fetchDataUpdate
      this.updateTimer = setInterval(() => {
        this.fresh_alarm();
      }, 30000); // 30 * 1000 = 30000 毫秒
    },

    /**
     * 清理定时任务
     */
    clearUpdateTimer() {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null; // 重置定时器实例，避免残留
      }
    },
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
      }
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
    handle_syslog(){
      if(this.hanld_cache.length<=0){
        this.$message({
          type: 'error',
          message: '未选中告警'
        });
        return
      }
      this.$set(this.handle_feature, 'selected_count', this.hanld_cache.length)
      this.diag_handle_show=true
    },
    submitHandleForm(){
      // console.log("提交状态修改===", this.hanld_cache, this.handle_feature)
      let that = this
      let post_data = {}
      post_data["alarm_ids"] = this.hanld_cache
      post_data["handler"] = "chensong"
      post_data["status"] = String(this.handle_feature["status"])
      post_data["descr"] = this.handle_feature["descr"] || ""
      alarm_api.handleAlarmByIds(post_data,{}).then(function (response) {
        // console.log("handle log===",response.data)
        if(response.data.code==0){
          that.$message({
            type: 'success',
            message: '处理成功'
          });
          that.diag_handle_show=false
          that.fresh_alarm()
        }else{
          that.$message({
            type: 'error',
            message: '处理失败，请重试'+response.data.message
          });
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    },

    fresh_alarm(){
      let that = this
      alarm_api.getCurrentAlarm({},{}).then(function (response) {
        // console.log("current log===",response.data)
        if(response.data.code==0){
          const newData = response.data["data"] || [];
          // 保留数组引用，仅清空内容并添加新数据（避免子组件整体重渲染）
          that.rawAlarmData.splice(0);
          that.rawAlarmData.push(...newData);
          that.lastRefreshAt = Date.now();
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
     * 统计条点击：再点一次同一张卡取消该筛选
     * @param {Object} payload { type: reset/severity/status/muted, value }
     */
    handleStatPick({ type, value }){
      if(type === 'reset'){
        this.resetFilter()
        return
      }
      const field = { severity: 'filter_severity', status: 'filter_status', muted: 'filter_muted' }[type]
      if(!field) return
      this[field] = this[field] === value ? '' : value
    },
    resetFilter(){
      this.filter_severity = ''
      this.filter_state = ''
      this.filter_status = ''
      this.filter_muted = ''
      this.filter_keyword = ''
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

    toggleAutoRefresh(){
      this.autoRefresh = !this.autoRefresh
      if(this.autoRefresh){
        this.initUpdateTimer()
        this.$message({ type: 'success', message: '已恢复 30 秒自动刷新' })
      }else{
        this.clearUpdateTimer()
        this.$message({ type: 'info', message: '已暂停自动刷新' })
      }
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
        const hw = [alarm["vendor"], alarm["hardware"]].filter(Boolean).join(' ')
        let label = `[${alarm["ip"]}]${alarm["hostname"]}${hw ? ' (' + hw + ')' : ''}`
        if(!device_log[label]){
          device_log[label]=[]
        }
        device_log[label].push(alarm)
      });
      let exportContent = '';

      // 遍历顶层对象（获取 hostname 和对应的告警数组）
      const hostnameEntries = Object.entries(device_log);
      for (const [hostname, hostnameAlarms] of hostnameEntries) {
        // 拼接 hostname 分隔符（格式：=======hostname=========）
        const separator = `\n=======${hostname}=========\n`;
        exportContent += separator;

        // 拼接当前 hostname 下的所有聚合告警，一行一条。object_alias
        // 目前只有接口对象会有值（端口描述），没有就不加这段括号
        hostnameAlarms.forEach((alarm, index) => {
          const objectText = alarm.object_alias ? `${alarm.alarm_object}(${alarm.object_alias})` : alarm.alarm_object;
          const logLine = `[P${alarm.severity}][${alarm.state}] ${alarm.keyword} ${objectText} 条数:${alarm.counter} ${alarm.msg}\n`;
          exportContent += logLine;
        });
      }

      // 生成带时间戳的文件名
      const now = new Date();
      const timeStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `switch_log_${timeStr}.log`;

      // 调用下载工具函数
      downloadFile(exportContent, fileName, 'text/plain');
    }


  },
};
</script>

<style scoped>
/* 原来写死 max-height:600px，告警一多就全挤在一个小滚动框里，
   外面大片空白。改成跟着视口走，页面自己滚 */
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

/* 统计条的样式在 alarm_sub/AlarmStatsBar.vue 里 */

/* ---------- 操作/筛选栏 ---------- */
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

.filter-select {
  width: 120px;
}

.filter-input {
  width: 160px;
}

/* 把刷新相关的挤到最右边，和左边的操作按钮分开 */
.op-spacer {
  flex: 1;
  min-width: 10px;
}

.refresh-tip {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
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
</style>
