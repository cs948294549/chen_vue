<template>
  <div class="app-layout">
    <TopMenu ref="top_menu" :collapsed="collapsed" @changeGroup="changeGroupItem" @toggleCollapse="toggleCollapse" />
    <div class="app-body">
      <SideMenu ref="side_menu" :collapsed="collapsed" @changeMenu="changeTab" />
      <div class="app-main">
        <TabMenu ref="tab_nav"></TabMenu>
        <!-- 这里是页面的主要内容区域 -->
        <div class="app-content">
          <transition name="main" mode="out-in">
            <router-view class="page-container"></router-view>
          </transition>
        </div>
        <Footer />
      </div>
    </div>
  </div>
</template>

<script>
import TopMenu from "./TopMenu.vue"
import SideMenu from "./SideMenu.vue"
import Footer from "./Footer.vue"
import TabMenu from "./TabMenu.vue"

const COLLAPSE_KEY = "side_menu_collapsed"

export default {
  name: "App",
  data () {
    return {
      collapsed: localStorage.getItem(COLLAPSE_KEY) === "1"
    }
  },
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
    },
    toggleCollapse(){
      this.collapsed = !this.collapsed
      localStorage.setItem(COLLAPSE_KEY, this.collapsed ? "1" : "0")
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

<style scoped>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .app-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .app-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    background-color: #f0f2f5;
  }
  .app-content {
    flex: 1;
    min-height: 0;
    padding: 12px 16px 16px;
    overflow-y: auto;
    position: relative;
  }

  /* 页面内容卡片 */
  .page-container {
    box-sizing: border-box;
    min-height: 100%;
    padding: 16px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  }
</style>

<style>
  .main-enter, .main-leave-to {
    opacity: 0;
    transform: translateX(-10px);
  }
  .main-enter-active,
  .main-leave-active {
    transition: all 0.2s;
  }
</style>
