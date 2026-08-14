import axios from "../axios"
// 先知告警

export default {
  checkBlackList (data, params) {
    return axios.post("/alarm/check_blacklist", data, params)
  },
  checkMergeList (data, params) {
    return axios.post("/alarm/check_mergelist", data, params)
  },

  //黑名单接口列表
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

  //聚合规则接口
  addMergelist (data, params) {
    return axios.post("/alarm/add_mergelist", data, params)
  },
  delMergelist (data, params) {
    return axios.post("/alarm/del_mergelist", data, params)
  },
  updateMergelist (data, params) {
    return axios.post("/alarm/update_mergelist", data, params)
  },
  getMergelist (data, params) {
    return axios.post("/alarm/get_mergelist", data, params)
  },

  //告警相关接口
  getCurrentAlarm (data, params) {
    return axios.post("/alarm/get_current_alarm", data, params)
  },
  getAlarmByGroup (data, params) {
    return axios.post("/alarm/get_alarm_by_group", data, params)
  },
  handleAlarmByGroup (data, params) {
    return axios.post("/alarm/handle_alarm_by_group", data, params)
  },
  getAlarmLog (data, params) {
    return axios.post("/alarm/get_alarm_log", data, params)
  },
  getHistoryAlarm (data, params) {
    return axios.post("/alarm/get_history_alarm", data, params)
  },
  getLogByGroup (data, params) {
    return axios.post("/alarm/get_log_by_group", data, params)
  },

}
