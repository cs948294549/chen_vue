<!--可视化工具：词云-->
<template>
  <div class="wc-page">
    <!-- 标题栏 -->
    <div class="wc-header">
      <div class="wc-title">
        <i class="el-icon-cloudy"></i>词云
        <span class="wc-subtitle">填写或上传 text / weight 数据，weight 即字号，越大越醒目</span>
      </div>
      <div class="wc-actions">
        <el-button size="small" icon="el-icon-download" @click="download_table">下载模板</el-button>
        <el-upload
          ref="upload"
          action="/"
          class="inline-upload"
          accept=".xlsx,.xls,.xlsm,.xlt,.xlw,.xlc,.xlm,.csv"
          :show-file-list="false"
          :on-change="importExcel"
          :auto-upload="false">
          <el-button slot="trigger" size="small" icon="el-icon-upload2">上传表格</el-button>
        </el-upload>
        <el-button size="small" type="primary" icon="el-icon-refresh" @click="genWordCloud(true)">生成词云</el-button>
      </div>
    </div>

    <div class="wc-body">
      <!-- 词云预览 -->
      <div class="wc-panel wc-preview">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-picture-outline"></i>词云预览</span>
          <span class="panel-actions">
            <el-checkbox v-model="autoScale" @change="genWordCloud(false)">自动缩放字号</el-checkbox>
            <el-button size="mini" icon="el-icon-refresh-right" :disabled="!wordData.length" @click="relayout">重新排布</el-button>
          </span>
        </div>
        <div ref="cloudWrap" class="cloud-wrap">
          <WordCloud
            ref="cloud"
            :words="wordData"
            :width="cloudWidth"
            :height="cloudHeight"
            :font-size-range="[15, 73]"
            :color-list="customColorList"
            @word-click="handleWordClick"
          />
        </div>
        <div class="panel-foot">
          <span v-if="activeWord" key="word" class="active-word">
            <i class="el-icon-aim"></i>
            <span class="strong">{{ activeWord.text }}</span>
            <span class="meta-chip chip-gray">weight {{ activeWord.weight }}</span>
            <span v-if="activeWord.desc" class="word-desc">{{ activeWord.desc }}</span>
          </span>
          <span v-else key="tip" class="state-idle">
            <i class="el-icon-info"></i>点击词语查看详情；「重新排布」可换一种布局和配色
          </span>
        </div>
      </div>

      <!-- 数据 -->
      <div class="wc-panel wc-data">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-edit-outline"></i>词语数据</span>
          <span class="panel-actions">
            <el-button type="text" size="mini" icon="el-icon-refresh-left" @click="resetData">初始化数据</el-button>
            <el-button type="text" size="mini" icon="el-icon-magic-stick" :disabled="!parsedData.ok || !input_data.trim()" @click="formatInput">格式化</el-button>
          </span>
        </div>
        <el-input
          v-model="input_data"
          type="textarea"
          class="wc-textarea mono-input"
          resize="none"
          :placeholder="placeholder"
          @input="onInput">
        </el-input>
        <div class="panel-foot">
          <span v-if="!appliedText.trim()" key="idle" class="state-idle">
            <i class="el-icon-info"></i>点击「初始化数据」填入示例
          </span>
          <span v-else-if="!parsedData.ok" key="err" class="state-err" :title="parsedData.err">
            <i class="el-icon-circle-close"></i>{{ parsedData.err }}
          </span>
          <span v-else key="ok" class="foot-row">
            <span class="state-ok"><i class="el-icon-circle-check"></i>{{ parsedData.words.length }} 个词</span>
            <el-popover v-if="parsedData.invalid.length" placement="top-end" width="300" trigger="hover">
              <div class="err-list">
                <div v-for="(e, idx) in parsedData.invalid" :key="idx" class="err-item">
                  <span class="err-line">第 {{ e.index }} 项</span>
                  <span class="err-msg">{{ e.msg }}</span>
                </div>
              </div>
              <span slot="reference" class="foot-warn"><i class="el-icon-warning-outline"></i>{{ parsedData.invalid.length }} 项无效，已跳过</span>
            </el-popover>
            <el-tooltip v-else-if="!autoScale && outOfRange" placement="top" content="weight 直接作为字号，过小不显示、过大可能放不下，可勾选「自动缩放字号」">
              <span class="foot-warn"><i class="el-icon-warning-outline"></i>{{ outOfRange }} 个 weight 不在 16~72</span>
            </el-tooltip>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 引入词云组件
import WordCloud from '@/components/word_cloud/WordCloud.vue';
import XLSX from 'xlsx'

const SIZE_MIN = 16
const SIZE_MAX = 72

