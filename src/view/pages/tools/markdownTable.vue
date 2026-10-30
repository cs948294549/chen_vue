<!--文本工具：Markdown 表格转 JSON / Excel-->
<template>
  <div class="mt-page">
    <!-- 标题栏 -->
    <div class="mt-header">
      <div class="mt-title">
        <i class="el-icon-s-grid"></i>Markdown 表格转换
        <span class="mt-subtitle">粘贴 Markdown 表格，实时转换为 JSON，可预览并下载 Excel</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-document-copy" :disabled="!tables.length" @click="copyJson">复制 JSON</el-button>
        <el-button size="small" type="primary" icon="el-icon-download" :disabled="!tables.length" @click="download_table">下载 Excel</el-button>
      </div>
    </div>

    <div class="mt-body">
      <!-- 输入 -->
      <div class="mt-panel mt-input">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-edit-outline"></i>Markdown 表格</span>
          <span class="panel-actions">
            <el-button type="text" size="mini" icon="el-icon-magic-stick" @click="fillExample">示例</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!input_src" @click="clearAll">清空</el-button>
          </span>
        </div>
        <el-input
          v-model="input_src"
          type="textarea"
          class="mt-textarea mono-input"
          resize="none"
          :placeholder="placeholder"
          @input="onInput">
        </el-input>
        <div class="panel-foot">
          <span>{{ lineCount }} 行</span>
          <span v-if="errorMsg" class="foot-error"><i class="el-icon-warning-outline"></i>{{ errorMsg }}</span>
        </div>
      </div>

      <!-- 输出 -->
      <div class="mt-panel mt-output">
        <div class="panel-head">
          <el-radio-group v-model="view" size="mini">
            <el-radio-button label="table"><i class="el-icon-s-grid"></i> 表格预览</el-radio-button>
            <el-radio-button label="json"><i class="el-icon-tickets"></i> JSON</el-radio-button>
          </el-radio-group>
          <span v-if="tables.length" class="result-meta">
            <span class="meta-chip">{{ tables.length }} 行</span>
            <span class="meta-chip">{{ headers.length }} 列</span>
          </span>
        </div>

        <div v-if="!tables.length" key="empty" class="panel-empty">
          <el-empty :image-size="90" description="在左侧粘贴 Markdown 表格后自动转换"></el-empty>
        </div>
        <div v-else-if="view === 'table'" key="table" class="table-wrap">
        <el-table
          :data="tables"
          size="small"
          stripe
          border
          height="100%"
          class="mt-table">
          <el-table-column type="index" label="#" width="50" align="center" fixed></el-table-column>
          <el-table-column
            v-for="(h, idx) in headers"
            :key="idx + '-' + h"
            :label="h"
            min-width="120"
            show-overflow-tooltip>
            <template slot-scope="scope">
              <span v-if="scope.row[h] !== ''">{{ scope.row[h] }}</span>
              <span v-else class="empty-text">-</span>
            </template>
          </el-table-column>
        </el-table>
        </div>
        <el-input
          v-else
          key="json"
          v-model="output_table"
          type="textarea"
          class="mt-textarea mono-input"
          resize="none"
          readonly>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
  import XLSX from 'xlsx'

  const EXAMPLE = [
    '| 设备名 | 管理IP | 型号 | 位置 |',
    '| --- | --- | :---: | --- |',
    '| CORE-01 | 10.0.0.1 | S12508 | A 机房 |',
    '| CORE-02 | 10.0.0.2 | S12508 | B 机房 |',
    '| TOR-101 | 10.0.1.101 | S6850 | A 机房 |',
  ].join('\n')

  // 分隔行：| --- | :---: | ---: |
  const SEP_RE = /^\s*\|?(\s*:?-{3,}:?\s*\|)*\s*:?-{3,}:?\s*\|?\s*$/

  // 按 | 拆分单元格，去掉首尾竖线和单元格两侧空白
  function splitRow (line) {
    let s = line.trim()
    if (s.charAt(0) === '|') s = s.slice(1)
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1)
    return s.split('|').map(c => c.trim())
  }

  export default {
    name: 'tool_for_diff1',
    data () {
      return {
        input_src: '',
        output_table: '',
        headers: [],
        tables: [],
        errorMsg: '',
        view: 'table',
        timer: null,
        placeholder: '粘贴 Markdown 表格，例如：\n\n| 设备名 | 管理IP |\n| --- | --- |\n| CORE-01 | 10.0.0.1 |'
      }
    },
    computed: {
      lineCount () {
        return this.input_src ? this.input_src.split('\n').length : 0
      }
    },
    beforeDestroy () {
      clearTimeout(this.timer)
    },
    methods: {
      // 输入防抖，停顿后自动转换
      onInput () {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.submit_table, 300)
      },
      submit_table () {
        const src = this.input_src.replace(/^\s*|\s*$/g, '')
        let rows = src.split('\n')
        // 兼容转义后的单行文本（字面量 \n）
        if (rows.length <= 1) {
          rows = src.split('\\n')
        }

        let headers = []
        const tables = []
        rows.forEach(line => {
          if (line.replace(/^\s*|\s*$/g, '') === '' || SEP_RE.test(line)) return
          const cells = splitRow(line)
          if (!headers.length) {
            // 表头去重，空表头补列名，避免字段互相覆盖
            const seen = {}
            headers = cells.map((h, i) => {
              let key = h || ('列' + (i + 1))
              if (seen[key]) {
                seen[key]++
                key = key + '_' + seen[key]
              } else {
                seen[key] = 1
              }
              return key
            })
            return
          }
          const obj = {}
          headers.forEach((key, i) => {
            obj[key] = cells[i] === undefined ? '' : cells[i]
          })
          tables.push(obj)
        })

        this.headers = headers
        this.tables = tables
        this.output_table = tables.length ? JSON.stringify(tables, null, 2) : ''
        if (src && !headers.length) {
          this.errorMsg = '未识别到表头'
        } else if (src && !tables.length) {
          this.errorMsg = '只有表头，没有数据行'
        } else {
          this.errorMsg = ''
        }
      },
      fillExample () {
        this.input_src = EXAMPLE
        this.submit_table()
      },
      clearAll () {
        this.input_src = ''
        this.submit_table()
      },
      copyJson () {
        if (!this.output_table) return
        const ta = document.createElement('textarea')
        ta.value = this.output_table
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          this.$message.success('JSON 已复制')
        } catch (e) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(ta)
      },
      download_table () {
        if (!this.tables.length) {
          this.$message.error('空数据！')
          return
        }
        // 复制一份，downloadExcl 里的 unshift 不会污染预览数据
        this.downloadExcl(this.tables.map(r => Object.assign({}, r)))
      },

      //通用下载方法
      downloadExcl: function (json, type) {
        let tmpDown;
        let getjson = json;
        let keys = getjson[0];
        getjson.unshift({});
        let keyMap = []; //获取keys
        for (let k in keys) {
          keyMap.push(k);
          getjson[0][k] = k;
        }
        let tmpdata = [];//用来保存转换好的json
        getjson.map((v, i) => keyMap.map((k, j) => Object.assign({}, {
          v: v[k],
          position: (j > 25 ? this.getCharCol(j) : String.fromCharCode(65 + j)) + (i + 1)
        }))).reduce((prev, next) => prev.concat(next)).forEach((v, i) => {
          if (typeof (v.v) == "object") {
            tmpdata[v.position] = { v: JSON.stringify(v.v) }
          } else {
            tmpdata[v.position] = { v: v.v }
          }
        });
        let outputPos = Object.keys(tmpdata); //设置区域,比如表格从A1到D10
        let tmpWB = {
          SheetNames: ['mySheet'], //保存的表标题
          Sheets: {
            'mySheet': Object.assign({},
              tmpdata, //内容
              {
                '!ref': outputPos[0] + ':' + outputPos[outputPos.length - 1] //设置填充区域
              })
          }
        };

        tmpDown = new Blob([this.s2ab(XLSX.write(tmpWB,
          { bookType: (type == undefined ? 'xlsx' : type), bookSST: false, type: 'binary' }//这里的数据是用来定义导出的格式类型
        ))], { type: "" }); //创建二进制对象写入转换好的字节流

        let aTag = document.createElement('a')
        aTag.download = "表格.xlsx"
        aTag.href = URL.createObjectURL(tmpDown)
        aTag.click()
        URL.revokeObjectURL(aTag.href)
      },
      s2ab: function (s) {
        let buf = new ArrayBuffer(s.length);
        let view = new Uint8Array(buf);
        for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      },
      getCharCol: function (n) {
        let s = '',
          m = 0
        while (n > 0) {
          m = n % 26 + 1
          s = String.fromCharCode(m + 64) + s
          n = (n - m) / 26
        }
        return s
      },
    },
  }
</script>

<style scoped>
.mt-page {
  color: #303133;
}
.mono-input /deep/ textarea {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.empty-text {
  color: #c0c4cc;
}

/* 标题栏 */
.mt-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.mt-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.mt-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.mt-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 左右两栏 */
.mt-body {
  display: flex;
  height: calc(100vh - 230px);
  min-height: 460px;
}
.mt-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.mt-input {
  flex: 0 0 38%;
  max-width: 520px;
  margin-right: 12px;
}
.mt-output {
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
}
.panel-title i {
  margin-right: 6px;
  color: #409eff;
}
.panel-actions .el-button + .el-button {
  margin-left: 8px;
}
.result-meta {
  display: flex;
}
.meta-chip {
  margin-left: 6px;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 10px;
  color: #409eff;
  background: #ecf5ff;
}
.mt-textarea {
  flex: 1;
  min-height: 0;
}
.mt-textarea /deep/ textarea {
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
}
.foot-error {
  color: #e6a23c;
}
.foot-error i {
  margin-right: 4px;
}
.panel-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}
/* 表格撑满剩余高度，超出部分在表格内部滚动 */
.table-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}
.mt-table {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.mt-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
</style>
