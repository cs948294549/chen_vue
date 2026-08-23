import axios from "../axios"

/*
拓扑管理相关接口
*/

export default {
  // 获取拓扑列表
  getTopologyList(data, params) {
    return axios.post("/topology/list", data, params)
  },

  // 获取拓扑详情
  getTopologyDetail(data, params) {
    return axios.post("/topology/detail", data, params)
  },

  // 创建拓扑
  createTopology(data, params) {
    return axios.post("/topology/create", data, params)
  },

  // 更新拓扑
  updateTopology(data, params) {
    return axios.post("/topology/update", data, params)
  },

  // 删除拓扑
  deleteTopology(data, params) {
    return axios.post("/topology/delete", data, params)
  }
}
