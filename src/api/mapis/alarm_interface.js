import axios from "../axios"
// 先知告警

export default {
  //黑名单接口列表（syslog_black_list，L2黑名单）
  addBlacklist (data, params) {
    return axios.post("/alarm/add_blacklist", data, params)
  },
  delBlacklist (data, params) {
    return axios.post("/alarm/del_blacklist", data, params)
  },
  updateBlacklist (data, params) {
    return axios.post("/alarm/update_blacklist", data, params)
  },
  getBlacklist (data, params) {
    return axios.post("/alarm/get_blacklist", data, params)
  },

  //解析规则接口（syslog_rule，L3匹配规则）
  addRule (data, params) {
    return axios.post("/alarm/add_rule", data, params)
  },
  delRule (data, params) {
    return axios.post("/alarm/del_rule", data, params)
  },
  updateRule (data, params) {
    return axios.post("/alarm/update_rule", data, params)
  },
  getRule (data, params) {
    return axios.post("/alarm/get_rule", data, params)
  },

  //事件属性接口（syslog_event，L5事件属性）
  addEvent (data, params) {
    return axios.post("/alarm/add_event", data, params)
  },
  delEvent (data, params) {
    return axios.post("/alarm/del_event", data, params)
  },
  updateEvent (data, params) {
    return axios.post("/alarm/update_event", data, params)
  },
  getEvent (data, params) {
    return axios.post("/alarm/get_event", data, params)
  },

  //事件定级接口（syslog_severity_rule，L5事件定级）
  addSeverityRule (data, params) {
    return axios.post("/alarm/add_severity_rule", data, params)
  },
  delSeverityRule (data, params) {
    return axios.post("/alarm/del_severity_rule", data, params)
  },
  updateSeverityRule (data, params) {
    return axios.post("/alarm/update_severity_rule", data, params)
  },
  getSeverityRule (data, params) {
    return axios.post("/alarm/get_severity_rule", data, params)
  },

  //告警静默接口（syslog_mute_rule，L8告警静默）
  addMuteRule (data, params) {
    return axios.post("/alarm/add_mute_rule", data, params)
  },
  delMuteRule (data, params) {
    return axios.post("/alarm/del_mute_rule", data, params)
  },
  updateMuteRule (data, params) {
    return axios.post("/alarm/update_mute_rule", data, params)
  },
  getMuteRule (data, params) {
    return axios.post("/alarm/get_mute_rule", data, params)
  },

  //告警相关接口
  getCurrentAlarm (data, params) {
    return axios.post("/alarm/get_current_alarm", data, params)
  },
  getAlarmLogDetail (data, params) {
    return axios.post("/alarm/get_alarm_log_detail", data, params)
  },
  // 按设备查一段时间内的全部原子日志，不限指纹（含没产生告警的）
  getDeviceLogDetail (data, params) {
    return axios.post("/alarm/get_device_log_detail", data, params)
  },
  handleAlarmByIds (data, params) {
    return axios.post("/alarm/handle_alarm_by_ids", data, params)
  },
  getHandleLog (data, params) {
    return axios.post("/alarm/get_handle_log", data, params)
  },
  getHistoryAlarm (data, params) {
    return axios.post("/alarm/get_history_alarm", data, params)
  },
  getAlarmByIds (data, params) {
    return axios.post("/alarm/get_alarm_by_ids", data, params)
  },

}
