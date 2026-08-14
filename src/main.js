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
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const socketUrl = process.env.SOCKET_URL || "netops.vdian.net"
const socketPath = process.env.SOCKET_PATH || "/sock/socket.io"

console.log("WebSocket连接地址===", `${protocol}//${socketUrl}`, "路径===", socketPath)

Vue.use(new VueSocketIO({
  debug: true,
  connection: SocketIO(`${protocol}//${socketUrl}`, {path: socketPath}),
}));



const app = new Vue({
  router,
  store: store,
  render: h => h(App)
}).$mount("#app")
