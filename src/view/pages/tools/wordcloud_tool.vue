<template>
  <div style="display: flex;">
    <div>
      <WordCloud
        :words="wordData"
        :width="wordCloudWidth"
        :height="wordCloudHeight"
        :font-size-range="[15, 73]"
        :color-list="customColorList"
        @word-click="handleWordClick"
      />
    </div>
    <div style="margin: 20px;width:400px">
      <div style="margin-bottom: 20px;display: flex;justify-content: space-between;">
        <el-button size="mini" type="primary" @click="download_table">下载模板</el-button>
        <el-upload ref="upload" action="/"
        	:show-file-list="false"
        	:on-change="importExcel"
        	:auto-upload="false">
        	<el-button
        	  slot="trigger"
        	  icon="el-icon-upload"
        	  size="mini"
        	  type="primary">
        	  上传表格
        	</el-button>
        </el-upload>
        <el-button type="info" size="mini" @click="resetData">初始化数据</el-button>
        <el-button type="primary" size="mini" @click="genWordCloud">生成图</el-button>
      </div>
      <p>weight值需要设置在16～72之间</p>
      <el-input
        type="textarea"
        :rows='20'
        resize="none"
        placeholder="输入数据"
        v-model="input_data">
      </el-input>
    </div>
  </div>
</template>

<script>
// 引入词云组件
import WordCloud from '@/components/word_cloud/WordCloud.vue';
import XLSX from 'xlsx'


export default {
  name: 'WordCloudDemo',
  components: {
    WordCloud
  },
  data() {
    return {
      // 词云宽高
      wordCloudWidth: 1000,
      wordCloudHeight: 540,
      // 自定义颜色列表
      customColorList: [
        '#2f54eb', '#1890ff', '#096dd9', '#722ed1', '#9254de',
        '#fa541c', '#ff7d00', '#fa8c16', '#00b42a', '#52c41a'
      ],
      // 词汇数据（初始数据）
      wordData: [],
      wordDataTemp: [
        { text: 'Vue 2', weight: 20, desc: '前端框架' },
        { text: 'WordCloud', weight: 78, desc: '词云可视化库' },
        { text: 'npm', weight: 72, desc: '包管理工具' },
        { text: '前端开发', weight: 68, desc: '技术领域' },
        { text: '组件封装', weight: 65, desc: '开发技巧' },
        { text: '动态更新', weight: 60, desc: '核心功能' },
        { text: '中文适配', weight: 58, desc: '支持中文显示' },
        { text: '交互事件', weight: 55, desc: '点击/悬浮' },
        { text: '响应式', weight: 52, desc: '适配不同屏幕' },
        { text: '样式自定义', weight: 48, desc: '颜色/字体/间距' },
        { text: '性能优化', weight: 45, desc: '渲染效率' },
        { text: '开箱即用', weight: 42, desc: '快速集成' }
      ],
      input_data:"",

    };
  },
  methods: {
    //excel操作
    //upload上传excel表格
    importExcel(file) {
      // let file = file.files[0] // 使用传统的input方法需要加上这一步
      const types = file.name.split('.')[1]
      const fileType = ['xlsx', 'xlc', 'xlm', 'xls', 'xlt', 'xlw', 'csv'].some(item => item === types)
      if (!fileType) {
        this.$message('格式错误！请重新选择')
        return
      }
      this.file2Xce(file).then(tabJson => {
        if (tabJson && tabJson.length > 0) {
          let jsondata=tabJson[0].sheet;
          this.input_data = JSON.stringify(jsondata)
        }
      })
    },
    file2Xce(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader()
        reader.onload = function(e) {
          const data = e.target.result
          this.wb = XLSX.read(data, {
            type: 'binary'
          })
        const result = []
        this.wb.SheetNames.forEach((sheetName) => {
          result.push({
            sheetName: sheetName,
            sheet: XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName])
          })
        })
        resolve(result)
        }
        reader.readAsBinaryString(file.raw)
        // reader.readAsBinaryString(file) // 传统input方法
      })
    },

    //下载模板
    //下载excel表格
    download_table(){
      try{
        let ab = this.wordDataTemp
        if(ab instanceof Array){
          this.downloadExcl(ab);
        }else{
          this.downloadExcl([ab]);
        }
      }catch(e){
        //TODO handle the exception
        console.log(e)
        this.$message({
          showClose: true,
          message: 'json格式不正确！',
          type: 'error'
        });
      }

    	// this.downloadExcl(this.json_input);
    },
    //通用下载方法
    downloadExcl:function(json, type){
    	let tmpDown;
    	let getjson=json;
    	let keys = getjson[0];
    	getjson.unshift({});
    	let keyMap = []; //获取keys
    	//keyMap =Object.keys(json[0]);
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
    	let temCol = '',
    	s = '',
    	m = 0
    	while (n > 0) {
    		m = n % 26 + 1
    		s = String.fromCharCode(m + 64) + s
    		n = (n - m) / 26
    	}
    	return s
    },

    handleWordClick(wordInfo){
      console.log("点击了词===",wordInfo)
    },

    genWordCloud(){
      this.wordData = JSON.parse(this.input_data)
    },

    resetData(){
      this.input_data = JSON.stringify(this.wordDataTemp, null, 2)
    },
  }
};
</script>

<style scoped>
.word-cloud-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.demo-controls {
  display: flex;
  gap: 10px;
}

.demo-content {
  text-align: center;
  margin-bottom: 30px;
}

/* 自定义 tooltip */
.custom-tooltip {
  position: fixed;
  z-index: 9999;
  width: 200px;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none; /* 避免遮挡鼠标事件 */
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-text {
  font-size: 16px;
  font-weight: bold;
}

.tooltip-weight {
  font-size: 12px;
  color: #ccc;
}

.tooltip-body {
  font-size: 13px;
  color: #eee;
  line-height: 1.4;
}

/* 点击记录 */
.demo-log {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}


</style>