const TEMPLATE = [
  { text: 'Vue 2', weight: 20, desc: '前端框架' },
  { text: 'WordCloud', weight: 72, desc: '词云可视化库' },
  { text: 'npm', weight: 70, desc: '包管理工具' },
  { text: '前端开发', weight: 68, desc: '技术领域' },
  { text: '组件封装', weight: 65, desc: '开发技巧' },
  { text: '动态更新', weight: 60, desc: '核心功能' },
  { text: '中文适配', weight: 58, desc: '支持中文显示' },
  { text: '交互事件', weight: 55, desc: '点击/悬浮' },
  { text: '响应式', weight: 52, desc: '适配不同屏幕' },
  { text: '样式自定义', weight: 48, desc: '颜色/字体/间距' },
  { text: '性能优化', weight: 45, desc: '渲染效率' },
  { text: '开箱即用', weight: 42, desc: '快速集成' }
]

const EXCEL_TYPES = ['xlsx', 'xlsm', 'xlc', 'xlm', 'xls', 'xlt', 'xlw', 'csv']

export default {
  name: 'WordCloudDemo',
  components: {
    WordCloud
  },
  data() {
    return {
      // 词云宽高，按容器尺寸计算
      cloudWidth: 600,
      cloudHeight: 400,
      // 自定义颜色列表
      customColorList: [
        '#2f54eb', '#1890ff', '#096dd9', '#722ed1', '#9254de',
        '#fa541c', '#ff7d00', '#fa8c16', '#00b42a', '#52c41a'
      ],
      // 传给词云组件的数据
      wordData: [],
      autoScale: false,
      activeWord: null,

      input_data: '',
      appliedText: '',
      timer: null,
      resizeTimer: null,
      placeholder: '[\n  {"text": "交换机", "weight": 60, "desc": "可选说明"},\n  {"text": "路由器", "weight": 40}\n]\n\nweight 建议在 16~72 之间'
    };
  },
  computed: {
    parsedData() {
      const text = this.appliedText.trim()
      if (!text) return { ok: true, err: '', words: [], invalid: [] }
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        return { ok: false, err: 'JSON 格式不正确：' + e.message, words: [], invalid: [] }
      }
      if (!(data instanceof Array)) {
        return { ok: false, err: '需要是数组，如 [{"text": "词", "weight": 30}]', words: [], invalid: [] }
      }
      const words = []
      const invalid = []
      data.forEach((r, i) => {
        if (!r || typeof r !== 'object') {
          invalid.push({ index: i + 1, msg: '不是对象' })
          return
        }
        const t = r.text === undefined || r.text === null ? '' : String(r.text).trim()
        const w = parseFloat(r.weight)
        if (!t) {
          invalid.push({ index: i + 1, msg: '缺少 text' })
        } else if (isNaN(w)) {
          invalid.push({ index: i + 1, msg: '「' + t + '」的 weight 不是数字' })
        } else {
          words.push({ ...r, text: t, weight: w })
        }
      })
      return { ok: true, err: '', words: words, invalid: invalid }
    },
    outOfRange() {
      return this.parsedData.words.filter(w => w.weight < SIZE_MIN || w.weight > SIZE_MAX).length
    }
  },
  mounted() {
    this.measure()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    clearTimeout(this.timer)
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    // ---------- 尺寸 ----------
    measure() {
      const el = this.$refs.cloudWrap
      if (!el) return false
      const w = Math.max(el.clientWidth - 24, 300)
      const h = Math.max(el.clientHeight - 24, 240)
      if (w === this.cloudWidth && h === this.cloudHeight) return false
      this.cloudWidth = w
      this.cloudHeight = h
      return true
    },
    onResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        // 词云组件不监听宽高，尺寸变化后手动重绘
        if (this.measure() && this.wordData.length) this.relayout()
      }, 300)
    },
    relayout() {
      this.$nextTick(() => {
        if (this.$refs.cloud) this.$refs.cloud.renderWordCloud()
      })
    },

    // ---------- 数据 ----------
    onInput() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.genWordCloud(false), 500)
    },
    // manual=true 为点击按钮触发，数据有问题时给出提示
    genWordCloud(manual) {
      clearTimeout(this.timer)
      this.appliedText = this.input_data
      const p = this.parsedData
      if (!p.ok) {
        if (manual) this.$message.error(p.err)
        return
      }
      if (!p.words.length && manual) {
        this.$message.warning('没有可用的词语数据')
      }
      this.activeWord = null
      this.wordData = this.autoScale ? this.scaleWords(p.words) : p.words
    },
    // 按权重线性映射到 16~72 字号，原始权重保留在 rawWeight
    scaleWords(words) {
      if (!words.length) return []
      let min = Infinity
      let max = -Infinity
      words.forEach(w => {
        if (w.weight < min) min = w.weight
        if (w.weight > max) max = w.weight
      })
      return words.map(w => {
        const size = max === min
          ? Math.round((SIZE_MIN + SIZE_MAX) / 2)
          : Math.round(SIZE_MIN + (w.weight - min) * (SIZE_MAX - SIZE_MIN) / (max - min))
        return { ...w, rawWeight: w.weight, weight: size }
      })
    },
    resetData() {
      this.input_data = JSON.stringify(TEMPLATE, null, 2)
      this.genWordCloud(false)
    },
    formatInput() {
      try {
        this.input_data = JSON.stringify(JSON.parse(this.input_data), null, 2)
      } catch (e) {
        this.$message.error('JSON 格式不正确！')
      }
    },
    handleWordClick(wordInfo) {
      this.activeWord = {
        text: wordInfo.text,
        weight: wordInfo.rawWeight !== undefined ? wordInfo.rawWeight : wordInfo.weight,
        desc: wordInfo.desc
      }
    },

    //excel操作
    //upload上传excel表格
    importExcel(file) {
      const parts = file.name.split('.')
      const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
      if (EXCEL_TYPES.indexOf(ext) === -1) {
        this.$message.error('格式错误！仅支持 xlsx / xls / csv 等表格文件')
        return
      }
      this.file2Xce(file).then(tabJson => {
        if (tabJson && tabJson.length > 0) {
          this.input_data = JSON.stringify(tabJson[0].sheet, null, 2)
          this.genWordCloud(false)
          this.$message.success('已导入 ' + tabJson[0].sheet.length + ' 行数据')
        }
      }).catch(e => {
        console.log(e)
        this.$message.error('文件解析失败，请确认文件内容是否正确')
      })
    },
    file2Xce(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader()
        reader.onload = function(e) {
          try {
            const wb = XLSX.read(e.target.result, { type: 'binary' })
            resolve(wb.SheetNames.map(sheetName => ({
              sheetName: sheetName,
              sheet: XLSX.utils.sheet_to_json(wb.Sheets[sheetName])
            })))
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsBinaryString(file.raw)
      })
    },

    //下载模板
    download_table() {
      // 传入副本，downloadExcl 里的 unshift 不会污染模板数据
      this.downloadExcl(TEMPLATE.map(r => ({ ...r })))
    },
    //通用下载方法
    downloadExcl:function(json, type){
    	let tmpDown;
    	let getjson=json;
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
        if(typeof(v.v)=="object"){
          tmpdata[v.position] = {v: JSON.stringify(v.v)}
        }else{
          tmpdata[v.position] = {v: v.v}
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
    						{bookType:(type == undefined ? 'xlsx':type),bookSST: false, type: 'binary'}//这里的数据是用来定义导出的格式类型
    						))], {type: "" }); //创建二进制对象写入转换好的字节流

      let aTag = document.createElement('a')
      aTag.download = "词云数据模板.xlsx"
      aTag.href = URL.createObjectURL(tmpDown)
      aTag.click()
      URL.revokeObjectURL(aTag.href)
    },
    s2ab:function(s){
    	let buf = new ArrayBuffer(s.length);
    	let view = new Uint8Array(buf);
    	for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    	return buf;
    },
    getCharCol:function(n){
    	let s = '',
    	m = 0
    	while (n > 0) {
    		m = n % 26 + 1
    		s = String.fromCharCode(m + 64) + s
    		n = (n - m) / 26
    	}
    	return s
    },
  }
};
</script>

