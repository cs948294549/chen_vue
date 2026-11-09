<template>
  <div class="rt-traffic" :style="{width: chartswidth, maxWidth: '100%'}">
    <div class="rt-title">{{ titleText }}</div>
    <div ref="chart" class="rt-chart" :style="{width: '100%', height: chartsheight, display: errorMsg ? 'none' : 'block'}" v-loading="loading"></div>
    <div v-if="errorMsg" class="rt-empty">
      <i class="el-icon-warning-outline"></i>{{ errorMsg }}
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
import collector_api from "@/api/mapis/collector_interface.js"

// 两类实时指标：流量用 64 位字节计数（×8 换 bps），错包用 32 位错包计数（直接取增量）
const METRIC_CONF = {
  flow: {
    title: "流量计数",
    // ifHCInOctets / ifHCOutOctets
    oids: {"in": "1.3.6.1.2.1.31.1.1.1.6.", "out": "1.3.6.1.2.1.31.1.1.1.10."},
    factor: 8
  },
  error: {
    title: "错包计数",
    // ifInErrors / ifOutErrors
    oids: {"in": "1.3.6.1.2.1.2.2.1.14.", "out": "1.3.6.1.2.1.2.2.1.20."},
    factor: 1
  }
}

// 保留最近多少个采样点
const MAX_POINTS = 30

