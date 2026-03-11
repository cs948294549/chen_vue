<template>
  <div class="parent-page">
    <h2>vis.js 实现的拓扑图（固定大小 + 左上角绘制）</h2>
    <!-- 使用 vis.js 版本的拓扑图组件 -->
    <NetworkTopologyVis
      v-bind:toponame="'test'"
      v-bind:position="{}"
      v-bind:node_list="topologyNodes"
      v-bind:link_list="topologyLines"
      v-bind:chartswidth="'1200px'"
      v-bind:chartsheight="'400px'"
    />
  </div>
</template>

<script>
import NetworkTopologyVis from '@/components/topology/NetworkTopology.vue';
import switchSvg from '@/assets/topo/h3_switch_general.svg';
import routerSvg from '@/assets/topo/h3_router_general.svg';

export default {
  components: { NetworkTopologyVis },
  data() {
    return {
      // 节点数据（与之前格式完全兼容）
      // topo_nodes:[
      //   {"id":"1","label":"t1","title":"隐藏t1","group":"router","x":0, "y":0},
      //   {"id":"2","label":"t2","title":"隐藏t2","group":"router","x":100, "y":100},
      //   {"id":"3","label":"t3","title":"隐藏t3","group":"router","x":100, "y":0},
      //   {"id":"4","label":"t4","title":"隐藏t4","group":"router","x":-100, "y":0},
      // ],
      // topo_links:[
      //   {"id":"1","from":"1","to":"2","label":"test","color":{"color":"#333"}},
      //   {"id":"2","from":"1","to":"3","label":"test","color":{"color":"#333"}},
      //   {"id":"3","from":"1","to":"4","label":"test","color":{"color":"#333"}},
      // ],
      topologyNodes: [
        {
          id: 'node1',
          name: 'Broker-1',
          group:"router",
          x: 50, // 左上角绘制：x=50（靠近左上角）
          y: 50, // y=50（靠近左上角）
          status: 'online',
          ip: '192.168.1.101',
          svgSrc: switchSvg, // 本地 SVG 路径
          svgWidth: 36,
          svgHeight: 36
        },
        {
          id: 'node2',
          name: 'Broker-2',
          group:"router",
          x: 150,
          y: 50,
          status: 'online',
          ip: '192.168.1.102',
          svgSrc: switchSvg,
          svgWidth: 36,
          svgHeight: 36
        },
        {
          id: 'node3',
          name: 'Producer',
          group:"switch",
          x: 50,
          y: 150,
          status: 'online',
          ip: '192.168.1.201',
          svgSrc: routerSvg,
          svgWidth: 32,
          svgHeight: 32
        },
        {
          id: 'node4',
          name: 'Consumer',
          group:"switch",
          x: 150,
          y: 150,
          status: 'offline',
          ip: '192.168.1.301',
          svgSrc: routerSvg,
          svgWidth: 32,
          svgHeight: 32
        }
      ],
      // 边数据（与之前格式完全兼容）
      topologyLines: [
        { id: 'line1', from: 'node3', to: 'node1', color: {"color":"#333"} },
        { id: 'line2', from: 'node3', to: 'node2', status: 'normal' },
        { id: 'line3', from: 'node1', to: 'node2', status: 'normal' },
        { id: 'line4', from: 'node2', to: 'node4', color: {"color":"#333"} }
      ]
    };
  },
  methods: {
    // 节点点击事件（缩放后仍生效）
    handleNodeClick(node) {
      console.log('点击节点：', node);
    },
    // 缩放事件
    handleScaleChange(scaleInfo) {
      console.log('缩放比例：', scaleInfo);
    }
  }
};
</script>

<style scoped>
.parent-page {
  padding: 20px;
}
</style>
