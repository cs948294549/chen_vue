import axios from "../axios"
// 先知告警

export default {
  checkDiffText (data, params) {
    return axios.post("/tools/check_diff", data, params)
  },
  mergeNetworkList (data, params) {
    return axios.post("/tools/network_merge", data, params)
  },
}
