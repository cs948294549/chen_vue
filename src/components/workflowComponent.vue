<template>
  <div class="workflow-editor">
    <div class="toolbar">
      <el-button type="primary" size="small" @click="handleSubmit">提交流程</el-button>
      <el-button size="small" @click="handleClear">清空画布</el-button>
      <el-button size="small" @click="handleResetZoom">重置视图</el-button>
      <el-button size="small" @click="handleFitZoom">适应视图</el-button>
    </div>

    <!-- 中间图 -->
    <div id="canvasPanel" :style="'border: #000 solid 1px;background-color: white;width:'+ panel_width+'px;'" ref="canvasPanel" @dragover.prevent/>

    <!-- 小地图容器 -->
    <div class="mini-map-container" :style="'left:'+panel_width+'px;top:'+panel_height+'px;'">
      <div ref="miniMap" class="mini-map"></div>
    </div>
  </div>
</template>

<script>
  /*
  组件功能提供initialData初始化功能，绘制初始图
  主动方法
  this.$refs.flowChart.addNode(updatedNode);
  this.$refs.flowChart.updateNode(updatedNode);
  this.$refs.flowChart.updateLink(updatedLink);
  add-node 从外部往里添加节点
  update-node 更新node
  update-link 更新link


  被动方法
  add-link事件监听，返回callback方法，需要确认后添加线路
  @linkAddEvent(linkItem,callback){
    if(linkItem){
      emit("linkAddEvent", linkItem)
    }
    @success{
      callback(true)
    }else{
      callback(false)
    }
  }

  submit事件，提交变更好的node和link数据
  @submit({nodes,links}){
    emit("submit", {nodes,links})
  }

  */
  import G6 from '@antv/g6';
  import Factory from '@/components/graph_g6/graph.js';

  export default {
    props:{
      panel_width: {
        type: Number,
        default() {
          return 800
        }
      },
      panel_height:{
        type: Number,
        default() {
          return 400
        }
      },
      readonly:{
        type:Boolean,
        default() {
          return false
        }
      },
      initialData: {
        type: Object,
        default() {
          return {
            nodes: [
              {"node_id":"start", "node_label":"开始", "position":{"x":400,"y":100}},
              {"node_id":"process", "node_label":"处理", "position":{"x":400,"y":300}},
              {"node_id":"end", "node_label":"结束", "position":{"x":400,"y":500}}
            ],
            edges: [
              {"source_node":"start","target_node":"process1","label":""},
              {"source_node":"process1","target_node":"end","label":""}
            ],
          };
        }
      }
    },
  	data(){
  		return {

        //图相关
        graph:{},
        nodes:{},
        edges:{},
        logoSvgBase64:'/static/images/workflow.svg',

        init_cfg:{
        	// ... 其他G6原生入参
        	// 所有节点默认配置
          // 初始缩放比例（不再被fitView覆盖）
          zoom: this.initZoom,
          // 缩放范围限制
          minZoom: 0.3,
          maxZoom: 2,
        	defaultNode: {
        	  type:  'modelRect-node',
        	  style: {
        	    radius: 6,
        	    width:  100,
        	    height: 40,
        	    cursor: 'pointer',
        	    fill:   '#fff',
        	  },
        	  labelCfg: {
        	    fontSize: 18,
        	    style:    {
        	      cursor: 'pointer',
        	    },
        	  },
        	},
        	// 所有边的默认配置
        	defaultEdge: {
        	  type:  'polyline-edge', // 扩展了内置边, 有边的事件
        	  style: {
        	    radius:          5,
        	    offset:          15,
        	    stroke:          '#aab7c3',
        	    lineAppendWidth: 10, // 防止线太细没法点中
        						  lineWidth:5,
        	    endArrow:        true,
        	  },
        	},
        	// 覆盖全局样式
        	nodeStateStyles: {
        	  'nodeState:default': {
        	    opacity: 1,
        	  },
        	  'nodeState:hover': {
        	    opacity: 0.8,
        	  },
        	  'nodeState:selected': {
        	    opacity: 0.9,
        	  },
        	},
        	// 默认边不同状态下的样式集合
        	edgeStateStyles: {
        	  'edgeState:default': {
              lineWidth:5,
        	    stroke: '#aab7c3',
        	  },
        	  'edgeState:selected': {
        							lineWidth:5,
        	    stroke: '#1890FF',
        	  },
        	  'edgeState:hover': {
        							lineWidth:5,
        	    animate:       true,
        	    animationType: 'dash',
        	    stroke:        '#1890FF',
        	  },
        	}
        },
      }
  	},
    mounted() {
      console.log("-=-=-=-=", this.logoSvgBase64)
    	// 创建画布
    	this.$nextTick(() => {
    	  this.createGraphic();
    	  this.initGraphEvent();
        this.initTopo();
    	});
    },
    beforeDestroy () {
      this.graph.destroy();
    },
    methods:{
      createGraphic(){
      	const vm = this;
      	const grid = new G6.Grid();
      	const menu = new G6.Menu({
      	    offsetX:   -20,
      	    offsetY:   -50,
      	    itemTypes: ['node', 'edge'],
      	    getContent(e) {
      	        const outDiv = document.createElement('div');
      	        outDiv.style.width = '80px';
      	        outDiv.style.cursor = 'pointer';
      	        outDiv.innerHTML = '<p id="deleteNode">删除元素</p>';
      	        return outDiv;
      	    },
      	    handleMenuClick(target, item) {
      	        const { id } = target;
      	        if(id) {
      	            vm[id](item);
      	        }
      	    },
      	});
      	const minimap = new G6.Minimap({
      	    size: [200, 100],
            className: 'g6-minimap', // 自定义类名
            container: this.$refs.miniMap, // 默认为主图容器内，可指定外部容器
            type: 'default', // 小地图类型，default/keyShape
            padding: 0, // 小地图内边距
            maskStyle: { // 视口指示器样式
              fill: 'rgba(255, 165, 0, 0.1)',
              stroke: '#ff7d00',
              lineWidth: 2
            }
      	});

      	const cfg = {
      		...this.init_cfg,
      	  container: "canvasPanel",
      	  width:  this.panel_width,
      	  height: this.panel_height,
      	  modes: {
      	    // 支持的 behavior
      		// default:    ['zoom-canvas', 'drag-node'],
      	    default:    ['drag-canvas','drag-shadow-node', 'canvas-event', 'select-node', 'hover-node', 'active-edge', 'delete-item'],
      	    readonly: ['drag-canvas', 'drag-shadow-node', 'active-edge', 'select-node',],
      	  },
      	  plugins: [minimap],
      	}
        if(this.readonly==false){
          cfg["plugins"].push(menu)
        }
      	const g6 = Factory(G6, cfg);
      	this.graph = new G6.Graph(g6);
        if(this.readonly){
          this.graph.setMode('readonly');
        }


        // 获取 G6 容器的 DOM 元素（关键：直接操作原生 DOM）
        const container = this.graph.getContainer(); // 返回容器的 DOM 节点（通常是 div）

        // 绑定 dragOver 事件（原生 DOM 事件）
        container.addEventListener('dragover', (event) => {
          // 必须调用 preventDefault()，否则 drop 事件不会触发
          event.preventDefault();
          // 可选：设置拖放效果（copy/move/link）
          event.dataTransfer.dropEffect = 'copy';

          // console.log('拖拽经过容器');
          // 可在此处添加视觉反馈（如高亮容器）
          container.style.border = '2px dashed #1890ff';
        });

        // 绑定 drop 事件（处理最终放置逻辑）
        container.addEventListener('drop', (event) => {
          event.preventDefault();
          console.log('元素放置在容器内');
          container.style.border = 'none'; // 移除高亮

          // 获取拖拽的数据（根据实际需求处理）
          const draggedData = event.dataTransfer.getData('text/plain');
          console.log('拖拽的数据：', draggedData);

          // 示例：在放置位置添加一个新节点
          const { offsetX, offsetY } = event;

          let that = this
          this.$emit("node-add",{
            position: {"x":offsetX, "y":offsetY},
            callback (confirm, node_info) {
              if(confirm){
                that.addNode({...{
                  "node_label":"",
                  "position": {"x":offsetX,"y":offsetY}
                  }, ...node_info})
                that.graph.paint(); // 重新渲染
              }
            }
          });
        });
      },
      // 初始化图事件
      initGraphEvent () {

        //连线流动效果
        this.graph.on('on-node-mouseenter', e => {
          if(e && e.item) {
            e.item.getOutEdges().forEach(edge => {
              edge.clearStates('edgeState');
              edge.setState('edgeState', 'hover');
            });
          }
        });
        //拖拽效果
        this.graph.on('on-node-mousemove', e => {
          if (e && e.item) {
            this.tooltip = e.item.get('model').id;
            this.left = e.clientX + 40;
            this.top = e.clientY - 20;
          }
        });
        //清除流动效果
        this.graph.on('on-node-mouseleave', e => {
          if (e && e.item) {
            this.tooltip = '';
            if(e && e.item) {
              e.item.getOutEdges().forEach(edge => {
                edge.clearStates('edgeState');
              });
            }
          }
        });

        //删除节点
        this.graph.on('before-node-removed', ({ target, callback }) => {
          setTimeout(() => {
            // 确认提示
            if (target) {
              console.log("快捷键删除节点==", target)
            }
            callback(false);
          }, 1000);
        });

        //删除线路
        this.graph.on('before-edge-removed', ({ target, callback }) => {
          setTimeout(() => {
            // 确认提示
            if (target) {
              console.log("快捷键删除线路==", target)
            }
            callback(false);
          }, 1000);
        });

        //节点双击
        this.graph.on('after-node-dblclick', e => {
          if (e && e.item) {
            console.log(e.item);
          }
        });

        //边移动鼠标
        this.graph.on('on-edge-mousemove', e => {
          if (e && e.item) {
            this.tooltip = e.item.get('model').label;
            this.left = e.clientX + 40;
            this.top = e.clientY - 20;
          }
        });

        //离开边
        this.graph.on('on-edge-mouseleave', e => {
          if (e && e.item) {
            this.tooltip = '';
          }
        });

        //添加边
        this.graph.on('before-edge-add', ({ source, target, sourceAnchor, targetAnchor }) => {
          let that = this
          this.$emit("edge-add",{
            link: [source.get('id'), target.get('id')],
            callback (confirm, edge_info) {
              if(confirm){
                that.addLink({...{
                  "source_node":source.get('id'),
                  "target_node":target.get('id'),
                  "label":""
                  }, ...edge_info})
              }
            }
          });
        });

        //节点拖拽结束
        this.graph.on('on-node-dragend', (e) => {
          this.updateNodePosition({"node_id":e.item.get("id"),"position": JSON.stringify({"x":parseInt(e.x), "y":parseInt(e.y)})})
        });

        //点击节点
        this.graph.on('after-node-selected', (e) => {
          if(e && e.item){
            this.drawer_node = true
            console.log("点击节点==",e.item);
          }
        });

        //点击边
        this.graph.on('after-edge-selected', e => {
          this.configVisible = !!e;
          if (e && e.item) {
            this.config = e.item.get('model').id;
            this.graph.updateItem(e.item, {
              // shape: 'line-edge',
              style: {
                radius:    10,
                lineWidth: 2,
              },
            });
            this.drawer_link = true
            console.log("点击边==",e.item);
          }
        });
      },

      // 初始化拓扑
      initTopo(){
        this.graph.clear()
        this.nodes = {}
        for(let i=0;i<this.initialData["nodes"].length;i++){
          let node_item = this.initialData["nodes"][i]
          if(node_item["node_id"]){
            this.addNode(node_item)
          }
        }
        this.edges = {}
        for(let i=0;i<this.initialData["edges"].length;i++){
          let edge_item = this.initialData["edges"][i]
          if(this.nodes[edge_item["source_node"]]&&this.nodes[edge_item["target_node"]]){
            this.addLink(edge_item)
          }
        }
      },

      // 添加节点
      addNode (nodeItem) {
        let position = {...{x:0,y:0}, ...nodeItem.position}
        if(nodeItem["node_id"]){
          let node ={
            ...{
              "id": ""+nodeItem.node_id,
              "label": nodeItem.node_label,
              "description": nodeItem.node_label,
            },
            ...{
              "type": "modelRect-node",
              // 节点中 icon 配置
              logoIcon: {
                // 是否显示 icon，值为 false 则不渲染 icon
                show: true,
                // icon 的地址，字符串类型
                // img: "https://gw.alipayobjects.com/zos/basement_prod/4f81893c-1806-4de4-aff3-9a6b266bc8a2.svg",
                // img: this.logoSvgBase64,
              },
              // 节点中表示状态的 icon 配置
              stateIcon: {
                // 是否显示 icon，值为 false 则不渲染 icon
                show: false,
                // icon 的地址，字符串类型
                // img: this.logoSvgBase64,
              },
              x: position.x,
              y: position.y
            }
          }
          console.log("org node===", nodeItem)
          console.log("add node===", node)
          this.graph.addItem('node', node);
          this.nodes[node["id"]]=node
        }

      },

      addLink(linkItem){
        let link = {}
        link["id"] = ""+linkItem.source_node + "_" + linkItem.target_node
        link["source"] = ""+linkItem.source_node
        link["target"] = ""+linkItem.target_node
        link["sourceAnchor"] = 1
        link["targetAnchor"] = 0
        link["label"] = linkItem.label
        this.graph.addItem('edge', link);
        this.edges[link["id"]] = link
      },

      deleteNode(item) {
        console.log("删除元素==", item)
        let item_mode = item.getModel()
        if (item.getType() === 'node') {
          console.log('这是一个节点');
          let nodeId = item_mode.id
          console.log("删除节点ID==", nodeId)

          // 1. 查找所有与该节点相关的边
          const relatedEdges = this.graph.getEdges().filter(edge => {
            const model = edge.getModel();
            // 边的起点或终点是当前节点
            return model.source === nodeId || model.target === nodeId;
          });

          // 2. 先删除所有关联边
          relatedEdges.forEach(edge => {
            console.log("删除关联边==", edge.getModel().id)
            delete this.edges[edge.getModel().id]
            this.graph.removeItem(edge);
          });

          // 3. 再删除节点
          const node = this.graph.findById(nodeId);
          if (node) {
            this.graph.removeItem(node);
            console.log(`节点 ${nodeId} 及其关联边已删除`);
            delete this.nodes[nodeId]
          }

        } else if (item.getType() === 'edge') {
          console.log('这是一条边');
          delete this.edges[item_mode.id];
          this.graph.removeItem(item);
          console.log("仅删除边==", item)
        }
      },

      // 修改边数据并局部重绘
      updateEdgeData(edgeId, newData) {
        // 1. 查找边实例
        const edge = this.graph.findById(edgeId);
        if (!edge) return;

        // 2. 合并新旧配置
        const updatedModel = { ...edge.getModel(), ...newData };

        // 3. 更新边（局部重绘）
        this.graph.updateItem(edge, updatedModel);
      },

      // 修改节点数据并局部重绘
      updateNodeData(nodeId, newData) {
        // 1. 查找节点实例
        const node = this.graph.findById(nodeId);
        if (!node) return;

        // 2. 获取节点当前配置
        const oldModel = node.getModel();

        // 3. 合并新旧配置（只修改变化的字段）
        const updatedModel = { ...oldModel, ...newData };

        // 4. 更新节点（G6 会自动局部重绘该节点）
        this.graph.updateItem(node, updatedModel);

        // 无需调用 paint()，updateItem 会触发局部重绘
      },

      //更新节点位置信息
      updateNodePosition(nodeItem,flag){
        console.log("更新节点位置===",nodeItem, flag)
      },

      handleClear(){
        console.log("清空画布")
        if (this.graph) {
          this.graph.clear();
        }
      },

      handleResetZoom(){
        console.log("重置视图")
        if (this.graph) {
          // 在 mounted 或初始化方法中检查
          console.log('G6 实例:', this.graph);
          console.log('G6 版本:', G6.version); // 确认是否为 4.3.7

          // this.graph.zoomTo(1,{ x: 0, y: 0 });
          this.initTopo();
          this.graph.fitView();
        }
      },

      handleFitZoom(){
        console.log("适应视图")
        if (this.graph) {
          // 在 mounted 或初始化方法中检查
          console.log('G6 实例:', this.graph);
          console.log('G6 版本:', G6.version); // 确认是否为 4.3.7

          // this.graph.zoomTo(1,{ x: 0, y: 0 });
          this.graph.fitView();
        }
      },

      handleSubmit(){
        console.log("提交流程", this.nodes, this.edges)
      },

    },
  }
</script>

<style scoped>
  .workflow-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .toolbar {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e8e8e8;
    gap: 10px;
  }
  /* 小地图样式 */
  .mini-map-container {
    width: 200px;
    height: 100px;
    position: absolute;
    border-left: 1px solid #e8e8e8;
    background-color: #fff;
  }

  .mini-map {
    width: 100%;
    height: 100%;
  }
</style>
