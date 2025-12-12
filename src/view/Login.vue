<template>
  <div class="login-container">
    <!-- 登录卡片 -->
    <div class="login-card">
      <h2 class="login-title">系统登录</h2>

      <!-- 表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <!-- 账号输入 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号/手机号"
            prefix-icon="el-icon-user"
            clearable
          ></el-input>
        </el-form-item>

        <!-- 密码输入 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            clearable
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="isLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
// 引入axios（已封装的请求工具，下文提供）
import login_api from "@/api/mapis/user_interface.js"
import lmd5 from '@/utils/MD5.js'
import NativeAesGcmUtil from '@/utils/AES.js'

export default {
  name: 'Login',
  data() {
    return {
      // 登录表单数据
      loginForm: {
        username: '', // 账号
        password: '', // 密码
        remember: false // 记住密码
      },
      // 表单验证规则
      loginRules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 4, max: 20, message: '账号长度在 4~20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 4, max: 20, message: '密码长度在 4~20 个字符', trigger: 'blur' }
        ]
      },
      // 登录按钮加载状态
      isLoading: false
    };
  },
  mounted() {
    let query = this.$route.query
    this.authStart()

  },
  methods: {
    authStart(){
      if(process.env.NODE_ENV == "development1"){
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicmlkIjoic3lzdGVtIiwiZXhwIjoxNzY1NDMzODgwfQ.0Z-ZteJ8bNmRdStogrmoj5yo0QDJ15NV1Y-oCG_kxa4"
        const user_info = {"username":"admin", "rid":"system", "subname":"测试管理"}
        this.$store.dispatch('user/login', {"token": token,"user_info":user_info});
        this.$router.push({path: "/"})
      }
    },

    getRouteList(){
      let that = this
      login_api.getRoleRouteList({},{}).then(function (response) {
        // console.log("加载 route===",response.data)
        if(response.data.code==0){
          localStorage.setItem("RouteList", JSON.stringify(response.data.data))
          that.$router.push('/');
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    },

    // 处理登录
    async handleLogin() {
      // 1. 表单验证
      // let dd = lmd5.hex_md5("netops"+this.input_password)
      try {
        await this.$refs.loginFormRef.validate();
      } catch (error) {
        this.$message.error('请完善表单信息');
        return;
      }
      try {
        let that = this;
        this.isLoading = true;
        let username = this.loginForm.username
        let passwd = this.loginForm.password
        let identify = lmd5.salt_identify(passwd)
        let timestamp = parseInt(new Date().getTime()/1000)

        let secret = lmd5.hex_md5(username+identify+"netops"+timestamp)
        let post_data = {
          "username": username,
          "secret": secret,
          "timestamp": timestamp
        }
        // console.log("登陆信息==", post_data)

        login_api.login(post_data,{}).then(async function(response){
          // console.log("登陆结果",response.data)
          if(response.data.code===0){
            let user_infos = {
              "token":response.data.data["token"],
              "user_info":response.data.data["user_info"],
              "token_sign": secret
            }
            // console.log("写入信息==",user_infos)


            await that.$store.dispatch("user/login", user_infos)
            // console.log("写入完成，获取路由")
            await that.getRouteList()
            that.$message({
              type: 'success',
              message: '登陆成功'
            });
          }else{
            that.$message({
              type: 'error',
              message: '登陆失败，失败原因:'+response.data.message
            });
          }

        }).catch(function (error) {
            console.log(error)
            that.$message({
              type: 'error',
              message: '登陆失败，请重试'
            });
        })
      } catch (error) {
        // 5. 登录失败处理
        this.$message.error('网络错误，请重试');
        console.error('登录请求失败：', error);
      } finally {
        // 6. 关闭加载状态
        this.isLoading = false;
      }
    },

    // 忘记密码（跳转或弹窗）
    handleForgetPwd() {
      this.$message.info('跳转到忘记密码页面');
      // this.$router.push('/forget-pwd');
    },

    // 注册（跳转）
    handleRegister() {
      this.$message.info('跳转到注册页面');
      // this.$router.push('/register');
    }
  }
};
</script>

<style scoped>
/* 登录页面整体样式 */
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(120deg, #2c3e50, #4ca1af);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 登录卡片 */
.login-card {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

/* 登录标题 */
.login-title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
}

/* 登录表单 */
.login-form {
  margin-top: 20px;
}

/* 表单操作区（记住密码+忘记密码） */
.login-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

/* 注册入口 */
.login-register {
  text-align: center;
  margin-top: 10px;
}

/* 响应式适配（移动端） */
@media (max-width: 450px) {
  .login-card {
    width: 90%;
    padding: 20px;
  }
}
</style>
