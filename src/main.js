import Vue from "vue"
import App from "@/App.vue"
import router from "@/router"
import store from "@/vuex"
import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"
import "@/assets/global.css"
import '@/router/permission.js';

Vue.use(ElementUI)


import VueSocketIO from 'vue-socket.io'
import SocketIO from "socket.io-client";
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

console.log("用户使用协议类型===", protocol, window.location.protocol)

if(protocol=="http:"){
  Vue.use(new VueSocketIO({
   debug: true,
   connection: SocketIO("http://chen.test.com/sock/", {
    autoConnect: false ,// 自动连接
    }),
   options: { path: '/socket.io' },
   extraHeaders: { "Access-Control-Allow-Origin": "*" }
  }));
}else{
  Vue.use(new VueSocketIO({
   debug: false,
   connection: 'https://chen.test.com/sock/',
   options: { path: '/sock/socket.io' },
   extraHeaders: { "Access-Control-Allow-Origin": "*" }
  }));
}



const app = new Vue({
  router,
  store: store,
  render: h => h(App)
}).$mount("#app")
