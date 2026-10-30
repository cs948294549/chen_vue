<template>
  <div class="top-header">
    <!-- logo 区域，宽度跟随侧边栏折叠状态 -->
    <div class="header-logo" :class="{ collapsed: collapsed }">
      <i class="el-icon-s-platform logo-icon"></i>
      <span v-show="!collapsed" class="logo-title">OPS</span>
      <span v-show="!collapsed" class="logo-sub">运维平台</span>
    </div>

    <div class="header-main">
      <div class="header-left">
        <!-- 侧边栏折叠 -->
        <div class="header-action" :title="collapsed ? '展开菜单' : '收起菜单'" @click="$emit('toggleCollapse')">
          <i :class="collapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
        </div>

        <!-- 顶部分组导航 -->
        <div v-if="refresh_flag" class="group-nav">
          <div
            class="group-item"
            v-for="(item, index) in classic"
            :key="index"
            :class="{ active: activeName == item }"
            @click="changeGroup(item)">
            {{ item }}
          </div>
        </div>
      </div>

      <div class="header-right">
        <div class="header-action" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
          <i class="el-icon-full-screen"></i>
        </div>

        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-box">
            <span class="user-avatar">{{ userName.charAt(0) }}</span>
            <span class="user-name">{{ userName }}</span>
            <i class="el-icon-arrow-down"></i>
          </div>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="editPassword" icon="el-icon-lock">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" icon="el-icon-switch-button" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <el-dialog title="修改密码" :visible.sync="diag_editPassword" width="460px" append-to-body :close-on-click-modal="false">
      <el-form :model="feature_user" size="small" label-width="90px">
        <el-form-item label="原密码">
          <el-input :show-password="true" placeholder="请输入原密码" v-model="feature_user.old_passwd"></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input :show-password="true" placeholder="请输入新密码" v-model="feature_user.new_passwd"></el-input>
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input :show-password="true" placeholder="请再次输入新密码" v-model="feature_user.pre_new_passwd"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="diag_editPassword=false">取消</el-button>
        <el-button size="small" type="primary" @click="submitEdit()">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import user_api from "@/api/mapis/user_interface.js"
import lmd5 from '@/utils/MD5.js'

export default {
  name: "TopMenu",
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      activeName: "",
      classic: [],
      refresh_flag: false,
      isFullscreen: false,

      //修改密码
      diag_editPassword:false,
      feature_user:{
        "old_passwd":"",
        "new_passwd":"",
        "pre_new_passwd": "",
      },
    }
  },
  computed: {
    userName () {
      const info = this.$store.getters["user/user_info"] || {}
      return info.subname || "用户"
    }
  },
  mounted () {
    document.addEventListener("fullscreenchange", this.onFullscreenChange)
  },
  beforeDestroy () {
    document.removeEventListener("fullscreenchange", this.onFullscreenChange)
  },
  methods: {
    reloadRoute (route, callback){
      try{
        this.refresh_flag = false
        let classic = []
        for(let i=0;i<route.length;i++){
          if(classic.indexOf(route[i]["group"])<0 && route[i]["group"]!==""){
            classic.push(route[i]["group"])
          }
        }
        this.classic = classic
        this.activeName = classic[0]
        this.refresh_flag = true
        // 关键：逻辑执行完成后，调用回调函数（若传入）
        if (typeof callback === 'function') {
          callback(this.activeName);
        }
      }catch (error) {
        console.error('top_menu reloadRoute 执行失败：', error);
        // 异常时也可调用回调（可选，根据业务需求决定）
        if (typeof callback === 'function') {
          callback();
        }
      }
    },
    changeGroup(g_str){
      this.activeName = g_str
      this.$emit('changeGroup', g_str);
    },

    toggleFullscreen () {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
    },
    onFullscreenChange () {
      this.isFullscreen = !!document.fullscreenElement
    },

    handleCommand (command) {
      if (command === "logout") {
        this.$store.dispatch("user/logout")
      }else if (command === "editPassword") {
        this.feature_user = {"old_passwd":"", "new_passwd":"", "pre_new_passwd": ""}
        this.diag_editPassword = true
      }
    },

    submitEdit(){
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

      let that=this
      user_api.changePasswd(post_data,{}).then(async function(response){
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
      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '修改失败，请重试'
          });
      })
    },
  },
  components: {}
}
</script>

<style scoped>
  .top-header {
    display: flex;
    height: 50px;
    background-color: #0f1c2e;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.3);
    position: relative;
    z-index: 10;
    flex-shrink: 0;
  }

  /* logo */
  .header-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 210px;
    flex-shrink: 0;
    color: #fff;
    background-color: #0b1624;
    transition: width 0.2s;
    overflow: hidden;
    white-space: nowrap;
  }
  .header-logo.collapsed {
    width: 64px;
  }
  .logo-icon {
    font-size: 24px;
    color: #409eff;
  }
  .logo-title {
    margin-left: 8px;
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 2px;
  }
  .logo-sub {
    margin-left: 8px;
    padding-left: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    border-left: 1px solid rgba(255, 255, 255, 0.25);
  }

  .header-main {
    flex: 1;
    display: flex;
    justify-content: space-between;
    min-width: 0;
  }
  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    height: 100%;
  }
  .header-left {
    min-width: 0;
  }

  /* 图标按钮 */
  .header-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 100%;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    transition: all 0.2s;
  }
  .header-action:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  /* 分组导航 */
  .group-nav {
    display: flex;
    height: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .group-nav::-webkit-scrollbar {
    display: none;
  }
  .group-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 18px;
    height: 100%;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
  }
  .group-item:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.08);
  }
  .group-item.active {
    color: #fff;
    background-color: rgba(64, 158, 255, 0.18);
  }
  .group-item.active::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background-color: #409eff;
  }

  /* 用户信息 */
  .user-box {
    display: flex;
    align-items: center;
    height: 50px;
    padding: 0 16px 0 12px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .user-box:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
  .user-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #409eff;
    color: #fff;
    font-size: 13px;
  }
  .user-name {
    margin: 0 6px 0 8px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }
</style>
