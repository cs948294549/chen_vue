<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_rule=defaultRule();" size="mini">创建静默规则</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="设备IP正则">
              <el-input placeholder="ip_reg" v-model="filter_ip_reg" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="事件码正则">
              <el-input placeholder="event_code_reg" v-model="filter_event_code_reg" @keyup.enter.native="searchKey" clearable></el-input>
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
          ref="mute_t"
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

    <el-dialog title="新增静默规则" :visible.sync="diag_flag" width="55%" append-to-body>
      <MuteForm :feature="feature_rule" />
      <div>
        <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
        <el-button type="primary" @click="diag_flag=false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改静默规则" :visible.sync="diag_update_flag" width="55%" append-to-body>
      <MuteForm :feature="feature_rule" :show-rule-id="true" />
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
  import MuteForm from './mute_rule_form.vue'

  export default {
    data() {
      return {

        filter_ip_reg:"",
        filter_event_code_reg:"",
        filter_descr:"",
        isload:false,

        refresh_flag:false,
        table_data:[],
        table_header:[
          {"key":"rule_id","label":"规则ID","width":"80"},
          {"key":"ip_reg","label":"设备IP正则","width":"130"},
          {"key":"event_code_reg","label":"事件码正则","width":"130"},
          {"key":"object_reg","label":"告警对象正则","width":"130"},
          {"key":"start_time","label":"窗口开始","width":"120", "type":"date"},
          {"key":"end_time","label":"窗口结束","width":"120", "type":"date"},
          {"key":"enabled","label":"启用","width":"70"},
          {"key":"descr","label":"描述（建议写变更工单号）","width":"220"},
          {"key":"hit_count","label":"命中次数","width":"90"},
          {"key":"last_hit_time","label":"最近命中时间","width":"120", "type":"date"},
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
          ip_reg: "",
          event_code_reg: "",
          object_reg: "",
          start_time: "",
          end_time: "",
          enabled: true,
          descr: ""
        }
      },

      searchKey(){
        let post_data = {}
        this.filter_ip_reg = this.filter_ip_reg.replace(/^\s*|\s*$/g,"")
        if(this.filter_ip_reg!=""){
          post_data["ip_reg_reg"] = this.filter_ip_reg
        }
        this.filter_event_code_reg = this.filter_event_code_reg.replace(/^\s*|\s*$/g,"")
        if(this.filter_event_code_reg!=""){
          post_data["event_code_reg_reg"] = this.filter_event_code_reg
        }
        this.filter_descr = this.filter_descr.replace(/^\s*|\s*$/g,"")
        if(this.filter_descr!=""){
          post_data["descr_reg"] = this.filter_descr
        }

        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getMuteRule(post_data,{}).then(function(response){
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
        alarm_api.addMuteRule(this.feature_rule,{}).then(function(response){
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
          ip_reg: row["ip_reg"],
          event_code_reg: row["event_code_reg"],
          object_reg: row["object_reg"],
          start_time: row["start_time"],
          end_time: row["end_time"],
          enabled: Number(row["enabled"])===1,
          descr: row["descr"]
        }
        this.diag_update_flag=true;
      },

      submit_update(){
        let that = this
        this.isload=true
        alarm_api.updateMuteRule(this.feature_rule,{}).then(function(response){
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
        this.$confirm('删除当前记录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let that = this
          alarm_api.delMuteRule({"rule_id":val.rule_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.mute_t.delIndex(rowid)
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
      MuteForm
    },
  }
</script>

<style>
</style>
