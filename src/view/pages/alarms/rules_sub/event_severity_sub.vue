<template>
  <div>
    <el-divider content-position="left">事件属性（全网统一行为）</el-divider>
    <EventSub />
    <el-divider content-position="left">事件定级（事件码+设备 -&gt; 级别）</el-divider>
    <SeverityRuleSub />
  </div>
</template>

<script>
import EventSub from './event_sub.vue'
import SeverityRuleSub from './severity_rule_sub.vue'

export default {
  name: 'EventSeveritySub',
  components: { EventSub, SeverityRuleSub }
};
</script>
