import axios from "../axios"

/*
地址前缀列表管理相关接口
*/

export default {
  // ==================== 规则制定（Standards） ====================

  // 获取标准规则列表
  getStandardsList(data, params) {
    return axios.post("/prefix_list/standards/list", data, params)
  },

  // 创建标准规则
  createStandard(data, params) {
    return axios.post("/prefix_list/standards/create", data, params)
  },

  // 更新标准规则
  updateStandard(data, params) {
    return axios.post("/prefix_list/standards/update", data, params)
  },

  // 删除标准规则
  deleteStandard(data, params) {
    return axios.post("/prefix_list/standards/delete", data, params)
  },

  // 切换标准规则启用状态
  toggleStandardActive(data, params) {
    return axios.post("/prefix_list/standards/toggle_active", data, params)
  },

  // 获取标准规则的设备应用统计
  getStandardStatistics(data, params) {
    return axios.post("/prefix_list/standards/statistics", data, params)
  },

  // 获取标准规则关联的设备列表
  getStandardDeviceList(data, params) {
    return axios.post("/prefix_list/standards/device_list", data, params)
  },

  // ==================== 规则记录（Records） ====================

  // 获取设备配置记录列表
  getRecordsList(data, params) {
    return axios.post("/prefix_list/records/list", data, params)
  },

  // ==================== 问题处理记录（Issues） ====================

  // 获取问题处理记录列表
  getIssueRecordsList(data, params) {
    return axios.post("/prefix_list/issues/list", data, params)
  },

  // 批量创建问题处理记录
  batchCreateIssueRecords(data, params) {
    return axios.post("/prefix_list/issues/batch_create", data, params)
  },

  // 创建新的问题处理记录（手动创建）
  createNewIssue(data, params) {
    return axios.post("/prefix_list/issues/new_issue", data, params)
  },

  // 删除问题处理记录
  deleteIssueRecord(data, params) {
    return axios.post("/prefix_list/issues/delete", data, params)
  },

  // 更新问题处理记录状态
  updateIssueStatus(data, params) {
    return axios.post("/prefix_list/issues/update_status", data, params)
  },

  // 获取问题处理统计
  getIssueStatistics(data, params) {
    return axios.post("/prefix_list/issues/statistics", data, params)
  },

  // 文本对比
  compareTextDiff(data, params) {
    return axios.post("/prefix_list/compare/text_diff", data, params)
  },

  // ==================== 变更工单（Change Order） ====================

  // 创建变更工单
  createChangeOrder(data, params) {
    return axios.post("/prefix_list/change_order/create", data, params)
  }
}
