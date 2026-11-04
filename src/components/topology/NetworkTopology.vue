<template>
	<!-- 外层只负责尺寸与定位；vis 的画布单独放在 canvas 容器里，避免与 Vue 的节点操作互相干扰 -->
	<div class="mynetwork" :class="{ 'pick-mode': pickMode }" :style="{width:chartswidth,height:chartsheight}">
		<div :id="toponame" class="mynetwork-canvas"></div>
		<!-- 搜索定位标记：只覆盖被定位的那一个节点，不改变其他节点的样式 -->
		<div
			v-if="focusBadge"
			class="focus-ring"
			:style="{
				left: focusBadge.x + 'px',
				top: focusBadge.y + 'px',
				width: focusBadge.size + 'px',
				height: focusBadge.size + 'px'
			}">
			<span class="fr-pulse"></span>
		</div>
		<div
			v-if="focusBadge"
			class="focus-badge"
			:style="{ left: focusBadge.x + 'px', top: focusBadge.y + 'px', marginTop: -(focusBadge.size / 2) + 'px' }">
			<i class="el-icon-aim"></i>
			<span class="fb-text">{{ focusBadge.label }}</span>
			<i class="el-icon-close fb-close" title="取消标记" @click.stop="clearFocusNode"></i>
		</div>
	</div>
</template>

