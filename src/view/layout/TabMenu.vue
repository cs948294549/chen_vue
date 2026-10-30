<template>
  <div class="tab-menu">
    <!-- 页签栏（带滚动，适配多页签） -->
    <div class="tags-bar">
      <div class="tags-scroll" ref="tagsScroll" @wheel.prevent="handleWheel">
        <div
          class="tag-item"
          v-for="(item, index) in $store.getters['tabnav/tabnavBox']"
          :key="item.path"
          :class="{ active: activeTabId === item.path }"
          @click="changeTab(item)"
          @contextmenu.prevent="openContextMenu($event, item, index)"
        >
          <span class="tag-title">{{ item.title }}</span>
          <!-- 关闭按钮（首页不可关闭） -->
          <i
            class="el-icon-close tag-close"
            v-if="index!==0"
            @click.stop="closeTab(item, index)"
          ></i>
        </div>
      </div>
    </div>

    <!-- 页签右键菜单 -->
    <ul v-show="ctxMenu.visible" class="ctx-menu" :style="{ left: ctxMenu.left + 'px', top: ctxMenu.top + 'px' }">
      <li v-if="ctxMenu.index !== 0" @click="closeTab(ctxMenu.item, ctxMenu.index)">关闭当前</li>
      <li @click="closeOthers(ctxMenu.item)">关闭其他</li>
      <li @click="closeAll">关闭全部</li>
    </ul>

    <el-breadcrumb class="breadcrumb-bar" separator-class="el-icon-arrow-right">
      <el-breadcrumb-item v-for="(title,index) in activebreadcrumb" :key="index">{{title}}</el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
const HOME_PATH = "/pages/index"

export default {
  data () {
    return {
      ctxMenu: {
        visible: false,
        left: 0,
        top: 0,
        item: null,
        index: -1
      }
    }
  },
  computed: {
    // 当前页签直接跟随路由，避免和地址栏不同步
    activeTabId () {
      return this.$route.path
    },
    activebreadcrumb () {
      const tabs = this.$store.getters['tabnav/tabnavBox']
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].path === this.activeTabId) {
          return tabs[i].breadcrumbs && tabs[i].breadcrumbs.length > 0 ? tabs[i].breadcrumbs : [tabs[i].title]
        }
      }
      return []
    }
  },
  watch: {
    "ctxMenu.visible" (val) {
      if (val) {
        document.body.addEventListener("click", this.closeContextMenu)
      } else {
        document.body.removeEventListener("click", this.closeContextMenu)
      }
    }
  },
  beforeDestroy () {
    document.body.removeEventListener("click", this.closeContextMenu)
  },
  methods: {
    removeTab(){
      this.$store.dispatch("tabnav/clearTab")
    },
    switchTab(path){
      this.$router.push({path: path, query:{}});
    },
    changeTab(route){
      this.switchTab(route["path"])
    },
    closeTab(item, idx){
      if(this.activeTabId==item["path"]){
        if(idx>0){
          this.$store.dispatch("tabnav/removeTab", item)
          this.switchTab(this.$store.getters['tabnav/tabnavBox'][idx-1]["path"])
        }
      }else{
        this.$store.dispatch("tabnav/removeTab", item)
      }
    },
    closeOthers(item){
      const tabs = this.$store.getters['tabnav/tabnavBox'].slice()
      for (let i = 1; i < tabs.length; i++) {
        if (tabs[i].path !== item.path) {
          this.$store.dispatch("tabnav/removeTab", tabs[i])
        }
      }
      if (this.activeTabId !== item.path) {
        this.switchTab(item.path)
      }
    },
    closeAll(){
      this.removeTab()
      if (this.activeTabId !== HOME_PATH) {
        this.switchTab(HOME_PATH)
      }
    },

    openContextMenu(e, item, index){
      this.ctxMenu.item = item
      this.ctxMenu.index = index
      this.ctxMenu.left = e.clientX
      this.ctxMenu.top = e.clientY
      this.ctxMenu.visible = true
    },
    closeContextMenu(){
      this.ctxMenu.visible = false
    },

    // 鼠标滚轮横向滚动页签
    handleWheel(e){
      this.$refs.tagsScroll.scrollLeft += e.deltaY || e.deltaX
    }
  }
}
</script>

<style scoped>
  .tab-menu {
    flex-shrink: 0;
  }

  /* 页签栏 */
  .tags-bar {
    height: 36px;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .tags-scroll {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 10px;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    scrollbar-width: none; /* 火狐 */
  }
  .tags-scroll::-webkit-scrollbar {
    display: none; /* 谷歌/Edge */
  }

  .tag-item {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    height: 26px;
    padding: 0 10px;
    margin-right: 6px;
    font-size: 12px;
    color: #495060;
    background-color: #fff;
    border: 1px solid #d8dce5;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .tag-item:hover:not(.active) {
    color: #409eff;
    border-color: #b3d8ff;
    background-color: #ecf5ff;
  }
  .tag-item.active {
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
  }
  /* 选中页签前的小圆点 */
  .tag-item.active::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 6px;
    border-radius: 50%;
    background-color: #fff;
  }

  .tag-close {
    margin-left: 6px;
    margin-right: -4px;
    width: 14px;
    height: 14px;
    line-height: 14px;
    font-size: 10px;
    text-align: center;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
  .tag-close:hover {
    color: #fff;
    background-color: #b4bccc;
  }
  .tag-item.active .tag-close:hover {
    background-color: rgba(255, 255, 255, 0.35);
  }

  /* 右键菜单 */
  .ctx-menu {
    position: fixed;
    z-index: 3000;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    font-size: 12px;
    color: #333;
  }
  .ctx-menu li {
    padding: 7px 16px;
    cursor: pointer;
  }
  .ctx-menu li:hover {
    color: #409eff;
    background-color: #ecf5ff;
  }

  /* 面包屑 */
  .breadcrumb-bar {
    padding: 12px 16px 0;
    font-size: 13px;
    cursor: default !important;
  }
</style>
