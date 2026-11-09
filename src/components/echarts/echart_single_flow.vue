<template>
  <echart_realtime
    metric="flow"
    :chartsname="chartsname"
    :port_info="port_info"
    :chartswidth="chartswidth"
    :chartsheight="chartsheight"
    :interval="interval">
  </echart_realtime>
</template>

<script>
import echart_realtime from "./echart_realtime.vue"

// 实时流量曲线：保留原组件名和 props，样式与历史流量图统一
export default {
  components: {echart_realtime},
  props: {
    chartsname: {
      type: String,
      default: () => "echartContainer"
    },
    port_info: {
      type: Object,
      default: () => {
        return {"ip": "", "if_name": "", "port_id": "", "sysname": "", "alias": "-"}
      }
    },
    chartswidth: {
      type: String,
      default: () => "600px"
    },
    chartsheight: {
      type: String,
      default: () => "320px"
    },
    interval: {
      type: Number,
      default: () => 10
    }
  }
}
</script>
