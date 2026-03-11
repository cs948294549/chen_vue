<template>
	<div :id="toponame" class="mynetwork" :style="{width:chartswidth,height:chartsheight}">
		<!--用于画关系图的部分 :id="chartsname" :style="{width:chartswidth,height:chartsheight}"-->
	</div>
</template>

<script>
  import vis from 'vis'
  import switchSvg from '@/assets/topo/h3_switch_general.svg';
  import routerSvg from '@/assets/topo/h3_router_general.svg';

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
		},
		data(){
			return{
			}
		},
		mounted(){
			this.draw();
			// this.timer = setInterval(this.draw, 5000);
		},
		beforeDestroy() {
			//删除定时器
			console.log("清除定时器");
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
				console.log(edges)
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
					},
					physics: {
						enabled: false
					},
					interaction: { hover: true },
				};
				// initialize your network!
				let network = new vis.Network(container, data, options);

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
        	console.log("rightclick event",params)
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
          network.selectNodes([params.node])
        });
        network.on("blurNode", function (params) {
          network.selectNodes([])
        });
        network.on("hoverEdge", function (params) {
          network.selectEdges([params.edge])
        });
        network.on("blurEdge", function (params) {
          network.selectEdges([])
        });


			},
			saveNodePosition:function(position){
				this.$emit("savePosition",position)
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
		border: 1px solid lightgray;
	}
</style>
