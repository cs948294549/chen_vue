import Vue from "vue"
import Vuex from "vuex"
import allMenu from "./module/allMenus.js"
import user from "./module/user.js"
import tabnav from "./module/tabNav.js"

// 安装 Vuex 插件
Vue.use(Vuex)

// 创建 store 实例
const store = new Vuex.Store({
  // 状态
  state: {},
  // 变更状态的方法，必须是同步的
  mutations: {},
  // 异步操作，可调用 mutations 中的方法
  actions: {},
  // 获取状态的计算属性
  getters: {},
  // 模块
  modules: {
    "allMenu": allMenu,
    "user": user,
    "tabnav": tabnav
  }
})

export default store
