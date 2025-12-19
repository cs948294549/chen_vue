<template>
  <div style="position: relative;">
    <div style="position: absolute;left: 40px;top: 40px;z-index: 2;">
        <div style="display: flex;" v-for="(item,index) in legendConfig">
          <div :style="'width: 40px;height: 20px;border-radius: 5px;background-color: '+item.kind+';'"></div>
          <div style="margin-left: 10px;">{{item.start}}~{{item.end}}{{item.label}}</div>
        </div>
    </div>
    <!-- 必须设置宽高，否则地图无法渲染 -->
    <div class="echarts-map" ref="mapRef" :style="{ width: mapWidth, height: mapHeight }"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
// 引入中国地图 GeoJSON 数据
import chinaGeo from '@/assets/map/100000_full.json';

export default {
  name: 'EchartsMap',
  props: {
    // 外部传入地图数据（如各省份数值）
    mapData: {
      type: Array,
      default: () => []
    },

    // 父组件传入宽度（支持 px/% 等单位，默认 100%）
    width: {
      type: String,
      default: '100%'
    },
    // 父组件传入高度（支持 px/% 等单位，默认 600px）
    height: {
      type: String,
      default: '600px'
    },
    // 自定义图例配置（父组件可传入，也可子组件固定）
    legendConfig: {
      type: Array,
      default: () => []
    }

  },
  data() {
    return {
      myChart: null, // ECharts 实例
      all_Geo: [
        '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省',
        '吉林省', '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省',
        '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
        '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省',
        '贵州省', '云南省', '西藏自治区', '陕西省', '甘肃省',
        '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省',
        '香港特别行政区', '澳门特别行政区'
      ],

      mapWidth: this.width,  // 响应式宽高
      mapHeight: this.height

    };
  },
  mounted() {
    // 初始化地图
    this.initMap();
    // 监听窗口resize，自适应地图
    window.addEventListener('resize', this.resizeChart);
  },
  beforeDestroy() {
    // 销毁实例，避免内存泄漏
    if (this.myChart) {
      this.myChart.dispose();
      this.myChart = null;
    }
    window.removeEventListener('resize', this.resizeChart);
  },
  methods: {
    // 初始化地图
    initMap() {
      // 1. 初始化 ECharts 实例
      this.myChart = echarts.init(this.$refs.mapRef);
      // 2. 注册地图数据（关键：将 GeoJSON 注册到 ECharts）
      echarts.registerMap('china', chinaGeo);
      // 3. 配置地图参数
      const option = {
        // 标题
        // title: {
        //   text: '中国各省份数据可视化',
        //   left: 'center',
        //   textStyle: { fontSize: 18 }
        // },
        // 提示框
        tooltip: {
          trigger: 'item', // 按区域触发
          formatter: '{b}: {c}（单位：万）' // b=省份名，c=数值
        },
        // 视觉映射（颜色渐变）
        // visualMap: {
        //   min: 0,
        //   max: 1000,
        //   left: 'left',
        //   top: 'bottom',
        //   text: ['高值', '低值'], // 文本标签
        //   calculable: true, // 允许手动调整范围
        //   inRange: {
        //     color: ['#e0ffff', '#006edd'] // 颜色渐变区间
        //   }
        // },
        // 地图核心配置

        series: [
          {
            name: '数据指标',
            type: 'map',
            mapType: 'china', // 对应注册的地图名称
            roam: true, // 允许缩放、拖拽
            label: {
              show: true, // 显示省份名称
              fontSize: 10,
              color: '#333',
            },
            // 核心：自定义省份颜色
            itemStyle: {
              // 默认样式（未指定颜色的省份）
              normal: {
                areaColor: '#EEEEEE', // 默认浅蓝
                borderColor: '#6F6F6F',
                borderWidth: 1,
                // 条件判断：匹配省份名则用自定义颜色
                color: (params) => {
                  if(params.data&&params.data.kind){
                    return params.data.kind
                  }else{
                    return '#EEEEEE'
                  }
                }
              },
              // 鼠标hover样式
              emphasis: {
                label: { color: '#fff' },
                areaColor: '#389BB7'
              }
            },
            emphasis: {
              label: { color: '#fff' }, // 鼠标hover时文字颜色
              itemStyle: { areaColor: '#389BB7' } // hover时区域颜色
            },
            data: this.mapData // 绑定外部传入的省份数据
          }
        ]
      };
      // 4. 渲染地图
      this.myChart.setOption(option);
    },
    // 地图自适应
    resizeChart() {
      if (this.myChart) {
        this.myChart.resize();
      }
    },
    reload(){
      if (this.myChart) {
        this.myChart.dispose();
        this.myChart = null;
      }
      this.initMap()
    }
  }
};
</script>

<style scoped>
.echarts-map {
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
