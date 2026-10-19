import axios from "../axios"

/*
ACL 管理相关接口（含地址组、端口组）
*/

export default {
  // ==================== 规则制定（Standards） ====================

  // 获取标准规则列表
  getStandardsList(data, params) {
    return axios.post("/acl/standards/list", data, params)
  },

  // 获取标准规则详情
  getStandardDetail(data, params) {
    return axios.post("/acl/standards/detail", data, params)
  },

  // 创建标准规则
  createStandard(data, params) {
    return axios.post("/acl/standards/create", data, params)
  },

  // 更新标准规则
  updateStandard(data, params) {
    return axios.post("/acl/standards/update", data, params)
  },

  // 删除标准规则
  deleteStandard(data, params) {
    return axios.post("/acl/standards/delete", data, params)
  },

  // 获取标准规则的设备应用统计
  getStandardStatistics(data, params) {
    return axios.post("/acl/standards/statistics", data, params)
  },

  // 获取标准规则关联的设备列表
  getStandardDeviceList(data, params) {
    return axios.post("/acl/standards/device_list", data, params)
  },

  // ==================== 地址组（AddrGroup） ====================

  // 获取地址组标准规则列表
  getAddrGroupList(data, params) {
    return axios.post("/acl/addrgroup/standards/list", data, params)
  },

  // 获取地址组标准规则详情
  getAddrGroupDetail(data, params) {
    return axios.post("/acl/addrgroup/standards/detail", data, params)
  },

  // 创建地址组标准规则
  createAddrGroup(data, params) {
    return axios.post("/acl/addrgroup/standards/create", data, params)
  },

  // 更新地址组标准规则
  updateAddrGroup(data, params) {
    return axios.post("/acl/addrgroup/standards/update", data, params)
  },

  // 删除地址组标准规则
  deleteAddrGroup(data, params) {
    return axios.post("/acl/addrgroup/standards/delete", data, params)
  },

  // 获取地址组标准的设备应用统计
  getAddrGroupStatistics(data, params) {
    return axios.post("/acl/addrgroup/standards/statistics", data, params)
  },

  // 获取地址组标准关联的设备列表
  getAddrGroupDeviceList(data, params) {
    return axios.post("/acl/addrgroup/standards/device_list", data, params)
  },

  // 获取地址组的设备配置记录列表
  getAddrGroupRecordsList(data, params) {
    return axios.post("/acl/addrgroup/records/list", data, params)
  },

  // 地址组配置文本对比
  compareAddrGroupTextDiff(data, params) {
    return axios.post("/acl/addrgroup/compare/text_diff", data, params)
  },

  // 批量创建地址组问题处理记录
  batchCreateAddrGroupIssueRecords(data, params) {
    return axios.post("/acl/addrgroup/issues/batch_create", data, params)
  },

  // ==================== 端口组（PortGroup） ====================

  // 获取端口组标准规则列表
  getPortGroupList(data, params) {
    return axios.post("/acl/portgroup/standards/list", data, params)
  },

  // 获取端口组标准规则详情
  getPortGroupDetail(data, params) {
    return axios.post("/acl/portgroup/standards/detail", data, params)
  },

  // 创建端口组标准规则
  createPortGroup(data, params) {
    return axios.post("/acl/portgroup/standards/create", data, params)
  },

  // 更新端口组标准规则
  updatePortGroup(data, params) {
    return axios.post("/acl/portgroup/standards/update", data, params)
  },

  // 删除端口组标准规则
  deletePortGroup(data, params) {
    return axios.post("/acl/portgroup/standards/delete", data, params)
  },

  // 获取端口组标准的设备应用统计
  getPortGroupStatistics(data, params) {
    return axios.post("/acl/portgroup/standards/statistics", data, params)
  },

  // 获取端口组标准关联的设备列表
  getPortGroupDeviceList(data, params) {
    return axios.post("/acl/portgroup/standards/device_list", data, params)
  },

  // 获取端口组的设备配置记录列表
  getPortGroupRecordsList(data, params) {
    return axios.post("/acl/portgroup/records/list", data, params)
  },

  // 端口组配置文本对比
  comparePortGroupTextDiff(data, params) {
    return axios.post("/acl/portgroup/compare/text_diff", data, params)
  },

  // 批量创建端口组问题处理记录
  batchCreatePortGroupIssueRecords(data, params) {
    return axios.post("/acl/portgroup/issues/batch_create", data, params)
  },

  // ==================== 设备配置记录（Records） ====================

  // 获取设备配置记录列表
  getRecordsList(data, params) {
    return axios.post("/acl/records/list", data, params)
  },

  // ==================== 问题处理记录（Issues） ====================

  // 批量创建问题处理记录（配置管理弹窗勾选设备后调用）
  batchCreateIssues(data, params) {
    return axios.post("/acl/issues/batch_create", data, params)
  },

  // 配置文本对比
  compareTextDiff(data, params) {
    return axios.post("/acl/compare/text_diff", data, params)
  }
}
