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

  // 网段树文件夹
  getFolderList(data, params) {
    return axios.post("/ipam/folder/list", data, params)
  },
  addFolder(data, params) {
    return axios.post("/ipam/folder/add", data, params)
  },
  updateFolder(data, params) {
    return axios.post("/ipam/folder/update", data, params)
  },
  deleteFolder(data, params) {
    return axios.post("/ipam/folder/delete", data, params)
  },
  moveToFolder(data, params) {
    return axios.post("/ipam/folder/move", data, params)
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
