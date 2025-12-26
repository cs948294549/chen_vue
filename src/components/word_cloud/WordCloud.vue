<template>
  <!-- 词云容器：支持响应式宽高，添加加载状态 -->
  <div class="word-cloud-container">
    <div
      ref="wordCloudRef"
      class="word-cloud"
      :style="{ width: `${width}px`, height: `${height}px` }"
    ></div>
    <!-- 加载提示（词汇为空时显示） -->
    <div class="empty-tip" v-if="words.length === 0">
      暂无词汇数据，请添加关键词
    </div>
  </div>
</template>

<script>
// 引入 npm 安装的 wordcloud 包
import WordCloud from 'wordcloud';

export default {
  name: 'WordCloud',
  props: {
    /**
     * 词汇数据
     * 格式：[{ text: '关键词', weight: 权重(影响字体大小), color: '自定义颜色(可选)' }]
     */
    words: {
      type: Array,
      required: true,
      default: () => []
    },
    /** 词云宽度（单位：px） */
    width: {
      type: Number,
      default: 600
    },
    /** 词云高度（单位：px） */
    height: {
      type: Number,
      default: 400
    },
    /** 字体（支持中文） */
    fontFamily: {
      type: String,
      default: 'Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif'
    },
    /** 字体大小范围（单位：px） */
    fontSizeRange: {
      type: Array,
      default: () => [16, 64]
    },
    /** 词汇旋转比例（0-1，0 表示不旋转） */
    rotateRatio: {
      type: Number,
      default: 0.5
    },
    /** 词汇间距（单位：px） */
    padding: {
      type: Number,
      default: 2
    },
    /** 颜色列表（优先级：词汇自带 color > 颜色列表 > 随机色） */
    colorList: {
      type: Array,
      default: () => [
        '#1890ff', '#722ed1', '#fa541c', '#00b42a', '#ff7d00',
        '#00c4ff', '#ff4d4f', '#52c41a', '#13c2c2', '#757575'
      ]
    },
    /** 是否允许词汇点击 */
    clickable: {
      type: Boolean,
      default: true
    },
    /** 是否显示词汇悬浮提示 */
    showTooltip: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      wordCloudInstance: null, // 词云实例（用于销毁/更新）
      hoverWord: null // 悬浮的词汇信息
    };
  },
  watch: {
    // 深度监听词汇数据变化，自动更新词云
    words: {
      deep: true,
      handler() {
        this.renderWordCloud();
      }
    },
    // 监听宽高、样式配置变化，重新渲染
    fontSizeRange() {
      this.renderWordCloud();
    },
    rotateRatio() {
      this.renderWordCloud();
    },
    padding() {
      this.renderWordCloud();
    },
    colorList() {
      this.renderWordCloud();
    }
  },
  mounted() {
    // 组件挂载后初始化词云
    this.renderWordCloud();
  },
  beforeDestroy() {
    // 销毁词云实例和事件监听，避免内存泄漏
    if (this.wordCloudInstance) {
      this.wordCloudInstance.destroy();
      this.wordCloudInstance = null;
    }
  },
  methods: {
    /** 生成词汇颜色 */
    getWordColor(word) {
      const randomIndex = Math.floor(Math.random() * this.colorList.length);
      return this.colorList[randomIndex] || '#666666';
    },

    /** 核心：渲染/更新词云 */
    renderWordCloud() {
      const container = this.$refs.wordCloudRef;
      if (!container) return;

      // 销毁旧实例（避免重复渲染）
      if (this.wordCloudInstance) {
        this.wordCloudInstance.destroy();
      }

      // 词汇为空时直接返回
      if (this.words.length === 0) return;

      // 转换为 wordcloud 要求的格式：[['词1', 权重1], ['词2', 权重2]]
      const wordList = this.words.map(item => [item.text, item.weight]);

      // 词云配置项
      // circle(圆形) cardioid(心形) diamond(菱形) triangle(三角形) star (星形)
      const options = {
        // shape: 'triangle',
        list: wordList,
        fontFamily: this.fontFamily,
        minSize: this.fontSizeRange[0],
        maxSize: this.fontSizeRange[1],
        // 禁用默认旋转比例（必须设为 0，避免冲突）
        rotateRatio: this.rotateRatio,
        padding: this.padding,
        gridSize: 10,
        // 自定义颜色逻辑
        color: (word) => {
          return this.getWordColor(word);
        },
        // 鼠标悬浮事件
        // hover: (item) => {
        //   if (!this.showTooltip) return;
        //   const targetWord = this.words.find(w => w.text === item[0]);
        //   this.hoverWord = {
        //     text: item[0],
        //     weight: item[1],
        //     color: targetWord ? this.getWordColor(targetWord) : '#666666',
        //     ...targetWord
        //   };
        //   this.$emit('word-hover', this.hoverWord);
        // },
        // 鼠标离开事件
        // mouseout: () => {
        //   if (this.showTooltip) {
        //     this.hoverWord = null;
        //     this.$emit('word-mouseout');
        //   }
        // },
        // 点击事件
        click: (item) => {
          if (!this.clickable) return;
          const targetWord = this.words.find(w => w.text === item[0]);
          const wordInfo = {
            text: item[0],
            weight: item[1],
            color: targetWord ? this.getWordColor(targetWord) : '#666666',
            ...targetWord
          };
          this.$emit('word-click', wordInfo);
        }
      };


      // 初始化词云实例
      this.wordCloudInstance = WordCloud(container, options);
    },
  }
};
</script>

<style scoped>
.word-cloud-container {
  position: relative;
  display: inline-block;
}

.word-cloud {
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.word-cloud:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999999;
  font-size: 14px;
  text-align: center;
  width: 100%;
  padding: 0 20px;
}

/* 适配小屏幕 */
@media (max-width: 768px) {
  .word-cloud {
    border-radius: 8px;
  }
}
</style>
