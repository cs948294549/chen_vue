import axios from "../axios"

/*
变更工单管理相关接口
*/

export default {
  // ==================== 工单类型管理 ====================
  getTypeList(data, params) {
    return axios.post("/op/type/list", data, params)
  },
  addType(data, params) {
    return axios.post("/op/type/add", data, params)
  },
  updateType(data, params) {
    return axios.post("/op/type/update", data, params)
  },
  deleteType(data, params) {
    return axios.post("/op/type/delete", data, params)
  },

  // ==================== 审批分组管理 ====================
  getGroupList(data, params) {
    return axios.post("/op/group/list", data, params)
  },
  addGroup(data, params) {
    return axios.post("/op/group/add", data, params)
  },
  updateGroup(data, params) {
    return axios.post("/op/group/update", data, params)
  },
  deleteGroup(data, params) {
    return axios.post("/op/group/delete", data, params)
  },

  // ==================== 通知群组管理 ====================
  getNotifyList(data, params) {
    return axios.post("/op/notify/list", data, params)
  },
  addNotify(data, params) {
    return axios.post("/op/notify/add", data, params)
  },
  updateNotify(data, params) {
    return axios.post("/op/notify/update", data, params)
  },
  deleteNotify(data, params) {
    return axios.post("/op/notify/delete", data, params)
  },

  // ==================== 工单管理 ====================
  getOrderList(data, params) {
    return axios.post("/op/order/list", data, params)
  },
  getOrderDetail(data, params) {
    return axios.post("/op/order/detail", data, params)
  },
  addOrder(data, params) {
    return axios.post("/op/order/add", data, params)
  },
  updateOrder(data, params) {
    return axios.post("/op/order/update", data, params)
  },
  deleteOrder(data, params) {
    return axios.post("/op/order/delete", data, params)
  },
  copyOrder(data, params) {
    return axios.post("/op/order/copy", data, params)
  },

  // ==================== 工单流程操作 ====================
  submitOrder(data, params) {
    return axios.post("/op/order/submit", data, params)
  },
  takeoverOrder(data, params) {
    return axios.post("/op/order/takeover", data, params)
  },
  approveOrder(data, params) {
    return axios.post("/op/order/approve", data, params)
  },
  startChange(data, params) {
    return axios.post("/op/order/start", data, params)
  },
  finishChange(data, params) {
    return axios.post("/op/order/finish", data, params)
  },
  executeBatch(data, params) {
    return axios.post("/op/order/execute/batch", data, params)
  },
  executeDevice(data, params) {
    return axios.post("/op/order/execute/device", data, params)
  },
  rollbackOrder(data, params) {
    return axios.post("/op/order/rollback", data, params)
  },
  rollbackDevice(data, params) {
    return axios.post("/op/order/rollback/device", data, params)
  },
  cancelOrder(data, params) {
    return axios.post("/op/order/cancel", data, params)
  },

  // ==================== 设备命令管理 ====================
  getDeviceList(data, params) {
    return axios.post("/op/device/list", data, params)
  },
  addDevice(data, params) {
    return axios.post("/op/device/add", data, params)
  },
  updateDevice(data, params) {
    return axios.post("/op/device/update", data, params)
  },
  deleteDevice(data, params) {
    return axios.post("/op/device/delete", data, params)
  },

  // ==================== 日志查询 ====================
  getLogList(data, params) {
    return axios.post("/op/log/list", data, params)
  },
  getApprovalList(data, params) {
    return axios.post("/op/approval/list", data, params)
  }
}
