<template>
  <div class="flow-chart-container" ref="chartContainer"></div>
</template>

<script>
import G6 from '@antv/g6';

export default {
  name: 'FlowChart',
  props: {
    chartData: {
      type: Object,
      required: true,
      default: () => ({ nodes: [], edges: [] })
    },
    width: { type: [String, Number], default: '100%' },
    height: { type: [String, Number], default: 600 },
    draggable: { type: Boolean, default: true },
    // 自定义初始缩放比例（不再被fitView覆盖）
    initZoom: { type: Number, default: 0.6 },
    // 自定义节点默认尺寸
    nodeSize: { type: Array, default: () => [80, 40] },
    // 画布边缘留白（控制节点与画布的间距）
    padding: { type: Array, default: () => [50, 50, 50, 50] }
  },
  data() {
    return {
      graph: null,
      cachedChartData: null
    };
  },
  watch: {
    chartData: {
      deep: true,
      handler(newVal) {
        if (this.isDataChanged(newVal, this.cachedChartData)) {
          this.cachedChartData = JSON.parse(JSON.stringify(newVal));
          this.updateChart(newVal);
        }
      },
      immediate: true
    },
    width() { this.resizeChart(); },
    height() { this.resizeChart(); }
  },
  mounted() {
    this.initChart();
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.destroy();
      this.graph = null;
    }
  },
  methods: {
    // 判断核心数据是否变化
    isDataChanged(newVal, oldVal) {
      if (!oldVal) return true;
      const newStr = JSON.stringify({
        nodes: newVal.nodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
        edges: newVal.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      });
      const oldStr = JSON.stringify({
        nodes: oldVal.nodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
        edges: oldVal.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      });
      return newStr !== oldStr;
    },

    // 核心：手动计算画布偏移，让节点居中（替代fitView）
    calculateCenterOffset() {
      if (!this.graph || this.chartData.nodes.length === 0) return;

      // 1. 获取所有节点的包围盒（最小/最大坐标）
      const nodes = this.graph.getNodes();
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      nodes.forEach(node => {
        const model = node.getModel();
        const { x, y } = model;
        // 考虑节点尺寸，计算真实包围盒
        const size = model.size || this.nodeSize;
        const halfW = size[0] / 2 * this.initZoom;
        const halfH = size[1] / 2 * this.initZoom;

        minX = Math.min(minX, x * this.initZoom - halfW);
        minY = Math.min(minY, y * this.initZoom - halfH);
        maxX = Math.max(maxX, x * this.initZoom + halfW);
        maxY = Math.max(maxY, y * this.initZoom + halfH);
      });

      // 2. 获取画布实际尺寸
      const canvasWidth = this.graph.get('width');
      const canvasHeight = this.graph.get('height');

      // 3. 计算居中偏移（加入留白）
      const [top, right, bottom, left] = this.padding;
      const contentWidth = maxX - minX + left + right;
      const contentHeight = maxY - minY + top + bottom;

      // 4. 计算最终偏移量（保证节点居中，且不缩放）
      const offsetX = (canvasWidth - contentWidth) / 2 - minX + left;
      const offsetY = (canvasHeight - contentHeight) / 2 - minY + top;

      // 5. 设置画布偏移（不修改缩放）
      this.graph.set('viewport', {
        x: offsetX,
        y: offsetY,
        scale: this.initZoom
      });
      this.graph.paint();
    },

    // 初始化图表
    initChart() {
      const container = this.$refs.chartContainer;
      const containerWidth = this.width === '100%' ? container.offsetWidth : this.width;

      this.graph = new G6.Graph({
        container: container,
        width: containerWidth,
        height: this.height,
        // 初始缩放比例（不再被fitView覆盖）
        zoom: this.initZoom,
        // 缩放范围限制
        minZoom: 0.3,
        maxZoom: 2,
        modes: {
          default: ['drag-node', 'drag-canvas']
        },
        renderAnchorPoints: true, // 显示锚点
        anchorPointStyle: { r: 4, fill: '#ff4d4f' }, // 红色锚点，方便查看
        defaultNode: {
          type: 'rect',
          size: this.nodeSize,
          // 锚点配置：[[上中, 下中]]（替换默认的左右）
          anchorPoints: [[0.5, 0], [0.5, 1]],
          style: {
            fill: '#40a9ff',
            stroke: '#1890ff',
            lineWidth: 2,
            radius: 6
          },
          labelCfg: {
            style: {
              fill: '#fff',
              fontSize: 12,
              fontWeight: 500
            }
          }
        },
        defaultEdge: {
          type: 'polyline',
          style: {
            stroke: '#8c8c8c',
            lineWidth: 1.5,
            endArrow: {
              path: G6.Arrow.triangle(4, 6, 2),
              fill: '#8c8c8c'
            }
          },
          labelCfg: {
            style: {
              fontSize: 10
            }
          }
        },
        nodeStateStyles: {
          active: {
            fill: '#1890ff',
            stroke: '#096dd9',
            lineWidth: 2
          }
        }
      });

      // 加载数据并渲染
      this.cachedChartData = JSON.parse(JSON.stringify(this.chartData));
      this.graph.data(this.chartData);
      this.graph.render();

      // 替代fitView：手动计算居中偏移，保留缩放
      this.calculateCenterOffset();

      // 节点拖拽事件
      this.graph.on('node:dragend', (e) => {
        const nodeModel = e.item.getModel();
        this.$emit('node-dragend', {
          id: nodeModel.id,
          x: nodeModel.x,
          y: nodeModel.y,
          data: { ...nodeModel }
        });
      });

      this.graph.on('node:click', (e) => {
        this.$emit('node-click', { ...e.item.getModel() });
      });
    },

    // 更新图表
    updateChart(newData) {
      if (!this.graph) return;
      this.graph.stopAnimate();
      this.graph.clear();
      this.graph.data(newData);
      this.graph.render();
      // 重新计算居中偏移，保留缩放
      this.calculateCenterOffset();
    },

    // 调整画布大小
    resizeChart() {
      if (!this.graph) return;
      const container = this.$refs.chartContainer;
      const width = this.width === '100%' ? container.offsetWidth : this.width;
      this.graph.changeSize(width, this.height);
      // 重新计算居中偏移，保留缩放
      this.calculateCenterOffset();
    }
  }
};
</script>

<style scoped>
.flow-chart-container {
  width: 100%;
  height: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fafafa;
}
</style>
