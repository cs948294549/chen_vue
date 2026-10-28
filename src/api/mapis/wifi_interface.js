import axios from "../axios"

/*
Wi-Fi 地图相关接口：AC 管理 / 地图维护 / AP 详情
统一返回 body.data；失败 reject { code, message }
*/

export default {
  // ==================== 公共 ====================

  // 解包响应：code === 0 返回 data，否则 reject { code, message }
  unwrap(p) {
    return new Promise((resolve, reject) => {
      p.then(res => {
        // axios 拦截器遇到 401/403 会提示并 resolve undefined
        if (!res) return reject({ code: 403, message: "无权限或登录失效" })
        const body = res.data || {}
        if (body.code === 0) resolve(body.data)
        else reject({ code: body.code, message: body.message })
      }).catch(err => {
        const body = err && err.data
        reject({ code: (body && body.code) || 500, message: (body && body.message) || "网络或服务异常" })
      })
    })
  },

  // ==================== AC 管理 ====================

  // AC 列表
  getAcList() {
    return this.unwrap(axios.post("/wifi/ac/list", {}))
  },

  // 新增或修改 AC，带 ac_id 为修改
  saveAc(data) {
    return this.unwrap(axios.post("/wifi/ac/save", data))
  },

  // 删除 AC
  deleteAc(acId) {
    return this.unwrap(axios.post("/wifi/ac/delete", { ac_id: acId }))
  },

  // SNMP 连通测试，不入库
  testAc(data) {
    return this.unwrap(axios.post("/wifi/ac/test", data))
  },

  // 立即探测，回写 last_status
  collectAc(acId) {
    return this.unwrap(axios.post("/wifi/ac/collect", { ac_id: acId }))
  },

  // ==================== 地图 ====================

  // 地图列表，按建筑分组
  getMapList() {
    return this.unwrap(axios.post("/wifi/map/list", {}))
  },

  // 地图详情：底图 + 图标及最新指标
  getMapDetail(mapId) {
    return this.unwrap(axios.post("/wifi/map/detail", { map_id: mapId }))
  },

  // 新增或修改地图属性与底图，带 map_id 为修改
  saveMapInfo(data) {
    return this.unwrap(axios.post("/wifi/map/info", data))
  },

  // 保存地图布局，version 冲突返回 code 409
  saveMap(data) {
    return this.unwrap(axios.post("/wifi/map/save", data))
  },

  // 删除地图
  deleteMap(mapId) {
    return this.unwrap(axios.post("/wifi/map/delete", { map_id: mapId }))
  },

  // ==================== AP ====================

  // AP 列表：ap_name / ap_mac / ap_ip / sn / model / ap_group / sw_version 模糊，ac_id / online_status 精确
  getApList(data) {
    return this.unwrap(axios.post("/wifi/ap/list", data || {}))
  },

  // ==================== 终端 ====================

  // 终端列表：ip / username / client_mac / ap_name / ssid / band 模糊，ac_id / status 精确
  getClientList(data) {
    return this.unwrap(axios.post("/wifi/client/list", data || {}))
  },

  // 可摆放 AP 池，按 AC 分组
  getApPool() {
    return this.unwrap(axios.post("/wifi/ap/pool", {}))
  },

  // AP 详情：基础信息 + 射频 + SSID
  getApDetail(apMac) {
    return this.unwrap(axios.post("/wifi/ap/detail", { ap_mac: apMac }))
  },

  // AP 下在线终端（含快照的 rssi / up_rate / down_rate，前端自行转换）
  getApClients(apMac) {
    return this.unwrap(axios.post("/wifi/ap/clients", { ap_mac: apMac }))
  },
}
