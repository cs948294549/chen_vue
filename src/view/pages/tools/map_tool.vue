<!--可视化工具：省份地图着色-->
<template>
  <div class="mp-page">
    <!-- 标题栏 -->
    <div class="mp-header">
      <div class="mp-title">
        <i class="el-icon-map-location"></i>地图着色
        <span class="mp-subtitle">按数值区间给省份着色：先设置图例，再填写或上传各省数据</span>
      </div>
      <div class="mp-actions">
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
        <el-button size="small" type="primary" icon="el-icon-refresh" @click="genMap(true)">生成地图</el-button>
      </div>
    </div>

    <div class="mp-body">
      <!-- 地图预览 -->
      <div class="mp-panel mp-preview">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-picture-outline"></i>地图预览</span>
          <span class="panel-actions">
            <span v-if="!kinds.length" key="no-legend" class="head-tip"><i class="el-icon-info"></i>添加图例后自动着色</span>
            <span v-else-if="generated" key="stats" class="stat-chips">
              <span class="meta-chip">已着色 {{ provinceData.length }} / 34</span>
              <el-popover v-if="outOfRange.length" placement="bottom-end" width="260" trigger="hover">
                <div class="name-list">
                  <span v-for="n in outOfRange" :key="n" class="name-chip">{{ n }}</span>
                </div>
                <span slot="reference" class="meta-chip chip-warn">{{ outOfRange.length }} 个不在图例区间</span>
              </el-popover>
              <el-popover v-if="parsedData.unknown.length" placement="bottom-end" width="260" trigger="hover">
                <div class="pop-title">以下名称无法识别为省份</div>
                <div class="name-list">
                  <span v-for="(n, idx) in parsedData.unknown" :key="idx" class="name-chip">{{ n }}</span>
                </div>
                <span slot="reference" class="meta-chip chip-danger">{{ parsedData.unknown.length }} 个名称无法识别</span>
              </el-popover>
            </span>
          </span>
        </div>
        <div class="map-wrap">
          <EchartsMap
            ref="echart_map"
            :mapData="provinceData"
            :legendConfig="sortedKinds"
            width="100%"
            :height="mapHeight"
          />
        </div>
      </div>

      <!-- 右侧：图例 + 数据 -->
      <div class="mp-side">
        <div class="mp-panel legend-panel">
          <div class="panel-head">
            <span class="panel-title"><i class="el-icon-collection-tag"></i>图例</span>
            <el-button size="mini" type="primary" plain icon="el-icon-plus" @click="openCreate">添加图例</el-button>
          </div>
          <div class="legend-list">
            <div v-if="!sortedKinds.length" key="empty" class="legend-empty">
              还没有图例，点击「添加图例」设置颜色和数值区间
            </div>
            <template v-else>
              <div v-for="(item, idx) in sortedKinds" :key="idx + '-' + item.kind" class="legend-item">
                <span class="legend-swatch" :style="{ backgroundColor: item.kind }"></span>
                <span class="legend-range mono">{{ rangeText(item) }}</span>
                <span class="legend-count">{{ legendCounts[idx] || 0 }} 个省</span>
                <span class="legend-ops">
                  <i class="el-icon-edit-outline op-icon" title="编辑" @click="openEdit(item)"></i>
                  <i class="el-icon-delete op-icon op-danger" title="删除" @click="deleteKind(item)"></i>
                </span>
              </div>
            </template>
          </div>
        </div>

        <div class="mp-panel data-panel">
          <div class="panel-head">
            <span class="panel-title"><i class="el-icon-edit-outline"></i>省份数据</span>
            <span class="panel-actions">
              <el-button type="text" size="mini" icon="el-icon-refresh-left" @click="resetData">初始化数据</el-button>
              <el-button type="text" size="mini" icon="el-icon-magic-stick" :disabled="!parsedData.ok || !input_data" @click="formatInput">格式化</el-button>
            </span>
          </div>
          <el-input
            v-model="input_data"
            type="textarea"
            class="mp-textarea mono-input"
            resize="none"
            :placeholder="placeholder"
            @input="onInput">
          </el-input>
          <div class="panel-foot">
            <span v-if="!input_data.trim()" key="idle" class="state-idle">
              <i class="el-icon-info"></i>点击「初始化数据」生成 34 个省份的模板
            </span>
            <span v-else-if="parsedData.ok" key="ok" class="state-ok">
              <i class="el-icon-circle-check"></i>JSON 有效 · {{ parsedData.rows.length }} 个省份
            </span>
            <span v-else key="err" class="state-err" :title="parsedData.err">
              <i class="el-icon-circle-close"></i>{{ parsedData.err }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加 / 编辑图例 -->
    <el-dialog
      :visible.sync="diag_add_flag"
      width="460px"
      :close-on-click-modal="false"
      append-to-body>
      <div slot="title" class="dialog-title">
        <i :class="formMode === 'create' ? 'el-icon-circle-plus-outline' : 'el-icon-edit-outline'"></i>
        {{ formMode === 'create' ? '添加图例' : '编辑图例' }}
      </div>
      <el-form ref="kindForm" :model="feature_kind" :rules="rules" size="small" label-width="70px">
        <el-form-item label="颜色" prop="kind">
          <el-color-picker v-model="feature_kind.kind" :predefine="predefineColors"></el-color-picker>
          <span v-if="feature_kind.kind" class="mono color-text">{{ feature_kind.kind }}</span>
        </el-form-item>
        <el-form-item label="数值区间" prop="start">
          <div class="range-row">
            <el-input v-model="feature_kind.start" placeholder="不限" clearable></el-input>
            <span class="range-sep">~</span>
            <el-input v-model="feature_kind.end" placeholder="不限" clearable></el-input>
          </div>
          <div class="form-tip">包含两端的值；留空表示不限，如「100 ~ 不限」表示 ≥ 100</div>
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="feature_kind.label" placeholder="可选，如：万、台、%" clearable></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="diag_add_flag = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submit_update">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import EchartsMap from '@/components/echarts/EchartsMap.vue';
import XLSX from 'xlsx'

const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省',
  '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省',
  '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省',
  '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省',
  '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省',
  '香港特别行政区', '澳门特别行政区'
]

