<template>
  <div>
    <div style="text-align: center;font-weight: bolder;">错包计数</div>
    <div :id="chartsname" :style="{width:chartswidth,height:chartsheight}"></div>
  </div>
</template>

<script>
	import echarts from 'echarts'
  	import collector_api from "@/api/mapis/collector_interface.js"


	export default {
		props:{
			//传递的json数据，填充表格
			chartsname:{
				type:String,
				default:()=>{
					return "echartContainer"
				}
			},
			port_info:{
				type:Object,
				default:()=>{
					return {"ip":"","if_name":"","port_id":"","sysname":"", "alias":"-"};
				}
			},
			chartswidth:{
				type:String,
				default:()=>{
					return "800px"
				}
			},
			chartsheight:{
				type:String,
				default:()=>{
					return "500px"
				}
			},
			interval:{
				type:Number,
				default:()=>{
					return 10
				}
			}
		},
		mounted() {
			this.time_interval = this.interval;
			this.createBar(this.chartsname);
			this.getDevFlow();
			this.timer = setInterval(this.getDevFlow, this.time_interval*1000);
		},
		beforeDestroy() {
			console.log("clear timer 全部清除");
		  clearInterval(this.timer);
		},
	  data() {
      return {
        //流量
        //1.3.6.1.2.1.31.1.1.1.6
        //1.3.6.1.2.1.31.1.1.1.10
        //错包
        //1.3.6.1.2.1.2.2.1.14
        //1.3.6.1.2.1.2.2.1.20

        //x轴标签
				flow_time:[],
        //in流量
				flow_in:[],
        //out流量
				flow_out:[],
        //当前 in out 值
				flow_in_curr:0,
				flow_out_curr:0,

				myChart:"",
				timer:"",

				division_flag:1,
				hex_flag:"byte/s",

				showflag:true,
				time_interval:1,
			};
	  },
	  methods: {
			stop:function(){
				this.showflag=false;
				clearInterval(this.timer);
			},
			getDevFlow:function(){
				let ip = this.port_info["ip"]
				let port_id = this.port_info["port_id"]
        if(typeof(ip)==undefined||typeof(port_id)==undefined||ip==""||port_id==""){
          clearInterval(this.timer);
          this.$message({
            type: 'error',
            message: '信息缺失，请重试'
          });
          return
        }

				let in_p = new Promise(function(resolve,reject){
				  collector_api.getSNMPGET({"ip":ip, "oid":"1.3.6.1.2.1.2.2.1.14."+port_id, "coding":"utf-8"},{}).then(function (response) {
				    // console.log("===", response)
				    resolve({"val": response.data["data"], "name":"in"})
				  }).catch(function (error) {
				    console.log(error)
				  })
				})

				let out_p = new Promise(function(resolve,reject){
				  collector_api.getSNMPGET({"ip":ip, "oid":"1.3.6.1.2.1.2.2.1.20."+port_id, "coding":"utf-8"},{}).then(function (response) {
				    // console.log("===", response)
				    resolve({"val": response.data["data"], "name":"out"})
				  }).catch(function (error) {
				    console.log(error)
				  })
				})

				let that = this
				Promise.all([in_p, out_p]).then(function(res){
				  // console.log("采集===",res, that.flow_in_curr, that.flow_out_curr, "-=-=")
				  let flow_info = {}

				  for(let i=0;i<res.length;i++){
				    if(res[i]["name"]=="in"){
				      if(that.flow_in_curr===""){
				        that.flow_in_curr=res[i]["val"]
				      }else{
				        flow_info["flow_in"] = parseInt(res[i]["val"]-that.flow_in_curr)*8
				        that.flow_in_curr=res[i]["val"]
				      }
				    }
				    if(res[i]["name"]=="out"){
				      if(that.flow_out_curr===""){
				        that.flow_out_curr=res[i]["val"]
				      }else{
				        flow_info["flow_out"] = parseInt(res[i]["val"]-that.flow_out_curr)*8
				        that.flow_out_curr=res[i]["val"]
				      }
				    }
				  }

          if(typeof(flow_info["flow_in"]) != undefined){
            that.addData(flow_info)
          }

				});
			},
			addData:function(data){
        // data = {flow_in, flow_out}
        // console.log("添加数据====", data)
				let newData=data;
				let in_sp=0;
				let out_sp=0;
				if(this.flow_time.length>30){
					this.flow_time.shift();
					this.flow_time.push(this.formatDate(newData.timestamp*1000))
					this.flow_in.shift();
					in_sp=parseInt(newData.flow_in/this.time_interval);
					this.flow_in.push(parseInt(newData.flow_in/this.time_interval))

					this.flow_out.shift();
					out_sp=parseInt(newData.flow_out/this.time_interval);
					this.flow_out.push(parseInt(newData.flow_out/this.time_interval))

				}else{
					if(this.flow_time.length<1){
						this.flow_time.push(this.formatDate(newData.timestamp*1000))
						this.flow_in.push(0)
						this.flow_out.push(0)
					}else{
						this.flow_time.push(this.formatDate(newData.timestamp*1000))
						in_sp=parseInt(newData.flow_in/this.time_interval);
						this.flow_in.push(parseInt(newData.flow_in/this.time_interval))
						out_sp=parseInt(newData.flow_out/this.time_interval);
						this.flow_out.push(parseInt(newData.flow_out/this.time_interval))
					}
				}

				this.myChart.setOption({
					xAxis: {
						data:this.flow_time,
						axisLabel:{
							textStyle: {
								fontSize:8
							},
						}
					},
					yAxis:{
						axisLabel:{
							textStyle: {
								fontSize:8
							},
							formatter:'{value} '+'个'
						}
					},
					series: [
            {
              data: this.flow_in
            },
            {
              data: this.flow_out
            }
					]
				});
			},
			createBar:function(id){
				this.myChart=echarts.init(document.getElementById(id));
				let option2 = {
					title: {
						text: "IP:"+this.port_info.ip+"\n端口:"+this.port_info.if_name+"\n描述:"+this.port_info.alias,
						x:"center",
						textStyle:{
							fontSize:10
						}
					},
					tooltip: {
						// trigger: 'axis',
						textStyle:{
							"fontSize": 14,
							},
						// formatter: function (params) {
						// 	params = params[0];
						// 	let date = params.name;
						// 	return date;
						// 	},
						},
					legend: {
						bottom:0,
						type: 'scroll',
						icon: 'rectangle',
						orient:'horizontal',
						itemWidth :10,
						itemHeight:8,
						textStyle:{
							fontSize:10
						}
					},
					xAxis: {
						type: 'category',
						boundaryGap: false,
						axisLabel: {
							show: true,
							textStyle: {
								fontSize:8
							}
						},
						data:this.flow_time
					},
					yAxis: {
						type: 'value',
						position:'left',
						axisLabel: {
							show: true,
							textStyle: {
								fontSize:10
							},
							formatter:'{value} b'
						}
					},
					series: [{
							type:'line',
							name:"in",
							// areaStyle: {
							// 	shadowColor: 'rgba(0, 0, 0, 0.5)',
							// 	color:'rgba(255, 255, 255, 0.5)'
							// },
							label:{
								normal:{
									show:true,//显示数字
									fontSize:8,
									position: 'top'//这里可以自己选择位置
								}
							},
							data:this.flow_in
						},
						{
							type:'line',
							name:"out",
							// areaStyle: {
							// 	shadowColor: 'rgba(0, 0, 0, 0.5)',
							// 	color:'rgba(255, 255, 255, 0.5)'
							// },
							label:{
								normal:{
									show:true,//显示数字
									fontSize:8,
									position: 'top'//这里可以自己选择位置
								}
							},
							data:this.flow_out
						}]
				};
				this.myChart.setOption(option2);
			},
			formatDate: function (value) {
				let date;
				if(value){
					date=new Date(value);
				}else{
					date=new Date();
				}
				let y = date.getFullYear();
				let MM = date.getMonth() + 1;
				MM = MM < 10 ? ('0' + MM) : MM;
				let d = date.getDate();
				d = d < 10 ? ('0' + d) : d;
				let h = date.getHours();
				h = h < 10 ? ('0' + h) : h;
				let m = date.getMinutes();
				m = m < 10 ? ('0' + m) : m;
				let s = date.getSeconds();
				s = s < 10 ? ('0' + s) : s;
				return h + ':' + m + ':' + s;
			},
	  }
	};
</script>

<style lang="scss" scoped="true">
	.show-flow-table{
		margin: 2px;
		border-collapse: collapse;
		font-size: 10px;
		td{
			border:1px solid #000;padding:1px;
		}
		th{
			border:1px solid #000;padding:7px;
		}
	}
</style>
