import axios from "axios"
import Cookies from "js-cookie"
import { Message } from "element-ui"
import router from "@/router"
import store from "@/vuex"

// axios默认配置
axios.defaults.timeout = 1000000 // 超时时间

axios.defaults.withCredentials = false

// const server_port = "localhost:28003"
const server_port = "chen.test.com"

const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

console.log("用户【接口】使用协议类型===", protocol, window.location.protocol)
if(protocol=="http:"){
  axios.defaults.baseURL = "http://"+server_port+"/api"
}else{
  axios.defaults.baseURL = "https://"+server_port+"/api"
}


// http request 拦截器
axios.interceptors.request.use(config => {
  if (!config.headers["Content-Type"]){
    config.headers["Content-Type"] = "application/json;charset=UTF-8"
  }

  if (Cookies.get("access_token")) {
    config.headers.sessionID = Cookies.get("access_token")
  }
  return config
}, error => {
  return Promise.reject(error.response)
},


// http response 拦截器
axios.interceptors.response.use(response => {
  return Promise.resolve(response)
} , error => {
  if (!error.response) {
  } else if (error.response.status === 404) {
  } else if (error.response.status === 401) {
    Message({
      message: "用户登录失效, 请退出重新登录",
      type: "warning"
    })
    store.dispatch("setToken", null)
    Cookies.remove("access_token")
    router.push("/login")
  } else if (error.response.status === 403) {
    Message({
      message: "用户没有访问页面权限",
      type: "warning"
    })
    store.dispatch("setToken", null)
    Cookies.remove("access_token")
  } else {
  }
  return Promise.reject(error.response) // 返回接口返回的错误信息
})
)

export default axios
