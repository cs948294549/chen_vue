<!--文本工具：JSON / 表格互转-->
<template>
  <div class="tj-page">
    <!-- 标题栏 -->
    <div class="tj-header">
      <div class="tj-title">
        <i class="el-icon-sort"></i>JSON / 表格互转
        <span class="tj-subtitle">上传 Excel / CSV 转 JSON；粘贴 JSON 导出为 Excel</span>
      </div>
    </div>

    <div class="tj-body">
      <!-- 表格 → JSON -->
      <div class="tj-panel tj-left">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-upload2"></i>表格 → JSON</span>
          <span class="panel-actions">
            <el-radio-group v-model="outputMode" size="mini">
              <el-radio-button label="pretty">格式化</el-radio-button>
              <el-radio-button label="compact">压缩</el-radio-button>
            </el-radio-group>
            <el-button size="mini" icon="el-icon-document-copy" :disabled="!json_output" @click="copyText(json_output)">复制</el-button>
          </span>
        </div>

        <div class="upload-box">
          <el-upload
            ref="upload"
            action="/"
            drag
            accept=".xlsx,.xls,.xlsm,.xlt,.xlw,.xlc,.xlm,.csv"
            :show-file-list="false"
            :on-change="importExcel"
            :auto-upload="false">
            <i class="el-icon-upload upload-icon"></i>
            <div class="upload-text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="upload-tip">支持 xlsx / xls / csv</div>
          </el-upload>
        </div>

        <div v-if="fileName" class="file-bar">
          <span class="file-name" :title="fileName"><i class="el-icon-document"></i>{{ fileName }}</span>
          <span class="file-meta">
            <el-select
              v-if="sheets.length > 1"
              v-model="sheetIndex"
              size="mini"
              class="sheet-select">
              <el-option
                v-for="(s, idx) in sheets"
                :key="idx"
                :label="s.sheetName + '（' + s.sheet.length + ' 行）'"
                :value="idx"></el-option>
            </el-select>
            <span v-else class="meta-chip chip-gray">{{ currentSheetName }}</span>
            <span class="meta-chip">{{ currentRows.length }} 行</span>
            <span class="meta-chip">{{ countColumns(currentRows) }} 列</span>
          </span>
        </div>

        <el-input
          :value="json_output"
          type="textarea"
          class="tj-textarea mono-input"
          resize="none"
          placeholder="上传表格后在此显示 JSON"
          readonly>
        </el-input>
      </div>

      <!-- JSON → 表格 -->
      <div class="tj-panel tj-right">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-download"></i>JSON → 表格</span>
          <span class="panel-actions">
            <el-button type="text" size="mini" icon="el-icon-magic-stick" :disabled="!inputState.ok" @click="formatInput(2)">格式化</el-button>
            <el-button type="text" size="mini" icon="el-icon-minus" :disabled="!inputState.ok" @click="formatInput(0)">压缩</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!json_input" @click="clearInput">清空</el-button>
          </span>
        </div>

        <el-input
          v-model="json_input"
          type="textarea"
          class="tj-textarea mono-input"
          resize="none"
          :placeholder="placeholder"
          @input="onInput">
        </el-input>

        <div class="panel-foot">
          <span v-if="!json_input" key="idle" class="state state-idle">
            <i class="el-icon-info"></i>等待输入，支持对象数组或单个对象
          </span>
          <span v-else-if="inputState.ok" key="ok" class="state state-ok">
            <i class="el-icon-circle-check"></i>JSON 有效 · {{ inputState.rows }} 行 · {{ inputState.cols }} 列
          </span>
          <span v-else key="err" class="state state-err" :title="inputState.msg">
            <i class="el-icon-circle-close"></i>{{ inputState.msg }}
          </span>
          <span class="foot-actions">
            <el-input v-model="fileBase" size="mini" class="name-input" placeholder="文件名">
              <template slot="append">.xlsx</template>
            </el-input>
            <el-button size="mini" type="primary" icon="el-icon-download" :disabled="!inputState.ok" @click="download_table">下载表格</el-button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import XLSX from 'xlsx'

  const EXCEL_TYPES = ['xlsx', 'xlsm', 'xlc', 'xlm', 'xls', 'xlt', 'xlw', 'csv']

  // 把 JSON 文本解析成行数组：数组原样返回，单个对象包成一行
  function parseRows (text) {
    const data = JSON.parse(text)
    const rows = data instanceof Array ? data : [data]
    if (!rows.length) {
      throw new Error('数组为空，没有可导出的数据')
    }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (r === null || typeof r !== 'object' || r instanceof Array) {
        throw new Error('第 ' + (i + 1) + ' 个元素不是对象，无法转成表格行')
      }
    }
    return rows
  }

  export default {
    data () {
      return {
        // 表格 → JSON
        fileName: '',
        sheets: [],
        sheetIndex: 0,
        outputMode: 'pretty',

        // JSON → 表格
        json_input: '',
        inputState: { ok: false, msg: '', rows: 0, cols: 0 },
        fileBase: 'table',
        timer: null,
        placeholder: '粘贴 JSON，例如：\n\n[\n  {"设备名": "CORE-01", "管理IP": "10.0.0.1"},\n  {"设备名": "CORE-02", "管理IP": "10.0.0.2"}\n]'
      }
    },
    computed: {
      currentSheet () {
        return this.sheets[this.sheetIndex] || null
      },
      currentSheetName () {
        return this.currentSheet ? this.currentSheet.sheetName : ''
      },
      currentRows () {
        return this.currentSheet ? this.currentSheet.sheet : []
      },
      json_output () {
        if (!this.currentSheet) return ''
        return this.outputMode === 'pretty'
          ? JSON.stringify(this.currentRows, null, 2)
          : JSON.stringify(this.currentRows)
      }
    },
    beforeDestroy () {
      clearTimeout(this.timer)
    },
    methods: {
      countColumns (rows) {
        const keys = {}
        rows.forEach(r => {
          Object.keys(r).forEach(k => { keys[k] = 1 })
        })
        return Object.keys(keys).length
      },

      // ---------- JSON → 表格 ----------
      onInput () {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.validateInput, 300)
      },
      validateInput () {
        if (!this.json_input.trim()) {
          this.inputState = { ok: false, msg: '', rows: 0, cols: 0 }
          return
        }
        try {
          const rows = parseRows(this.json_input)
          this.inputState = { ok: true, msg: '', rows: rows.length, cols: this.countColumns(rows) }
        } catch (e) {
          this.inputState = { ok: false, msg: 'JSON 格式不正确：' + e.message, rows: 0, cols: 0 }
        }
      },
      formatInput (indent) {
        try {
          const data = JSON.parse(this.json_input)
          this.json_input = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data)
        } catch (e) {
          this.$message.error('JSON 格式不正确！')
        }
      },
      clearInput () {
        this.json_input = ''
        this.validateInput()
      },
      download_table () {
        let rows
        try {
          rows = parseRows(this.json_input)
        } catch (e) {
          console.log(e)
          this.$message({
            showClose: true,
            message: 'JSON 格式不正确！' + e.message,
            type: 'error'
          })
          return
        }
        this.downloadExcl(rows)
      },

      //通用下载方法：列取所有行字段的并集，字段不全的行对应单元格留空
      downloadExcl: function (json, type) {
        let tmpDown;
        let getjson = json;
        let keyMap = []; //获取keys
        let seen = {};
        getjson.forEach(row => {
          for (let k in row) {
            if (!seen[k]) {
              seen[k] = 1;
              keyMap.push(k);
            }
          }
        });
        let header = {};
        keyMap.forEach(k => { header[k] = k });
        getjson.unshift(header);
        let tmpdata = [];//用来保存转换好的json
        getjson.map((v, i) => keyMap.map((k, j) => Object.assign({}, {
          v: v[k],
          position: (j > 25 ? this.getCharCol(j) : String.fromCharCode(65 + j)) + (i + 1)
        }))).reduce((prev, next) => prev.concat(next)).forEach((v, i) => {
          if (v.v === undefined || v.v === null) {
            tmpdata[v.position] = { v: '' }
          } else if (typeof (v.v) == "object") {
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
        aTag.download = (this.fileBase.trim() || 'table') + '.xlsx'
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

      // ---------- 表格 → JSON ----------
      importExcel (file) {
        const parts = file.name.split('.')
        const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
        if (EXCEL_TYPES.indexOf(ext) === -1) {
          this.$message.error('格式错误！仅支持 xlsx / xls / csv 等表格文件')
          return
        }
        this.file2Xce(file).then(result => {
          if (!result.length) {
            this.$message.warning('文件中没有工作表')
            return
          }
          this.fileName = file.name
          this.sheets = result
          this.sheetIndex = 0
          if (!result[0].sheet.length) {
            this.$message.warning('第一个工作表没有数据')
          }
        }).catch(e => {
          console.log(e)
          this.$message.error('文件解析失败，请确认文件内容是否正确')
        })
      },
      file2Xce (file) {
        return new Promise(function (resolve, reject) {
          const reader = new FileReader()
          reader.onload = function (e) {
            try {
              const wb = XLSX.read(e.target.result, { type: 'binary' })
              const result = wb.SheetNames.map(sheetName => ({
                sheetName: sheetName,
                sheet: XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
              }))
              resolve(result)
            } catch (err) {
              reject(err)
            }
          }
          reader.onerror = reject
          reader.readAsBinaryString(file.raw)
        })
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
.tj-page {
  color: #303133;
}
.mono-input /deep/ textarea {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}

/* 标题栏 */
.tj-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.tj-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.tj-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.tj-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 左右两栏 */
.tj-body {
  display: flex;
  height: calc(100vh - 230px);
  min-height: 480px;
}
.tj-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.tj-left {
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
  margin-left: 8px;
}
.panel-actions .el-button + .el-button {
  margin-left: 8px;
}

/* 上传区 */
.upload-box {
  flex-shrink: 0;
  padding: 12px 12px 0;
}
.upload-box /deep/ .el-upload {
  display: block;
}
.upload-box /deep/ .el-upload-dragger {
  width: 100%;
  height: auto;
  padding: 14px 0 12px;
  background: #fafbfc;
}
.upload-box /deep/ .el-upload-dragger:hover,
.upload-box /deep/ .el-upload-dragger.is-dragover {
  background: #ecf5ff;
}
.upload-icon {
  font-size: 34px;
  line-height: 1;
  color: #409eff;
}
.upload-text {
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
}
.upload-text em {
  font-style: normal;
  color: #409eff;
}
.upload-tip {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.file-bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  margin: 10px 12px 0;
  padding: 6px 10px;
  border-radius: 4px;
  background: #f5f7fa;
}
.file-name {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-name i {
  margin-right: 6px;
  color: #67c23a;
}
.file-meta {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: 10px;
}
.sheet-select {
  width: 160px;
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
  white-space: nowrap;
}
.chip-gray {
  color: #606266;
  background: #e9e9eb;
}

.tj-textarea {
  flex: 1;
  min-height: 0;
  margin-top: 10px;
  border-top: 1px solid #ebeef5;
}
.tj-right .tj-textarea {
  margin-top: 0;
  border-top: none;
}
.tj-textarea /deep/ textarea {
  height: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
}

.panel-foot {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
}
.state {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.state i {
  margin-right: 4px;
}
.state-idle {
  color: #909399;
}
.state-ok {
  color: #67c23a;
}
.state-err {
  color: #f56c6c;
}
.foot-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: 10px;
}
.name-input {
  width: 160px;
  margin-right: 8px;
}
</style>
