<!--文本工具：正则提取-->
<template>
  <div class="re-page">
    <!-- 标题栏 -->
    <div class="re-header">
      <div class="re-title">
        <i class="el-icon-scissors"></i>正则提取
        <span class="re-subtitle">按正则表达式从文本中提取内容，可用 ${N} 引用分组重新组合输出</span>
      </div>
    </div>

    <!-- 规则区 -->
    <div class="re-filter">
      <div class="preset-row">
        <span class="preset-label">常用规则</span>
        <span
          v-for="p in presets"
          :key="p.id"
          :class="['preset-chip', { active: activePreset === p.id }]"
          :title="p.tip"
          @click="change_reg(p.id)">
          {{ p.name }}
        </span>
      </div>
      <div class="rule-row">
        <el-input
          v-model="reg_filter"
          size="small"
          class="rule-reg mono-input"
          placeholder="正则表达式，如 (\d+)\.(\d+)"
          clearable
          @input="onRuleInput">
          <template slot="prepend">/</template>
          <template slot="append">/g{{ flagI ? 'i' : '' }}{{ flagM ? 'm' : '' }}</template>
        </el-input>
        <el-input
          v-model="reg_format"
          size="small"
          class="rule-fmt mono-input"
          placeholder="输出格式（可选），如 ${1}:${2}，留空输出整个匹配"
          clearable
          @input="onRuleInput">
          <template slot="prepend">格式</template>
        </el-input>
        <el-button size="small" type="primary" icon="el-icon-search" @click="func_extract">提取</el-button>
      </div>
      <div class="opt-row">
        <el-checkbox v-model="flagI" @change="func_extract">忽略大小写</el-checkbox>
        <el-checkbox v-model="flagM" @change="func_extract">多行模式（^ $ 匹配每行）</el-checkbox>
        <el-checkbox v-model="dedupe" @change="func_extract">结果去重</el-checkbox>
        <span class="form-tip">格式中 ${0} 为整个匹配，${1}、${2}… 为分组，支持 \t 制表符</span>
      </div>
      <div v-if="regError" class="reg-error">
        <i class="el-icon-circle-close"></i>正则表达式错误：{{ regError }}
      </div>
    </div>

    <!-- 输入 / 输出 -->
    <div class="re-body">
      <div class="re-panel re-left">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-edit-outline"></i>输入内容</span>
          <span class="panel-actions">
            <span class="meta-chip chip-gray">{{ inputLines }} 行</span>
            <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!input_data" @click="clearInput">清空</el-button>
          </span>
        </div>
        <el-input
          v-model="input_data"
          type="textarea"
          class="re-textarea mono-input"
          resize="none"
          placeholder="粘贴需要提取的文本"
          @input="onRuleInput">
        </el-input>
      </div>

      <div class="re-panel re-right">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-finished"></i>提取结果</span>
          <span class="panel-actions">
            <span v-if="hasRun" class="meta-chip">
              {{ matchCount }} 条匹配<template v-if="dedupe && matchCount !== resultCount">，去重后 {{ resultCount }} 条</template>
            </span>
            <el-button size="mini" icon="el-icon-document-copy" :disabled="!output_data" @click="copyText(output_data)">复制</el-button>
          </span>
        </div>
        <el-input
          :value="output_data"
          type="textarea"
          class="re-textarea mono-input"
          resize="none"
          :placeholder="hasRun ? '没有匹配到内容' : '填写正则和输入内容后自动提取'"
          readonly>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
  const PRESETS = [
    {
      id: 1,
      name: '身份证',
      tip: '18 位身份证号',
      reg: "([1-6][1-9]|50)\\d{4}(18|19|20)\\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]",
      fmt: ''
    },
    {
      id: 2,
      name: 'IP',
      tip: 'IPv4 地址',
      reg: "((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){3}",
      fmt: ''
    },
    {
      id: 3,
      name: '资产号',
      tip: '形如 XX-XX-123 的资产编号',
      reg: "[a-zA-Z]+-[a-zA-Z]+-[0-9a-zA-Z]+",
      fmt: ''
    },
    {
      id: 4,
      name: 'kf入室',
      tip: '姓名 单位 身份证 手机号，按制表符输出',
      reg: "(\\S+)\\s+(\\S+)\\s+(\\d{18})\\s+(\\d{11})(?:\\s?)",
      fmt: "${1}\\t${2}\\t${3}\\t${4}\\t"
    },
    {
      id: 5,
      name: 'mysql字段',
      tip: '从 mysql 命令行表格输出中提取第一列',
      reg: "\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\n+",
      fmt: "${1}"
    },
  ]

  export default {
    data () {
      return {
        input_data: '',
        output_data: '',
        reg_filter: '',
        reg_format: '',
        presets: PRESETS,
        activePreset: 0,
        flagI: false,
        flagM: false,
        dedupe: false,
        regError: '',
        hasRun: false,
        matchCount: 0,
        resultCount: 0,
        timer: null
      }
    },
    computed: {
      inputLines () {
        return this.input_data ? this.input_data.split('\n').length : 0
      }
    },
    beforeDestroy () {
      clearTimeout(this.timer)
    },
    methods: {
      // 输入防抖，停顿后自动提取
      onRuleInput () {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.func_extract, 300)
      },
      func_extract () {
        clearTimeout(this.timer)
        this.regError = ''
        if (!this.reg_filter || !this.input_data) {
          this.output_data = ''
          this.hasRun = false
          this.matchCount = 0
          this.resultCount = 0
          return
        }

        let reg
        try {
          reg = new RegExp(this.reg_filter, 'g' + (this.flagI ? 'i' : '') + (this.flagM ? 'm' : ''))
        } catch (e) {
          this.regError = e.message
          return
        }
        // 格式里的 \t 按制表符处理
        const fmt = this.reg_format.replace(/\\t/g, '\t')

        const lines = []
        const seen = {}
        let count = 0
        let match
        while ((match = reg.exec(this.input_data)) !== null) {
          // 空匹配时手动前进，避免死循环
          if (match[0] === '') reg.lastIndex++
          count++
          let line
          if (fmt !== '') {
            const m = match
            line = fmt.replace(/\$\{(\d+)\}/g, (all, n) => {
              n = parseInt(n, 10)
              if (n >= m.length) return all
              return m[n] === undefined ? '' : m[n]
            })
          } else {
            line = match[0]
          }
          if (this.dedupe) {
            if (seen[line]) continue
            seen[line] = 1
          }
          lines.push(line)
        }

        this.hasRun = true
        this.matchCount = count
        this.resultCount = lines.length
        this.output_data = lines.length ? lines.join('\n') + '\n' : ''
      },
      change_reg (id) {
        const p = PRESETS.filter(x => x.id === id)[0]
        if (!p) return
        this.activePreset = id
        this.reg_filter = p.reg
        this.reg_format = p.fmt
        this.func_extract()
      },
      clearInput () {
        this.input_data = ''
        this.func_extract()
      },
      copyText (text) {
        if (!text) return
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          this.$message.success('已复制')
        } catch (e) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(ta)
      },
    },
  };
