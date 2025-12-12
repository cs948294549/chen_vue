<template>
  <div style="display: flex;">
    <div style="background-color: darkred;">
      <p style="width: 200px; height: 20px; line-height: 20px; text-align: center;font-size: 16px; font-weight: bold; color: #ffffff;">OPS</p>
    </div>

    <!-- 这里可以添加顶部菜单的具体内容，如导航链接 -->
    <div style="background-color: #335596;width: 100%; display: flex;">
      <div v-if="refresh_flag" style="display: flex;">
        <div class="menu" v-for="(item, index) in classic" :key="index" @click="changeGroup(item)">
          <span v-if="activeName==item" style="color: #5a9cf8;">{{item}}</span>
          <span v-else>{{item}}</span>
        </div>
      </div>
    </div>

    <div style="background-color: #335596;width: 150px;align-items: center;">
      <el-dropdown style="width: 120px;" @command="handleCommand">
        <el-button style="width: 120px;color: white" type="text" icon="el-icon-user-solid" >{{ this.$store.getters["user/user_info"].subname}}</el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="editPassword">修改密码</el-dropdown-item>
          <el-dropdown-item command="logout">退出</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <el-dialog title="修改密码" :visible.sync="diag_editPassword" width="50%" append-to-body>
      <el-form v-model="feature_user" size="mini" label-width="80px">
        <el-form-item label="原密码">
          <el-input style="width: 500px;" :show-password="true" placeholder="passwd" v-model="feature_user.old_passwd"></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input style="width: 500px;" :show-password="true" placeholder="passwd" v-model="feature_user.new_passwd"></el-input>
        </el-form-item>

        <el-form-item label="确认新密码">
          <el-input style="width: 500px;" :show-password="true" placeholder="passwd" v-model="feature_user.pre_new_passwd"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button size='mini' type="primary" @click="submitEdit()">提交</el-button>
          <el-button size='mini' type="primary" @click="diag_editPassword=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Cookies from "js-cookie"
import user_api from "@/api/mapis/user_interface.js"
import lmd5 from '@/utils/MD5.js'

export default {
  name: "TopMenu",
  data () {
    return {
      activeName: "",
      classic: [],
      refresh_flag: false,

      //修改密码
      diag_editPassword:false,
      feature_user:{
        "old_passwd":"",
        "new_passwd":"",
        "pre_new_passwd": "",
      },
    }
  },
  mounted () {
    // console.log("当前用户==",JSON.stringify(this.$store.getters["user/user_info"]))
  },
  methods: {
    reloadRoute (route){
      this.refresh_flag = false
      let classic = []
      for(let i=0;i<route.length;i++){
        if(classic.indexOf(route[i]["group"])>-1){

        }else{
          classic.push(route[i]["group"])
        }
      }
      this.classic = classic
      this.activeName = classic[0]
      this.refresh_flag = true
    },
    changeGroup(g_str){
      this.activeName = g_str
      this.$emit('changeGroup', g_str);
    },

    handleCommand (command) {
      if (command === "logout") {
        this.$store.dispatch("user/logout")
      }else if (command === "editPassword") {
        this.diag_editPassword = true
      }
    },

    submitEdit(){
      console.log("修改密码", this.feature_user)
      if(this.feature_user["new_passwd"]!=this.feature_user["pre_new_passwd"]){
        this.$message({
          type: 'error',
          message: '新密码不一致'
        });
        return
      }
      let post_data = {
        "old_password": lmd5.salt_identify(this.feature_user["old_passwd"]),
        "new_password": lmd5.salt_identify(this.feature_user["new_passwd"]),
      }
      console.log("登陆信息==", post_data)

      let that=this
      user_api.changePasswd(post_data,{}).then(async function(response){
        console.log("修改结果",response.data)
        if(response.data.code==0){
          that.$message({
            type: 'success',
            message: '修改成功,即将退出重新登陆'
          });
          that.diag_editPassword=false

          that.$nextTick(() => {
            setTimeout(() => {
              that.$store.dispatch("user/logout")
            }, 5000);
          });
        }else{
          that.$message({
            type: 'error',
            message: '修改失败，原因:'+response.data.message
          });
        }
        // 修改完成退出登陆
        // await that.$store.dispatch("user/logout")

      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '修改失败，请重试'
          });
      })

    }
  },
  components: {}
}
</script>

<style scoped>
  .menu{
    margin-left: 20px;
    margin-right: 20px;
    text-align: center;
    line-height: 50px;
    font-size: 16px;
    color: #ffffff;
    cursor: pointer;
    font-family: "Lucida Console", Courier, monospace;
  }
</style>
