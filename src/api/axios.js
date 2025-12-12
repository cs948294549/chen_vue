import axios from "axios"
import Cookies from "js-cookie"
import { Message } from "element-ui"
import router from "@/router"
import store from "@/vuex"
import lmd5 from '@/utils/MD5.js'

// axios默认配置
axios.defaults.timeout = 1000000 // 超时时间

axios.defaults.withCredentials = false

// const server_port = "localhost:5000"
const server_port = "chen.test.com/api"

const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

// console.log("用户【接口】使用协议类型===", protocol, window.location.protocol)
if(protocol=="http:"){
  axios.defaults.baseURL = "http://"+server_port
}else{
  axios.defaults.baseURL = "https://"+server_port
}

const header_sign = ()=>{
  const secret = Cookies.get("token_sign")
  let current_timestamp = parseInt(new Date().getTime()/1000)
  let sign = lmd5.hex_md5(secret+current_timestamp)
  return {"sign": sign, "timestamp":current_timestamp}
}
// http request 拦截器
axios.interceptors.request.use(config => {
  const token = Cookies.get("access_token")
  if (!config.headers["Content-Type"]){
    config.headers["Content-Type"] = "application/json;charset=UTF-8"
  }
  const sign_info = header_sign()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers["Apptime"] = sign_info["timestamp"]
    config.headers["Sessionid"] = sign_info["sign"]

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
