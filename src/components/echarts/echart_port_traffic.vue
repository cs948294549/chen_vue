<template>
  <div class="port-traffic">
    <div class="pt-toolbar">
      <el-date-picker
        v-model="range"
        type="datetimerange"
        size="small"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :picker-options="pickerOptions"
        :clearable="false"
        @change="onRangeChange">
      </el-date-picker>
      <el-button size="small" type="primary" icon="el-icon-search" :loading="loading" @click="loadFlow">查询</el-button>
      <el-button-group class="pt-nav">
        <el-button size="small" icon="el-icon-back" :disabled="!rangeHistory.length || loading" @click="goBack">上一段</el-button>
        <el-button size="small" icon="el-icon-refresh-left" :disabled="!rangeHistory.length || loading" @click="resetRange">重置</el-button>
      </el-button-group>
      <span class="pt-tip"><i class="el-icon-mouse"></i>图上横向拖动可框选时间段下钻</span>
      <span class="pt-granularity" v-if="granularity">
        <i class="el-icon-info"></i>{{ granularity }}
      </span>
    </div>

    <div class="pt-stats" v-if="stats">
      <div class="pt-stat">
        <span class="pt-stat-label">in 峰值</span>
        <span class="pt-stat-value">{{ formatBps(stats.in.max) }}</span>
      </div>
      <div class="pt-stat">
        <span class="pt-stat-label">in 平均</span>
        <span class="pt-stat-value">{{ formatBps(stats.in.avg) }}</span>
      </div>
      <div class="pt-stat">
        <span class="pt-stat-label">out 峰值</span>
        <span class="pt-stat-value">{{ formatBps(stats.out.max) }}</span>
      </div>
      <div class="pt-stat">
        <span class="pt-stat-label">out 平均</span>
        <span class="pt-stat-value">{{ formatBps(stats.out.avg) }}</span>
      </div>
      <div class="pt-stat">
        <span class="pt-stat-label">数据点</span>
        <span class="pt-stat-value">{{ inCount }} / {{ outCount }}</span>
      </div>
      <div class="pt-stat" v-if="spanText">
        <span class="pt-stat-label">区间跨度</span>
        <span class="pt-stat-value">{{ spanText }}</span>
      </div>
    </div>

    <div ref="chart" class="pt-chart" :style="{display: empty ? 'none' : 'block'}" v-loading="loading"></div>
    <el-empty v-if="empty && !loading" :image-size="90" description="该时间段没有流量数据"></el-empty>
  </div>
</template>

<script>
import echarts from 'echarts'
import collector_api from "@/api/mapis/collector_interface.js"

// 单条曲线最多渲染的点数，超过后按桶取最大值抽稀（时间跨度大时避免几十万个点拖垮浏览器）
const MAX_POINTS = 1200
// 框选下钻的最小窗口（秒），再小就没有更细的数据了（history 本身是 1 分钟粒度）
const MIN_SPAN = 120
// 下钻回退栈的深度上限
const MAX_HISTORY = 20

