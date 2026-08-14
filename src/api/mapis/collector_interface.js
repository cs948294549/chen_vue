import axios from "../axios"

/*
设备白屏变更相关接口

*/

export default {
  findDevs (data, params) {
    return axios.post("/collector/getfullsearch", data, params)
  },



  getDevs (data, params) {
    return axios.post("/forward/snmpdata_getdeviceslist", data, params)
  },
  getLLDPS (data, params) {
    return axios.post("/forward/snmpdata_getlldps", data, params)
  },
  getPorts (data, params) {
    return axios.post("/forward/snmpdata_getportinfo", data, params)
  },
  getPorts_ex (data, params) {
    return axios.post("/forward/snmpdata_getex_portinfo", data, params)
  },
  getCurrentInterface (data, params) {
    return axios.post("/forward/command_dis_cur_interface", data, params)
  },
  getInterface (data, params) {
    return axios.post("/forward/command_dis_interface", data, params)
  },
  getTransceiver (data, params) {
    return axios.post("/forward/command_dis_transceiver", data, params)
  },
  getLogging (data, params) {
    return axios.post("/forward/command_dis_logging", data, params)
  },
  getARPs (data, params) {
    return axios.post("/forward/command_dis_arp", data, params)
  },
  getRoutes (data, params) {
    return axios.post("/forward/command_dis_routes", data, params)
  },

  getCommonFunction (data, params) {
    return axios.post("/forward/command_dis_common", data, params)
  },


  setInterfaceStatus(data, params) {
    return axios.post("/forward/config_interface_status", data, params)
  },
  setDeviceSflow(data, params) {
    return axios.post("/forward/config_device_sflow", data, params)
  },
  setInterfaceSflow(data, params) {
    return axios.post("/forward/config_interface_sflow", data, params)
  },

  setCreateVlans(data, params) {
    return axios.post("/forward/config_create_vlan", data, params)
  },
  setLinkType(data, params) {
    return axios.post("/forward/config_change_link_type", data, params)
  },
  setAccessVlans(data, params) {
    return axios.post("/forward/config_access_vlans", data, params)
  },
  setTrunkVlans(data, params) {
    return axios.post("/forward/config_trunk_vlans", data, params)
  },

  setCreateBaggs(data, params) {
    return axios.post("/forward/config_config_bagg_port", data, params)
  },
  addPortBaggs(data, params) {
    return axios.post("/forward/config_add_bagg_port", data, params)
  },

  execDiyCmds(data, params) {
    return axios.post("/forward/config_exec_dev_cmds", data, params)
  },



  getArrangeConfigLog(data, params) {
    return axios.post("/forward/arrange_get_config_log", data, params)
  },
  delArrangeConfigLog(data, params) {
    return axios.post("/forward/arrange_del_config_log", data, params)
  },
  doneArrangeConfigLog(data, params) {
    return axios.post("/forward/arrange_done_config_log", data, params)
  },
  createAT_arrange(data, params) {
    return axios.post("/forward/arrange_create_at", data, params)
  },
  getAT_arrange(data, params) {
    return axios.post("/forward/arrange_get_config_at", data, params)
  },

  closeATconfig(data, params) {
    return axios.post("/forward/arrange_close_config_at", data, params)
  },
  doneATconfig(data, params) {
    return axios.post("/forward/arrange_done_config_at", data, params)
  },
  rollATconfig(data, params) {
    return axios.post("/forward/arrange_roll_config_at", data, params)
  },

  //配置记录
  addTask(data, params) {
    return axios.post("/forward/check_add_task", data, params)
  },
  addTaskByAT(data, params) {
    return axios.post("/forward/check_add_task_at", data, params)
  },
  addTaskByAT_padding(data, params) {
    return axios.post("/forward/check_add_task_at_padding", data, params)
  },
  reloadLogByID(data, params) {
    return axios.post("/forward/check_reload_log", data, params)
  },
  checkDiffByName(data, params) {
    return axios.post("/forward/check_check_diff", data, params)
  },
  checkDiffByID(data, params) {
    return axios.post("/forward/check_check_diff_byid", data, params)
  },
  getAT_List(data, params) {
    return axios.post("/forward/check_getat_list", data, params)
  },
  getDetailByID(data, params) {
    return axios.post("/forward/check_get_detail", data, params)
  },
  getLogList(data, params) {
    return axios.post("/forward/check_get_log_list", data, params)
  },
  delLogByID(data, params) {
    return axios.post("/forward/check_del_log_list", data, params)
  },


  //snmp接口 fast_snmpget
  getSNMPGET(data, params) {
    return axios.post("/forward/fast_snmpget", data, params)
  },
  getSNMPWALK(data, params) {
    return axios.post("/forward/fast_snmpget", data, params)
  },
  
  
  //下线清理配置
  clearConfig(data, params) {
    return axios.post("/forward/command_clear_cfg", data, params)
  },

}
