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
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

console.log("用户使用协议类型===", protocol, window.location.protocol)

if(protocol=="http:"){
  Vue.use(new VueSocketIO({
   debug: true,
   connection: 'http://chen.test.com',
   options: { path: '/sock/socket.io' }
  }));
}else{
  Vue.use(new VueSocketIO({
   debug: false,
   connection: 'https://chen.test.com',
   options: { path: '/sock/socket.io' }
  }));
}


const app = new Vue({
  router,
  store: store,
  render: h => h(App)
}).$mount("#app")
