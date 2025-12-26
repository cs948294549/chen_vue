<template>
  <div>
    <!-- 页签头部（带滚动，适配多页签） -->
    <div class="tab-header-wrapper">
      <div class="tab-header">
        <div
          class="tab-item"
          v-for="(item, index) in $store.getters['tabnav/tabnavBox']"
          :key="item.path"
          :class="{ active: activeTabId === item.path }"
          @click="changeTab(item)"
        >
          <!-- 页签标题 -->
          <span class="tab-title">{{ item.title }}</span>
          <!-- 关闭按钮（首页不可关闭） -->
          <i
            class="el-icon-close tab-close"
            v-if="index!==0"
            @click.stop="closeTab(item, index)"
          ></i>
        </div>
      </div>
    </div>
    <el-breadcrumb class="breadcrumb_menu" separator-class="el-icon-arrow-right">
      <el-breadcrumb-item v-for="(title,index) in activebreadcrumb" :key="index">{{title}}</el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  data () {
    return {
      activeTabId:"",
      activebreadcrumb:""
    }
  },
  methods: {
    removeTab(){
      this.$store.dispatch("tabnav/clearTab")
    },
    switchTab(path){
      this.activeTabId=path
      this.$router.push({path: path, query:{}});
    },
    changeTab(route){
      this.switchTab(route["path"])
      this.activebreadcrumb=route["breadcrumbs"]
    },
    closeTab(item, idx){
      if(idx>0){
        this.$store.dispatch("tabnav/removeTab", item)
        this.switchTab(this.$store.getters['tabnav/tabnavBox'][idx-1]["path"])
      }
    }
  }
}
</script>
<style scoped>
  .breadcrumb_menu {
    margin-top: 8px;
    cursor: default !important;
  }


  /* 页签头部滚动容器（适配多页签超出横向显示） */
  .tab-header-wrapper {
    width: 1000px;
    overflow-x: auto;
    overflow-y: hidden;
    /* 可选：禁止子容器超出父容器（进一步约束） */
    max-width: 100%;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    /* 隐藏滚动条（美观优化） */
    scrollbar-width: none; /* 火狐 */
  }

  .tab-header-wrapper::-webkit-scrollbar {
    display: none; /* 谷歌/Edge */
  }

  .tab-header {
    display: flex;
    height: 35px;
    white-space: nowrap; /* 禁止页签换行 */
  }

  /* 页签项样式 */
  .tab-item {
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 100%;
    cursor: pointer;
    font-size: 14px;
    color: #606266;
    transition: all 0.2s ease;
    position: relative;
  }

  .tab-item.active {
    background-color: #fff;
    color: #409eff;
    font-weight: 500;
  }

  .tab-item.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #409eff;
  }

  .tab-item:hover:not(.active) {
    color: #409eff;
    background-color: #f0f7ff;
  }

  /* 页签标题与关闭按钮 */
  .tab-title {
    margin-right: 8px;
  }

  /* 关闭按钮：默认隐藏（opacity: 0），hover 显示（opacity: 1） */
  .tab-close {
    font-size: 12px;
    opacity: 0; /* 默认透明（隐藏） */
    transition: opacity 0.2s ease; /* 过渡动画，避免闪烁 */
    cursor: pointer; /* 手动设置光标样式 */
  }

  .tab-item:hover .tab-close {
    opacity: 1;
  }

  .tab-close:hover {
    color: #f56c6c;
  }

  /* 页签内容区域 */
  .tab-content {
    width: 100%;
    height: calc(100% - 45px);
    overflow: auto;
  }

  /* 缓存组件样式 */
  /deep/ .tab-content > div {
    width: 100%;
    height: 100%;
  }
</style>
