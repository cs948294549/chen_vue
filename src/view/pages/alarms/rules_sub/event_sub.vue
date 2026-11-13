<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_event=defaultEvent();" size="mini">创建事件属性</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="事件码">
              <el-input placeholder="event_code" v-model="filter_event_code" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="描述">
              <el-input placeholder="描述" v-model="filter_descr" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <div>
        <tem_table
          ref="event_t"
          :key="refresh_flag"
          v-bind:table_data="table_data"
          v-bind:table_header="table_header"
          v-bind:multi_flag="false"
          v-bind:option_btn="tab_single_btns"
          v-bind:option_multibtn="[]"
          v-bind:download_flag="false"
          @deleteRow="deleteRow"
          @updateRow="updateRow"
          >
        </tem_table>
      </div>
    </div>

    <el-dialog title="新增事件属性" :visible.sync="diag_flag" width="55%" append-to-body>
      <el-form :model="feature_event" size="mini" label-width="110px">
        <el-form-item label="事件码">
          <el-select v-model="feature_event.event_code" placeholder="统一事件码，如 IF_DOWN" filterable style="width: 300px;">
            <el-option v-for="code in eventCodes" :key="code" :label="code" :value="code"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="feature_event.state" style="width: 200px;">
            <el-option label="raise（开告警）" value="raise"></el-option>
            <el-option label="clear（关告警）" value="clear"></el-option>
            <el-option label="stateless（窗口计数，静默即恢复）" value="stateless"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="feature_event.object_type" style="width: 200px;">
            <el-option label="interface" value="interface"></el-option>
            <el-option label="peer" value="peer"></el-option>
            <el-option label="mac" value="mac"></el-option>
            <el-option label="slot" value="slot"></el-option>
            <el-option label="none" value="none"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="聚合窗口(秒)">
          <el-input-number style="width: 200px;" v-model="feature_event.window_sec" :min="1" :max="86400"></el-input-number>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number style="width: 200px;" v-model="feature_event.threshold" :min="1" :max="9999"></el-input-number>
          <span style="color:#909399;margin-left:10px;font-size:12px;">窗口内达到该条数才告警</span>
        </el-form-item>
        <el-form-item label="恢复事件码">
          <el-input style="width: 300px;" placeholder="如 IF_DOWN 的恢复码是 IF_UP，空=无显式恢复" v-model="feature_event.clear_code" clearable></el-input>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="feature_event.enabled"></el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="事件描述" v-model="feature_event.descr" clearable></el-input>
        </el-form-item>
      </el-form>
      <div>
        <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
        <el-button type="primary" @click="diag_flag=false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改事件属性" :visible.sync="diag_update_flag" width="55%" append-to-body>
      <el-form :model="feature_event" size="mini" label-width="110px">
        <el-form-item label="事件码">
          <el-input style="width: 300px;" v-model="feature_event.event_code" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="feature_event.state" style="width: 200px;">
            <el-option label="raise（开告警）" value="raise"></el-option>
            <el-option label="clear（关告警）" value="clear"></el-option>
            <el-option label="stateless（窗口计数，静默即恢复）" value="stateless"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="feature_event.object_type" style="width: 200px;">
            <el-option label="interface" value="interface"></el-option>
            <el-option label="peer" value="peer"></el-option>
            <el-option label="mac" value="mac"></el-option>
            <el-option label="slot" value="slot"></el-option>
            <el-option label="none" value="none"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="聚合窗口(秒)">
          <el-input-number style="width: 200px;" v-model="feature_event.window_sec" :min="1" :max="86400"></el-input-number>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input-number style="width: 200px;" v-model="feature_event.threshold" :min="1" :max="9999"></el-input-number>
        </el-form-item>
        <el-form-item label="恢复事件码">
          <el-input style="width: 300px;" v-model="feature_event.clear_code" clearable></el-input>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="feature_event.enabled"></el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" v-model="feature_event.descr" clearable></el-input>
        </el-form-item>
      </el-form>
      <div>
        <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
        <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  import alarm_api from "@/api/mapis/alarm_interface.js"

  export default {
    data() {
      return {

        filter_event_code:"",
        filter_descr:"",
        isload:false,

        refresh_flag:false,
        table_data:[],
        table_header:[
          {"key":"event_code","label":"事件码","width":"130"},
          {"key":"state","label":"状态","width":"90"},
          {"key":"object_type","label":"对象类型","width":"90"},
          {"key":"window_sec","label":"聚合窗口(秒)","width":"100"},
          {"key":"threshold","label":"阈值","width":"70"},
          {"key":"clear_code","label":"恢复事件码","width":"100"},
          {"key":"enabled","label":"启用","width":"70"},
          {"key":"descr","label":"描述","width":"220"},
          {"key":"update_time","label":"最近更新时间","width":"120", "type":"date"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_event:{},

        diag_update_flag:false,

        eventCodes:[],

      };
    },
    mounted() {
      this.searchKey()
      this.loadEventCodes()
    },
    methods:{
      loadEventCodes(){
        // 事件码由 L3 解析规则（syslog_rule）产出，下拉取自那张表已经
        // 用过的 event_code 去重 —— 没在解析规则里出现过的事件码配了
        // 属性也不会有日志命中它
        let that = this
        alarm_api.getRule({}, {}).then(function(response){
          if(response.data.code==0){
            let codes = response.data.data
              .map(function(row){ return row.event_code })
              .filter(function(code){ return code })
            that.eventCodes = Array.from(new Set(codes)).sort()
          }
        }).catch(function(error){
          console.log(error)
        })
      },

      defaultEvent(){
        return {
          event_code: "",
          state: "stateless",
          object_type: "none",
          window_sec: 300,
          threshold: 1,
          clear_code: "",
          enabled: true,
          descr: ""
        }
      },

      searchKey(){
        let post_data = {}
        this.filter_event_code = this.filter_event_code.replace(/^\s*|\s*$/g,"")
        if(this.filter_event_code!=""){
          post_data["event_code_reg"] = this.filter_event_code
        }
        this.filter_descr = this.filter_descr.replace(/^\s*|\s*$/g,"")
        if(this.filter_descr!=""){
          post_data["descr_reg"] = this.filter_descr
        }

        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getEvent(post_data,{}).then(function(response){
          if(response.data.code==0){
            that.table_data = response.data.data
            that.refresh_flag = !that.refresh_flag
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'+response.data.message
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      },

      submit_create(){
        let that = this
        this.isload=true
        alarm_api.addEvent(this.feature_event,{}).then(function(response){
          if(response.data.code==0){
            that.diag_flag=false
            that.searchKey()
            that.$message({
              type: 'success',
              message: '添加完成'
            });
          }else{
            that.$message({
              type: 'error',
              message: '添加失败，原因:'+response.data.message
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '操作失败，请重试'
            });
        })
      },

      updateRow(row){
        this.feature_event = {
          event_code: row["event_code"],
          state: row["state"],
          object_type: row["object_type"],
          window_sec: Number(row["window_sec"]),
          threshold: Number(row["threshold"]),
          clear_code: row["clear_code"],
          enabled: Number(row["enabled"])===1,
          descr: row["descr"]
        }
        this.diag_update_flag=true;
      },

      submit_update(){
        let that = this
        this.isload=true
        alarm_api.updateEvent(this.feature_event,{}).then(function(response){
          if(response.data.code==0){
            that.diag_update_flag=false
            that.searchKey()
            that.$message({
              type: 'success',
              message: '更新完成'
            });
          }else{
            that.$message({
              type: 'error',
              message: '更新失败，原因:'+response.data.message
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '操作失败，请重试'
            });
        })
      },

      deleteRow(val, rowid){
        this.$confirm('删除当前记录？删除后该事件码会落到代码里的默认值（stateless/P3），且不会再出现在规则缺口清单之外的管理页里', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let that = this
          alarm_api.delEvent({"event_code":val.event_code}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.event_t.delIndex(rowid)
            }else{
              that.$message({
                type: 'error',
                message: "删除失败,原因:"+response.data.message
              });
            }
          }).catch(function (error) {
              console.log(error)
              that.$message({
                type: 'error',
                message: "删除异常"
              });
          })
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消操作'
          });
        });
      },
    },
    components:{
      tem_table
    },
  }
</script>

<style>
</style>
