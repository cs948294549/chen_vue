<template>
  <div style="margin: 10px;">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="用户管理" name="1">
        <Card_user v-if="activeName=='1'" ></Card_user>
      </el-tab-pane>
      <el-tab-pane label="角色管理" name="2">
        <Card_role v-if="activeName=='2'" ></Card_role>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import Card_user from './userManage_sub/user_manage_sub.vue';
  import Card_role from './userManage_sub/role_manage_sub.vue';

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
      Card_user,Card_role
    },
  }
</script>

<style>
</style>
