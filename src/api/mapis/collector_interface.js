import axios from "../axios"

/*
设备白屏变更相关接口

*/

export default {
  //snmp接口 fast_snmpget
  getSNMPGET(data, params) {
    return axios.post("/collector/snmp_get", data, params)
  },
  getSNMPWALK(data, params) {
    return axios.post("/collector/snmp_walk", data, params)
  },
  //collector相关数据
  findDevs (data, params) {
    return axios.post("/collector/getfullsearch", data, params)
  },
  getDevs (data, params) {
    return axios.post("/collector/getdeviceslist", data, params)
  },
  getPorts_ex (data, params) {
    return axios.post("/collector/getports_ex", data, params)
  },
  getLLDPS (data, params) {
    return axios.post("/collector/getlldps", data, params)
  },

  getARPList (data, params) {
    return axios.post("/collector/getarp_list", data, params)
  },
  getGateV4List (data, params) {
    return axios.post("/collector/gates_v4", data, params)
  },
  getGateV6List (data, params) {
    return axios.post("/collector/gates_v6", data, params)
  },
  getMACList (data, params) {
    return axios.post("/collector/get_torarp", data, params)
  },
  getSNList (data, params) {
    return axios.post("/collector/getdevice_sn", data, params)
  },

  //command相关数据
  getCurrentInterface (data, params) {
    return axios.post("/command/dis_cur_interface", data, params)
  },
  getInterface (data, params) {
    return axios.post("/command/dis_interface", data, params)
  },
  getTransceiver (data, params) {
    return axios.post("/command/dis_transceiver", data, params)
  },
  getLogging (data, params) {
    return axios.post("/command/dis_logging", data, params)
  },
  getARPs (data, params) {
    return axios.post("/command/dis_arp", data, params)
  },
  getRoutes (data, params) {
    return axios.post("/command/dis_routes", data, params)
  },
  getCommonFunction (data, params) {
    return axios.post("/command/dis_common", data, params)
  },
  execDiyCmds(data, params) {
    return axios.post("/command/exec_dev_cmds", data, params)
  },

  // SSH 终端相关接口
  createSSHSession(data, params) {
    return axios.post("/webssh/create_session", data, params)
  },
  sendSSH(data, params) {
    return axios.post("/webssh/send_command", data, params)
  },
  closeSSHSession(data, params) {
    return axios.post("/webssh/close_session", data, params)
  },
  getSSHSessionStatus(params) {
    return axios.get("/webssh/session_status", { params: params })
  },

}
