<template>
  <div style="width: 100%; height: 800px;">
    <div style="display: flex;">
      <FlowChart
        style="width: 800px;"
        :panel_width="800"
        :panel_height="600"
        :readonly="false"
        :initialData="initialData"
        @edge-add="edge_add_event"
        @node-add="node_add_event"
        ref="flowChart"
      />

      <div class="node-library">
          <span class="library-title">节点库</span>
          <div
            class="node-item"
            v-for="node in customNodes"
            :key="node.type"
            @dragstart="handleDragStart($event, node)"
            draggable
          >
            <i :class="node.icon"></i>
            <span>{{ node.label }}</span>
          </div>
      </div>
    </div>

    <el-dialog title="线路信息" :visible.sync="diag_link_info" width="50%" append-to-body>
      <el-form v-model="feature_link" size="mini" label-width="80px">
        <el-form-item label="源">
          <el-input style="width: 500px;" placeholder="源节点" v-model="feature_link.source_node" readonly></el-input>
        </el-form-item>
        <el-form-item label="目的">
          <el-input style="width: 500px;" placeholder="目的节点" v-model="feature_link.target_node" readonly></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="链路描述" v-model="feature_link.label" clearable></el-input>
        </el-form-item>
        <el-form-item label="附加信息">
          <el-input style="width: 500px;" type="textarea" :rows='4' resize="none" placeholder="评论" v-model="feature_link.msg"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitLink">确认</el-button>
          <el-button type="primary" @click="diag_link_info=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


    <el-dialog title="节点信息" :visible.sync="diag_node_info" width="50%" append-to-body>
      <el-form v-model="feature_node" size="mini" label-width="80px">
        <el-form-item label="节点ID">
          <el-input style="width: 500px;" placeholder="节点ID" v-model="feature_node.node_id" readonly></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input style="width: 500px;" placeholder="链路描述" v-model="feature_node.node_label" clearable></el-input>
        </el-form-item>
        <el-form-item label="附加信息">
          <el-input style="width: 500px;" type="textarea" :rows='4' resize="none" placeholder="评论" v-model="feature_link.msg"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitNode">确认</el-button>
          <el-button type="primary" @click="diag_node_info=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


  </div>
</template>

<script>
import FlowChart from '@/components/workflowComponent.vue';

export default {
  components: { FlowChart },
  data() {
    return {
      // 自定义节点类型
      customNodes: [
        { type: 'start', label: '开始111', color: '#409EFF', icon: 'el-icon-circle-check' },
        { type: 'end', label: '结束', color: '#F56C6C', icon: 'el-icon-circle-close' },
        { type: 'task', label: '任务', color: '#67C23A', icon: 'el-icon-s-operation' },
        { type: 'decision', label: '判断', color: '#E6A23C', icon: 'el-icon-question' },
        { type: 'subprocess', label: '子流程', color: '#909399', icon: 'el-icon-folder-opened' }
      ],
      // 初始流程图数据
      initialData: {
        nodes: [
          { node_id: 'start-1', type: 'start', node_label: '开始', color: '#409EFF', position:{x: 100, y: 200}, icon: 'el-icon-circle-check',size: [50, 25], style: { fill: '#52c41a' } },
          { node_id: 'task-1', type: 'task', node_label: '数据处理', color: '#67C23A', position:{x: 300, y: 200}, icon: 'el-icon-s-operation' },
          { node_id: 'end-1', type: 'end', node_label: '结束', color: '#F56C6C', position:{x: 500, y: 200}, icon: 'el-icon-circle-close' }
        ],
        edges: [
          { source_node: 'start-1', target_node: 'task-1', label:"开始" },
          { source_node: 'task-1', target_node: 'end-1', label:"处理成功" }
        ]
      },




      callback_cache:null,

      //link添加确认窗口
      diag_link_info:false,
      feature_link:{
        "source_node": "",
        "target_node": "",
        "label": ""
      },

      diag_node_info:false,
      feature_node:{
        "node_id": "",
        "node_label": "",
      },

    };
  },
  methods: {
    // 处理节点拖拽开始
    handleDragStart(e, nodeType) {
      e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
      console.log("拖拽开始===",e)
    },

    //线路新增事件
    edge_add_event(eventData){
      console.log("link add===", eventData.link)
      let link = eventData.link
      this.callback_cache = eventData.callback

      this.feature_link = {}
      this.$set(this.feature_link, 'source_node', link[0])
      this.$set(this.feature_link, 'target_node', link[1])
      this.$set(this.feature_link, 'label', "")
      this.diag_link_info = true
    },
    //提交link的回调
    submitLink(){
      this.callback_cache(true, this.feature_link)
      this.diag_link_info = false
    },


    //节点新增事件
    node_add_event(eventData){
      console.log("node add===", eventData.position)
      let position = eventData.position
      this.callback_cache = eventData.callback

      this.feature_node = {}
      this.$set(this.feature_node, 'node_id', `node-${Date.now()}`)
      this.$set(this.feature_node, 'node_label', "")
      this.diag_node_info = true
    },
    //提交节点的回调
    submitNode(){
      this.callback_cache(true, this.feature_node)
      this.diag_node_info = false
    },



  }
};
</script>
<style scoped>
  .node-library {
    display: flex;
    align-items: center;
    margin-left: auto;
    gap: 15px;
    padding-left: 15px;
    border-left: 1px solid #e8e8e8;
  }

  .library-title {
    font-size: 14px;
    color: #666;
  }
  .node-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background-color: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    cursor: move;
    font-size: 12px;
  }

  .node-item:hover {
    border-color: #1890ff;
  }
</style>
