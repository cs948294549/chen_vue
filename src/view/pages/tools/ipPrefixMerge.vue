<template>
  <!--前缀融合工具-->
	<div style="display: flex;overflow: auto;">
		<div style="width: 400px;height: 700px;">
      <span>前缀列表</span>
			<el-input
			  type="textarea"
			  :rows='30'
        resize="none"
			  @change="merge_prefix"
			  placeholder="a.b.c.d/n"
			  v-model="input_src">
			</el-input>
		</div>
		<div style="width: 400px;height: 700px;">
      <span>优化结果</span>
			<el-input
        style="line-height:none !important"
			  type="textarea"
			  :rows='30'
        resize="none"
        readonly
			  placeholder="请输入内容"
			  v-model="input_target">
			</el-input>
		</div>
		<div style="width: 900px;height: 700px;">
      <span>前后对比</span>
      <div v-html="diff_result" style="line-height:1.5"></div>
		</div>
	</div>
</template>

<script>
  import tools_api from "@/api/mapis/tools_interface.js"

	export default {
	  name: 'tool_for_diff1',
	  data () {
		  return{
			  input_src:"",
			  input_target:"",
			  diff_result:"",
		  }
	  },
    mounted(){
    },
	  methods:{
		merge_prefix(){
      let that = this
      let net_list = []
      let nets_str = this.input_src.replace(/^\s*|\s*$/g,"").split("\n")
      for(let i=0;i<nets_str.length;i++){
        net_list.push(nets_str[i])
      }
			tools_api.mergeNetworkList({"net_list":net_list}, {}).then((response)=>{
        if(response.data.code==0){
          that.input_target = response.data.data.join("\n")
          that.getDiffRes()
        }else{
          this.$message({
            showClose: true,
            message: '处理失败！',
            type: 'error'
          });
        }
			}).catch((err)=>{
			  console.log("错误信息",response.data)
			});
		},
    getDiffRes(){
      tools_api.checkDiffText({"src":this.input_src, "target":this.input_target}, {}).then((response)=>{
        if(response.data.code==0){
          this.diff_result = response.data.data
        }else{
          this.$message({
            showClose: true,
            message: '处理失败！',
            type: 'error'
          });
        }
      }).catch((err)=>{
        console.log("错误信息",response.data)
        this.$message({
          showClose: true,
          message: '提交失败！',
          type: 'error'
        });
      });
    },


	  },
	}
</script>

<style>
</style>
