<template>
  <data_query_panel
    title="IP列表"
    icon="el-icon-place"
    export-name="ip_list"
    tip="服务器IP 输入完整 IPv4 地址时，查询包含该地址的网段；否则按正则匹配端口IP"
    :filters="filters"
    :columns="columns"
    :request="request"></data_query_panel>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import data_query_panel from "./data_query_panel.vue"

  const ipReg = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/

  const int2iP = num => {
    return [(num >>> 24) >>> 0, ((num << 8) >>> 24) >>> 0, (num << 16) >>> 24, (num << 24) >>> 24].join(".")
  }

  export default {
    components: { data_query_panel },
    data() {
      return {
        filters: [
          { key: "ip", label: "设备IP" },
          { key: "server", label: "服务器IP", placeholder: "IP地址" },
          { key: "flag", label: "版本", type: "select", default: "V4", clearable: false, options: [
            { label: "IPv4", value: "V4" },
            { label: "IPv6", value: "V6" },
          ] },
        ],
        columns: [
          { prop: "sysname", label: "设备名", minWidth: 200, type: "device" },
          { prop: "ip", label: "设备IP", minWidth: 130, mono: true },
          { prop: "if_name", label: "端口名", minWidth: 150, mono: true },
          { prop: "gateway", label: "端口IP", minWidth: 150, mono: true },
          { prop: "mask", label: "掩码", minWidth: 120, mono: true },
          { prop: "oper_statu", label: "物理状态", width: 100, align: "center", type: "status",
            status: row => row.oper_statu == '1' ? { text: "UP", type: "success" } : { text: "DOWN", type: "danger" } },
          { prop: "startip_str", label: "开始IP", minWidth: 130, mono: true },
          { prop: "endip_str", label: "结束IP", minWidth: 130, mono: true },
          { prop: "timestamp", label: "采集时间", width: 160 },
        ],
      }
    },
    methods: {
      request(v) {
        let post_data = {}
        if (v.ip !== "") {
          post_data["ip"] = v.ip
        }
        if (v.server !== "") {
          if (ipReg.test(v.server)) {
            post_data["gate"] = v.server
          } else {
            post_data["gatereg"] = v.server
          }
        }
        post_data["unlimit"] = '1'
        post_data["and"] = '1'

        const isV6 = v.flag == "V6"
        const req = isV6 ? collector_api.getGateV6List(post_data, {}) : collector_api.getGateV4List(post_data, {})
        return req.then(response => {
          if (response.data && response.data["code"] === 0) {
            const list = response.data["data"] || []
            for (let i = 0; i < list.length; i++) {
              list[i]["startip_str"] = isV6 ? "" : int2iP(parseInt(list[i]["startip"]))
              list[i]["endip_str"] = isV6 ? "" : int2iP(parseInt(list[i]["endip"]))
            }
          }
          return response
        })
      },
    },
  }
</script>
