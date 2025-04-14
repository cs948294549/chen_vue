<template>
  <div>测试页面1</div>
</template>

<script>
import op_api from "@/api/mapis/image_interface.js"

export default {
  name: "TopMenu",
  data () {
    return {}
  },
  mounted () {
    this.test()
  },
  methods: {
    test(){
      let that = this
      op_api.test({"op_id":1},{}).then(function(response){
        console.log("工单详情",response.data)
        that.$message({
          type: 'success',
          message: '查询成功'
        });
      }).catch(function (error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
      })
    },
  },
  components: {}
}
</script>

<style>
</style>
