import axios from "../axios"
// 先知告警

export default {

  findAlarm (data, params) {
    return axios.post("/forward/auto_config_alarm_find", data, params)
  },
  addAlarm (data, params) {
    return axios.post("/forward/auto_config_alarm_add", data, params)
  },
  delAlarm (data, params) {
    return axios.post("/forward/auto_config_alarm_delete", data, params)
  },
  updateAlarm (data, params) {
    return axios.post("/forward/auto_config_alarm_update", data, params)
  },

}