<template>
  <div>
    <el-button type="primary" :loading="isload" @click="addData">添加数据</el-button>
    <tem_table
      ref="bgp_t"
      :key="refresh_flag"
      v-bind:table_data="bgp_data"
      v-bind:table_header="bgp_header"
      v-bind:multi_flag="true"
      v-bind:option_btn="tab_single_btns"
      v-bind:option_multibtn="tab_multi_btns"
      v-bind:download_flag="true"
      @showIt="showView"
      @delIt="delIt"
      @editMulti="ediView"
      >
    </tem_table>
  </div>
</template>

<script>
  import tem_table from '@/components/tables/table_basic.vue';
  export default {
    data() {
      return {
        num:1,
        isload:false,
        refresh_flag:false,
        bgp_data:[
          {"peer_ip":"1.1.1.1","group_name":"测试", "asn":45062,"afi":"ipv4","vrf":"","import":"sda","export":"xx","cmd":"sadsd"}
        ],
        bgp_header:[
          {"key":"peer_ip","label":"邻居地址","width":"120"},
          {"key":"group_name","label":"BGP分组","width":"120"},
          {"key":"asn","label":"ASN","width":"80"},
          {"key":"afi","label":"地址簇","width":"80"},
          {"key":"vrf","label":"VPN实例","width":"80"},
          {"key":"import","label":"入向策略","width":"120"},
          {"key":"export","label":"出向策略","width":"120"},
          {"key":"cmd","label":"相关配置","type":"text"},
        ],
        tab_single_btns:[
          {"label":"预览","type":"primary","click":"showIt"},
          {"label":"删除","type":"danger","click":"delIt"}
        ],
        tab_multi_btns:[
          {"label":"编辑","type":"primary","click":"editMulti"},
          {"label":"删除","type":"danger","click":"delMulti"},
        ],
      };
    },
    mounted() {
    },
    methods:{
      showView(val){
        console.log(val)
      },
      ediView(val){
        console.log(val)
      },
      addData(){
        this.bgp_data.push({"peer_ip":"1.1.1."+this.num,"group_name":"测试", "asn":45062,"afi":"ipv4","vrf":"","import":"sda","export":"xx","cmd":"sadsd"})
        this.num=this.num+1
        this.refresh_flag = !this.refresh_flag
      },
      delIt(val,row_id, idx){
        console.log("删除==",row_id,idx)
        this.$refs.bgp_t.delIndex(row_id)
      }
    },
    components:{
      tem_table
    },
  }
</script>

<style>
</style>
