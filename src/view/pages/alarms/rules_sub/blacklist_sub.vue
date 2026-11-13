<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_pattern={scope:'mnemonic',ignore_case:false,enabled:true};" size="mini">创建黑名单</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="规则">
              <el-input placeholder="规则" v-model="filter_pattern" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="设备IP">
              <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="searchKey" clearable></el-input>
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
          ref="blacklist_t"
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
    <el-dialog title="新增黑名单" :visible.sync="diag_flag" width="50%" append-to-body>
      <el-form v-model="feature_pattern" size="mini" label-width="100px">
        <el-form-item label="判据范围">
          <el-select v-model="feature_pattern.scope" placeholder="scope" style="width: 300px;">
            <el-option label="mnemonic（精确，走dict）" value="mnemonic"></el-option>
            <el-option label="message（全文子串，线性扫）" value="message"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规则">
          <el-input style="width: 500px;" :placeholder="feature_pattern.scope==='message' ? '全文子串' : 'mnemonic全名，如 ETHPORT-5-IF_DOWN'" v-model="feature_pattern.pattern" clearable></el-input>
          <RegexTester :pattern="feature_pattern.pattern" match-type="contains" :ignore-case="feature_pattern.ignore_case" v-if="feature_pattern.scope==='message'" />
        </el-form-item>
        <el-form-item label="限定设备IP">
          <el-input style="width: 500px;" placeholder="空=所有设备" v-model="feature_pattern.ip" clearable></el-input>
        </el-form-item>
        <el-form-item label="大小写不敏感" v-if="feature_pattern.scope==='message'">
          <el-switch v-model="feature_pattern.ignore_case"></el-switch>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="feature_pattern.enabled"></el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="为什么拦这条，便于日后判断能不能放开" v-model="feature_pattern.descr" clearable></el-input>
        </el-form-item>
        <p>新增5分钟后生效</p>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
          <el-button type="primary" @click="diag_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改信息" :visible.sync="diag_update_flag" width="50%" append-to-body>
      <el-form v-model="feature_pattern" size="mini" label-width="100px">
        <el-form-item label="规则ID">
          <el-input style="width: 500px;" placeholder="规则ID" v-model="feature_pattern.rule_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="判据范围">
          <el-select v-model="feature_pattern.scope" placeholder="scope" style="width: 300px;">
            <el-option label="mnemonic（精确，走dict）" value="mnemonic"></el-option>
            <el-option label="message（全文子串，线性扫）" value="message"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规则">
          <el-input style="width: 500px;" placeholder="pattern" v-model="feature_pattern.pattern" clearable></el-input>
          <RegexTester :pattern="feature_pattern.pattern" match-type="contains" :ignore-case="feature_pattern.ignore_case" v-if="feature_pattern.scope==='message'" />
        </el-form-item>
        <el-form-item label="限定设备IP">
          <el-input style="width: 500px;" placeholder="空=所有设备" v-model="feature_pattern.ip" clearable></el-input>
        </el-form-item>
        <el-form-item label="大小写不敏感" v-if="feature_pattern.scope==='message'">
          <el-switch v-model="feature_pattern.ignore_case"></el-switch>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="feature_pattern.enabled"></el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="描述" v-model="feature_pattern.descr" clearable></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
          <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  import alarm_api from "@/api/mapis/alarm_interface.js"
  import RegexTester from './regex_tester.vue'

  export default {
    data() {
      return {

        //table 用
        filter_pattern:"",
        filter_descr:"",
        filter_ip:"",
        isload:false,


        refresh_flag:false,
        table_data:[],
        table_header:[
          {"key":"rule_id","label":"规则ID","width":"80"},
          {"key":"scope","label":"判据范围","width":"100"},
          {"key":"pattern","label":"规则","width":"220"},
          {"key":"ip","label":"限定IP","width":"120"},
          {"key":"ignore_case","label":"忽略大小写","width":"90"},
          {"key":"enabled","label":"启用","width":"80"},
          {"key":"descr","label":"描述","width":"200"},
          {"key":"hit_count","label":"命中次数","width":"90"},
          {"key":"last_hit_time","label":"最近命中时间","width":"120", "type":"date"},
          {"key":"update_time","label":"最近更新时间","width":"120", "type":"date"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_pattern:{},

        diag_update_flag:false,

      };
    },
    mounted() {
      this.searchKey()
    },
    methods:{
      searchKey(){
        //查询信息
        let post_data = {}
        this.filter_pattern = this.filter_pattern.replace(/^\s*|\s*$/g,"")
        if(this.filter_pattern!=""){
          post_data["pattern_reg"] = this.filter_pattern
        }

        this.filter_descr = this.filter_descr.replace(/^\s*|\s*$/g,"")
        if(this.filter_descr!=""){
          post_data["descr_reg"] = this.filter_descr
        }

        this.filter_ip = this.filter_ip.replace(/^\s*|\s*$/g,"")
        if(this.filter_ip!=""){
          post_data["ip_reg"] = this.filter_ip
        }

        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getBlacklist(post_data,{}).then(function(response){
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
        //提交信息
        let that = this
        this.isload=true
        let base_data = {
          "scope":"mnemonic",
          "pattern":"",
          "ip":"",
          "ignore_case":false,
          "enabled":true,
          "descr":""
        }
        let post_data = {
          ...base_data,
          ...this.feature_pattern
        }
        alarm_api.addBlacklist(post_data,{}).then(function(response){
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
        //更新或查看信息
        this.feature_pattern = {}
        this.$set(this.feature_pattern, 'rule_id', row["rule_id"])
        this.$set(this.feature_pattern, 'scope', row["scope"])
        this.$set(this.feature_pattern, 'pattern', row["pattern"])
        this.$set(this.feature_pattern, 'ip', row["ip"])
        this.$set(this.feature_pattern, 'ignore_case', Number(row["ignore_case"])===1)
        this.$set(this.feature_pattern, 'enabled', Number(row["enabled"])===1)
        this.$set(this.feature_pattern, 'descr', row["descr"])

        this.diag_update_flag=true;
      },

      submit_update(){
        //提交信息
        let that = this
        this.isload=true
        let post_data = {
          ...this.feature_pattern
        }
        alarm_api.updateBlacklist(post_data,{}).then(function(response){
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
          alarm_api.delBlacklist({"rule_id":val.rule_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.blacklist_t.delIndex(rowid)
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
      RegexTester
    },
  }
</script>

<style>
</style>
