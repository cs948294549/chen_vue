<template>
  <!--配置对比工具-->
	<div style="display: flex;">
		<div style="width: 400px;height: 700px;">
      <span>文本1</span>
			<el-input
			  type="textarea"
			  :rows='30'
        resize="none"
			  @change="getDiffRes"
			  placeholder="请输入内容"
			  v-model="input_src">
			</el-input>
		</div>
		<div style="width: 400px;height: 700px;">
      <span>文本2</span>
			<el-input
        style="line-height:none !important"
			  type="textarea"
			  :rows='30'
        resize="none"
			  @change="getDiffRes"
			  placeholder="请输入内容"
			  v-model="input_target">
			</el-input>
		</div>
		<div style="width: 900px;height: 700px;overflow: auto;">
      <span>对比结果</span>
      <div v-html="diff_result" style="line-height:1.5"></div>
		</div>
	</div>
</template>

<script>
  import tools_api from "@/api/mapis/tools_interface.js"

	export default {
	  name: 'tool_for_diff',
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
      getDiffRes(){
        tools_api.checkDiffText({"src":this.input_src, "target":this.input_target, "flag": true}, {}).then((response)=>{
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
