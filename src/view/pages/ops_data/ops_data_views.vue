<template>
  <div class="ops-data">
    <el-tabs v-model="activeName">
      <el-tab-pane v-for="t in tabs" :key="t.name" :name="t.name" lazy>
        <span slot="label"><i :class="t.icon"></i> {{ t.label }}</span>
        <component :is="t.comp"></component>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import card_port_list from "./data_sub/port_list.vue"
  import card_gate_list from "./data_sub/gate_list.vue"
  import card_lldp_list from "./data_sub/lldp_list.vue"
  import card_sn_list from "./data_sub/sn_list.vue"
  import card_arp_list from "./data_sub/arp_list.vue"
  import card_mac_list from "./data_sub/mac_list.vue"

  export default {
    components: {
      card_port_list,
      card_gate_list,
      card_lldp_list,
      card_sn_list,
      card_arp_list,
      card_mac_list,
    },
    data() {
      return {
        activeName: '1',
        // lazy：首次切换到该页签时才渲染，之后保留查询结果
        tabs: [
          { name: '1', label: "端口列表", icon: "el-icon-connection", comp: "card_port_list" },
          { name: '2', label: "IP列表", icon: "el-icon-place", comp: "card_gate_list" },
          { name: '3', label: "LLDP列表", icon: "el-icon-share", comp: "card_lldp_list" },
          { name: '4', label: "SN列表", icon: "el-icon-price-tag", comp: "card_sn_list" },
          { name: '5', label: "ARP列表", icon: "el-icon-sort", comp: "card_arp_list" },
          { name: '6', label: "Tor设备MAC", icon: "el-icon-s-grid", comp: "card_mac_list" },
        ],
      }
    },
  }
</script>

<style scoped>
.ops-data /deep/ .el-tabs__header {
  margin-bottom: 16px;
}
.ops-data /deep/ .el-tabs__item i {
  margin-right: 2px;
}
</style>
