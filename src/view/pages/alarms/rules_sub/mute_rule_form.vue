<template>
  <el-form :model="feature" size="mini" label-width="110px">
    <el-form-item label="规则ID" v-if="showRuleId">
      <el-input style="width: 300px;" v-model="feature.rule_id" disabled readonly></el-input>
    </el-form-item>
    <el-form-item label="设备IP正则">
      <el-input style="width: 500px;" placeholder="空=不限" v-model="feature.ip_reg" clearable></el-input>
      <RegexTester :pattern="feature.ip_reg" match-type="regex" />
    </el-form-item>
    <el-form-item label="事件码正则">
      <el-input style="width: 500px;" placeholder="空=不限。注意盖住IF_FLAP" v-model="feature.event_code_reg" clearable></el-input>
      <RegexTester :pattern="feature.event_code_reg" match-type="regex" />
    </el-form-item>
    <el-form-item label="告警对象正则">
      <el-input style="width: 500px;" placeholder="空=不限" v-model="feature.object_reg" clearable></el-input>
      <RegexTester :pattern="feature.object_reg" match-type="regex" />
    </el-form-item>
    <el-form-item label="窗口开始">
      <el-date-picker
        v-model="startTimeMs"
        type="datetime"
        placeholder="空=立即生效"
        value-format="timestamp"
        style="width: 300px;"
        clearable
      ></el-date-picker>
    </el-form-item>
    <el-form-item label="窗口结束">
      <el-date-picker
        v-model="endTimeMs"
        type="datetime"
        placeholder="空=永久静默"
        value-format="timestamp"
        style="width: 300px;"
        clearable
      ></el-date-picker>
    </el-form-item>
    <el-form-item label="启用">
      <el-switch v-model="feature.enabled"></el-switch>
    </el-form-item>
    <el-form-item label="描述">
      <el-input style="width: 500px;" placeholder="为什么静默，建议写上变更工单号" v-model="feature.descr" clearable></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
import RegexTester from './regex_tester.vue'

export default {
  name: 'MuteForm',
  props: {
    feature: { type: Object, required: true },
    showRuleId: { type: Boolean, default: false }
  },
  components: { RegexTester },
  computed: {
    // el-date-picker 用毫秒时间戳，feature.start_time/end_time 存的是 epoch 秒字符串，
    // 两边互转。空字符串在 picker 里显示为未选中
    startTimeMs: {
      get() {
        return this.feature.start_time ? Number(this.feature.start_time) * 1000 : null;
      },
      set(val) {
        this.feature.start_time = val ? String(Math.floor(val / 1000)) : "";
      }
    },
    endTimeMs: {
      get() {
        return this.feature.end_time ? Number(this.feature.end_time) * 1000 : null;
      },
      set(val) {
        this.feature.end_time = val ? String(Math.floor(val / 1000)) : "";
      }
    }
  }
};
</script>
