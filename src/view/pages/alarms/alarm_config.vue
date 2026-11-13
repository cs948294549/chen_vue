<template>
  <div style="margin: 10px;">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="日志黑名单" name="1">
        <Card_black v-if="activeName=='1'" ></Card_black>
      </el-tab-pane>
      <el-tab-pane label="解析规则" name="2">
        <Card_rule v-if="activeName=='2'" ></Card_rule>
      </el-tab-pane>
      <el-tab-pane label="事件与定级" name="3">
        <Card_event_severity v-if="activeName=='3'" ></Card_event_severity>
      </el-tab-pane>
      <el-tab-pane label="告警静默" name="4">
        <Card_mute v-if="activeName=='4'" ></Card_mute>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import Card_black from './rules_sub/blacklist_sub.vue';
  import Card_rule from './rules_sub/syslog_rule_sub.vue';
  import Card_event_severity from './rules_sub/event_severity_sub.vue';
  import Card_mute from './rules_sub/mute_rule_sub.vue';

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
      Card_black,Card_rule,Card_event_severity,Card_mute
    },
  }
</script>

<style>
</style>
