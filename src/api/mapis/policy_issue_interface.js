import axios from "../axios"

/*
策略配置问题处理记录统一接口（跨 object_type）
*/

export default {
  // 获取问题处理记录列表（支持 object_type 筛选）
  getIssueRecordsList(data, params) {
    return axios.post("/policy/issues/list", data, params)
  },

  // 获取问题记录详情
  getIssueRecordDetail(data, params) {
    return axios.post("/policy/issues/detail", data, params)
  },

  // 删除问题记录
  deleteIssueRecord(data, params) {
    return axios.post("/policy/issues/delete", data, params)
  },

  // 更新问题记录状态
  updateIssueStatus(data, params) {
    return axios.post("/policy/issues/update_status", data, params)
  },

  // 配置差异对比（issue_id 或 standard_id+device_ip 或直接传 src_entries+target_entries）
  compareTextDiff(data, params) {
    return axios.post("/policy/issues/compare/text_diff", data, params)
  },

  // 创建变更工单
  createChangeOrder(data, params) {
    return axios.post("/policy/issues/change_order/create", data, params)
  },

  // 创建新的问题处理记录（手动创建）
  createNewIssue(data, params) {
    return axios.post("/policy/issues/new_issue", data, params)
  },

  // 基于设备最新备份配置重新解析（object_type + device_ip）
  recollectDevice(data, params) {
    return axios.post("/policy/issues/recollect", data, params)
  }
}
