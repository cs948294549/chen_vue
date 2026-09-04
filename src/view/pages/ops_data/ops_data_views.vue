<template>
  <div style="padding: 10px;">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="端口列表" name="1">
        <card_port_list v-if="activeName=='1'"></card_port_list>
      </el-tab-pane>
      <el-tab-pane label="IP列表" name="2">
        <card_gate_list v-if="activeName=='2'"></card_gate_list>
      </el-tab-pane>
      <el-tab-pane label="LLDP列表" name="3">
        <card_lldp_list v-if="activeName=='3'"></card_lldp_list>
      </el-tab-pane>
      <el-tab-pane label="SN列表" name="4">
        <card_sn_list v-if="activeName=='4'"></card_sn_list>
      </el-tab-pane>
      <el-tab-pane label="ARP列表" name="5">
        <card_arp_list v-if="activeName=='5'"></card_arp_list>
      </el-tab-pane>
      <el-tab-pane label="Tor设备MAC" name="6">
        <card_mac_list v-if="activeName=='6'"></card_mac_list>
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
    data() {
      return {
        activeName: '1',
        select_id: 0,
      };
    },
    methods: {
      handleClick(tab, event) {
        this.select_id = 0
      },
    },
    components:{
      card_port_list,
      card_gate_list,card_lldp_list,
      card_sn_list,card_arp_list,
      card_mac_list
    }
  };
</script>

<style>
</style>
