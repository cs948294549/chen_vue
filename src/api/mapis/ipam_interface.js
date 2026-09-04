import axios from "../axios"

/*
IPAM 地址管理相关接口
*/

export default {
  // 网络地址管理
  addNetworkAddress(data, params) {
    return axios.post("/ipam/add_address", data, params)
  },
  batchAddNetworkAddress(data, params) {
    return axios.post("/ipam/batch_add_address", data, params)
  },
  updateNetworkAddress(data, params) {
    return axios.post("/ipam/update_address", data, params)
  },
  deleteNetworkAddress(data, params) {
    return axios.post("/ipam/del_address", data, params)
  },
  getNetworkAddressList(data, params) {
    return axios.post("/ipam/get_address", data, params)
  },
  getNetworkAddressTree(data, params) {
    return axios.post("/ipam/get_address_tree", data, params)
  },

  // IP地址管理
  getIpamAddressList(data, params) {
    return axios.post("/ipam/get_ipam_address", data, params)
  },
  batchAddIpamAddress(data, params) {
    return axios.post("/ipam/batch_add_ipaddr", data, params)
  },

  deleteIpamAddress(data, params) {
    return axios.post("/ipam/del_ipam_address", data, params)
  }
}
