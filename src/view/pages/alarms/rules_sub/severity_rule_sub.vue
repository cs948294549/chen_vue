<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_rule=defaultRule();" size="mini">创建定级规则</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="事件码">
              <el-input placeholder="event_code" v-model="filter_event_code" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="级别">
              <el-select v-model="filter_severity" placeholder="不限" clearable style="width: 120px;">
                <el-option label="P1" value="1"></el-option>
                <el-option label="P2" value="2"></el-option>
                <el-option label="P3" value="3"></el-option>
              </el-select>
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
          ref="severity_t"
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

    <el-dialog title="新增定级规则" :visible.sync="diag_flag" width="55%" append-to-body>
      <SeverityForm :feature="feature_rule" />
      <div>
        <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
        <el-button type="primary" @click="diag_flag=false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改定级规则" :visible.sync="diag_update_flag" width="55%" append-to-body>
      <SeverityForm :feature="feature_rule" :show-rule-id="true" />
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
  import SeverityForm from './severity_rule_form.vue'

  export default {
    data() {
      return {

        filter_event_code:"",
        filter_severity:"",
        filter_descr:"",
        isload:false,

        refresh_flag:false,
        table_data:[],
        table_header:[
          {"key":"rule_id","label":"规则ID","width":"80"},
          {"key":"event_code","label":"事件码","width":"110"},
          {"key":"ip_reg","label":"IP正则","width":"130"},
          {"key":"sysname_reg","label":"sysname正则","width":"130"},
          {"key":"severity","label":"级别","width":"60"},
          {"key":"action","label":"动作","width":"80"},
          {"key":"priority","label":"优先级","width":"70"},
          {"key":"enabled","label":"启用","width":"70"},
          {"key":"descr","label":"描述","width":"220"},
          {"key":"update_time","label":"最近更新时间","width":"120", "type":"date"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_rule:{},

        diag_update_flag:false,

      };
    },
    mounted() {
      this.searchKey()
    },
    methods:{
      defaultRule(){
        return {
          event_code: "*",
          ip_reg: "",
          sysname_reg: "",
          severity: 3,
          action: "",
          priority: 100,
          enabled: true,
          descr: ""
        }
      },

      searchKey(){
        let post_data = {}
        this.filter_event_code = this.filter_event_code.replace(/^\s*|\s*$/g,"")
        if(this.filter_event_code!=""){
          post_data["event_code"] = this.filter_event_code
        }
        if(this.filter_severity!==""){
          post_data["severity"] = this.filter_severity
        }
        this.filter_descr = this.filter_descr.replace(/^\s*|\s*$/g,"")
        if(this.filter_descr!=""){
          post_data["descr_reg"] = this.filter_descr
        }

        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getSeverityRule(post_data,{}).then(function(response){
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
        alarm_api.addSeverityRule(this.feature_rule,{}).then(function(response){
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
        this.feature_rule = {
          rule_id: row["rule_id"],
          event_code: row["event_code"],
          ip_reg: row["ip_reg"],
          sysname_reg: row["sysname_reg"],
          severity: Number(row["severity"]),
          action: row["action"],
          priority: Number(row["priority"]),
          enabled: Number(row["enabled"])===1,
          descr: row["descr"]
        }
        this.diag_update_flag=true;
      },

      submit_update(){
        let that = this
        this.isload=true
        alarm_api.updateSeverityRule(this.feature_rule,{}).then(function(response){
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
        const isGlobalFallback = val.event_code === '*' && val.ip_reg === '' && val.sysname_reg === ''
        const warnMsg = isGlobalFallback
          ? '这是全局兜底规则（唯一允许匹配全网所有事件的规则），删除后未配规则的事件码会落到代码里的默认值，加载时会报错。确定删除？'
          : '删除当前记录?'
        this.$confirm(warnMsg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let that = this
          alarm_api.delSeverityRule({"rule_id":val.rule_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.severity_t.delIndex(rowid)
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
      tem_table,
      SeverityForm
    },
  }
</script>

<style>
</style>
