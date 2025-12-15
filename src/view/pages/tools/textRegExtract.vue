<template>
  <!--文本提取工具-->
  <div>
    <div style="display: flex;margin: 10px;width: 800px;">
      <el-tag type="success" @click="change_reg(1)">身份证</el-tag>
      <el-tag type="success" @click="change_reg(2)">IP</el-tag>
      <el-tag type="success" @click="change_reg(3)">资产号</el-tag>
      <el-tag type="success" @click="change_reg(4)">kf入室</el-tag>
      <el-tag type="success" @click="change_reg(5)">mysql字段</el-tag>
    </div>
    <div style="display: flex;">
      <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
        <el-form-item>
           <el-input style="width: 400px;height: 20px;" placeholder="正则提取表达式" v-model="reg_filter" clearable></el-input>
        </el-form-item>
        <el-form-item>
           <el-input style="width: 400px;height: 20px;" placeholder="转换形式 ${1}${2}" v-model="reg_format" clearable></el-input>
        </el-form-item>
        <el-form-item>
           <el-button size="mini" type="primary" @click="func_extract">提取</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div style="display: flex;">
      <div>
        <span>输入内容</span>
        <div style="width: 600px;margin: 5px;">
          <el-input
            type="textarea"
            :rows='30'
            resize="none"
            placeholder="请输入内容"
            v-model="input_data">
          </el-input>
        </div>
      </div>
      <div style="margin-left: 20px;">
        <span>提取结果</span>
        <div style="width: 600px;margin: 5px;">
          <el-input
            type="textarea"
            :rows='30'
            resize="none"
            :readonly="true"
            placeholder=""
            v-model="output_data">
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
	export default {
    data() {
        return {
          input_data:"",
          output_data:"",
          reg_filter:"",
          reg_format:"",
        };
    },
    methods: {
      func_extract(){
        // console.log(this.input_data)
        // console.log(this.reg_filter)

        let reg = RegExp(this.reg_filter, "g")
        let replace_reg = RegExp(/\${(\d+)}/, "g")
        let row_tmp = this.reg_format.replace(/\${(\d+)}/g,"${match[$1]}")

        this.output_data = "";

        let result = "";
        let match;
        reg.lastIndex = 0;
        while ((match = reg.exec(this.input_data)) !== null) {
          if(row_tmp!=""){
            let dd_tmp = row_tmp;
            for(let i=0;i<match.length;i++){
              dd_tmp = dd_tmp.replace("${match["+i+"]}", match[i])
            }
            result += dd_tmp + "\n";
          }else{
            result += match[0] + "\n";
          }
        }
        this.output_data = result;

      },
      change_reg(id_type){
        if(id_type==1){
          let _IDRe18 = "([1-6][1-9]|50)\\d{4}(18|19|20)\\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]";
          let _IDre15 = "([1-6][1-9]|50)\\d{4}\\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\\d{3}";
          this.reg_filter=_IDRe18;
          this.reg_format="";
        }else if(id_type==2){
          this.reg_filter="((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})(\\.((2(5[0-5]|[0-4]\\d))|[0-1]?\\d{1,2})){3}";
          this.reg_format="";
        }else if(id_type==3){
          this.reg_filter="[a-zA-Z]+-[a-zA-Z]+-[0-9a-zA-Z]+";
          this.reg_format="";
        }else if(id_type==4){
          this.reg_filter="(\\S+)\\s+(\\S+)\\s+(\\d{18})\\s+(\\d{11})(?:\\s?)";
          this.reg_format="${1}\t${2}\t${3}\t${4}\t";
        }else if(id_type==5){
          this.reg_filter="\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\s+(\\S+)?\\s+\\|\\n+";
          this.reg_format="${1}";
        }

      }
    },
		components:{
		}
	};
</script>

<style scoped>
  .el-tag {
    cursor: pointer;
    margin: 5px;
  }
  .el-tag:hover{
    border: 2px #ddebfd solid;
  }

</style>
