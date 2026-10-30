<template>
  <data_query_panel
    title="LLDP列表"
    icon="el-icon-share"
    export-name="lldp_list"
    tip="至少填写一项查询条件；设备名可点击进入设备详情"
    :filters="filters"
    :columns="columns"
    :validate="validate"
    :request="request"></data_query_panel>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import data_query_panel from "./data_query_panel.vue"

  const upDown = val => val == '1' ? { text: "UP", type: "success" } : { text: "DOWN", type: "danger" }

  export default {
    components: { data_query_panel },
    data() {
      return {
        filters: [
          { key: "loc_name", label: "本端设备名" },
          { key: "loc_ip", label: "本端IP" },
          { key: "rem_name", label: "对端设备名" },
          { key: "rem_ip", label: "对端IP" },
        ],
        columns: [
          { prop: "loc_name", label: "本端设备名", minWidth: 190, type: "device", ipProp: "loc_ip" },
          { prop: "loc_ip", label: "本端IP", minWidth: 130, mono: true },
          { prop: "loc_portname", label: "本端端口", minWidth: 150, mono: true },
          { prop: "loc_portstatus", label: "本端状态", width: 100, align: "center", type: "status", status: row => upDown(row.loc_portstatus) },
          { prop: "rem_name", label: "对端设备名", minWidth: 190, type: "device", ipProp: "rem_ip" },
          { prop: "rem_ip", label: "对端IP", minWidth: 130, mono: true },
          { prop: "rem_portname", label: "对端端口", minWidth: 150, mono: true },
          { prop: "rem_portstatus", label: "对端状态", width: 100, align: "center", type: "status", status: row => upDown(row.rem_portstatus) },
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
        Object.keys(v).forEach(k => {
          if (v[k] !== "") {
            post_data[k] = v[k]
          }
        })
        return collector_api.getLLDPS(post_data, {})
      },
    },
  }
</script>
