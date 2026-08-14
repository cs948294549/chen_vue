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
    console.log("=== WebSocket 调试信息 ===")
    console.log("Socket 对象:", this.$socket)
    console.log("Socket ID:", this.$socket.id)
    console.log("连接状态:", this.$socket.connected)

    this.$socket.open()

    // 监听连接事件
    this.sockets.subscribe('connect', () => {
      console.log("✅ WebSocket 连接成功!")
      console.log("Socket ID:", this.$socket.id)
    })

    this.sockets.subscribe('connect_error', (error) => {
      console.error("❌ WebSocket 连接错误:", error)
    })

    this.sockets.subscribe('disconnect', (reason) => {
      console.warn("⚠️ WebSocket 断开连接:", reason)
    })

    // 查看socket是否连接成功
    console.log("初始连接状态===", this.$socket.connected)

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
