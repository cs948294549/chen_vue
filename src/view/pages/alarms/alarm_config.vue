<template>
  <div style="margin: 10px;">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="日志黑名单" name="1">
        <Card_black v-if="activeName=='1'" ></Card_black>
      </el-tab-pane>
      <el-tab-pane label="日志聚合规则" name="2">
        <Card_merge v-if="activeName=='2'" ></Card_merge>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import Card_black from './rules_sub/blacklist_sub.vue';
  import Card_merge from './rules_sub/mergelist_sub.vue';

  export default {
    data() {
      return {
        activeName: '1',
        select_id: 0,
      };
    },
    mounted() {

    },
    methods:{
      handleClick(tab, event) {
        this.select_id = 0
      },
    },
    components:{
      Card_black,Card_merge
    },
  }
</script>

<style>
</style>