<script>
  import vis from 'vis'
  import switchSvg from '@/assets/topo/h3_switch_general.svg';
  import routerSvg from '@/assets/topo/h3_router_general.svg';
  import cloudSvg from '@/assets/topo/cloud.svg';

  //node: {"id":"唯一ID", "label":"展示在图里的名称", "title":"悬浮节点展示的名称", "group": "设备的类型，用于区分展示图标，与组件group一致", "x": "坐标", "y": "坐标"}
  //edge: {"id":"唯一ID,一般用from@to去标识", "from":"来源的nodeid", "to":"目的nodeid", "label": "线上展示的描述", "color": {"color":"#333"}}
	export default {
		props:{
			//传递的json数据，填充表格
			toponame:{
				type:String,
				default:()=>{
					return "mynetwork"
				}
			},
			position:{
				type:Object,
				default:()=>{
					return {};
				}
			},
			node_list:{
				type:Array,
				default:()=>{
					return []
				}
			},
			link_list:{
				type:Array,
				default:()=>{
					return []
				}
			},
			chartswidth:{
				type:String,
				default:()=>{
					return "1400px"
				}
			},
			chartsheight:{
				type:String,
				default:()=>{
					return "700px"
				}
			},
			// 连线模式：开启后点击节点触发 pick_node 事件（单击选点，不拖拽）
			pickMode:{
				type:Boolean,
				default:false
			},
		},
		data(){
			return{
				network: null,
				nodesDataSet: null,
				edgesDataSet: null,
				// 被固定选中的节点（连线模式下高亮起点），鼠标划过后不被清除
				pinnedNodeId: null,
				// 搜索定位的节点ID，画布上保留明显标记直到手动取消
				focusNodeId: null,
				focusNodeLabel: '',
				// 定位标记的位置与文案（画布像素坐标）
				focusBadge: null
			}
		},
		watch: {
			node_list: {
				handler(newNodes) {
					// 如果network已初始化，更新节点数据
					if (this.network && this.nodesDataSet) {
						this.nodesDataSet.clear()
						this.nodesDataSet.add(this.setPosition())
					}
				},
				deep: true
			},
			link_list: {
				handler(newEdges) {
					// 如果network已初始化，更新边数据
					if (this.network && this.edgesDataSet) {
						this.edgesDataSet.clear()
						this.edgesDataSet.add(newEdges)
					}
				},
				deep: true
			}
		},
		mounted(){
			this.draw();
			// this.timer = setInterval(this.draw, 5000);
		},
		beforeDestroy() {
			//删除定时器
			// console.log("清除定时器");
			// clearInterval(this.timer);
		},
		methods: {
			setPosition:function(){
				let node_list = []
				let nodes = this.node_list
				for(let i=0;i<nodes.length;i++){
					let node = nodes[i]
					if(this.position[nodes[i]["id"]]){
						node["x"] = this.position[nodes[i]["id"]]["x"]
						node["y"] = this.position[nodes[i]["id"]]["y"]
						node_list.push(node)
					}else{
						node_list.push(node)
					}
				}
				return node_list
			},
			draw () {
				let node_list = this.setPosition()
				let nodes = node_list
				let edges = this.link_list
				// this.getnodes = this.setposition(this.getnodes)
				// let nodes = new vis.DataSet(this.getnodes);
				// let edges = new vis.DataSet(this.getedgs);
				// console.log(edges)
				// create a network
				let container = document.getElementById(this.toponame);

				// provide the data in the vis format
				let data = {
					nodes: nodes,
					edges: edges
				};
				let options = {
					edges: {
						smooth: false, //是否显示方向箭头
						///color: "#333" // 线条颜色
						// arrows:'to'
					},
					groups: {
						router: {'image': routerSvg, 'shape': 'image'},
						switch: {'image': switchSvg, 'shape': 'image'},
						cloud: {'image': cloudSvg, 'shape': 'image', 'size': 30},
					},
					physics: {
						enabled: false
					},
					interaction: { hover: true },
				};
				// initialize your network!
				let network = new vis.Network(container, data, options);

				// 保存network实例供外部调用
				this.network = network
				this.pinnedNodeId = null
				this.focusNodeId = null
				this.focusBadge = null

				let postdev=list2dict(nodes)
				let idlist=Object.keys(postdev);
				let that=this;

				function list2dict(lists){
					let res = {}
					for(let i=0;i<lists.length;i++){
						res[lists[i]["id"]] = lists[i]
					}
					return res
				};

				//双击事件
				network.on("doubleClick", function(params) {//双击事件
					console.log("doubleClick event",params)
					if (params.nodes.length != 0) {//确定为节点双击事件
						console.log("doubleClick node")
						let click_node_id = params.nodes[0];
						console.log(postdev[click_node_id]);
						that.$emit("click_node", postdev[click_node_id])
					}else if(params.edges.length != 0){
						console.log("doubleClick edgs")
						let click_edgs_id = params.edges[0];
						console.log("edgs id",click_edgs_id);
            that.$emit("click_link")
					}else{
						console.log(JSON.stringify(that.getnodes))
					}
				});
        //鼠标右键
        network.on("oncontext", function (params) {
        	if (params.nodes.length != 0) {//确定为节点双击事件
        		let click_node_id = params.nodes[0];
        		that.$emit("rightclick", {"click_type": "node", "detail":postdev[click_node_id]})
        	}else if(params.edges.length != 0){
        		let click_edgs_id = params.edges[0];
        	  that.$emit("rightclick", {"click_type": "link", "detail":click_edgs_id})
        	}
        });

				//拖动结束后
				network.on("dragEnd", function (params) {
					if (params.nodes.length != 0 ) {
						console.log(params.nodes);
						let node_positon=network.getPositions(idlist);
						console.log(JSON.stringify(node_positon));
						that.saveNodePosition(node_positon);
						//setGlobalPosition();
					}
				});

        network.on("hoverNode", function (params) {
          // 连线模式下固定起点后不再被 hover 选中覆盖
          if (that.pinnedNodeId) return
          network.selectNodes([params.node])
        });
        network.on("blurNode", function (params) {
          if (that.pinnedNodeId) return
          network.selectNodes([])
        });
        network.on("hoverEdge", function (params) {
          network.selectEdges([params.edge])
        });
        network.on("blurEdge", function (params) {
          network.selectEdges([])
        });

        //单击节点：连线模式下用于依次选取起点/终点
        network.on("click", function (params) {
          if (!that.pickMode) return
          if (params.nodes.length === 0) return
          let click_node_id = params.nodes[0]
          that.$emit("pick_node", postdev[click_node_id])
        });

        //每次重绘后同步定位标记的位置（缩放、拖拽后跟随节点）
        network.on("afterDrawing", function () {
          that.updateFocusBadge()
        });


			},
			saveNodePosition:function(position){
				this.$emit("savePosition",position)
			},
			//父组件调用：高亮指定节点（连线模式下标记已选起点）
			selectNodesByIds(ids){
				if (!this.network) return
				this.pinnedNodeId = (ids && ids.length) ? ids[0] : null
				this.network.selectNodes(ids || [])
			},
			//父组件调用：聚焦并高亮指定节点（搜索定位）
			//定位后只在该节点外套一个红色脉冲光环 + 悬浮标签，直到手动关闭
			focusNodeById(nodeId, label){
				if (!this.network || !nodeId) return
				this.clearFocusNode()
				const options = {
					scale: Math.max(this.network.getScale() || 1, 0.8),
					animation: {
						duration: 600,
						easingFunction: 'easeInOutQuad'
					}
				}
				this.focusNodeId = nodeId
				this.focusNodeLabel = label || nodeId
				this.network.selectNodes([nodeId])
				this.network.focus(nodeId, options)
				// 动画结束后节点才到视野中心，这里立即算一次，后面由 afterDrawing 持续跟随
				this.updateFocusBadge()
			},
			//当前节点在画布上的像素位置与图标尺寸（用于绘制光环）
			getFocusGeometry(){
				if (!this.network || !this.focusNodeId) return null
				const positions = this.network.getPositions([this.focusNodeId])
				const pos = positions && positions[this.focusNodeId]
				if (!pos) return null
				const dom = this.network.canvasToDOM(pos)
				if (!dom) return null
				// 图片节点：实际边长 = size * 2，再按当前缩放换算成屏幕像素
				let size = 50
				const nodeBody = this.network.body && this.network.body.nodes && this.network.body.nodes[this.focusNodeId]
				if (nodeBody) {
					const shapeSize = nodeBody.shape && (nodeBody.shape.width || nodeBody.shape.height)
					const optionSize = nodeBody.options && nodeBody.options.size
					const base = shapeSize || (optionSize ? optionSize * 2 : 25 * 2)
					size = base * (this.network.getScale() || 1)
				}
				// 略大于图标，让光环套在图标外侧，留出一点间距
				size = Math.max(Math.round(size * 1.35), 34)
				return { x: dom.x, y: dom.y, size: size }
			},
			//光环与标签跟随节点：缩放、拖动画布后重新计算画布像素坐标
			updateFocusBadge(){
				if (!this.network || !this.focusNodeId) {
					if (this.focusBadge) this.focusBadge = null
					return
				}
				const geo = this.getFocusGeometry()
				if (!geo) {
					if (this.focusBadge) this.focusBadge = null
					return
				}
				const x = Math.round(geo.x)
				const y = Math.round(geo.y)
				const size = Math.round(geo.size)
				const label = this.focusNodeLabel
				const prev = this.focusBadge
				if (prev && prev.x === x && prev.y === y && prev.size === size && prev.label === label) return
				this.focusBadge = { x: x, y: y, size: size, label: label }
			},
			//父组件 / 标签关闭按钮调用：清除定位标记
			clearFocusNode(){
				if (!this.focusNodeId) return
				this.focusNodeId = null
				this.focusNodeLabel = ''
				this.focusBadge = null
				if (this.network) this.network.selectNodes([])
			},
			//父组件调用
			focus_node(node_id){
			  let options = {
			    scale: 0.6,
			    offset: {x:0,y:0},
			    animation:{
			      duration:1000,
			      easingFunction:'easeInOutQuad'
			    }
			  }
			  this.network.selectNodes([node_id])
			  this.network.focus(node_id, options)
			},
			reloadData:function(){
			  this.draw(true)
			},
		},
		components:{
		}
	}
