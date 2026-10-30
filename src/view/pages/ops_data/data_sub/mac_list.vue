<template>
  <data_query_panel
    title="Tor设备MAC"
    icon="el-icon-s-grid"
    export-name="tor_mac_list"
    tip="数据量大，需要输入精确的设备IP"
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
          { key: "switch_ip", label: "设备IP" },
        ],
        columns: [
          { prop: "sysname", label: "设备名", minWidth: 200, type: "device" },
          { prop: "ip", label: "设备IP", minWidth: 130, mono: true },
          { prop: "if_name", label: "端口名", minWidth: 150, mono: true },
          { prop: "arp_ip", label: "ARP IP", minWidth: 140, mono: true },
          { prop: "mac_address", label: "MAC", minWidth: 150, mono: true },
          { prop: "vlan_id", label: "VLAN", width: 90, align: "center", sortBy: row => parseInt(row.vlan_id) || 0 },
          { prop: "timestamp", label: "采集时间", width: 160 },
        ],
      }
    },
    methods: {
      validate(v) {
        return v.switch_ip !== "" ? "" : "数量大，需要精确查询设备IP"
      },
      request(v) {
        return collector_api.getMACList({ switch_ip: v.switch_ip }, {})
      },
    },
  }
</script>
