<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_rule=defaultRule();" size="mini">创建解析规则</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="mnemonic">
              <el-input placeholder="mnemonic" v-model="filter_mnemonic" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="事件码">
              <el-input placeholder="event_code" v-model="filter_event_code" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="厂商">
              <el-input placeholder="vendor" v-model="filter_vendor" @keyup.enter.native="searchKey" clearable></el-input>
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
          ref="rule_t"
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

    <el-dialog title="新增解析规则" :visible.sync="diag_flag" width="60%" append-to-body>
      <RuleForm :feature="feature_rule" />
      <div style="margin-top: 10px;">
        <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
        <el-button type="primary" @click="diag_flag=false">取消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改解析规则" :visible.sync="diag_update_flag" width="60%" append-to-body>
      <RuleForm :feature="feature_rule" :show-rule-id="true" />
      <div style="margin-top: 10px;">
        <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
        <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  import alarm_api from "@/api/mapis/alarm_interface.js"
  import RuleForm from './rule_form.vue'

  export default {
    data() {
      return {

        filter_mnemonic:"",
        filter_event_code:"",
        filter_vendor:"",
        filter_descr:"",
        isload:false,

        refresh_flag:false,
        table_data:[],
        table_header:[
          {"key":"rule_id","label":"规则ID","width":"80"},
          {"key":"vendor","label":"厂商","width":"90"},
          {"key":"mnemonic","label":"mnemonic","width":"180"},
          {"key":"match_type","label":"匹配方式","width":"90"},
          {"key":"pattern","label":"pattern","width":"150"},
          {"key":"body_match","label":"消歧子串","width":"150"},
          {"key":"event_code","label":"事件码","width":"110"},
          {"key":"object_regex","label":"对象抽取正则","width":"150"},
          {"key":"priority","label":"优先级","width":"70"},
          {"key":"enabled","label":"启用","width":"70"},
          {"key":"descr","label":"描述","width":"200"},
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
          vendor: "*",
          mnemonic: "",
          match_type: "exact",
          pattern: "",
          body_match: "",
          event_code: "",
          object_regex: "",
          priority: 100,
          enabled: true,
          descr: ""
        }
      },

      searchKey(){
        let post_data = {}
        this.filter_mnemonic = this.filter_mnemonic.replace(/^\s*|\s*$/g,"")
        if(this.filter_mnemonic!=""){
          post_data["mnemonic_reg"] = this.filter_mnemonic
        }
        this.filter_event_code = this.filter_event_code.replace(/^\s*|\s*$/g,"")
        if(this.filter_event_code!=""){
          post_data["event_code"] = this.filter_event_code
        }
        this.filter_vendor = this.filter_vendor.replace(/^\s*|\s*$/g,"")
        if(this.filter_vendor!=""){
          post_data["vendor"] = this.filter_vendor
        }
        this.filter_descr = this.filter_descr.replace(/^\s*|\s*$/g,"")
        if(this.filter_descr!=""){
          post_data["descr_reg"] = this.filter_descr
        }

        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getRule(post_data,{}).then(function(response){
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
        alarm_api.addRule(this.feature_rule,{}).then(function(response){
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
          vendor: row["vendor"],
          mnemonic: row["mnemonic"],
          match_type: row["match_type"],
          pattern: row["pattern"],
          body_match: row["body_match"],
          event_code: row["event_code"],
          object_regex: row["object_regex"],
          priority: Number(row["priority"]),
          enabled: Number(row["enabled"])===1,
          descr: row["descr"]
        }
        this.diag_update_flag=true;
      },

      submit_update(){
        let that = this
        this.isload=true
        alarm_api.updateRule(this.feature_rule,{}).then(function(response){
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
          alarm_api.delRule({"rule_id":val.rule_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.rule_t.delIndex(rowid)
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
      RuleForm
    },
  }
</script>

<style>
</style>
