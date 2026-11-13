<template>
  <div class="regex-tester">
    <el-input
      size="mini"
      placeholder="贴一段样例文本，测试上面的正则/子串能不能命中"
      v-model="sampleText"
      clearable
    ></el-input>
    <div class="regex-tester-result" v-if="sampleText">
      <template v-if="pattern">
        <span v-if="testError" class="result-error">正则语法错误：{{ testError }}</span>
        <span v-else-if="matched" class="result-hit">
          命中，捕获：<code>{{ matchedText }}</code>
        </span>
        <span v-else class="result-miss">未命中</span>
      </template>
      <span v-else class="result-empty">先填写上面的正则/关键字</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegexTester',
  props: {
    // 要测试的正则或子串，父组件表单里的 pattern/object_regex/ip_reg 等字段
    pattern: {
      type: String,
      default: ''
    },
    // 匹配方式：regex=正则 / contains=子串，影响判定逻辑。默认按正则处理
    matchType: {
      type: String,
      default: 'regex'
    },
    ignoreCase: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      sampleText: ''
    };
  },
  computed: {
    testResult() {
      if (!this.pattern || !this.sampleText) {
        return { matched: false, matchedText: '', error: '' };
      }
      if (this.matchType === 'contains') {
        const hay = this.ignoreCase ? this.sampleText.toLowerCase() : this.sampleText;
        const needle = this.ignoreCase ? this.pattern.toLowerCase() : this.pattern;
        const hit = hay.indexOf(needle) !== -1;
        return { matched: hit, matchedText: hit ? this.pattern : '', error: '' };
      }
      try {
        const flags = this.ignoreCase ? 'i' : '';
        const re = new RegExp(this.pattern, flags);
        const m = this.sampleText.match(re);
        if (m) {
          return { matched: true, matchedText: m[1] !== undefined ? m[1] : m[0], error: '' };
        }
        return { matched: false, matchedText: '', error: '' };
      } catch (err) {
        return { matched: false, matchedText: '', error: err.message };
      }
    },
    matched() {
      return this.testResult.matched;
    },
    matchedText() {
      return this.testResult.matchedText;
    },
    testError() {
      return this.testResult.error;
    }
  }
};
</script>

<style scoped>
.regex-tester {
  margin-top: 4px;
}

.regex-tester-result {
  margin-top: 4px;
  font-size: 12px;
}

.result-hit {
  color: #67c23a;
}

.result-miss {
  color: #909399;
}

.result-error {
  color: #f56c6c;
}

.result-empty {
  color: #c0c4cc;
}
</style>
