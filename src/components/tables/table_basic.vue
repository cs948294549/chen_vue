<template>
  <div>
    <div v-if="multi_flag&&multipleSelection.length>0" style="display: flex;justify-content: start;">
      <div style="margin: 5px;display: flex;">
        <template v-for="(btn,idx) in option_multibtn">
          <el-button :type="btn['type']" size="small" @click="submitMulti(btn['click'])">{{btn["label"]}}</el-button>
        </template>
      </div>
    </div>
    <div>
      <el-table class="wrap_tab" style="width: 100%" max-height="600" border :data.sync='table_info_show' @selection-change="handleSelectionChange" border size="mini">
        <el-table-column v-if="multi_flag" type='selection' width='40'></el-table-column>
        <el-table-column v-for="(header,idx) in table_header" :prop='header["key"]' :label='header["label"]' :key="idx" show-overflow-tooltip :min-width='header["width"]' align='center'>
          <template v-slot='scope'>
            <div>
              <div v-if="header['type']=='text'">
                <el-popover
                  placement="right"
                  width="800"
                  trigger="hover">
                  <el-input
                    type="textarea"
                    placeholder=""
                    v-model="scope.row[header['key']]"
                    rows="30"
                    :readonly="true"
                  ></el-input>
                  <el-input
                    slot="reference"
                    type="textarea"
                    placeholder=""
                    v-model="scope.row[header['key']]"
                    rows="8"
                    :readonly="true"
                  >
                  </el-input>

                </el-popover>
              </div>
              <div v-else-if="header['type']=='date'">{{formatTimestamp(scope.row[header['key']])}}</div>
              <div v-else>{{scope.row[header['key']]}}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="option_btn.length>0" label='操作' show-overflow-tooltip :width='option_btn.length*80' align='center'>
          <template v-slot='scope'>
            <div style="margin: 5px;display: flex;">
              <template v-for="(btn,idx) in option_btn">
                <el-button :type="btn['type']" size="mini" @click="submit(btn['click'], scope.row, scope.$index)">{{btn["label"]}}</el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination @current-change='handleCurrentChange' :current-page='table_currentPage'  @size-change="handleSizeChange"
      :page-sizes="[20, 50, 100, 200, 500]" :page-size="table_size" layout='total, sizes, prev, pager, next' :total='table_total' style='display: flex;justify-content: end;margin-top: 5px;'></el-pagination><br/>
    </div>

    <div v-if="download_flag" style="display: flex;justify-content: end;">
      <el-button type="primary" size="mini" @click="download_table()">下载</el-button>
    </div>
  </div>
</template>

<script>
import XLSX from 'xlsx'
import { formatTime } from '@/utils/date';

export default {
  props:{
      //传递的json数据，填充表格
			table_data:{
				type:Array,
				default:()=>{
					return [];
				}
			},
      table_header:{
        type:Array,
        default:()=>{
        	return [];
        }
      },
      multi_flag:{
				type:Boolean,
				default:()=>{
					return false;
				}
			},
      download_flag:{
      	type:Boolean,
      	default:()=>{
      		return false;
      	}
      },
      download_name:{
      	type:String,
      	default:()=>{
      		return "表格数据";
      	}
      },
      option_btn:{
        type:Array,
        default:()=>{
          //表格内部的按钮，添加了就要新增监听项目，传入的是 val, row, idx
          //{"label":"预览","type":"primary","click":"showIt"}
        	return [];
        }
      },
      option_multibtn:{
        type:Array,
        default:()=>{
          //表格多选后生效，同样需要监听项目，传入的是多选的数组
          //{"label":"编辑","type":"primary","click":"editMulti"},
        	return [];
        }
      },

  },
  name: 'basic_table',
  data() {
    return {
      table_total: 0, //总页数
      table_currentPage: 1, //当前页
      table_size: 50, //每页数量
      table_info:[],//表所有数据
      table_info_show:[],//表显示数据
      isload:false,//按钮点击load配置
      multipleSelection:[],//多选表项
		};
  },
  mounted() {
    this.table_info = this.table_data
    this.table_total = this.table_info.length;
    this.table_size = this.table_info.length;
    this.table_currentPage = 1
    this.table_info_show = this.table_info
    // this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
  },
  methods: {
    formatTimestamp(timestamp){
      return formatTime(timestamp);
    },
    statuFormat(){
      //数据转换
    },
    handleSelectionChange(val){
      //表项多选
      this.multipleSelection = val;
    },
    //修改页码
    handleCurrentChange (val) {
      this.table_currentPage = val
      this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
    },
    //修改一页总数
    handleSizeChange(val){
      this.table_size = val
      this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
    },
    delIndex(idx){
      this.table_info.splice((this.table_currentPage-1)*this.table_size+idx, 1);
      this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
    },
    submit(val, row, idx){
      this.$emit(val, row, idx)
    },
    submitMulti(val){
      this.$emit(val, this.multipleSelection)
    },


    //下载excel表格
    download_table:function(){
    	this.downloadExcl(this.table_info);
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
    	}))).reduce((prev, next) => prev.concat(next)).forEach((v, i) => tmpdata[v.position] = {
    				v: v.v
    			});
    	let outputPos = Object.keys(tmpdata); //设置区域,比如表格从A1到D10
    	let tmpWB = {
    		SheetNames: ['Sheet1'], //保存的表标题
    		Sheets: {
    			'Sheet1': Object.assign({},
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
      aTag.download = this.download_name+".xlsx"
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
  components:{
  }
};
</script>

<style>
</style>
