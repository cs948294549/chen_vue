<template>
  <div style="width: 100%; height: 800px; padding: 20px;">
    <h3>AntV G6 流程图（缩放不失效）</h3>
    <FlowChart
      :chart-data="chartData"
      :width="'100%'"
      :height="700"
      :init-zoom="0.5"
      :node-size="[60, 30]"
      :padding="[30, 30, 30, 30]"
      @node-dragend="handleNodeDragEnd"
      @node-click="handleNodeClick"
    />
  </div>
</template>

<script>
import FlowChart from '@/components/flowChart/FlowChart.vue';

export default {
  components: { FlowChart },
  data() {
    return {
      chartData: {
        nodes: [
          { id: 'node1', label: '开始', x: 200, y: 100, size: [50, 25], style: { fill: '#52c41a' } },
          { id: 'node2', label: '处理任务', x: 200, y: 150 },
          { id: 'node3', label: '判断结果', x: 200, y: 200, type: 'diamond', size: [70, 50], style: { fill: '#faad14' } },
          { id: 'node4', label: '结束', x: 200, y: 250, style: { fill: '#ff4d4f' } }
        ],
        edges: [
          { source: 'node1', target: 'node2', sourceAnchor: 1, targetAnchor: 0,label: '进入' },
          { source: 'node2', target: 'node3', sourceAnchor: 1, targetAnchor: 0, },
          { source: 'node3', target: 'node4', label: '通过', sourceAnchor: 1, targetAnchor: 0, }
        ]
      }
    };
  },
  methods: {
    handleNodeDragEnd(nodeInfo) {
      console.log('节点拖拽结束：', nodeInfo);
      this.$nextTick(() => {
        const targetIndex = this.chartData.nodes.findIndex(n => n.id === nodeInfo.id);
        if (targetIndex > -1) {
          this.$set(this.chartData.nodes[targetIndex], 'x', nodeInfo.x);
          this.$set(this.chartData.nodes[targetIndex], 'y', nodeInfo.y);
        }
      });
    },
    handleNodeClick(node) {
      console.log('点击节点：', node);
    }
  }
};
</script>