const EXCEL_TYPES = ['xlsx', 'xlsm', 'xlc', 'xlm', 'xls', 'xlt', 'xlw', 'csv']

function isSet (x) {
  return x !== undefined && x !== null && String(x).trim() !== ''
}

// 值是否落在图例区间内（两端包含，空表示不限）
function inRange (v, k) {
  if (isSet(k.start) && !(v >= parseFloat(k.start))) return false
  if (isSet(k.end) && !(v <= parseFloat(k.end))) return false
  return true
}

// 省份名补全：「北京」→「北京市」、「内蒙古」→「内蒙古自治区」，识别不了返回空
function normalizeName (name) {
  const n = String(name === undefined || name === null ? '' : name).trim()
  if (PROVINCES.indexOf(n) > -1) return n
  if (n.length < 2) return ''
  const hits = PROVINCES.filter(p => p.indexOf(n) === 0)
  return hits.length === 1 ? hits[0] : ''
}

export default {
  components: { EchartsMap },
  data() {
    return {
      // 地图着色数据：[{name: '省份名', value: 数值, kind: 颜色}, ...]
      provinceData: [],
      // 面板高度 calc(100vh - 230px) 减去标题栏 42、内边距 24 和边框
      mapHeight: 'calc(100vh - 300px)',
      generated: false,
      outOfRange: [],
      legendCounts: [],

      //图例设置
      kinds: [],
      diag_add_flag: false,
      formMode: 'create',
      editTarget: null,
      feature_kind: {},
      predefineColors: [
        '#f56c6c', '#e6a23c', '#f7d25c', '#67c23a', '#36cfc9',
        '#409eff', '#2f54eb', '#722ed1', '#eb2f96', '#909399'
      ],
      rules: {
        kind: [{ required: true, message: '请选择颜色', trigger: 'change' }],
        start: [{ validator: (rule, value, cb) => this.validateRange(cb), trigger: 'blur' }]
      },

      //地图数据
      input_data: '',
      appliedText: '',
      timer: null,
      placeholder: '[\n  {"name": "北京市", "value": 120},\n  {"name": "广东", "value": 86}\n]\n\n省份名可简写，如「广东」「内蒙古」'
    };
  },
  computed: {
    // 按开始值排序，开始值为空的排最前
    sortedKinds() {
      const num = k => (isSet(k.start) ? parseFloat(k.start) : -Infinity)
      return this.kinds.slice().sort((a, b) => num(a) - num(b))
    },
    parsedData() {
      const text = this.appliedText.trim()
      if (!text) return { ok: true, err: '', rows: [], unknown: [] }
      try {
        const data = JSON.parse(text)
        if (!(data instanceof Array)) throw new Error('需要是数组，如 [{"name": "北京市", "value": 1}]')
        const rows = []
        const unknown = []
        data.forEach(r => {
          if (!r || typeof r !== 'object') return
          const full = normalizeName(r.name)
          if (!full) {
            unknown.push(String(r.name))
            return
          }
          rows.push({ ...r, name: full })
        })
        return { ok: true, err: '', rows: rows, unknown: unknown }
      } catch (e) {
        return { ok: false, err: 'JSON 格式不正确：' + e.message, rows: [], unknown: [] }
      }
    }
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
  methods: {
    rangeText(k) {
      const unit = k.label || ''
      if (isSet(k.start) && isSet(k.end)) return k.start + ' ~ ' + k.end + unit
      if (isSet(k.start)) return '≥ ' + k.start + unit
      if (isSet(k.end)) return '≤ ' + k.end + unit
      return '全部' + (unit ? '（' + unit + '）' : '')
    },

    // ---------- 图例 ----------
    openCreate() {
      this.formMode = 'create'
      this.editTarget = null
      this.feature_kind = { kind: '', start: '', end: '', label: this.kinds.length ? this.kinds[0].label : '' }
      this.diag_add_flag = true
      this.clearValidate()
    },
    openEdit(item) {
      this.formMode = 'edit'
      this.editTarget = item
      this.feature_kind = { kind: item.kind, start: item.start, end: item.end, label: item.label }
      this.diag_add_flag = true
      this.clearValidate()
    },
    clearValidate() {
      this.$nextTick(() => {
        if (this.$refs.kindForm) this.$refs.kindForm.clearValidate()
      })
    },
    validateRange(cb) {
      const s = this.feature_kind.start
      const e = this.feature_kind.end
      if (isSet(s) && isNaN(parseFloat(s))) return cb(new Error('开始值需要是数字'))
      if (isSet(e) && isNaN(parseFloat(e))) return cb(new Error('结束值需要是数字'))
      if (isSet(s) && isSet(e) && parseFloat(s) > parseFloat(e)) return cb(new Error('开始值不能大于结束值'))
      cb()
    },
    submit_update() {
      this.$refs.kindForm.validate(valid => {
        if (!valid) return
        const item = {
          kind: this.feature_kind.kind,
          start: isSet(this.feature_kind.start) ? String(this.feature_kind.start).trim() : '',
          end: isSet(this.feature_kind.end) ? String(this.feature_kind.end).trim() : '',
          label: this.feature_kind.label || ''
        }
        if (this.formMode === 'edit' && this.editTarget) {
          const idx = this.kinds.indexOf(this.editTarget)
          if (idx > -1) this.kinds.splice(idx, 1, item)
        } else {
          this.kinds.push(item)
        }
        this.diag_add_flag = false
        this.genMap(false)
      })
    },
    deleteKind(item) {
      const idx = this.kinds.indexOf(item)
      if (idx > -1) this.kinds.splice(idx, 1)
      this.genMap(false)
    },

    // ---------- 数据 ----------
    onInput() {
      clearTimeout(this.timer)
      this.timer = setTimeout(this.applyInput, 500)
    },
    applyInput() {
      clearTimeout(this.timer)
      this.appliedText = this.input_data
      this.genMap(false)
    },
    resetData() {
      this.input_data = JSON.stringify(PROVINCES.map(n => ({ name: n, value: 0 })), null, 2)
      this.applyInput()
    },
    formatInput() {
      try {
        this.input_data = JSON.stringify(JSON.parse(this.input_data), null, 2)
        this.applyInput()
      } catch (e) {
        this.$message.error('JSON 格式不正确！')
      }
    },

    // manual=true 为点击按钮触发，条件不满足时给出提示
    genMap(manual) {
      this.appliedText = this.input_data
      if (!this.kinds.length) {
        if (manual) this.$message.error('未设置图例，无法生成地图')
        this.provinceData = []
        this.outOfRange = []
        this.legendCounts = []
        this.generated = false
        this.reloadMap()
        return
      }
      if (!this.parsedData.ok) {
        if (manual) this.$message.error(this.parsedData.err)
        return
      }
      const kinds = this.sortedKinds
      const counts = kinds.map(() => 0)
      const final_map_data = []
      const outOfRange = []
      this.parsedData.rows.forEach(r => {
        const v = parseFloat(r.value)
        let hit = -1
        for (let j = 0; j < kinds.length; j++) {
          if (inRange(v, kinds[j])) {
            hit = j
            break
          }
        }
        if (hit > -1) {
          counts[hit]++
          final_map_data.push({ ...r, kind: kinds[hit].kind })
        } else {
          outOfRange.push(r.name)
        }
      })
      this.provinceData = final_map_data
      this.outOfRange = outOfRange
      this.legendCounts = counts
      this.generated = true
      this.reloadMap()
    },
    reloadMap() {
      this.$nextTick(() => {
        if (this.$refs.echart_map) this.$refs.echart_map.reload()
      })
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
          this.applyInput()
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
      // 传入新数组，downloadExcl 里的 unshift 不会污染模板数据
      this.downloadExcl(PROVINCES.map(n => ({ name: n, value: 0 })))
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
      aTag.download = "地图数据模板.xlsx"
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
  },
};
</script>

<style scoped>
.mp-page {
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
.form-tip {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 12px;
  color: #909399;
}

/* 标题栏 */
.mp-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.mp-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.mp-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.mp-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}
.mp-actions {
  display: flex;
  align-items: center;
}
.mp-actions > * + * {
  margin-left: 10px;
}
.inline-upload {
  display: inline-block;
}

/* 布局 */
.mp-body {
  display: flex;
  height: calc(100vh - 230px);
  min-height: 480px;
}
.mp-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.mp-preview {
  flex: 1;
  margin-right: 12px;
}
.mp-side {
  display: flex;
  flex: 0 0 340px;
  flex-direction: column;
  min-width: 0;
}
.legend-panel {
  flex-shrink: 0;
  max-height: 45%;
  margin-bottom: 12px;
}
.data-panel {
  flex: 1;
  min-height: 0;
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
.head-tip {
  font-size: 12px;
  color: #909399;
}
.head-tip i {
  margin-right: 4px;
}
.stat-chips {
  display: flex;
  align-items: center;
}
.meta-chip {
  display: inline-block;
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
.chip-warn {
  color: #e6a23c;
  background: #fdf6ec;
  cursor: default;
}
.chip-danger {
  color: #f56c6c;
  background: #fef0f0;
  cursor: default;
}
.pop-title {
  margin-bottom: 6px;
  font-size: 12px;
  color: #909399;
}
.name-list {
  max-height: 200px;
  overflow: auto;
}
.name-chip {
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
.map-wrap {
  flex: 1;
  min-height: 0;
  padding: 12px;
}

/* 图例 */
.legend-list {
  flex: 1;
  min-height: 0;
  padding: 6px 0;
  overflow: auto;
}
.legend-empty {
  padding: 16px 12px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
}
.legend-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
}
.legend-item:hover {
  background: #f5f7fa;
}
.legend-swatch {
  flex-shrink: 0;
  width: 28px;
  height: 16px;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .08);
}
.legend-range {
  flex: 1;
  min-width: 0;
  margin-left: 10px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legend-count {
  flex-shrink: 0;
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
.legend-ops {
  flex-shrink: 0;
  margin-left: 10px;
  visibility: hidden;
}
.legend-item:hover .legend-ops {
  visibility: visible;
}
.op-icon {
  margin-left: 8px;
  color: #909399;
  cursor: pointer;
}
.op-icon:hover {
  color: #409eff;
}
.op-danger:hover {
  color: #f56c6c;
}

/* 数据 */
.mp-textarea {
  flex: 1;
  min-height: 0;
}
.mp-textarea /deep/ textarea {
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
.state-idle {
  color: #909399;
}
.state-ok {
  color: #67c23a;
}
.state-err {
  color: #f56c6c;
}

/* 弹窗 */
.dialog-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.dialog-title > i {
  margin-right: 6px;
  color: #409eff;
}
.color-text {
  margin-left: 10px;
  font-size: 12px;
  color: #606266;
  vertical-align: top;
  line-height: 32px;
}
.range-row {
  display: flex;
  align-items: center;
}
.range-sep {
  margin: 0 8px;
  color: #909399;
}
</style>
