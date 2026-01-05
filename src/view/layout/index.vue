<template>
  <div style="display: flex;flex-direction: column;">
    <TopMenu ref="top_menu" @changeGroup="changeGroupItem" />
    <div style="display: flex;max-height: 100vh;">
      <SideMenu ref="side_menu" @changeMenu="changeTab" />
      <div style="flex: 1;margin: 10px;">
        <TabMenu ref="tab_nav" style="padding-bottom: 10px;border-bottom: 1px solid #eee;"></TabMenu>
        <!-- 这里是页面的主要内容区域 -->
        <transition name="main" mode="out-in">
          <!-- <el-card> -->
          <router-view style="margin: 10px;"></router-view>
          <!-- </el-card> -->
        </transition>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script>
import TopMenu from "./TopMenu.vue"
import SideMenu from "./SideMenu.vue"
import Footer from "./Footer.vue"
import TabMenu from "./TabMenu.vue"


export default {
  name: "App",
  mounted () {
    const menuList = this.$store.state.allMenu.menuList;

    this.$refs.top_menu.reloadRoute(menuList, (g_name) => {
    // 该回调函数会在 top_menu.reloadRoute 执行完成后触发
      this.$refs.side_menu.reloadRoute(menuList, g_name);
    })
  },
  methods:{
    changeGroupItem(g_str){
      this.$refs.side_menu.reloadRoute(this.$store.state.allMenu.menuList, g_str)
    },
    changeTab(route){
      this.$refs.tab_nav.changeTab(route)
    }
  },
  components: {
    TopMenu,
    SideMenu,
    Footer,
    TabMenu
  }
}
</script>

<style>
  .main-enter, .main-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }
  .main-enter-active {
    transition: all 0.2s;
  }
  .main-leave-active {
    position: absolute;
    transition: all 0.3s;
  }
</style>
