import axios from "axios"
import Cookies from "js-cookie"
import { Message } from "element-ui"
import router from "@/router"
import store from "@/vuex"
import lmd5 from '@/utils/MD5.js'

// axios默认配置
axios.defaults.timeout = 1000000 // 超时时间

axios.defaults.withCredentials = false

// 接口地址走同源相对路径: 浏览器自动补当前页面的 origin, http/https 自适应
// 反代由外层 nginx 的 ^~ /api/ 承担, 换域名/端口无需重新构建
axios.defaults.baseURL = process.env.API_BASE_URL || "/api"

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
  if(response.data.code==403){
    Message({
      message: "用户没有访问页面权限",
      type: "warning"
    })
  }else if(response.data.code==401){
    // 如果是登录接口返回401，不要触发logout（用户本来就没登录），只弹提示让Login.vue自己处理
    if(response.config.url && response.config.url.includes('/system/login')){
      return Promise.resolve(response)
    }
    Message({
      message: "用户登录失效, 请退出重新登录",
      type: "warning"
    })
    store.dispatch("user/logout")
    router.push("/login")
  }else{
    return Promise.resolve(response)
  }
} , error => {
  if (!error.response) {
    // 网络错误或请求被取消
    Message({
      message: "网络连接失败，请检查网络",
      type: "error"
    })
  } else if (error.response.status === 401) {
    Message({
      message: "用户登录失效, 请退出重新登录",
      type: "warning"
    })
    store.dispatch("user/logout")
    router.push("/login")
  } else if (error.response.status === 403) {
    Message({
      message: "用户没有访问页面权限",
      type: "warning"
    })
  } else if (error.response.status === 404) {
    Message({
      message: "请求的资源不存在",
      type: "warning"
    })
  } else if (error.response.status >= 500) {
    Message({
      message: "服务器内部错误，请稍后重试",
      type: "error"
    })
  }
  return Promise.reject(error.response)
})
)

export default axios
