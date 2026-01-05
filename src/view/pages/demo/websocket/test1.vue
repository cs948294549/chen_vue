<template>
  <div>
    <div>测试页面1</div>
    <div><el-button type="primary" @click="subSock('aaa')">取消</el-button></div>
  </div>
</template>

<script>
import op_api from "@/api/mapis/1demo_interface.js"

export default {
  name: "TopMenu",
  data () {
    return {}
  },
  mounted () {
    this.test()
    this.$socket.open()
    // 查看socket是否连接成功
    console.log("连接状态===", this.$socket.connected)
    this.sockets.subscribe('aaa', (data) => {
    	console.log("recv===", data)
    })
    
  },
  beforeDestroy() {
  	this.sockets.unsubscribe('aaa');
    this.$socket.close()
  },
  methods: {
    test(){
      let that = this
      op_api.test({"op_id":1},{}).then(function(response){
        console.log("工单详情",response.data)
        that.$message({
          type: 'success',
          message: '查询成功'
        });
      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
    subSock() {
        // 提交数据到服务器
        console.log("发送数据", this.$socket)
        this.$socket.emit('submitData', "asdad");
    },
  },
  components: {}
}
</script>

<style>
</style>
