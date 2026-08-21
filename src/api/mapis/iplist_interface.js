import axios from "../axios"

/*
设备IP清单管理相关接口
*/

export default {
  // 获取设备IP清单列表
  getIpList(data, params) {
    return axios.post("/iplist/get_list", data, params)
  },

  // 新增设备IP
  addIp(data, params) {
    return axios.post("/iplist/add", data, params)
  },

  // 修改设备IP
  updateIp(data, params) {
    return axios.post("/iplist/update", data, params)
  },

  // 删除设备IP
  deleteIp(data, params) {
    return axios.post("/iplist/delete", data, params)
  },

  // 批量删除设备IP
  batchDeleteIp(data, params) {
    return axios.post("/iplist/batch_delete", data, params)
  },

  // 批量添加或更新设备IP
  batchAddOrUpdateIp(data, params) {
    return axios.post("/iplist/batch_add_or_update", data, params)
  }
}