export default {
  props: {
    // flow：流量；error：错包
    metric: {
      type: String,
      default: () => "flow"
    },
    // 保留原参数，父组件注释里按名字区分图表实例
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
    // 采集间隔（秒），仅用于提示，速率按实际两次采样的时间差计算
    interval: {
      type: Number,
      default: () => 10
    },
    title: {
      type: String,
      default: () => ""
    }
  },
  data () {
    return {
      loading: false,
      errorMsg: "",
      lastClock: null,
      // 上一次的原始计数器值，null 表示还没有采样过
      lastCounter: {in: null, out: null},
      times: [],
      flow_in: [],
      flow_out: [],
      timer: "",
      myChart: ""
    }
  },
  computed: {
    conf () {
      return METRIC_CONF[this.metric] || METRIC_CONF.flow
    },
    titleText () {
      return this.title || this.conf.title
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.myChart = echarts.init(this.$refs.chart)
      this.createBar()
      this.getDevFlow()
      this.timer = setInterval(this.getDevFlow, Math.max(this.interval, 1) * 1000)
    })
    // 对话框有展开动画，初始化时宽度可能还没撑开，稍后再校正一次
    this.resizeTimer = setTimeout(this.resizeChart, 300)
    window.addEventListener('resize', this.resizeChart)
  },
  beforeDestroy () {
    this.stop()
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.resizeChart)
    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = ""
    }
  },
  methods: {
    stop () {
      clearInterval(this.timer)
      this.timer = ""
    },
    resizeChart () {
      if (this.myChart) {
        this.myChart.resize()
      }
    },
    getDevFlow () {
      if (this.loading) {
        return
      }
      const ip = this.port_info["ip"]
      const port_id = this.port_info["port_id"]
      if (!ip || port_id === undefined || port_id === null || port_id === "") {
        this.stop()
        this.errorMsg = "缺少设备 IP 或端口索引，无法采集实时数据"
        return
      }

      let that = this
      const oids = this.conf.oids
      const read = direction => new Promise(resolve => {
        collector_api.getSNMPGET({"ip": ip, "oid": oids[direction] + port_id, "coding": "utf-8"}, {}).then(function (response) {
          resolve({"val": response.data["data"], "name": direction})
        }).catch(function (error) {
          console.log(error)
          resolve({"val": null, "name": direction})
        })
      })

      this.loading = this.times.length === 0
      Promise.all([read("in"), read("out")]).then(function (res) {
        that.loading = false
        let current = {}
        for (let i = 0; i < res.length; i++) {
          const value = parseInt(res[i]["val"])
          // 单次 SNMP 失败或返回非数字时沿用上次的值，避免曲线出现断崖
          current[res[i]["name"]] = isNaN(value) ? that.lastCounter[res[i]["name"]] : value
        }
        if (current["in"] === null && current["out"] === null) {
          that.errorMsg = "采集失败，请检查设备连通性"
          return
        }
        that.errorMsg = ""
        that.addData(current)
      })
    },
    addData: function (current) {
      const now = Date.now()
      const rate = {in: 0, out: 0}
      if (this.lastClock !== null) {
        // 按实际间隔换算，定时器的抖动不会让速率偏大
        const seconds = (now - this.lastClock) / 1000
        for (let i = 0; i < 2; i++) {
          const direction = i === 0 ? "in" : "out"
          const prev = this.lastCounter[direction]
          const value = current[direction]
          if (prev !== null && value !== null && seconds > 0) {
            let delta = (value - prev) * this.conf.factor
            // 计数器清零（设备重启）或 32 位回绕时会得到负数，按 0 处理
            if (delta < 0) {
              delta = 0
            }
            rate[direction] = delta / seconds
          }
        }
      }
      this.lastCounter = {in: current["in"], out: current["out"]}
      this.lastClock = now

      this.times.push(now)
      this.flow_in.push(rate["in"])
      this.flow_out.push(rate["out"])
      while (this.times.length > MAX_POINTS) {
        this.times.shift()
        this.flow_in.shift()
        this.flow_out.shift()
      }
      this.updateChart()
    },
    updateChart () {
      if (!this.myChart) {
        return
      }
      this.myChart.setOption({
        xAxis: {data: this.times.map(t => this.formatDate(t))},
        series: [
          {data: this.flow_in},
          {data: this.flow_out}
        ]
      })
    },
    createBar () {
      const isFlow = this.metric !== "error"
      this.myChart.setOption({
        color: ['#409eff', '#67c23a'],
        title: {
          text: "IP:" + this.port_info.ip + "\n端口:" + this.port_info.if_name + "\n描述:" + (this.port_info.alias || "-"),
          x: "center",
          textStyle: {fontSize: 11}
        },
        tooltip: {
          trigger: 'axis',
          textStyle: {fontSize: 12},
          formatter: params => {
            if (!params.length) {
              return ''
            }
            const lines = [params[0].axisValue]
            params.forEach(p => {
              lines.push(p.marker + p.seriesName + '：' + (isFlow ? this.formatBps(p.value) : this.formatCount(p.value)))
            })
            if (isFlow) {
              lines.push('<span style="color:#909399">采集间隔 ' + this.interval + ' 秒</span>')
            }
            return lines.join('<br/>')
          }
        },
        legend: {
          bottom: 0,
          icon: 'rect',
          itemWidth: 12,
          itemHeight: 8,
          textStyle: {fontSize: 11}
        },
        grid: {left: 80, right: 30, top: 76, bottom: 36},
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [],
          axisLabel: {fontSize: 10},
          splitLine: {show: false}
        },
        yAxis: {
          type: 'value',
          position: 'left',
          axisLabel: {
            fontSize: 10,
            formatter: value => (isFlow ? this.formatBps(value) : this.formatCount(value))
          }
        },
        series: [
          {
            type: 'line',
            name: "in",
            showSymbol: false,
            lineStyle: {width: 1.2},
            areaStyle: {opacity: 0.12},
            data: []
          },
          {
            type: 'line',
            name: "out",
            showSymbol: false,
            lineStyle: {width: 1.2},
            areaStyle: {opacity: 0.12},
            data: []
          }
        ]
      }, true)
    },
    formatBps (value) {
      if (value === null || value === undefined || isNaN(value)) {
        return "-"
      }
      const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"]
      let index = 0
      let num = Number(value)
      while (index < units.length - 1 && num >= 1000) {
        num = num / 1000
        index++
      }
      return (index === 0 ? num.toFixed(0) : num.toFixed(2)) + " " + units[index]
    },
    // 错包计数：大数压缩显示，避免 y 轴上一串位数撑爆宽度
    formatCount (value) {
      if (value === null || value === undefined || isNaN(value)) {
        return "-"
      }
      const num = Number(value)
      if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + "G"
      }
      if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + "M"
      }
      if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + "K"
      }
      return num < 1 ? num.toFixed(2) : String(Math.round(num))
    },
    formatDate (ms) {
      const date = new Date(ms)
      const pad = n => (n < 10 ? '0' + n : '' + n)
      return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    }
  }
}
</script>

<style scoped>
.rt-traffic {
  box-sizing: border-box;
}
.rt-title {
  margin-bottom: 4px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}
.rt-chart {
  box-sizing: border-box;
}
.rt-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 12px;
  color: #909399;
}
.rt-empty i {
  margin-right: 4px;
  color: #e6a23c;
}
</style>
