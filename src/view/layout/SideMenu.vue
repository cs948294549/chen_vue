<template>
  <div class="side-menu" :class="{ collapsed: collapsed }">
    <el-menu
      class="side-menu-list"
      :default-active="activePath"
      background-color="#1b2a3d"
      text-color="#bfcbd9"
      active-text-color="#ffffff"
      :collapse="collapsed"
      :collapse-transition="false"
      :unique-opened="true"
      :router="false"
      @select="selectmenu"
      v-if="refresh_flag">
        <template v-for="(item, index) in visibleList">
          <el-submenu v-if="item.children.length>0" :index="'sub-'+index" :key="'sub-'+index">
            <template slot="title">
              <i :class="item.icon || 'el-icon-menu'"></i>
              <span slot="title">{{ item.name }}</span>
            </template>

            <template v-for="child in item.children">
              <el-menu-item v-if="!child.hide" :index="child.path" :key="child.id || child.path">
                <span slot="title">{{ child.name }}</span>
              </el-menu-item>
            </template>
          </el-submenu>

          <el-menu-item v-else :index="item.path" :key="item.id || item.path">
            <i :class="item.icon || 'el-icon-document'"></i>
            <span slot="title">{{ item.name }}</span>
          </el-menu-item>
        </template>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: "SideMenu",
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      route_list:[],
      cur_group: "分组1",
      refresh_flag: true
    }
  },
  computed: {
    visibleList () {
      return this.route_list.filter(item => !item.hide)
    },
    // 菜单 index 为不带前导 / 的 path，用当前路由高亮对应菜单
    activePath () {
      return this.$route.path.replace(/^\//, "")
    }
  },
  methods: {
    getMenu () {
      this.$store.dispatch("sideMenu/fetchData").then(response => {
        this.userData = response
      }).catch(error => {
        console.error("获取数据失败:", error)
      })
    },
    reloadRoute (route, group){
      this.refresh_flag = false
      if(group){
        this.cur_group = group
      }else{
        if(route.length>0){
          this.cur_group = route[0]["group"]
        }
      }
      let route_list = []
      for(let i=0;i<route.length;i++){
        if(route[i]["group"]==this.cur_group){
          route_list.push(route[i])
        }
      }
      this.route_list = route_list
      this.refresh_flag = true
    },

    selectmenu(index, index_path){
      let matched = false
      let navTitle=""
      let breadcrumbs = []
      for(let i=0;i<this.route_list.length;i++){
        if(this.route_list[i]["children"].length>0){
          breadcrumbs = []
          breadcrumbs.push(this.route_list[i]["group"])
          breadcrumbs.push(this.route_list[i]["name"])

          for(let j=0;j<this.route_list[i]["children"].length;j++){
            if(this.route_list[i]["children"][j]["path"]==index){
              navTitle=this.route_list[i]["children"][j]["name"]
              breadcrumbs.push(navTitle)
              matched=true
              break
            }
          }
        }else{
          breadcrumbs = []
          breadcrumbs.push(this.route_list[i]["group"])
          if(this.route_list[i]["path"]==index){
            navTitle=this.route_list[i]["name"]
            breadcrumbs.push(navTitle)
            matched=true
          }
        }
        if(matched===true){
          break
        }
      }
      this.$store.dispatch("tabnav/addTab",{"title":navTitle,"path":'/'+index,'breadcrumbs':breadcrumbs})
      this.$emit('changeMenu', {"title":navTitle,"path":'/'+index,'breadcrumbs':breadcrumbs});
    },
  },
  components: {}
}
</script>

<style scoped>
.side-menu {
  width: 210px;
  height: 100%;
  flex-shrink: 0;
  background-color: #1b2a3d;
  overflow-x: hidden;
  overflow-y: auto;
  transition: width 0.2s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.2);
  position: relative;
  z-index: 5;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.side-menu.collapsed {
  width: 64px;
}
.side-menu::-webkit-scrollbar {
  width: 6px;
}
.side-menu::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.15);
}

.side-menu-list {
  border-right: none;
}
.side-menu-list:not(.el-menu--collapse) {
  width: 210px;
}

.side-menu /deep/ .el-menu-item,
.side-menu /deep/ .el-submenu__title {
  height: 46px;
  line-height: 46px;
}
.side-menu /deep/ .el-menu-item [class^="el-icon-"],
.side-menu /deep/ .el-submenu__title [class^="el-icon-"] {
  color: inherit;
  font-size: 16px;
}

/* 二级菜单背景加深，区分层级 */
.side-menu /deep/ .el-submenu .el-menu-item {
  min-width: 0;
  background-color: #14202f !important;
}

/* hover */
.side-menu /deep/ .el-menu-item:hover,
.side-menu /deep/ .el-submenu__title:hover,
.side-menu /deep/ .el-submenu .el-menu-item:hover {
  color: #ffffff !important;
  background-color: #24364d !important;
}

/* 选中菜单：整行高亮 */
.side-menu /deep/ .el-menu-item.is-active,
.side-menu /deep/ .el-submenu .el-menu-item.is-active {
  color: #ffffff !important;
  background-color: #409eff !important;
}

/* 子菜单选中时父级标题高亮 */
.side-menu /deep/ .el-submenu.is-active > .el-submenu__title {
  color: #ffffff !important;
}
</style>
