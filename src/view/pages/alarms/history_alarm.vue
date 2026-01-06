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
    <!-- 新增：操作按钮栏（全局，用于批量处理所有日志） -->
    <div class="global-operation-bar">
      <el-button type="success" @click="extractLog" :loading="isload" size="mini">导出日志数据</el-button>
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
    />
    <!-- 加载中提示 -->
    <div class="loading-tip" v-else>暂无数据</div>

    <el-dialog title="查看详情" :visible.sync="diag_detail_show" width="60%" append-to-body>
      <!-- 引入日志展示组件，传入日志数据 -->
      <LogDisplay
        :log-data="serverLogData"
        card-title="系统运行日志"
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
import alarm_api from "@/api/mapis/alarm_interface.js"
import { downloadFile } from '@/utils/downloadUtil';

export default {
  name: 'ParentNestedAlarm',
  components: {
    NestedCollapseAlarmList,LogDisplay,HandleLogDisplay
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
      //操作历史记录
      handleLogData: [],
      // 符合要求的嵌套式告警数据（可直接替换为接口返回数据）
      nestedAlarmListData: [],

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
  created() {
    // 1. 组件创建时，初始化定时任务（每 30 秒执行一次）
    // this.initUpdateTimer();
  },
  mounted() {
    // this.fresh_alarm();
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
      alarm_api.getAlarmLog({"group_label": item["group_label"]},{}).then(function (response) {
        // console.log("handle===",response.data)
        if(response.data.code==0){
          // that.nestedAlarmListData=response.data["data"]
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
      post_data["group_label"]=item["group_label"]

      this.serverLogData=[]
      alarm_api.getAlarmByGroup(post_data,{}).then(function (response) {
        // console.log("current log detail===",response.data)
        if(response.data.code==0){
          // that.nestedAlarmListData=response.data["data"]
          that.serverLogData=response.data["data"]
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

    searchKey(){
      let that = this
      // this.nestedAlarmListData=[]
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
        console.log("history log===",response.data)
        if(response.data.code==0){
          // that.nestedAlarmListData=response.data["data"]
          // 关键：保留数组引用，仅清空内容并添加新数据（避免子组件整体重渲染）
          const newData = response.data["data"] || [];
          that.nestedAlarmListData.splice(0);
          that.nestedAlarmListData.push(...newData);
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
      alarm_api.getLogByGroup({"group_labels":this.hanld_cache},{}).then(function (response) {
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
      alarm_datas.forEach((log, index) => {
        let label = `[${log["ip"]}]${log["hostname"]}`
        if(device_log[label]){
          device_log[label].push(log)
        }else{
          device_log[label]=[]
          device_log[label].push(log)
        }
      });
      let exportContent = '';

      // 2. 遍历顶层对象（获取 hostname 和对应的日志数组）
      const hostnameEntries = Object.entries(device_log);
      for (const [hostname, hostnameLogs] of hostnameEntries) {
        // 2.1 拼接 hostname 分隔符（格式：=======hostname=========）
        const separator = `\n=======${hostname}=========\n`;
        exportContent += separator;

        // 2.3 拼接当前 hostname 下的所有日志内容
        hostnameLogs.forEach((log, index) => {
          const logLine = `${log.msg}\n`;
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

<style>
.parent-nested-page {
  width: 95%;
  max-width: 1600px;
  margin: 50px auto;
  padding: 25px;
  background-color: #f5f7fa;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  height: 100%;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.loading-tip {
  font-size: 14px;
  color: #606266;
  padding: 30px;
  text-align: center;
}

/* 全局操作按钮栏 */
.global-operation-bar {
  margin-bottom: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
