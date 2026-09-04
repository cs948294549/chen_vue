import axios from "../axios"

/*
配置备份和对比相关接口
*/

export default {
  // 获取配置备份列表
  getConfigList(data, params) {
    return axios.post("/config/get_list", data, params)
  },

  // 获取配置详情
  getConfigDetail(data, params) {
    return axios.post("/config/get_detail", data, params)
  },

  // 对比两个配置
  compareConfigs(data, params) {
    return axios.post("/config/compare", data, params)
  },

  // 获取最新配置
  getLatestConfig(data, params) {
    return axios.post("/config/get_latest", data, params)
  },

  // 删除配置记录
  deleteConfig(data, params) {
    return axios.post("/config/delete", data, params)
  }
}
