<template>
  <el-form :model="feature" size="mini" label-width="110px">
    <el-form-item label="规则ID" v-if="showRuleId">
      <el-input style="width: 300px;" v-model="feature.rule_id" disabled readonly></el-input>
    </el-form-item>
    <el-form-item label="事件码">
      <el-select v-model="feature.event_code" placeholder="精确事件码，*=所有事件" filterable style="width: 300px;">
        <el-option label="*（全局兜底，匹配所有事件）" value="*"></el-option>
        <el-option v-for="code in eventCodes" :key="code" :label="code" :value="code"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="设备IP正则">
      <el-input style="width: 500px;" placeholder="空=不限" v-model="feature.ip_reg" clearable></el-input>
      <RegexTester :pattern="feature.ip_reg" match-type="regex" />
    </el-form-item>
    <el-form-item label="sysname正则">
      <el-input style="width: 500px;" placeholder="空=不限" v-model="feature.sysname_reg" clearable></el-input>
      <RegexTester :pattern="feature.sysname_reg" match-type="regex" />
    </el-form-item>
    <el-form-item label="级别">
      <el-select v-model="feature.severity" style="width: 150px;">
        <el-option label="P1" :value="1"></el-option>
        <el-option label="P2" :value="2"></el-option>
        <el-option label="P3" :value="3"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="动作">
      <el-select v-model="feature.action" style="width: 200px;">
        <el-option label="正常告警" value=""></el-option>
        <el-option label="ignore（不开告警）" value="ignore"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="优先级">
      <el-input-number style="width: 200px;" v-model="feature.priority" :min="1" :max="999"></el-input-number>
      <span style="color:#909399;margin-left:10px;font-size:12px;">越小越先匹配，首条命中即停</span>
    </el-form-item>
    <el-form-item label="启用">
      <el-switch v-model="feature.enabled"></el-switch>
    </el-form-item>
    <el-form-item label="描述">
      <el-input style="width: 500px;" placeholder="为什么这个级别，便于日后判断能不能调" v-model="feature.descr" clearable></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
import RegexTester from './regex_tester.vue'
import alarm_api from "@/api/mapis/alarm_interface.js"

export default {
  name: 'SeverityForm',
  props: {
    feature: { type: Object, required: true },
    showRuleId: { type: Boolean, default: false }
  },
  data() {
    return {
      eventCodes: []
    }
  },
  mounted() {
    this.loadEventCodes()
  },
  methods: {
    loadEventCodes() {
      // 事件码由 L3 解析规则（syslog_rule）产出，这里的下拉取自那张表
      // 已经用过的 event_code 去重，而不是 syslog_event —— 后者是给已有
      // 事件码配属性的表，新事件码没在 syslog_rule 里出现过就不该能选
      let that = this
      alarm_api.getRule({}, {}).then(function (response) {
        if (response.data.code === 0) {
          let codes = response.data.data
            .map(function (row) { return row.event_code })
            .filter(function (code) { return code })
          that.eventCodes = Array.from(new Set(codes)).sort()
        }
      }).catch(function (error) {
        console.log(error)
      })
    }
  },
  components: { RegexTester }
};
</script>
