import axios from "../axios"

/*
流量看板管理相关接口
*/

export default {
  // 获取看板列表
  getFlowList(data, params) {
    return axios.post("/flowboard/list", data, params)
  },

  // 获取看板详情
  getFlowDetail(data, params) {
    return axios.post("/flowboard/detail", data, params)
  },

  // 创建看板
  createFlow(data, params) {
    return axios.post("/flowboard/create", data, params)
  },

  // 更新看板
  updateFlow(data, params) {
    return axios.post("/flowboard/update", data, params)
  },

  // 删除看板
  deleteFlow(data, params) {
    return axios.post("/flowboard/delete", data, params)
  }
}
