<template>
  <div>
    <el-menu
      default-active="2"
      class="el-menu-vertical"
      background-color="#e8e8eb"
      text-color="#27569b"
      active-text-color="#27569b"
      :unique-opened="true"
      :router="false"
      @select="selectmenu"
      v-if="refresh_flag">
        <template v-for="(item, index) in route_list" v-if="!item.hide&&item.group == cur_group">
          <el-submenu v-if="item.children.length>0" :index="index+''" :key="index">
            <template slot="title">
              <!-- <i :class="item.iconCls?item.iconCls:'el-icon-collection-tag'"></i> -->
              <span slot="title">{{ item.name }}</span>
            </template>

            <template v-for="child in item.children">
              <el-menu-item v-if="!child.hide" :index="child.path" :key="child.page_id">
                <!-- <i :class="child.iconCls?child.iconCls:'el-icon-collection-tag'"></i> -->
                <span slot="title">{{ child.name }}</span>
              </el-menu-item>
            </template>
          </el-submenu>

          <el-menu-item v-else :index="item.path" :key="item.page_id">
            <!-- <i :class="item.iconCls?item.iconCls:'el-icon-collection-tag'"></i> -->
            <span slot="title">{{ item.name }}</span>
          </el-menu-item>
        </template>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: "SideMenu",
  data () {
    return {
      route_list:[],
      cur_group: "分组1",
      refresh_flag: true
    }
  },
  mounted () {
    // this.getMenu()
  },
  methods: {
    getMenu () {
      this.$store.dispatch("sideMenu/fetchData").then(response => {
        this.userData = response
        // console.log("结果===", response)
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
      // console.log("选中===",index, index_path)
      let matched = false
      let navTitle=""
      for(let i=0;i<this.route_list.length;i++){
        if(this.route_list[i]["children"].length>0){
          for(let j=0;j<this.route_list[i]["children"].length;j++){
            if(this.route_list[i]["children"][j]["path"]==index){
              navTitle=this.route_list[i]["children"][j]["name"]
              matched=true
              break
            }
          }
        }else{
          if(this.route_list[i]["path"]==index){
            navTitle=this.route_list[i]["name"]
            matched=true
          }
        }
        if(matched===true){
          break
        }
      }
      this.$store.dispatch("tabnav/addTab",{"title":navTitle,"path":index})
      this.$router.push({path:'/'+index, query:{}});

    },
  },
  components: {}
}
</script>

<style scoped>
.el-menu-vertical {
  width: 200px;
  min-height: 100vh;
  overflow-y: scroll;
  overflow-x: hide;
}
</style>
