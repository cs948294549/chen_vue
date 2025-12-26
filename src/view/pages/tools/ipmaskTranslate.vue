<!--网工工具-->
<template>
  <div style="display: flex;align-items: center;">
    <div style="width: 600px;margin: 5px;">
      <el-input
        type="textarea"
        :rows='30'
        resize="none"
        placeholder="IP地址"
        v-model="ip_input">
      </el-input>
    </div>
    <div>
      <div style="text-align: center;margin: 5px;">
        <el-button size="mini" @click="tranAddress('1')">掩码转换(/24)</el-button>
      </div>
      <div style="text-align: center;margin: 5px;">
        <el-button size="mini" @click="tranAddress('2')">掩码转换( 24)</el-button>
      </div>
      <div style="text-align: center;margin: 5px;">
        <el-button size="mini" @click="tranAddress('3')">掩码转换( 255.255)</el-button>
      </div>
      <div style="text-align: center;margin: 5px;">
        <el-button size="mini" @click="tranAddress('4')">反掩码转换</el-button>
      </div>
      <div style="text-align: center;margin: 5px;">
        <el-button size="mini" @click="tranAddress('5')">地址范围计算</el-button>
      </div>
    </div>
    <div style="width: 600px;margin: 5px;">
      <el-input
        type="textarea"
        :rows='30'
        resize="none"
        placeholder="结果"
        :readonly="true"
        v-model="ret_output">
      </el-input>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
        return {
          ip_input:"",
          ret_output:"",
        };
    },
    methods: {
      tranAddress(type_n){
        // console.log("转换掩码====", this.ip_input)
        let str_array = this.ip_input.split("\n");

        let reg1 = /^((?:\d+.){3}\d+)$/

        let rets = []
        for(let i=0;i<str_array.length;i++){
          // console.log("=====",str_array[i])
          if(/^\s*$/.test(str_array[i])){
            continue
          }
          let addrs = str_array[i].split(/[\s/]/)
          // console.log(addrs)
          let ip = addrs[0]
          let mask_str = addrs[1]
          if(reg1.test(mask_str)){
            // console.log("掩码是ip 地址形式")
          }else{
            mask_str = this.getMask(parseInt(mask_str))
          }
          let mask_array = mask_str.split(".")
          let res_ip = ip.split(".").reduce(function(new_ip, item, idx){
            if(idx==0){
              return ""+new_ip+(item&mask_array[idx])
            }else{
              return new_ip+"."+(item&mask_array[idx])
            }
          }, "");

          // console.log("reduce=final=", res_ip)
          // console.log("mask_length===", this.getMaskLength(mask_str))

          if(type_n=="1"){
            // x.x.x.x/24
            rets.push(res_ip+"/"+this.getMaskLength(mask_str))
          }else if(type_n=="2"){
            // x.x.x.x 24
            rets.push(res_ip+" "+this.getMaskLength(mask_str))
          }else if(type_n=="3"){
            // x.x.x.x 255.255.255.0
            rets.push(res_ip+" "+mask_str)
          }else if(type_n=="4"){
            // x.x.x.x 0.0.0.255
            rets.push(res_ip+" "+this.getReMask(this.getMaskLength(mask_str)))
          }else if(type_n=="5"){
            // x.x.x.x-x.x.x.n
            let re_mask_str = this.getReMask(this.getMaskLength(mask_str))
            let re_mask_array = re_mask_str.split(".")
            let end_ip = res_ip.split(".").reduce(function(new_ip, item, idx){
              if(idx==0){
                return ""+new_ip+(item^re_mask_array[idx])
              }else{
                return new_ip+"."+(item^re_mask_array[idx])
              }
            }, "");
            rets.push(res_ip+"-"+end_ip)
          }else{
            rets.push(res_ip+"/"+this.getMaskLength(mask_str))
          }
        }
        this.ret_output = rets.join("\n")

      },

      getMask(leng){
        if(leng>=0&&leng<=32){
          return ('1'.repeat(leng) + '0'.repeat(32 - leng)).match(/.{1,8}/g).map(function(s) { return parseInt(s, 2); }).join('.')
        }
      },

      getReMask(leng){
        if(leng>=0&&leng<=32){
          return ('0'.repeat(leng) + '1'.repeat(32 - leng)).match(/.{1,8}/g).map(function(s) { return parseInt(s, 2); }).join('.')
        }
      },

      getMaskLength(mask){
        let mask_len = mask.split(".").reduce(function(prev, item){
          return prev+parseInt(item).toString(2).split("1").length-1
        },0);
        return mask_len
      },

      ipToInt(IP){
        var xH = "",result = REG.exec(ip);
        if(!result) return -1;
        return (parseInt(result[1]) << 24
            | parseInt(result[2]) << 16
            | parseInt(result[3]) << 8
            | parseInt(result[4]));
      },
      intToIp(INT){
          if(INT < 0 || INT > 0xFFFFFFFF){
              throw ("The number is not normal!");
          }
          return (INT>>>24) + "." + (INT>>16 & 0xFF) + "." + (INT>>8 & 0xFF) + "." + (INT & 0xFF);
      },
      getNormalIP(ip_str){
        // 192.168.1.1/16 => 192.168.0.0/16
        let addrs = ip_str.split(/[\s/]/)
        let ip = addrs[0]
        let mask_str = addrs[1]

        let mask_10_str = this.getMask(parseInt(mask_str))
        let mask_array = mask_10_str.split(".")
        let res_ip = ip.split(".").reduce(function(new_ip, item, idx){
          if(idx==0){
            return ""+new_ip+(item&mask_array[idx])
          }else{
            return new_ip+"."+(item&mask_array[idx])
          }
        }, "");
        return res_ip+"/"+mask_str
      },
      getStartEndIP(ip_str){
        // 192.168.1.1/16 => 192.168.0.0/16
        let addrs = ip_str.split(/[\s/]/)
        let ip = addrs[0]
        let mask_str = addrs[1]

        let mask_10_str = this.getMask(parseInt(mask_str))
        let mask_array = mask_10_str.split(".")
        let res_ip = ip.split(".").reduce(function(new_ip, item, idx){
          if(idx==0){
            return ""+new_ip+(item&mask_array[idx])
          }else{
            return new_ip+"."+(item&mask_array[idx])
          }
        }, "");

        let re_mask_str = this.getReMask(parseInt(mask_str))
        let re_mask_array = re_mask_str.split(".")
        let end_ip = res_ip.split(".").reduce(function(new_ip, item, idx){
          if(idx==0){
            return ""+new_ip+(item^re_mask_array[idx])
          }else{
            return new_ip+"."+(item^re_mask_array[idx])
          }
        }, "");
        return res_ip + "-" + end_ip
      }


    },
  	components:{
  	}
  };
</script>

<style>
</style>
