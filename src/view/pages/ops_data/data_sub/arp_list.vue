<template>
  <data_query_panel
    title="ARP列表"
    icon="el-icon-sort"
    export-name="arp_list"
    tip="设备IP 和 ARP IP 至少填写一项"
    :filters="filters"
    :columns="columns"
    :validate="validate"
    :request="request"></data_query_panel>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import data_query_panel from "./data_query_panel.vue"

  export default {
    components: { data_query_panel },
    data() {
      return {
        filters: [
          { key: "ip", label: "设备IP" },
          { key: "arp_ip", label: "ARP IP" },
          { key: "sysname", label: "设备名" },
          { key: "if_name", label: "接口名" },
        ],
        columns: [
          { prop: "sysname", label: "设备名", minWidth: 200, type: "device" },
          { prop: "ip", label: "设备IP", minWidth: 130, mono: true },
          { prop: "if_name", label: "端口名", minWidth: 150, mono: true },
          { prop: "arp_ip", label: "ARP IP", minWidth: 140, mono: true },
          { prop: "arp_mac", label: "MAC", minWidth: 150, mono: true },
          { prop: "timestamp", label: "采集时间", width: 160 },
        ],
      }
    },
    methods: {
      validate(v) {
        return v.ip !== "" || v.arp_ip !== "" ? "" : "设备IP和ARP IP至少包含一项筛选项"
      },
      request(v) {
        let post_data = {}
        Object.keys(v).forEach(k => {
          if (v[k] !== "") {
            post_data[k] = v[k]
          }
        })
        return collector_api.getARPList(post_data, {})
      },
    },
  }
</script>
