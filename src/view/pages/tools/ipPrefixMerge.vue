<!--网工工具：IP 前缀合并-->
<template>
  <div class="pm-page">
    <!-- 标题栏 -->
    <div class="pm-header">
      <div class="pm-title">
        <i class="el-icon-files"></i>IP 前缀合并
        <span class="pm-subtitle">每行一个前缀，自动去重、合并相邻网段并去掉被包含的网段</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-magic-stick" @click="fillExample">示例</el-button>
        <el-button size="small" type="primary" icon="el-icon-refresh" :loading="loading" :disabled="!validList.length" @click="merge_prefix">合并</el-button>
      </div>
    </div>

    <div class="pm-body">
      <!-- 输入 -->
      <div class="pm-panel pm-input">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-edit-outline"></i>前缀列表</span>
          <span class="panel-actions">
            <span class="meta-chip chip-gray">{{ validList.length }} 条</span>
            <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!input_src" @click="clearAll">清空</el-button>
          </span>
        </div>
        <el-input
          v-model="input_src"
          type="textarea"
          class="pm-textarea mono-input"
          resize="none"
          :placeholder="placeholder"
          @input="onInput">
        </el-input>
        <div class="panel-foot">
          <span v-if="dupCount">重复 {{ dupCount }} 条</span>
          <span v-else>每行 a.b.c.d/n</span>
          <el-popover v-if="errors.length" placement="top-start" width="340" trigger="hover">
            <div class="err-list">
              <div v-for="(e, idx) in errors" :key="idx" class="err-item">
                <span class="err-line">第 {{ e.line }} 行</span>
                <span class="mono">{{ e.text }}</span>
                <span class="err-msg">{{ e.msg }}</span>
              </div>
            </div>
            <span slot="reference" class="foot-error"><i class="el-icon-warning-outline"></i>{{ errors.length }} 行无效，已忽略</span>
          </el-popover>
        </div>
      </div>

      <!-- 合并结果 -->
      <div class="pm-panel pm-result">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-finished"></i>合并结果</span>
          <span class="panel-actions">
            <span v-if="input_target" class="meta-chip">{{ resultList.length }} 条</span>
            <el-button size="mini" icon="el-icon-document-copy" :disabled="!input_target" @click="copyText(input_target)">复制</el-button>
          </span>
        </div>
        <el-input
          :value="input_target"
          type="textarea"
          class="pm-textarea mono-input"
          resize="none"
          placeholder="输入前缀后自动合并"
          readonly>
        </el-input>
        <div class="panel-foot">
          <span v-if="input_target" key="reduce" :class="reduceCount > 0 ? 'foot-ok' : ''">
            {{ uniqueCount }} → {{ resultList.length }}，减少 {{ reduceCount }} 条<template v-if="uniqueCount">（{{ reducePercent }}%）</template>
          </span>
          <span v-else key="idle">-</span>
        </div>
      </div>

      <!-- 前后对比 -->
      <div class="pm-panel pm-compare" v-loading="loading">
        <div class="panel-head">
          <el-radio-group v-model="view" size="mini">
            <el-radio-button label="detail"><i class="el-icon-s-grid"></i> 合并明细</el-radio-button>
            <el-radio-button label="diff"><i class="el-icon-document"></i> 文本对比</el-radio-button>
          </el-radio-group>
          <el-checkbox v-if="view === 'detail'" v-model="onlyChanged" class="only-changed">只看有变化</el-checkbox>
        </div>

        <div v-if="view === 'detail'" key="detail" class="table-wrap">
          <el-table
            :data="detailRows"
            size="small"
            stripe
            height="100%"
            class="pm-table">
            <template slot="empty">
              <el-empty :image-size="80" :description="detailEmptyText"></el-empty>
            </template>
            <el-table-column type="index" label="#" width="50" align="center"></el-table-column>
            <el-table-column prop="prefix" label="合并后前缀" width="170">
              <template slot-scope="scope">
                <span class="mono strong">{{ scope.row.prefix }}</span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.prefix)"></i>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <span :class="['state-tag', 'state-' + scope.row.state]">{{ scope.row.stateText }}</span>
              </template>
            </el-table-column>
            <el-table-column label="来源前缀" min-width="240">
              <template slot-scope="scope">
                <span v-for="(s, idx) in scope.row.sources" :key="idx" class="src-chip mono">{{ s }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else key="diff" class="diff-wrap">
          <div v-if="diff_result" key="html" class="diff-html-wrapper" v-html="diff_result"></div>
          <el-empty v-else key="empty" :image-size="80" description="合并完成后显示前后文本对比"></el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import tools_api from "@/api/mapis/tools_interface.js"

  const EXAMPLE = [
    '10.0.0.0/24',
    '10.0.1.0/24',
    '10.0.2.0/24',
    '10.0.3.0/24',
    '10.0.2.128/25',
    '192.168.10.0/24',
    '192.168.11.0/24',
    '172.16.0.0/16',
    '172.16.8.0/22',
    '100.64.1.1',
  ].join('\n')

  const PREFIX_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\s*\/\s*(\d{1,2}))?$/

  function intToIp (n) {
    return (n >>> 24) + '.' + ((n >>> 16) & 0xFF) + '.' + ((n >>> 8) & 0xFF) + '.' + (n & 0xFF)
  }

  // 解析一行前缀，返回 { text, start, end } 或 { error }；不写掩码按 /32 处理
  function parsePrefix (line) {
    const m = PREFIX_RE.exec(line)
    if (!m) return { error: '格式应为 a.b.c.d/n' }
    for (let i = 1; i <= 4; i++) {
      if (parseInt(m[i], 10) > 255) return { error: 'IP 地址不合法' }
    }
    const len = m[5] === undefined ? 32 : parseInt(m[5], 10)
    if (len < 1 || len > 32) return { error: '前缀长度需在 1-32' }
    const ip = ((parseInt(m[1], 10) << 24) | (parseInt(m[2], 10) << 16) | (parseInt(m[3], 10) << 8) | parseInt(m[4], 10)) >>> 0
    const mask = (0xFFFFFFFF << (32 - len)) >>> 0
    const start = (ip & mask) >>> 0
    return {
      text: intToIp(ip) + '/' + len,
      start: start,
      end: (start | (~mask >>> 0)) >>> 0
    }
  }

  export default {
    name: 'tool_for_diff1',
    data () {
      return {
        input_src: '',
        input_target: '',
        diff_result: '',
        loading: false,
        view: 'detail',
        onlyChanged: false,
        timer: null,
        seq: 0,
        placeholder: '每行一个前缀，例如：\n\n10.0.0.0/24\n10.0.1.0/24\n10.0.2.0/23\n192.168.1.0/24'
      }
    },
    computed: {
      // 解析输入：有效前缀（保持顺序）、无效行
      parsed () {
        const valid = []
        const errors = []
        this.input_src.split('\n').forEach((line, idx) => {
          const s = line.trim()
          if (!s) return
          const p = parsePrefix(s)
          if (p.error) {
            errors.push({ line: idx + 1, text: s, msg: p.error })
          } else {
            valid.push(p)
          }
        })
        return { valid: valid, errors: errors }
      },
      validList () {
        return this.parsed.valid
      },
      errors () {
        return this.parsed.errors
      },
      uniqueTexts () {
        const seen = {}
        const list = []
        this.validList.forEach(p => {
          if (seen[p.text]) return
          seen[p.text] = 1
          list.push(p.text)
        })
        return list
      },
      uniqueCount () {
        return this.uniqueTexts.length
      },
      dupCount () {
        return this.validList.length - this.uniqueCount
      },
      resultList () {
        return this.input_target ? this.input_target.split('\n').filter(s => s) : []
      },
      reduceCount () {
        return this.uniqueCount - this.resultList.length
      },
      reducePercent () {
        return this.uniqueCount ? Math.round(this.reduceCount * 1000 / this.uniqueCount) / 10 : 0
      },
      // 每个合并结果包含了哪些输入前缀
      allDetailRows () {
        const inputs = []
        const seen = {}
        this.validList.forEach(p => {
          if (seen[p.text]) return
          seen[p.text] = 1
          inputs.push(p)
        })
        return this.resultList.map(prefix => {
          const r = parsePrefix(prefix)
          if (r.error) {
            return { prefix: prefix, sources: [], state: 'same', stateText: '-' }
          }
          const sources = inputs.filter(p => p.start >= r.start && p.end <= r.end).map(p => p.text)
          let state, stateText
          if (sources.length === 1 && sources[0] === prefix) {
            state = 'same'
            stateText = '未变化'
          } else if (sources.length === 1) {
            state = 'norm'
            stateText = '已规整'
          } else {
            state = 'merge'
            stateText = '合并 ' + sources.length + ' 条'
          }
          return { prefix: prefix, sources: sources, state: state, stateText: stateText }
        })
      },
      detailRows () {
        if (!this.onlyChanged) return this.allDetailRows
        return this.allDetailRows.filter(r => r.state !== 'same')
      },
      detailEmptyText () {
        if (this.allDetailRows.length && this.onlyChanged) return '所有前缀都没有变化'
        return '在左侧输入前缀后自动合并'
      }
    },
    beforeDestroy () {
      clearTimeout(this.timer)
    },
    methods: {
      // 输入防抖，停顿后自动合并
      onInput () {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.merge_prefix, 600)
      },
      merge_prefix () {
        clearTimeout(this.timer)
        const net_list = this.uniqueTexts
        if (!net_list.length) {
          this.input_target = ''
          this.diff_result = ''
          return
        }
        // 只采用最后一次请求的结果，避免快速输入时旧结果覆盖新结果
        const seq = ++this.seq
        this.loading = true
        tools_api.mergeNetworkList({ "net_list": net_list }, {}).then((response) => {
          if (seq !== this.seq) return
          if (response.data.code == 0) {
            this.input_target = (response.data.data || []).join("\n")
            if (!this.input_target) {
              this.$message.error('合并结果为空，请检查输入的前缀')
            }
            this.getDiffRes(net_list.join("\n"), seq)
          } else {
            this.$message.error('处理失败：' + (response.data.message || response.data.msg || ''))
          }
        }).catch((err) => {
          console.log("错误信息", err)
          if (seq === this.seq) this.$message.error('提交失败，请重试')
        }).finally(() => {
          if (seq === this.seq) this.loading = false
        })
      },
      getDiffRes (src, seq) {
        tools_api.checkDiffText({ "src": src, "target": this.input_target }, {}).then((response) => {
          if (seq !== this.seq) return
          if (response.data.code == 0) {
            this.diff_result = this.extractDiffTable(response.data.data || '')
          } else {
            this.diff_result = ''
          }
        }).catch((err) => {
          console.log("错误信息", err)
          if (seq === this.seq) this.diff_result = ''
        })
      },
      // 后端返回完整 HTML 文档，只取对比表格，去掉自带的全局样式和图例
      extractDiffTable (html) {
        const m = html.match(/<table class="diff"[\s\S]*?<\/table>/)
        return m ? m[0] : html
      },
      fillExample () {
        this.input_src = EXAMPLE
        this.merge_prefix()
      },
      clearAll () {
        this.input_src = ''
        this.merge_prefix()
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
  }
</script>

<style scoped>
.pm-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ textarea {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.strong {
  font-weight: 600;
}

/* 标题栏 */
.pm-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.pm-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.pm-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.pm-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 三栏 */
.pm-body {
  display: flex;
  height: calc(100vh - 230px);
  min-height: 460px;
}
.pm-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.pm-input,
.pm-result {
  flex: 0 0 240px;
  margin-right: 12px;
}
.pm-compare {
  flex: 1;
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
  margin-left: 8px;
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
.pm-textarea {
  flex: 1;
  min-height: 0;
}
.pm-textarea /deep/ textarea {
  height: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
}
.panel-foot {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: 4px 12px;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
  white-space: nowrap;
}
.foot-ok {
  color: #67c23a;
}
.foot-error {
  color: #e6a23c;
  cursor: default;
}
.foot-error i {
  margin-right: 4px;
}
.err-list {
  max-height: 240px;
  overflow: auto;
}
.err-item {
  display: flex;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}
.err-line {
  flex-shrink: 0;
  width: 60px;
  color: #909399;
}
.err-item .mono {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.err-msg {
  flex-shrink: 0;
  margin-left: 8px;
  color: #f56c6c;
}

/* 合并明细 */
.only-changed {
  margin-left: 12px;
}
.table-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}
.pm-table {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.pm-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.pm-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.state-tag {
  display: inline-block;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
  white-space: nowrap;
}
.state-same {
  color: #909399;
  background: #f4f4f5;
}
.state-norm {
  color: #e6a23c;
  background: #fdf6ec;
}
.state-merge {
  color: #67c23a;
  background: #f0f9eb;
}
.src-chip {
  display: inline-block;
  margin: 2px 6px 2px 0;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 3px;
  color: #606266;
  background: #f4f4f5;
}

/* 文本对比：美化后端返回的 diff 表格 */
.diff-wrap {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}
.diff-wrap > .el-empty {
  height: 100%;
}
.diff-html-wrapper /deep/ table.diff {
  width: 100%;
  border-collapse: collapse;
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.diff-html-wrapper /deep/ table.diff th {
  padding: 4px 8px;
  font-weight: 600;
  color: #606266;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
}
.diff-html-wrapper /deep/ table.diff td {
  padding: 2px 8px;
  border: 1px solid #ebeef5;
  vertical-align: top;
  word-break: break-all;
}
.diff-html-wrapper /deep/ .diff_header {
  width: 40px;
  text-align: right;
  color: #909399;
  background: #fafbfc;
  user-select: none;
}
.diff-html-wrapper /deep/ .diff_next {
  width: 24px;
  text-align: center;
  background: #fafbfc;
}
.diff-html-wrapper /deep/ .diff_next a {
  color: #409eff;
  text-decoration: none;
}
.diff-html-wrapper /deep/ .diff_add {
  color: #3a8a1e;
  background: #f0f9eb;
}
.diff-html-wrapper /deep/ .diff_sub {
  color: #d63c3c;
  background: #fef0f0;
  text-decoration: line-through;
}
.diff-html-wrapper /deep/ .diff_chg {
  color: #b8860b;
  background: #fdf6ec;
}
</style>
