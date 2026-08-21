<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_user={};" size="mini">创建用户</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="用户ID">
              <el-input placeholder="用户ID" v-model="filter_name" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="角色ID">
              <el-select style="width: 200px;" v-model='filter_role' filterable placeholder="请选择角色分类" clearable>
                <el-option v-for='item in role_list' :key='item.rid' :label='item.name' :value='item.rid'></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <div>
        <tem_table
          ref="user_t"
          :key="refresh_flag"
          v-bind:table_data="table_data"
          v-bind:table_header="table_header"
          v-bind:multi_flag="false"
          v-bind:option_btn="tab_single_btns"
          v-bind:option_multibtn="[]"
          v-bind:download_flag="false"
          @deleteRow="deleteRow"
          @updateRow="updateRow"
          @resetIdentify="resetIdentify"
          >
        </tem_table>
      </div>
    </div>
    <el-dialog title="新增用户" :visible.sync="diag_flag" width="50%" append-to-body>
      <el-form v-model="feature_user" size="mini" label-width="80px">
        <el-form-item label="用户名">
          <el-input style="width: 500px;" placeholder="用户名" v-model="feature_user.username" clearable></el-input>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input style="width: 500px;" placeholder="姓名" v-model="feature_user.subname" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-select style="width: 200px;" v-model='feature_user.rid' filterable placeholder="请选择角色分类" clearable>
            <el-option v-for='item in role_list' :key='item.rid' :label='item.name' :value='item.rid'></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input style="width: 500px;" placeholder="电话" v-model="feature_user.phone" clearable></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input style="width: 500px;" placeholder="邮箱" v-model="feature_user.mail" clearable></el-input>
        </el-form-item>
        <p>新增用户的登陆凭证统一为123456，用户登陆后自行修改</p>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
          <el-button type="primary" @click="diag_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改信息" :visible.sync="diag_update_flag" width="50%" append-to-body>
      <el-form v-model="feature_user" size="mini" label-width="80px">
        <el-form-item label="用户名">
          <el-input style="width: 500px;" placeholder="用户名" v-model="feature_user.username" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input style="width: 500px;" placeholder="姓名" v-model="feature_user.subname" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-select style="width: 200px;" v-model='feature_user.rid' filterable placeholder="请选择角色分类" clearable>
            <el-option v-for='item in role_list' :key='item.rid' :label='item.name' :value='item.rid'></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="电话">
          <el-input style="width: 500px;" placeholder="电话" v-model="feature_user.phone" clearable></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input style="width: 500px;" placeholder="邮箱" v-model="feature_user.mail" clearable></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
          <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="重置用户凭证" :visible.sync="diag_reset_flag" width="50%" append-to-body>
      <el-form v-model="reset_user_data" size="mini" label-width="100px">
        <el-form-item label="用户名">
          <el-input style="width: 500px;" v-model="reset_user_data.username" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="重置方式">
          <el-radio-group v-model="reset_type">
            <el-radio label="default">重置为默认密码 (123456)</el-radio>
            <el-radio label="random">重置为随机密码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="随机密码" v-if="reset_type === 'random'">
          <el-input style="width: 500px;" v-model="random_password" disabled readonly></el-input>
          <el-button size="mini" @click="generateRandomPassword" style="margin-left: 10px;">重新生成</el-button>
        </el-form-item>
        <el-alert
          v-if="reset_type === 'random'"
          title="请务必记录此随机密码，重置后将无法再次查看！"
          type="warning"
          :closable="false"
          style="margin-bottom: 15px;">
        </el-alert>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_reset()">确认重置</el-button>
          <el-button type="primary" @click="diag_reset_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  import role_api from "@/api/mapis/user_interface.js"
  import lmd5 from '@/utils/MD5.js'

  export default {
    data() {
      return {

        //table 用
        filter_name:"",
        filter_role:"",
        isload:false,


        refresh_flag:false,
        table_data:[
          // {"rid":"admin","group_name":"管理原", "descr":"系统管理"}
        ],
        table_header:[
          {"key":"username","label":"用户ID","width":"120"},
          {"key":"subname","label":"姓名","width":"140"},
          {"key":"rid","label":"角色ID","width":"140"},
          {"key":"role_name","label":"角色名","width":"140"},
          {"key":"identify","label":"凭证","width":"120"},
          {"key":"phone","label":"电话","width":"120"},
          {"key":"mail","label":"邮箱","width":"120"},
          {"key":"update_time","label":"最近修改时间","width":"140", "type":"date"},
          {"key":"last_login","label":"最近登陆时间","width":"140", "type":"date"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"重置凭证","type":"warning","click":"resetIdentify"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        diag_flag:false,
        feature_user:{},

        diag_update_flag:false,

        diag_reset_flag:false,
        reset_user_data:{},
        reset_type:'default',
        random_password:'',

        role_list:[]

      };
    },
    mounted() {
      this.searchKey()
      this.getRoleList()
    },
    methods:{
      getRoleList(){
        let that = this
        this.role_list=[]
        role_api.getRoleList({},{}).then(function(response){
          if(response.data.code==0){
            that.role_list = response.data.data
            // console.log("角色列表===",that.role_list)
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'+response.data.message
            });
          }
        }).catch(function (error) {
            console.log(error)
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      },

      searchKey(){
        //查询信息
        let post_data = {}
        this.filter_name = this.filter_name.replace(/^\s*|\s*$/g,"")
        if(this.filter_name!=""){
          post_data["username_reg"] = this.filter_name
        }

        this.filter_role = this.filter_role.replace(/^\s*|\s*$/g,"")
        if(this.filter_role!=""){
          post_data["rid_reg"] = this.filter_role
        }
        // console.log("=====", post_data)
        let that = this
        this.isload=true
        this.table_data=[]
        role_api.getUserList(post_data,{}).then(function(response){
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
          "phone":"",
          "mail":"",
          "rid":"default"
        }
        let post_data = {
          ...base_data,
          ...this.feature_user,
          "identify":lmd5.salt_identify("123456")
        }
        // console.log("新增信息===", post_data)
        role_api.addUser(post_data,{}).then(function(response){
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
        this.feature_user = {}
        this.$set(this.feature_user, 'username', row["username"])
        this.$set(this.feature_user, 'subname', row["subname"])
        this.$set(this.feature_user, 'rid', row["rid"])
        this.$set(this.feature_user, 'phone', row["phone"])
        this.$set(this.feature_user, 'mail', row["mail"])

        this.diag_update_flag=true;
      },

      submit_update(){
        //提交信息
        let that = this
        this.isload=true
        let post_data = {
          "username":this.feature_user["username"],
          "subname":this.feature_user["subname"],
          "rid":this.feature_user["rid"],
          "phone":this.feature_user["phone"],
          "mail":this.feature_user["mail"],
        }
        role_api.updateUser(post_data,{}).then(function(response){
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
          role_api.delUser({"username":val.username}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.$refs.user_t.delIndex(rowid)
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

      resetIdentify(val, rowid){
        // 打开重置凭证对话框
        this.reset_user_data = {
          username: val.username,
          rowid: rowid
        }
        this.reset_type = 'default'
        this.random_password = ''
        this.diag_reset_flag = true
      },

      generateRandomPassword(){
        // 生成8位随机密码（包含大小写字母和数字）
        const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
        let password = ''
        for (let i = 0; i < 8; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        this.random_password = password
      },

      submit_reset(){
        let password_to_use = ''
        let display_password = ''

        if(this.reset_type === 'default'){
          password_to_use = '123456'
          display_password = '123456'
        } else {
          // 随机密码
          if(!this.random_password){
            this.generateRandomPassword()
          }
          password_to_use = this.random_password
          display_password = this.random_password
        }

        let that = this
        this.isload = true
        let post_data = {
          "username": this.reset_user_data.username,
          "new_identify": lmd5.salt_identify(password_to_use)
        }

        role_api.resetUserIdentify(post_data, {}).then(function(response){
          if(response.data.code==0){
            that.diag_reset_flag = false
            that.$alert('用户 ' + that.reset_user_data.username + ' 的凭证已重置为：' + display_password, '重置成功', {
              confirmButtonText: '确定',
              type: 'success',
              callback: action => {
                that.searchKey()
              }
            });
          }else{
            that.$message({
              type: 'error',
              message: "重置失败,原因:"+response.data.message
            });
          }
          that.isload = false
        }).catch(function (error) {
            console.log(error)
            that.isload = false
            that.$message({
              type: 'error',
              message: "重置异常"
            });
        })
      },
    },
    components:{
      tem_table
    },
  }
</script>

<style>
</style>
