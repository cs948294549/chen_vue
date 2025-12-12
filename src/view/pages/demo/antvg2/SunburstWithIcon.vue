<template>
  <div style="background-color: #f8f9fb;padding: 30px;">
    <div style="margin-bottom: 20px;">{{title}}</div>
    <div style="background-color: #f8f9fb;" ref="view_1"></div>
  </div>
</template>

<script>
  import { Chart } from '@antv/g2';

  export default {
    props:{
    	//传递的json数据，填充表格
      chartsdata:{
        type:Array,
        default:()=>{
          return [
        {"id": 1, "val":100, "t":1},
        {"id": 2, "val":101, "t":2},
        {"id": 3, "val":102, "t":3},
        {"id": 4, "val":103, "t":4},
        {"id": 5, "val":104, "t":5},
        {"id": 6, "val":105, "t":6},
        {"id": 7, "val":107, "t":7},
        {"id": 8, "val":101, "t":8}
      ]
        }
      },
      chartscfg:{
        type:Object,
        default:()=>{
          return {"xaxis":"t", "yaxis":"val", "type": "", "size":"nomal"}
        }
      },
    },
  	data(){
  		return {
        title:"折线图",
        size_width:{
          "large":800,
          "nomal":400,
          "small":200,
          "mini":100
        },
        size_height:{
          "large":400,
          "nomal":200,
          "small":100,
          "mini":80
        },

      }
    },
    mounted() {
      this.draw1()
    },
    destroyed() {
      // console.log("销毁line")
    },
    methods:{
      draw1(){
        // {xaxis,yaxis,type}
        let data = []
        for(let i=0;i<this.chartsdata.length;i++){
          if(this.chartsdata[i][this.chartscfg["xaxis"]]&&this.chartsdata[i][this.chartscfg["yaxis"]]){
            let new_item = {}
            new_item["xaxis"]=this.chartsdata[i][this.chartscfg["xaxis"]]
            new_item["yaxis"]=this.chartsdata[i][this.chartscfg["yaxis"]]
            if(this.chartsdata[i][this.chartscfg["type"]]){
              new_item["type"]=this.chartsdata[i][this.chartscfg["type"]]
            }else{
              new_item["type"]=""
            }
            data.push(new_item)
          }
        }

        //初始化size
        let size = "nomal"
        if(this.chartscfg["size"]){
          if(this.size_width[size]){
            size=this.chartscfg["size"]
          }
        }
        //图表名称
        if(this.chartscfg["name"]){
          this.title = this.chartscfg["name"]
        }


        const chart = new Chart({
          container: this.$refs.view_1,
          width: this.size_width[size],
          height: this.size_height[size],
        });

        chart.data(data);

        chart.scale(                 // 之前的chart.source()方法已经替换为chart.data()和chart.scale()
            "yaxis", {
                min: 0,                 // 我的纵坐标count的最小值，不设置的话自动取数据中最小数的作为y=0的起始
                nice: true              // 默认为 true，用于优化数值范围，使绘制的坐标轴刻度线均匀分布。例如原始数据的范围为 [3, 97]，如果 nice 为 true，那么就会将数值范围调整为 [0, 100] --官方
            }
        );
        if(data.length>0){
          chart.point().position("xaxis*yaxis").size(4).shape('circle').style({
            stroke: '#fff',
            lineWidth: 1,
          });
          chart.line().position("xaxis*yaxis").color("type").shape('smooth').label("yaxis");
          chart.render();
        }

      },
    },
  }
</script>

<style>
</style>