export default {
  props: {
    port_info: {
      type: Object,
      default: () => {
        return {"ip": "", "if_name": "", "sysname": "", "port_id": "", "alias": ""}
      }
    }
  },
  data () {
    return {
      range: [],
      // 打开时的初始区间，"重置" 回到这里
      defaultRange: [],
      // 下钻回退栈，每次换区间把旧区间压进来
      rangeHistory: [],
      loading: false,
      empty: false,
      granularity: "",
      stats: null,
      // 当前图上数据对应的区间，和 range 分开存，避免手动改选择器后拿不到旧区间
      appliedRange: [],
      inCount: 0,
      outCount: 0,
      reqSeq: 0,
      myChart: "",
      pickerOptions: {
        shortcuts: [
          {text: '最近1小时', onClick: picker => this.pickRange(picker, 3600)},
          {text: '最近6小时', onClick: picker => this.pickRange(picker, 6 * 3600)},
          {text: '最近24小时', onClick: picker => this.pickRange(picker, 24 * 3600)},
          {text: '最近7天', onClick: picker => this.pickRange(picker, 7 * 86400)},
          {text: '最近30天', onClick: picker => this.pickRange(picker, 30 * 86400)},
        ]
      }
    }
  },
  computed: {
    // 当前已加载区间的跨度，提示当前看的是多大一段
    spanText () {
      const applied = this.appliedRange
      if (!Array.isArray(applied) || applied.length !== 2) {
        return ""
      }
      return this.formatSpan(applied[1].getTime() - applied[0].getTime())
    }
  },
  mounted () {
    const now = Date.now()
    this.range = [new Date(now - 3600 * 1000), new Date(now)]
    this.defaultRange = [this.range[0], this.range[1]]
    this.$nextTick(() => {
      this.myChart = echarts.init(this.$refs.chart)
      this.bindBrush()
      this.loadFlow()
    })
    // 对话框有打开动画，初始化时宽度可能还没撑开，稍后再校正一次
    this.resizeTimer = setTimeout(this.resizeChart, 300)
    window.addEventListener('resize', this.resizeChart)
  },
  beforeDestroy () {
    clearTimeout(this.resizeTimer)
    window.removeEventListener('resize', this.resizeChart)
    if (this.myChart) {
      this.myChart.dispose()
      this.myChart = ""
    }
  },
  methods: {
    pickRange (picker, seconds) {
      const end = new Date()
      picker.$emit('pick', [new Date(end.getTime() - seconds * 1000), end])
    },
    // 图上横向框选 -> 取框选的起止时间重新查询，实现逐层下钻
    bindBrush () {
      if (!this.myChart) {
        return
      }
      this.myChart.on('brushEnd', params => {
        const areas = (params && params.areas) || []
        if (!areas.length) {
          return
        }
        const coord = areas[0].coordRange || areas[0].range
        if (!coord || coord.length !== 2) {
          return
        }
        const start = Math.min(coord[0], coord[1])
        const end = Math.max(coord[0], coord[1])
        // 清掉选框，不然下钻后框子还浮在新图上
        this.clearBrush()
        if (end - start < MIN_SPAN * 1000) {
          this.$message({type: 'warning', message: '选择的区间太短，请至少框选 2 分钟'})
          return
        }
        this.applyRange([new Date(start), new Date(end)])
      })
    },
    clearBrush () {
      if (!this.myChart) {
        return
      }
      this.myChart.dispatchAction({type: 'brush', areas: []})
    },
    // 换区间：把当前区间压进回退栈再查询
    applyRange (next) {
      const applied = this.appliedRange
      if (Array.isArray(applied) && applied.length === 2) {
        this.rangeHistory.push([applied[0], applied[1]])
        while (this.rangeHistory.length > MAX_HISTORY) {
          this.rangeHistory.shift()
        }
      }
      this.range = next
      this.loadFlow()
    },
    // 手动改选择器或点快捷方式，也算一次区间切换
    onRangeChange () {
      this.applyRange(this.range)
    },
    goBack () {
      const prev = this.rangeHistory.pop()
      if (!prev) {
        return
      }
      this.range = prev
      this.loadFlow()
    },
    resetRange () {
      this.rangeHistory = []
      this.range = [this.defaultRange[0], this.defaultRange[1]]
      this.loadFlow()
    },
    resizeChart () {
      if (this.myChart) {
        this.myChart.resize()
      }
    },
    loadFlow () {
      const range = this.range
      if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
        this.$message({type: 'warning', message: '请选择查询时间段'})
        return
      }
      const host = this.port_info["sysname"]
      const port_id = this.port_info["port_id"]
      if (!host || port_id === undefined || port_id === null || port_id === "") {
        this.$message({type: 'warning', message: '缺少设备名或端口索引，无法查询流量'})
        return
      }

      if (range[1].getTime() <= range[0].getTime()) {
        this.$message({type: 'warning', message: '结束时间必须大于开始时间'})
        return
      }

      let that = this
      // 连续框选时会有多个请求在路上，只认最后一个的结果
      const seq = ++this.reqSeq
      this.loading = true
      collector_api.getPortTraffic({
        "host": host,
        "port_id": String(port_id),
        "start_time": Math.floor(range[0].getTime() / 1000),
        "end_time": Math.floor(range[1].getTime() / 1000)
      }, {}).then(function (response) {
        if (seq !== that.reqSeq) {
          return
        }
        let ret = response.data || {}
        if (ret["code"] !== 0) {
          that.loading = false
          that.$message({type: 'error', message: ret["message"] || '查询失败'})
          return
        }
        that.appliedRange = [range[0], range[1]]
        that.renderFlow(ret["data"] || {})
        that.loading = false
      }).catch(function (error) {
        if (seq !== that.reqSeq) {
          return
        }
        console.log(error)
        that.loading = false
        that.$message({type: 'error', message: '查询失败，请重试'})
      })
    },
    renderFlow (data) {
      const inPoints = (data["net_if_in"] && data["net_if_in"]["points"]) || []
      const outPoints = (data["net_if_out"] && data["net_if_out"]["points"]) || []
      const types = {}

      // 时间轴用 [毫秒时间戳, 值] 的二元组，history 和 trend 混在一段里也能正常落点
      const toPairs = points => points.map(p => {
        types[p["type"]] = true
        return [Number(p["clock"]) * 1000, Number(p["value"])]
      })

      this.inCount = inPoints.length
      this.outCount = outPoints.length
      this.stats = {in: this.summarize(inPoints), out: this.summarize(outPoints)}
      this.granularity = this.granularityText(types)
      this.empty = inPoints.length === 0 && outPoints.length === 0

      if (this.empty) {
        this.stats = null
        this.granularity = ""
        if (this.myChart) {
          this.myChart.clear()
          // clear 会连 brush 状态一起清掉，重新挂上框选
          this.activateBrush()
        }
        return
      }

      if (!this.myChart) {
        return
      }
      this.myChart.setOption({
        color: ['#409eff', '#67c23a'],
        title: {
          text: "IP:" + this.port_info["ip"] + "\n端口:" + this.port_info["if_name"] + "\n描述:" + (this.port_info["alias"] || "-"),
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
            const lines = [this.formatClock(params[0].value[0], true)]
            params.forEach(p => {
              lines.push(p.marker + p.seriesName + '：' + this.formatBps(p.value[1]))
            })
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
        // toolbox 只用来给 brush 挂按钮，默认隐藏图标，交互靠 brush 的 lineX 直接拖
        toolbox: {show: false, feature: {brush: {}}},
        brush: {
          toolbox: ['lineX'],
          xAxisIndex: 0,
          brushMode: 'single',
          // 下钻后立刻重查，不需要保留选框
          transformable: false,
          throttleType: 'debounce',
          throttleDelay: 200,
          brushStyle: {
            borderWidth: 1,
            color: 'rgba(64,158,255,0.12)',
            borderColor: 'rgba(64,158,255,0.6)'
          }
        },
        grid: {left: 80, right: 30, top: 76, bottom: 56},
        xAxis: {
          type: 'time',
          // 把轴范围钉在查询区间上，两端没数据时也不会把曲线横向拉满
          min: this.appliedRange.length === 2 ? this.appliedRange[0].getTime() : null,
          max: this.appliedRange.length === 2 ? this.appliedRange[1].getTime() : null,
          axisLabel: {fontSize: 10},
          splitLine: {show: false}
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            formatter: value => this.formatBps(value)
          }
        },
        series: [
          {
            name: "in",
            type: 'line',
            showSymbol: false,
            lineStyle: {width: 1.2},
            areaStyle: {opacity: 0.12},
            data: this.downsample(toPairs(inPoints))
          },
          {
            name: "out",
            type: 'line',
            showSymbol: false,
            lineStyle: {width: 1.2},
            areaStyle: {opacity: 0.12},
            data: this.downsample(toPairs(outPoints))
          }
        ]
      }, true)
      this.activateBrush()
      this.resizeChart()
    },
    // toolbox 隐藏了，这里手动把 lineX 框选常驻打开，鼠标在图上横向拖动即可选区间
    activateBrush () {
      if (!this.myChart) {
        return
      }
      this.myChart.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {brushType: 'lineX', brushMode: 'single'}
      })
    },
    downsample (pairs) {
      if (pairs.length <= MAX_POINTS) {
        return pairs
      }
      const step = Math.ceil(pairs.length / MAX_POINTS)
      const result = []
      for (let i = 0; i < pairs.length; i += step) {
        let peak = pairs[i]
        for (let j = i + 1; j < Math.min(i + step, pairs.length); j++) {
          if (pairs[j][1] > peak[1]) {
            peak = pairs[j]
          }
        }
        result.push(peak)
      }
      return result
    },
    summarize (points) {
      if (!points.length) {
        return {max: null, avg: null}
      }
      let max = 0
      let sum = 0
      for (let i = 0; i < points.length; i++) {
        const value = Number(points[i]["value"])
        if (value > max) {
          max = value
        }
        sum += value
      }
      return {max: max, avg: sum / points.length}
    },
    // 后端按 35d 保留期分段取数：history 是 1 分钟实际值，trend 是 1 小时聚合值
    granularityText (types) {
      if (types["history"] && types["trend"]) {
        return "数据粒度：1 小时聚合（超出保留期）+ 1 分钟实际值"
      }
      if (types["trend"]) {
        return "数据粒度：1 小时聚合（超出 35 天保留期）"
      }
      if (types["history"]) {
        return "数据粒度：1 分钟实际值"
      }
      return ""
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
    formatSpan (ms) {
      const seconds = Math.round(ms / 1000)
      if (seconds < 60) {
        return seconds + " 秒"
      }
      if (seconds < 3600) {
        return Math.round(seconds / 60) + " 分钟"
      }
      if (seconds < 86400) {
        return (seconds / 3600).toFixed(seconds % 3600 === 0 ? 0 : 1) + " 小时"
      }
      return (seconds / 86400).toFixed(seconds % 86400 === 0 ? 0 : 1) + " 天"
    },
    formatClock (ms, withDate) {
      const date = new Date(ms)
      const pad = n => (n < 10 ? '0' + n : '' + n)
      const hm = pad(date.getHours()) + ':' + pad(date.getMinutes())
      if (!withDate) {
        return hm
      }
      return pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + hm + ':' + pad(date.getSeconds())
    }
  }
}
</script>

<style scoped>
.port-traffic {
  min-height: 200px;
}
.pt-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
}
.pt-toolbar .el-button {
  margin-left: 8px;
}
.pt-nav {
  margin-left: 8px;
}
.pt-nav .el-button {
  margin-left: 0;
}
.pt-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
.pt-tip i {
  margin-right: 4px;
  color: #c0c4cc;
}
.pt-granularity {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
.pt-granularity i {
  margin-right: 4px;
  color: #409eff;
}
.pt-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.pt-stat {
  padding: 6px 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f7fbff;
  font-size: 12px;
}
.pt-stat-label {
  margin-right: 8px;
  color: #909399;
}
.pt-stat-value {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-weight: 600;
  color: #303133;
}
.pt-chart {
  width: 100%;
  height: 420px;
}
</style>
