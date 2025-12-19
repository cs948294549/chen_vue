<template>
  <div style="display: flex;">
    <div>
      <EchartsMap
        ref="echart_map"
        :mapData="provinceData"
        :legendConfig='legendConfig'
        :width="mapWidth"
        :height="mapHeight"
      />
    </div>
    <div style="margin: 20px;width:200px">
      <div style="margin-bottom: 20px;">
        <el-button type="primary" size="mini" @click="diag_add_flag=true;">添加图例</el-button>
      </div>
      <div>
        <div style="display: flex;margin: 5px;" v-for="(item, key) in kinds">
          <div :style="'width: 40px;border-radius: 5px;background-color: '+item.kind+';'"></div>
          <div style="margin-left: 10px;">{{item.start}}~{{item.end}}{{item.label}}</div>
          <div style="margin-left: 10px;">
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteKind(item,key)" circle></el-button>
          </div>
        </div>
      </div>
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
        <el-button type="primary" size="mini" @click="genMap">生成图</el-button>
      </div>
      <el-input
        type="textarea"
        :rows='20'
        resize="none"
        placeholder="输入数据"
        v-model="input_data">
      </el-input>
    </div>

    <el-dialog title="添加图例" :visible.sync="diag_add_flag" width="50%" append-to-body>
      <el-form v-model="feature_kind" size="mini" label-width="80px">
        <el-form-item label="颜色">
          <el-color-picker v-model="feature_kind.kind"></el-color-picker>
        </el-form-item>
        <el-form-item label="开始值">
          <el-input style="width: 500px;" placeholder="开始值" v-model="feature_kind.start" clearable></el-input>
        </el-form-item>
        <el-form-item label="结束值">
          <el-input style="width: 500px;" placeholder="结束值" v-model="feature_kind.end" clearable></el-input>
        </el-form-item>
        <el-form-item label="单位">
          <el-input style="width: 500px;" placeholder="单位" v-model="feature_kind.label" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
          <el-button type="primary" @click="diag_add_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

  </div>
</template>

<script>
import EchartsMap from '@/components/echarts/EchartsMap.vue';
import XLSX from 'xlsx'

export default {
  components: { EchartsMap },
  data() {
    return {
      provinceTemp: [
        {"name": "北京市", "value": 0},
        {"name": "天津市", "value": 0},
        {"name": "河北省", "value": 0},
        {"name": "山西省", "value": 0},
        {"name": "内蒙古自治区", "value": 0},
        {"name": "辽宁省", "value": 0},
        {"name": "吉林省", "value": 0},
        {"name": "黑龙江省", "value": 0},
        {"name": "上海市", "value": 0},
        {"name": "江苏省", "value": 0},
        {"name": "浙江省", "value": 0},
        {"name": "安徽省", "value": 0},
        {"name": "福建省", "value": 0},
        {"name": "江西省", "value": 0},
        {"name": "山东省", "value": 0},
        {"name": "河南省", "value": 0},
        {"name": "湖北省", "value": 0},
        {"name": "湖南省", "value": 0},
        {"name": "广东省", "value": 0},
        {"name": "广西壮族自治区", "value": 0},
        {"name": "海南省", "value": 0},
        {"name": "重庆市", "value": 0},
        {"name": "四川省", "value": 0},
        {"name": "贵州省", "value": 0},
        {"name": "云南省", "value": 0},
        {"name": "西藏自治区", "value": 0},
        {"name": "陕西省", "value": 0},
        {"name": "甘肃省", "value": 0},
        {"name": "青海省", "value": 0},
        {"name": "宁夏回族自治区", "value": 0},
        {"name": "新疆维吾尔自治区", "value": 0},
        {"name": "台湾省", "value": 0},
        {"name": "香港特别行政区", "value": 0},
        {"name": "澳门特别行政区", "value": 0}
      ],

      // 模拟各省份数据（格式：[{name: '省份名', value: 数值}, ...]）
      provinceData: [
        // {
        //     "name": "内蒙古自治区",
        //     "kind": "#FFFF00",
        //     "value": "10"
        // },
        // {
        //     "name": "贵州省",
        //     "kind": "#99CC00",
        //     "value": "10"
        // }
      ],
      mapWidth:"800px",
      mapHeight:"500px",



      //图例设置
      legendConfig:[
        // {"kind":"#FFFF00", "label":"测试1"},
        // {"kind":"#99CC00", "label":"测试2"}
      ],
      kinds:[],

      diag_add_flag:false,
      feature_kind:{},
      isload:false,


      //地图数据
      input_data:"",
    };
  },
  methods:{
    submit_update(){
      if(this.feature_kind.kind){
        this.kinds.push({
          "kind": this.feature_kind.kind,
          "start": this.feature_kind.start,
          "end": this.feature_kind.end,
          "label": this.feature_kind.label,
        });
        this.legendConfig = this.kinds.sort((a, b) => {
          return a.start - b.start;
        });
        this.$nextTick(()=>{
          this.diag_add_flag=false;
        })
      }
    },
    deleteKind(row, idx){
      this.kinds.splice(idx, 1)
    },
    resetData(){
      this.$nextTick(()=>{
        this.input_data=JSON.stringify(this.provinceTemp,null,2)
      })
    },
    genMap(){
      if(this.kinds.length<=0){
        this.$message({
          type: 'error',
          message: '未设置图例，无法生成地图'
        });
        return
      }
      const map_data = JSON.parse(this.input_data)
      const final_map_data = []
      for(let i=0;i<map_data.length;i++){
        let matched = false
        let kind = ""
        for(let j=0;j<this.kinds.length;j++){
          if(this.kinds[j]["start"]&&this.kinds[j]["start"]!=""){
            if(parseFloat(map_data[i].value)>=parseFloat(this.kinds[j]["start"])){
              matched=true
            }else{
              continue
            }
          }else{
            matched=true
          }
          if(this.kinds[j]["end"]&&this.kinds[j]["end"]!=""){
            if(parseFloat(map_data[i].value)<=parseFloat(this.kinds[j]["end"])){
              matched=true
            }else{
              continue
            }
          }else{
            matched=true
          }
          if(matched==true){
            kind=this.kinds[j]["kind"]
            break
          }
        }
        if(matched==true){
          final_map_data.push({...map_data[i],"kind":kind})
        }
      }
      this.provinceData=final_map_data
      // console.log("最终数据===",this.provinceData)

      this.$nextTick(()=>{
        this.$refs["echart_map"].reload()
      })
    },





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
        let ab = this.provinceTemp
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


};
</script>
