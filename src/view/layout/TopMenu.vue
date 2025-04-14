<template>
  <div style="display: flex;">
    <div style="background-color: darkred;">
      <p style="width: 200px; height: 20px; line-height: 20px; text-align: center;font-size: 16px; font-weight: bold; color: #ffffff;">萌</p>
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
  </div>
</template>

<script>
export default {
  name: "TopMenu",
  data () {
    return {
      activeName: "",
      classic: [],
      refresh_flag: false,
    }
  },
  mounted () {},
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
