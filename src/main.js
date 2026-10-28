import Vue from "vue"
import App from "@/App.vue"
import router from "@/router"
import store from "@/vuex"
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"
import "@/assets/global.css"
import '@/router/permission.js';

Vue.use(ElementUI)


//全局使用websocket
import VueSocketIO from 'vue-socket.io'
import SocketIO from "socket.io-client";

// 从环境变量读取 WebSocket 配置
// socketUrl 默认取当前页面的 origin, 域名/端口/协议自动跟随
const socketUrl = process.env.SOCKET_URL || window.location.origin
const socketPath = process.env.SOCKET_PATH || "/sock/socket.io"

console.log("WebSocket连接地址===", socketUrl, "路径===", socketPath)

Vue.use(new VueSocketIO({
  debug: true,
  connection: SocketIO(socketUrl, {path: socketPath}),
}));



const app = new Vue({
  router,
  store: store,
  render: h => h(App)
}).$mount("#app")