</script>

<style scoped>
.re-page {
  color: #303133;
}
.mono-input /deep/ input,
.mono-input /deep/ textarea {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ textarea {
  font-size: 12px;
  line-height: 1.6;
}
.form-tip {
  font-size: 12px;
  color: #909399;
}

/* 标题栏 */
.re-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.re-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.re-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.re-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 规则区 */
.re-filter {
  margin-bottom: 12px;
  padding: 12px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.preset-row,
.rule-row,
.opt-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.preset-row > *,
.rule-row > *,
.opt-row > * {
  margin: 0 10px 8px 0;
}
.preset-label {
  font-size: 13px;
  color: #606266;
}
.preset-chip {
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
  font-size: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  color: #606266;
  background: #fff;
  cursor: pointer;
  transition: all .15s;
}
.preset-chip:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}
.preset-chip.active {
  color: #fff;
  border-color: #409eff;
  background: #409eff;
}
.rule-reg {
  flex: 3 1 360px;
}
.rule-fmt {
  flex: 2 1 260px;
}
.opt-row .el-checkbox {
  margin-right: 20px;
}
.reg-error {
  margin: 0 0 8px;
  font-size: 12px;
  color: #f56c6c;
}
.reg-error i {
  margin-right: 4px;
}

/* 左右两栏 */
.re-body {
  display: flex;
  height: calc(100vh - 340px);
  min-height: 400px;
}
.re-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.re-left {
  margin-right: 12px;
}
.panel-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
}
.panel-title i {
  margin-right: 6px;
  color: #409eff;
}
.panel-actions {
  display: flex;
  align-items: center;
}
.panel-actions .el-button {
  margin-left: 10px;
}
.meta-chip {
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 10px;
  color: #409eff;
  background: #ecf5ff;
  white-space: nowrap;
}
.chip-gray {
  color: #606266;
  background: #f4f4f5;
}
.re-textarea {
  flex: 1;
  min-height: 0;
}
.re-textarea /deep/ textarea {
  height: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
}
</style>
