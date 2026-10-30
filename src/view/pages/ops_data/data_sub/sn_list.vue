<template>
  <data_query_panel
    title="SN列表"
    icon="el-icon-price-tag"
    export-name="sn_list"
    tip="序列号不填时只返回有序列号的模块"
    :filters="filters"
    :columns="columns"
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
          { key: "sn_name", label: "模块类型" },
          { key: "sn_desc", label: "模块描述" },
          { key: "sn_number", label: "序列号", placeholder: "SN号" },
        ],
        columns: [
          { prop: "sysname", label: "设备名", minWidth: 200, type: "device" },
          { prop: "ip", label: "设备IP", minWidth: 130, mono: true },
          { prop: "sn_name", label: "模块类型", minWidth: 180 },
          { prop: "sn_desc", label: "模块描述", minWidth: 240 },
          { prop: "sn_number", label: "序列号", minWidth: 170, mono: true },
          { prop: "timestamp", label: "采集时间", width: 160 },
        ],
      }
    },
    methods: {
      request(v) {
        let post_data = {}
        ;["ip", "sn_name", "sn_desc"].forEach(k => {
          if (v[k] !== "") {
            post_data[k] = v[k]
          }
        })
        post_data["sn_number"] = v.sn_number !== "" ? v.sn_number : '[0-9a-zA-Z]+'
        return collector_api.getSNList(post_data, {})
      },
    },
  }
</script>
