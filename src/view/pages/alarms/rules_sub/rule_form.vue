<template>
  <el-form :model="feature" size="mini" label-width="110px">
    <el-form-item label="规则ID" v-if="showRuleId">
      <el-input style="width: 300px;" v-model="feature.rule_id" disabled readonly></el-input>
    </el-form-item>
    <el-form-item label="厂商">
      <el-input style="width: 300px;" placeholder="*=不限，或 cisco_nx/h3c/huawei/fortinet 等" v-model="feature.vendor" clearable></el-input>
    </el-form-item>
    <el-form-item label="mnemonic">
      <el-input style="width: 500px;" placeholder="header段关键字，空=只对剥不出mnemonic的报文走模糊匹配" v-model="feature.mnemonic" clearable></el-input>
    </el-form-item>
    <el-form-item label="匹配方式">
      <el-select v-model="feature.match_type" style="width: 200px;">
        <el-option label="exact（mnemonic即判据）" value="exact"></el-option>
        <el-option label="contains（正文含pattern）" value="contains"></el-option>
        <el-option label="regex（正文匹配正则）" value="regex"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="pattern" v-if="feature.match_type!=='exact'">
      <el-input style="width: 500px;" placeholder="contains关键字 / regex正则" v-model="feature.pattern" clearable></el-input>
      <RegexTester :pattern="feature.pattern" :match-type="feature.match_type" />
    </el-form-item>
    <el-form-item label="body_match">
      <el-input style="width: 500px;" placeholder="同mnemonic多事件时的消歧子串，须抄现网正文原字符串" v-model="feature.body_match" clearable></el-input>
    </el-form-item>
    <el-form-item label="事件码">
      <el-input style="width: 300px;" placeholder="event_code，如 IF_DOWN" v-model="feature.event_code" clearable></el-input>
    </el-form-item>
    <el-form-item label="对象抽取正则">
      <el-input style="width: 500px;" placeholder="object_regex，第一个捕获组即对象" v-model="feature.object_regex" clearable></el-input>
      <RegexTester :pattern="feature.object_regex" match-type="regex" />
    </el-form-item>
    <el-form-item label="优先级">
      <el-input-number style="width: 200px;" v-model="feature.priority" :min="1" :max="999"></el-input-number>
      <span style="color:#909399;margin-left:10px;font-size:12px;">越小越先匹配</span>
    </el-form-item>
    <el-form-item label="启用">
      <el-switch v-model="feature.enabled"></el-switch>
    </el-form-item>
    <el-form-item label="描述">
      <el-input style="width: 500px;" placeholder="建议填现网正文样例，便于核对正则" v-model="feature.descr" clearable></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
import RegexTester from './regex_tester.vue'

export default {
  name: 'RuleForm',
  props: {
    feature: { type: Object, required: true },
    showRuleId: { type: Boolean, default: false }
  },
  components: { RegexTester }
};
</script>
