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
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

// console.log("用户使用协议类型===", protocol, window.location.protocol)

if(protocol=="http:"){
  Vue.use(new VueSocketIO({
   debug: true,
   connection: SocketIO('http://47.98.235.241:80', {path:'/sock/socket.io'}),
  }));
}else{
  Vue.use(new VueSocketIO({
   debug: true,
   connection: SocketIO('https://47.98.235.241:80', {path:'/sock/socket.io'}),
  }));
}


const app = new Vue({
  router,
  store: store,
  render: h => h(App)
}).$mount("#app")
