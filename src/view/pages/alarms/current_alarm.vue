<template>
  <div class="parent-nested-page">
    <!-- 新增：操作按钮栏（全局，用于批量处理所有日志） -->
    <div class="global-operation-bar">
      <el-button type="primary" @click="handle_syslog" size="mini">处理选中日志</el-button>
      <el-button type="success" @click="" size="mini">导出日志数据</el-button>
      <el-button type="success" @click="fresh_alarm" size="mini">当前告警</el-button>
    </div>
    <!-- 引入嵌套折叠列表组件 -->
    <NestedCollapseAlarmList
      :list-data="nestedAlarmListData"
      :collapsedStateCache="collapsedStateCache"
      v-if="nestedAlarmListData.length > 0"
      @all-select-change="changeData"
      @collapsed-state-change="handleCollapsedStateChange"
      @show-item="showDetail"
    />
    <!-- 加载中提示 -->
    <div class="loading-tip" v-else>正在加载嵌套告警数据...</div>

    <el-dialog title="查看详情" :visible.sync="diag_detail_show" width="60%" append-to-body>
      <!-- 引入日志展示组件，传入日志数据 -->
      <LogDisplay
        :log-data="serverLogData"
        card-title="系统运行日志"
        container-height="700px"
      />
    </el-dialog>

    <el-dialog title="处理告警" width="50%" :visible.sync="diag_handle_show" destroy-on-close :close-on-click-modal="false" append-to-body>
      <el-form label-width="100px" ref="handle_form" :model="handle_feature">
        <el-form-item label="告警类型数量" prop="counter">
          <el-input style="width: 500px;" placeholder="告警类型数量" v-model="handle_feature.counter" disabled readonly></el-input>
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
import alarm_api from "@/api/mapis/alarm_interface.js"


export default {
  name: 'ParentNestedAlarm',
  components: {
    NestedCollapseAlarmList,LogDisplay
  },
  data() {
    return {
      // 定时器实例（必须保存，用于后续销毁）
      updateTimer: null,


      diag_detail_show:false,
      // 核心：折叠状态缓存对象（{ "ip地址": 折叠状态, ... }）
      collapsedStateCache: {},

      serverLogData: [
        {
          msg: "2026-01-04 10:00:00 [INFO] 系统启动成功，端口：8080",
          status: 1
        },
        {
          msg: "2026-01-04 10:05:00 [WARN] 数据库连接池剩余连接数不足：5/100",
          status: 0
        },
        {
          msg: "2026-01-04 10:10:00 [ERROR] 用户登录失败，用户名：admin，错误信息：密码错误",
          status: 0
        }
      ],
      // 符合要求的嵌套式告警数据（可直接替换为接口返回数据）
      nestedAlarmListData: [
        {
          "ip": "3.3.3.3",
          "hostname": "NHZ04_M02_S125_FN_CSW1.S",
          "children": [
            {
              "group_label": "e02bc7d5c2cf985f487cf1ca24360e14",
              "alarm_type": "syslog",
              "group_name": "up/down状态",
              "alarm_object": "Vlan-interface11",
              "keyword": "IFNET/5/LINK_UPDOWN",
              "counter": 20,
              "start_time": 1767495421,
              "end_time": 1767495431
            }
          ]
        },
        {
          "ip": "4.4.4.4",
          "hostname": "NHZ04_M02_S125_FN_CSW2.S",
          "children": [
            {
              "group_label": "1234567890abcdef1234567890abcdef",
              "alarm_type": "metric",
              "group_name": "CPU使用率过高",
              "alarm_object": "CPU 0",
              "keyword": "CPU_USAGE/HIGH",
              "counter": 5,
              "start_time": 1767495500,
              "end_time": 1767495600
            }
          ]
        }
      ],

      isload:false,
      hanld_cache:"",
      diag_handle_show:false,
      handle_feature:{},
      typeOptions:[{"label":"确认", "value": 1},{"label":"忽略", "value": 2},{"label":"屏蔽", "value": 3}]

    };
  },
  created() {
    // 1. 组件创建时，初始化定时任务（每 30 秒执行一次）
    this.initUpdateTimer();
  },
  mounted() {
    this.fresh_alarm();
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
    handle_syslog(){
      this.$set(this.handle_feature, 'counter', this.hanld_cache.length)
      this.diag_handle_show=true
    },
    submitHandleForm(){
      // console.log("提交状态修改===", this.hanld_cache, this.handle_feature)
      let that = this
      let post_data = {}
      post_data["group_labels"] = this.hanld_cache
      post_data["handler"] = "chensong"
      post_data["status"] = this.handle_feature["status"]
      alarm_api.handleAlarmByGroup(post_data,{}).then(function (response) {
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
      // this.nestedAlarmListData=[]
      alarm_api.getCurrentAlarm({},{}).then(function (response) {
        // console.log("current log===",response.data)
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
      })
      .catch(function (error) {
        console.log(error)
      })
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
