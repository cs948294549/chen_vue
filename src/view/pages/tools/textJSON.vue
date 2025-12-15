<template>
  <!--json表格互转-->
	<div style="display: flex;">
    <div>
      <span>tips:上传表格转JSON文本</span>
      <div style="margin-bottom: 10px;margin-left: 5px;">
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
      </div>
      <div style="width: 600px;margin: 5px;">
        <el-input
          type="textarea"
          :rows='30'
          resize="none"
          placeholder="请输入内容"
          :readonly="true"
          v-model="json_output">
        </el-input>
      </div>
    </div>
    <div style="margin-left: 20px;">
      <span>tips:填写JSON文本下载表格</span>
      <div style="margin: 5px;">
        <el-button size="mini" type="primary" @click="download_table">下载表格</el-button>
      </div>
      <div style="width: 600px;margin: 5px;">
        <el-input
          type="textarea"
          :rows='30'
          resize="none"
          placeholder="json内容"
          v-model="json_input">
        </el-input>
      </div>
    </div>
	</div>
</template>

<script>
	import XLSX from 'xlsx'

	export default {
    data() {
        return {
          json_output:"",
          json_input:"",
        };
    },
    methods: {
      //下载文件
      //下载excel表格
      download_table:function(){
        try{
          let ab = JSON.parse(this.json_input)
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
        aTag.download = "table.xlsx"
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

      //上传文件
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
            this.json_output = JSON.stringify(jsondata)
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
    },
		components:{
		}
	};
</script>

<style>
</style>
