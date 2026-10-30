<template>
  <data_query_panel
    title="端口列表"
    icon="el-icon-connection"
    export-name="port_list"
    tip="至少填写一项查询条件；状态 Warning 表示管理状态 UP 但物理状态异常的告警端口"
    :filters="filters"
    :columns="columns"
    :validate="validate"
    :request="request"></data_query_panel>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import data_query_panel from "./data_query_panel.vue"

  const upDown = (val, downType) => val == '1' ? { text: "UP", type: "success" } : { text: "DOWN", type: downType }

  // speed 单位为 Mbps
  const speedText = row => {
    const speed = parseInt(row.speed)
    if (!speed) {
      return ""
    }
    return speed >= 1000 ? parseFloat((speed / 1000).toFixed(1)) + "G" : speed + "M"
  }

  export default {
    components: { data_query_panel },
    data() {
      return {
        filters: [
          { key: "sysname", label: "设备名" },
          { key: "ip", label: "设备IP" },
          { key: "if_name", label: "端口名" },
          { key: "speed", label: "带宽", placeholder: "带宽(Mbps)" },
          { key: "alias", label: "描述" },
          { key: "status", label: "状态", type: "select", options: [
            { label: "UP", value: "UP" },
            { label: "Down", value: "Down" },
            { label: "AdminDown", value: "AdminDown" },
            { label: "Warning", value: "Warning" },
          ] },
        ],
        columns: [
          { prop: "sysname", label: "设备名", minWidth: 200, type: "device" },
          { prop: "ip", label: "设备IP", minWidth: 130, mono: true },
          { prop: "if_name", label: "端口名", minWidth: 150, mono: true },
          { prop: "speed", label: "带宽", width: 90, align: "center", format: speedText, sortBy: row => parseInt(row.speed) || 0 },
          { prop: "admin_statu", label: "管理状态", width: 100, align: "center", type: "status", status: row => upDown(row.admin_statu, "info") },
          { prop: "oper_statu", label: "物理状态", width: 100, align: "center", type: "status", status: row => upDown(row.oper_statu, "danger") },
          { prop: "alias", label: "描述", minWidth: 240 },
          { prop: "timestamp", label: "采集时间", width: 160 },
        ],
      }
    },
    methods: {
      validate(v) {
        const has = Object.keys(v).some(k => v[k] !== "")
        return has ? "" : "数据过多，请添加筛选条件"
      },
      request(v) {
        let post_data = {}
        if (v.status == "UP") {
          post_data["admin_statu"] = '1'
          post_data["oper_statu"] = '1'
        } else if (v.status == "Down") {
          post_data["oper_statu_ex"] = '1'
        } else if (v.status == "AdminDown") {
          post_data["admin_statu_ex"] = '1'
        } else if (v.status == "Warning") {
          post_data["oper_statu_ex"] = '1'
          post_data["admin_statu"] = '1'
          post_data["warning"] = "1"
        }
        ;["sysname", "ip", "if_name", "speed", "alias"].forEach(k => {
          if (v[k] !== "") {
            post_data[k] = v[k]
          }
        })
        return collector_api.getPorts_ex(post_data, {})
      },
    },
  }
</script>
