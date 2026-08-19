<template>
  <div>
    <div style="display: flex;justify-content: space-between;width:100%">
      <div>
        <span>{{target_ip}}</span>
      </div>
      <div>
        <el-button size="mini" type="text" @click="downloadTask(target_ip)">下载日志</el-button>
        <el-button size="mini" icon="el-icon-close" type="plain" circle @click="closeWeb(target_ip)"></el-button>
      </div>
    </div>
    <div :id="'xterm_'+target_ip" class="xterm" style="width: 800px;"></div>
    <div>
      <el-divider style="margin: 5px 0;"></el-divider>
      <div style="display: flex;">
        <el-input
          type="textarea"
          :rows='2'
          resize="none"
          placeholder="粘贴的命令在此出入"
          v-model="cmd_edit"
          @keyup.enter.native="sendAll"
          clearable></el-input>
        <div style="margin: auto 0;">
          <el-button size="mini" type="text" @click="sendAll">发送</el-button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
  import { Terminal } from 'xterm';
  import 'xterm/css/xterm.css';
  import collector_api from "@/api/mapis/collector_interface.js"


  export default {
    name: 'Xterm',
    props:{
    	//传递的json数据，填充表格
      target_ip:{
      	type:String,
      	default:()=>{
      		// return "10.220.17.122";
          return "";
      	}
      },
    },
    data(){
      return {
        term:"",
        ssh_session:"",
        term_cache:"",
        shift_down:false,
        ctrl_down:false,
        cache_clear_flag:false,
        cmd_edit:"",
        cmd_show:"",
      }
    },
	created() {
		this.$socket.open()
		// 查看socket是否连接成功
		this.$socket.connected
	},
    mounted() {
      this.initTerm()
      console.log(JSON.stringify(this.$store.getters["user/user_info"]))
      
      let user = this.$store.getters["user/user_info"].username
      this.ssh_session = user + "_" + this.target_ip
      let cache = localStorage.getItem(this.ssh_session);
      if(typeof(cache)=="string"){
        this.cmd_show = cache
        this.term.write(this.cmd_show)
      }

      // 订阅 WebSocket 频道接收终端输出
      this.sockets.subscribe(this.ssh_session, (data) => {
        this.cmd_show = this.cmd_show + data
        this.term.write(data)
      })

      // 创建 SSH 会话
      this.createSession()
    },
    beforeDestroy() {
      if(this.cache_clear_flag===false){
        localStorage.setItem(this.ssh_session, this.cmd_show);
      }

      // 关闭 SSH 会话
      let user = this.$store.getters["user/user_info"].username
      collector_api.closeSSHSession({
        ip: this.target_ip,
        user: user
      }).then(response => {
        console.log('SSH 会话已关闭:', response.data)
      }).catch(error => {
        console.error('关闭 SSH 会话失败:', error)
      })

      this.term.dispose()
      this.sockets.unsubscribe(this.ssh_session)
      this.$socket.close()
    },
    methods: {
      initTerm() {
        const term = new Terminal({
          fontSize: 14,
          cols: 100,
          rows: 40,
          cursorBlink: true
        });
        // console.log(term)

        term.open(document.getElementById('xterm_'+this.target_ip));
        // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        term.focus();
        document.getElementById('xterm_'+this.target_ip).addEventListener('keydown', e => e.stopPropagation());
        term.onKey((val) => {
          // console.log("===",val)
          // term.write(val);
          if(/[\u0000-\u001f\u007f-\u00ff]/g.test(val["key"])){
            // console.log("控制字符",val["key"])
            switch(val["key"]){
              case "\r": this.enter_key_down();break;
              // case "\u001b[A": this.up_key_down();break;
              // case "\u001b[B": this.down_key_down();break;
              case "\u0003": this.ctrl_c_down();break;
              case "\u0015": this.ctrl_u_down();break;
              case "\u0018": this.ctrl_x_down();break;
              case "\u007f": this.back_space_down();break;
              case "\t": this.tab_key_down();break;
              // default: console.log(val["key"]);
              default: ;
            }
          }else{
            if(val["key"]=="?"){
              this.q_key_down()
            }else if(val["key"]==" "){
              this.space_key_down()
            }else{
              term.write(val["key"])
              this.term_cache=this.term_cache+val["key"]
            }
          }
        });
        this.term = term
      },

      // 创建 SSH 会话
      createSession() {
        let user = this.$store.getters["user/user_info"].username
        collector_api.createSSHSession({
          ip: this.target_ip,
          user: user
        }).then(response => {
          console.log('SSH 会话已创建:', response.data)
        }).catch(error => {
          console.error('创建 SSH 会话失败:', error)
          this.$message({
            type: 'error',
            message: 'SSH 会话创建失败'
          })
        })
      },

      enter_key_down(){
        // console.log("执行命令", this.extract_promt())
        // let current_cmd = this.extract_promt()
        // if(/more/ig.test(current_cmd)){
        //   this.sendCMD("", "0a")
        // }else if(current_cmd.length>0){
        //   // this.sendCMD("", "03")
        //   this.sendCMD("", "15")
        //   this.sendCMD("", "18")
        //   this.sendCMD(current_cmd, "0a")
        //   this.term.write("\u001b["+current_cmd.length+"D\u001b[J")
        // }else{
        //   this.sendCMD("", "0a")
        // }

        this.sendCMD(this.term_cache, "0a")
        if(this.term_cache.length>0){
          this.term.write("\u001b["+this.term_cache.length+"D\u001b[J")
          this.term_cache = ""
        }

      },

      extract_promt(){
        // console.log(this.term.selectAll())
        this.term.selectAll()
        let choose_data = this.term.getSelection()
        this.term.clearSelection()
        // console.log("++++", choose_data)
        let array_strs = choose_data.replace(/^\s*|\s*$/g,"").split("\n")

        let promt = array_strs[array_strs.length-1].split(/[>\]#]/g)
        let pp = promt[promt.length-1]
        // console.log(",,,,",pp)
        // console.log("----", array_strs)

        return array_strs[array_strs.length-1]
      },

      up_key_down(){
        this.sendCMD("", "1b5b41")
        this.term_cache = ""
      },
      down_key_down(){
        this.sendCMD("", "1b5b42")
        this.term_cache = ""
      },
      ctrl_c_down(){
        this.sendCMD("", "03")
        this.term_cache = ""
      },
      ctrl_u_down(){
        if(this.term_cache.length>0){
          this.term.write("\u001b["+this.term_cache.length+"D\u001b[J")
          this.sendCMD(this.term_cache, "15")
          this.term_cache = ""
        }
      },
      ctrl_x_down(){
        if(this.term_cache.length>0){
          this.term.write("\u001b["+this.term_cache.length+"D\u001b[J")
          this.sendCMD(this.term_cache, "18")
          this.term_cache = ""
        }
      },
      back_space_down(){
        this.sendCMD("", "7f")
        if(this.term_cache.length>0){
          this.term.write("\u001b[1D\u001b[J")
          this.term_cache = this.term_cache.slice(0,-1)
        }

      },
      // tab键处理
      tab_key_down(){
        if(this.term_cache.length>0){
          this.term.write("\u001b["+this.term_cache.length+"D\u001b[J")
        }
        this.sendCMD(this.term_cache, "09")
        this.term_cache=""
      },

      // ? 处理
      q_key_down(){
        this.sendCMD(this.term_cache+"?", "00")
        this.term_cache=""
      },
      // 空格处理
      space_key_down(){
        const tail = this.cmd_show.slice(-60).replace(/[^\x20-\x7e]/g, '')
        if(/more/i.test(tail)){
          this.sendCMD(" ", "00")
        }else{
          this.term.write(" ")
          this.term_cache=this.term_cache+" "
        }
      },


      sendCMD(cmd, padding){
        let post_data = {}
        post_data["ip"] = this.target_ip
        post_data["cmd"] = cmd
        post_data["user"] = this.$store.getters["user/user_info"].username
        if(padding){
          post_data["padding"] = ""+padding
        }
        collector_api.sendSSH(post_data, {}).then(response => {
          // console.log("命令发送成功:", response.data)
        }).catch(error => {
            console.log(error)

            // 检查是否是 403 命令被拦截
            if (error && error.status === 403) {
              this.$message({
                type: 'warning',
                message: error.data.message || '只允许执行 show 或 display 开头的查询命令',
                duration: 3000
              });
              // 在终端显示错误提示
              this.term.write('\r\n\x1b[1;31m错误: 只允许执行 show 或 display 开头的查询命令\x1b[0m\r\n');
            } else {
              this.$message({
                type: 'error',
                message: '命令发送失败，请重试'
              });
            }
        })
      },
      downloadTask(){
        // console.log(this.term.selectAll())
        // let choose_data = this.term.getSelection()
        // this.term.clearSelection()
        // console.log("++++",choose_data)
        var fileName = "log_"+this.ssh_session+".log"

        this.cmd_show=this.cmd_show.replace(
                  // eslint-disable-next-line no-control-regex
                  /[\u001b\u009b][[\]()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-ORZcf-nqry=><;]/g,
                  ''
                )

        let blob = new Blob([this.cmd_show], { type: 'text/plain' })
        let link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = fileName
        link.click()
        link.remove()
      },
      closeWeb(target){
        // console.log("========",target)
        this.cache_clear_flag=true;
        localStorage.removeItem(this.ssh_session)
        this.$emit("close_session",target);
      },
      sendAll(){
        this.sendCMD(this.cmd_edit.replace(/^\s*|\s*$/g,""), "0a")
        this.cmd_edit=""
      },

    }
  }
</script>

<style>
</style>
