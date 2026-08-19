<template>
  <div>
    <div>
      <div v-if="table_info.length>0">
        <el-button type="primary" size="mini" @click="download_table">下载</el-button>
      </div>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item label="设备名">
            <el-input placeholder="设备名" v-model="filter_name" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="设备IP">
            <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="端口名">
            <el-input placeholder="端口名" v-model="filter_ifname" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="带宽">
            <el-input placeholder="带宽" v-model="filter_speed" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filter_status" placeholder="请选择" clearable>
              <el-option label="UP" value="UP"></el-option>
              <el-option label="Down" value="Down"></el-option>
              <el-option label="AdminDown" value="AdminDown"></el-option>
              <el-option label="Warning" value="Warning"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input placeholder="描述" v-model="filter_alias" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="isload" @click="getViews">筛选</el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>

    <el-table border :data.sync='table_info_show' @selection-change="handleSelectionChange" :default-sort = "{prop: 'port_id'}" border size="mini">
      <el-table-column prop='sysname' label='设备名' show-overflow-tooltip min-width='28' align='center'>
      </el-table-column>
      <el-table-column prop='ip' label='设备IP' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='if_name' label='端口名' show-overflow-tooltip min-width='10' align='center'>
      </el-table-column>
      <el-table-column prop='speed' label='端口带宽' :formatter="transSpeed" show-overflow-tooltip min-width='10' align='center'>
      </el-table-column>
      <el-table-column prop='admin_statu' label='管理状态' :formatter="transAdminStatu" show-overflow-tooltip min-width='10' align='center'>
      </el-table-column>
      <el-table-column prop='oper_statu' label='物理状态' :formatter="transOperStatu" show-overflow-tooltip min-width='10' align='center'>
      </el-table-column>
      <el-table-column prop='alias' label='描述' show-overflow-tooltip min-width='10' align='center'>
        <template v-slot="scope">
          <el-popover v-if="scope.row.alias!=''" placement="bottom-start" width="800" trigger="hover" :open-delay="600">
            <el-input type="textarea" v-model="scope.row.alias" :autosize="{ minRows: 5, maxRows: 20 }"></el-input>
            <el-button size="mini" type="info" plain slot="reference">描述</el-button>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop='timestamp' label='采集时间' show-overflow-tooltip min-width='20' align='center'>
      </el-table-column>

      <!-- <el-table-column label='操作' show-overflow-tooltip min-width='15' align='center'>
        <template v-slot='scope'>
          <div style="margin: 5px;">
            <el-button size='mini' type='success' :loading="isload" plain @click="show_detail(scope.row)" >预览</el-button>
            <el-button size='mini' type='warning' :loading="isload" plain @click="changeFlag(scope.row)" >修改</el-button>
          </div>
        </template>
      </el-table-column> -->
    </el-table>

    <el-pagination @current-change='handleCurrentChange' :current-page='table_currentPage'  @size-change="handleSizeChange"
    :page-sizes="[2, 20, 50, 100, 200, 500]" :page-size="table_size" layout='total, sizes, prev, pager, next' :total='table_total' style='float: right'></el-pagination><br/>
  </div>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import XLSX from 'xlsx'

  export default {
    data() {
      return {

        //table 用
        multipleSelection:"",
        table_currentPage:1,
        table_info:[],
        table_info_show:[],
        table_total:0,
        table_size:20,

        //筛选用
        filter_name:"",
        filter_ip:"",
        filter_ifname:"",
        filter_status:"",
        filter_speed:"",
        filter_alias:"",

        isload: false,
      };
    },

    mounted() {
    },
    methods: {
      //表格自带方法
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

      getViews(){
        let post_data = {}
        this.filter_status = this.filter_status.replace(/^\s*|\s*$/g,"")
        if(this.filter_status!=""){
          if(this.filter_status=="UP"){
            post_data["admin_statu"]='1'
            post_data["oper_statu"]='1'
          }
          if(this.filter_status=="Down"){
            post_data["oper_statu_ex"]='1'
          }
          if(this.filter_status=="AdminDown"){
            post_data["admin_statu_ex"]='1'
          }
          if(this.filter_status=="Warning"){
            post_data["oper_statu_ex"]='1'
            post_data["admin_statu"]='1'
            post_data["warning"]="1"
          }
        }
        this.filter_name = this.filter_name.replace(/^\s*|\s*$/g,"")
        if(this.filter_name!=""){
          post_data["sysname"]=this.filter_name
        }
        this.filter_ip = this.filter_ip.replace(/^\s*|\s*$/g,"")
        if(this.filter_ip!=""){
          post_data["ip"]=this.filter_ip
        }
        this.filter_ifname = this.filter_ifname.replace(/^\s*|\s*$/g,"")
        if(this.filter_ifname!=""){
          post_data["if_name"]=this.filter_ifname
        }
        this.filter_speed = this.filter_speed.replace(/^\s*|\s*$/g,"")
        if(this.filter_speed!=""){
          post_data["speed"]=this.filter_speed
        }
        this.filter_alias = this.filter_alias.replace(/^\s*|\s*$/g,"")
        if(this.filter_alias!=""){
          post_data["alias"]=this.filter_alias
        }
        if(Object.keys(post_data).length<=0){
          this.$message({
            type: 'error',
            message: '数据过多，请添加筛选条件'
          });
          return
        }
        
        this.table_currentPage=1;
        this.table_total=0;
        this.table_size=20;
        
        
        let that = this
        this.isload = true
        collector_api.getPorts_ex(post_data,{}).then(function(response){
          // console.log(response.data)
          if(response.data["code"]===0){
            that.table_info = response.data["data"]
            that.table_total = that.table_info.length
            that.table_info_show = that.table_info.slice((that.table_currentPage-1)*that.table_size,that.table_currentPage*that.table_size)
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
          }
          that.isload = false
        }).catch(function (error) {
            console.log(error)
            that.isload = false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      },

      transAdminStatu(row){
        if(row.admin_statu=='1'){
          return "up"
        }else{
          return "down"
        }
      },
      transOperStatu(row){
        if(row.oper_statu=='1'){
          return "up"
        }else{
          return "down"
        }
      },
      transSpeed(row){
        return ""+(parseInt(row.speed)/1000).toFixed(1)+"G"
      },


      transDataToTable(table_data){
        let name_dict = {
          "sysname":"",
          "ip":"",
          "port":"",
          "port_ex":"",
          "use_port":"",
          "use_port_ex":"",
          "remain_port":"",
          "remain_port_ex":"",
          "idle_ratio":"",
          "flag":"",
          "comment":"",
          "username":"",
          "timestamp":"",
        }
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

    },
  }
</script>

<style>
</style>
