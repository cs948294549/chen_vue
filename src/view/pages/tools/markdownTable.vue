<template>
  <!--前缀融合工具-->
	<div style="display: flex;overflow: auto;">
		<div style="width: 400px;height: 700px;">
      <span>markdown表格</span>
			<el-input
			  type="textarea"
			  :rows='30'
        resize="none"
			  @change="submit_table"
			  placeholder="markdown表格内容"
			  v-model="input_src">
			</el-input>
		</div>
		<div style="margin-left: 20px;">
		  <span>tips:转换完成后可下载表格</span>
		  <div style="margin: 5px;">
        <el-button size="mini" type="primary" @click="submit_table">转换</el-button>
		    <el-button size="mini" type="primary" @click="download_table">下载表格</el-button>
		  </div>
		  <div style="width: 600px;margin: 5px;">
		    <el-input
		      type="textarea"
		      :rows='26'
		      resize="none"
		      placeholder="json内容"
		      v-model="output_table"
          readonly
          >
		    </el-input>
		  </div>
		</div>

	</div>
</template>

<script>
  import tools_api from "@/api/mapis/tools_interface.js"
  import XLSX from 'xlsx'


	export default {
	  name: 'tool_for_diff1',
	  data () {
		  return{
			  input_src:"",
			  output_table:"",
		  }
	  },
    mounted(){
    },
	  methods:{
      submit_table(){
        let rows = this.input_src.replace(/^\s*|\s*$/g,"").split("\n")
        let headers = []
        let tables = []
        for(let i=0;i<rows.length;i++){
          if(rows[i].replace(/^\s*|\s*$/g,"")==""){
            continue
          }
          if(headers.length<=0){
            headers = rows[i].split('|')
          }else{
            if(rows[i].indexOf("---")>-1){
              continue
            }else{
              let content = rows[i].split('|')

              // reduce 遍历 key 数组，累加为对象
              const result = headers.reduce((obj, key, index) => {
                if(key!=""){
                  obj[key] = content[index];
                }
                return obj;
              }, {}); // 初始值为空对象
              tables.push(result)
            }
          }
        }

        this.output_table=JSON.stringify(tables, null, 2)
      },
      download_table(){

        try{
          if(this.output_table.length<=0){
            this.$message({
              showClose: true,
              message: '空数据！',
              type: 'error'
            });
            return
          }
          let ab = JSON.parse(this.output_table)

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
        aTag.download = "表格.xlsx"
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


	  },
	}
</script>

<style>
</style>
