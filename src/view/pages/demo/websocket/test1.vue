<template>
  <div>
    <div>测试页面1</div>
    <div><el-button type="primary" @click="subSock('aaa')">取消</el-button></div>
  </div>
</template>

<script>

export default {
  name: "TopMenu",
  data () {
    return {}
  },
  mounted () {
    this.$socket.open()
    // 查看socket是否连接成功
    console.log("连接状态===", this.$socket.connected)
    this.sockets.subscribe('submitData', (data) => {
    	console.log("recv===", data)
    })
    
  },
  beforeDestroy() {
  	this.sockets.unsubscribe('aaa');
    this.$socket.close()
  },
  methods: {
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
