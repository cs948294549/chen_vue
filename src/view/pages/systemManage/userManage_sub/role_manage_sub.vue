<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_role={};" size="mini">新建角色</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="角色ID">
              <el-input placeholder="角色ID" v-model="filter_name" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <div>
        <tem_table
          ref="roles_t"
          :key="refresh_flag"
          v-bind:table_data="table_data"
          v-bind:table_header="table_header"
          v-bind:multi_flag="false"
          v-bind:option_btn="tab_single_btns"
          v-bind:option_multibtn="[]"
          v-bind:download_flag="false"
          @privilRow="privilDiag"
          @deleteRow="deleteRow"
          @updateRow="updateRow"
          >
        </tem_table>
      </div>
    </div>
    <el-dialog title="创建角色" :visible.sync="diag_flag" width="50%" append-to-body>
      <el-form v-model="feature_role" size="mini" label-width="80px">
        <el-form-item label="角色ID">
          <el-input style="width: 500px;" placeholder="角色ID" v-model="feature_role.rid" clearable></el-input>
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input style="width: 500px;" placeholder="角色名称" v-model="feature_role.name" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input style="width: 500px;" type="textarea" :rows='3' resize="none" placeholder="描述信息" v-model="feature_role.descr"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
          <el-button type="primary" @click="diag_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改信息" :visible.sync="diag_update_flag" width="50%" append-to-body>
      <el-form v-model="feature_role" size="mini" label-width="80px">
        <el-form-item label="角色ID">
          <el-input style="width: 500px;" placeholder="角色ID" v-model="feature_role.rid" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input style="width: 500px;" placeholder="角色名称" v-model="feature_role.name" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input style="width: 500px;" type="textarea" :rows='3' resize="none" placeholder="描述信息" v-model="feature_role.descr"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
          <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


    <el-drawer :title="'【'+role_name+'】页面权限'" :visible.sync="dialog_page_flag" :direction="'rtl'" size="60%" destroy-on-close>
      <Card_page
        style="margin: 10px;"
        v-if="dialog_page_flag"
        v-bind:role_info="role_info_cache"
      ></Card_page>
    </el-drawer>


  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  import role_api from "@/api/mapis/user_interface.js"
  import Card_page from './privilege_manage_sub.vue';

  export default {
    data() {
      return {

        //table 用
        filter_name:"",
        isload:false,


        refresh_flag:false,
        table_data:[
          // {"rid":"admin","group_name":"管理原", "descr":"系统管理"}
        ],
        table_header:[
          {"key":"rid","label":"角色ID","width":"120"},
          {"key":"name","label":"角色名称","width":"120"},
          {"key":"descr","label":"角色描述","width":"240"},
        ],
        tab_single_btns:[
          {"label":"权限","type":"warning","click":"privilRow"},
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_role:{},

        diag_update_flag:false,

        //页面权限配置
        dialog_page_flag:false,
        role_name:"",
        role_info_cache:{},

      };
    },
    mounted() {
      this.searchKey()
    },
    methods:{
      searchKey(){
        //查询信息
        let post_data = {}
        this.filter_name = this.filter_name.replace(/^\s*|\s*$/g,"")
        if(this.filter_name!=""){
          post_data["rid_reg"] = this.filter_name
        }

        let that = this
        this.isload=true
        this.table_data=[]
        role_api.getRoleList(post_data,{}).then(function(response){
          if(response.data.code==0){
            that.table_data = response.data.data
            that.refresh_flag = !that.refresh_flag
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'+response.data.msg
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
        let post_data = {
          "rid":this.feature_role["rid"],
          "name":this.feature_role["name"],
          "descr":this.feature_role["descr"],
        }
        role_api.addRole(post_data,{}).then(function(response){
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
        this.feature_role = {}
        this.$set(this.feature_role, 'rid', row["rid"])
        this.$set(this.feature_role, 'name', row["name"])
        this.$set(this.feature_role, 'descr', row["descr"])

        this.diag_update_flag=true;
      },

      submit_update(){
        //提交信息
        let that = this
        this.isload=true
        let post_data = {
          "rid":this.feature_role["rid"],
          "name":this.feature_role["name"],
          "descr":this.feature_role["descr"],
        }
        role_api.updateRole(post_data,{}).then(function(response){
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
          role_api.delRole({"rid":val.rid}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.roles_t.delIndex(rowid)
            }else{
              that.$message({
                type: 'error',
                message: "删除失败,原因:"+response.data.message
              });
            }
          }).catch(function (error) {
              console.log("====",error)
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


      privilDiag(row){
        console.log("角色页面权限配置")
        this.role_name=row["rid"]
        this.role_info_cache=row
        this.dialog_page_flag=true
      }
    },
    components:{
      tem_table,Card_page
    },
  }
</script>

<style>
</style>