<style scoped>
.wc-page {
  color: #303133;
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
.wc-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.wc-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.wc-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.wc-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.wc-actions {
  display: flex;
  align-items: center;
}
.wc-actions > * + * {
  margin-left: 10px;
}
.inline-upload {
  display: inline-block;
}

/* 布局 */
.wc-body {
  display: flex;
  height: calc(100vh - 230px);
  min-height: 480px;
}
.wc-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.wc-preview {
  flex: 1;
  margin-right: 12px;
}
.wc-data {
  flex: 0 0 340px;
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
.panel-actions .el-button + .el-button {
  margin-left: 8px;
}
.panel-actions .el-checkbox {
  margin-right: 12px;
}
.meta-chip {
  display: inline-block;
  margin-left: 8px;
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

/* 词云 */
.cloud-wrap {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
.cloud-wrap /deep/ .word-cloud {
  box-shadow: none;
  border-radius: 6px;
}

/* 数据 */
.wc-textarea {
  flex: 1;
  min-height: 0;
}
.wc-textarea /deep/ textarea {
  height: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
}
.panel-foot {
  flex-shrink: 0;
  padding: 4px 12px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
}
.panel-foot i {
  margin-right: 4px;
}
.foot-row {
  display: flex;
  justify-content: space-between;
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
.foot-warn {
  color: #e6a23c;
  cursor: default;
}
.active-word {
  display: flex;
  align-items: center;
  color: #303133;
}
.active-word > i {
  color: #409eff;
}
.word-desc {
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #909399;
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
.err-msg {
  color: #f56c6c;
}
</style>
