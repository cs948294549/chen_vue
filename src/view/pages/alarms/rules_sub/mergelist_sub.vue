<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_user={};" size="mini">创建聚合规则</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="规则">
              <el-input placeholder="规则" v-model="filter_pattern" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="描述">
              <el-input placeholder="描述" v-model="filter_descr" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="分组名称">
              <el-input placeholder="分组名称" v-model="filter_group" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <div>
        <tem_table
          ref="mergelist_t"
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
    <el-dialog title="新增聚合" :visible.sync="diag_flag" width="50%" append-to-body>
      <el-form v-model="feature_pattern" size="mini" label-width="80px">
        <el-form-item label="分组名称">
          <el-input style="width: 500px;" placeholder="分组名称" v-model="feature_pattern.group_name" clearable></el-input>
        </el-form-item>
        <el-form-item label="正则表达式">
          <el-input style="width: 500px;" placeholder="pattern" v-model="feature_pattern.pattern" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="描述" v-model="feature_pattern.descr" clearable></el-input>
        </el-form-item>
        <p>新增5分钟后生效</p>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
          <el-button type="primary" @click="diag_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改信息" :visible.sync="diag_update_flag" width="50%" append-to-body>
      <el-form v-model="feature_pattern" size="mini" label-width="80px">
        <el-form-item label="规则ID">
          <el-input style="width: 500px;" placeholder="规则ID" v-model="feature_pattern.rule_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="分组名称">
          <el-input style="width: 500px;" placeholder="分组名称" v-model="feature_pattern.group_name" clearable></el-input>
        </el-form-item>
        <el-form-item label="正则表达式">
          <el-input style="width: 500px;" placeholder="pattern" v-model="feature_pattern.pattern" clearable></el-input>
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
  import lmd5 from '@/utils/MD5.js'

  export default {
    data() {
      return {

        //table 用
        filter_pattern:"",
        filter_descr:"",
        filter_group:"",
        isload:false,


        refresh_flag:false,
        table_data:[
          // {"rid":"admin","group_name":"管理原", "descr":"系统管理"}
        ],
        table_header:[
          {"key":"rule_id","label":"规则ID","width":"120"},
          {"key":"group_name","label":"分组名称","width":"150"},
          {"key":"pattern","label":"正则表达式","width":"200"},
          {"key":"descr","label":"描述","width":"200"},
          {"key":"update_time","label":"最近更新时间","width":"120", "type":"date"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_pattern:{},

        diag_update_flag:false,

        role_list:[]

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

        this.filter_group = this.filter_group.replace(/^\s*|\s*$/g,"")
        if(this.filter_group!=""){
          post_data["group_name_reg"] = this.filter_group
        }

        // console.log("=====", post_data)
        let that = this
        this.isload=true
        this.table_data=[]
        alarm_api.getMergelist(post_data,{}).then(function(response){
          // console.log("data====", response.data)
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
          "group_name":"",
          "pattern":"",
          "descr":""
        }
        let post_data = {
          ...base_data,
          ...this.feature_pattern
        }
        console.log("新增信息===", post_data)
        alarm_api.addMergelist(post_data,{}).then(function(response){
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
        this.$set(this.feature_pattern, 'group_name', row["group_name"])
        this.$set(this.feature_pattern, 'pattern', row["pattern"])
        this.$set(this.feature_pattern, 'descr', row["descr"])

        this.diag_update_flag=true;
      },

      submit_update(){
        //提交信息
        let that = this
        this.isload=true
        let base_data = {
          "group_name":"",
          "pattern":"",
          "descr":""
        }
        let post_data = {
          ...base_data,
          ...this.feature_pattern
        }
        alarm_api.updateMergelist(post_data,{}).then(function(response){
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
          alarm_api.delMergelist({"rule_id":val.rule_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.mergelist_t.delIndex(rowid)
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