</script>

<style>
	.mynetwork {
		position: relative;
		box-sizing: border-box;
		border: 1px solid lightgray;
	}
	/* vis 的画布容器：铺满外层，定位标记叠在它上面 */
	.mynetwork .mynetwork-canvas {
		width: 100%;
		height: 100%;
	}
	/* 连线模式：鼠标指向节点显示十字准星，明确可点击 */
	.mynetwork.pick-mode canvas {
		cursor: crosshair;
	}
	/* 搜索定位：套在被定位节点上的高亮圆环（只作用于这一个节点） */
	.focus-ring {
		position: absolute;
		z-index: 15;
		transform: translate(-50%, -50%);
		border: 2px solid #f56c6c;
		border-radius: 50%;
		pointer-events: none;
		animation: focus-ring-breathe 1.4s ease-in-out infinite;
	}
	/* 外扩的一圈脉冲，进一步吸引注意 */
	.focus-ring .fr-pulse {
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		border: 2px solid #f56c6c;
		border-radius: 50%;
		opacity: 0.7;
		animation: focus-ring-pulse 1.4s ease-out infinite;
	}
	@keyframes focus-ring-breathe {
		0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.55); }
		50% { box-shadow: 0 0 0 6px rgba(245, 108, 108, 0.18); }
	}
	@keyframes focus-ring-pulse {
		0% { transform: scale(1); opacity: 0.75; }
		100% { transform: scale(1.9); opacity: 0; }
	}
	/* 搜索定位标记：节点上方的红色标签，指向被定位的节点 */
	.focus-badge {
		position: absolute;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 4px;
		max-width: 260px;
		padding: 3px 6px 3px 8px;
		line-height: 18px;
		font-size: 12px;
		color: #fff;
		white-space: nowrap;
		background: #f56c6c;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(245, 108, 108, 0.45);
		transform: translate(-50%, -100%) translateY(-8px);
		/* 标签本身不拦截鼠标，只有关闭按钮可点，避免影响节点拖拽 */
		pointer-events: none;
	}
	.focus-badge::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -5px;
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid #f56c6c;
		transform: translateX(-50%);
	}
	.focus-badge .fb-text {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.focus-badge .fb-close {
		cursor: pointer;
		opacity: 0.8;
		/* 父级关闭了鼠标穿透，这里单独打开，保证关闭按钮可点 */
		pointer-events: auto;
	}
	.focus-badge .fb-close:hover {
		opacity: 1;
	}
</style>
