<template>
  <div class="word-cloud-demo">
    <div class="demo-header">
      <h2>Vue 2 词云组件演示（npm + wordcloud）</h2>
      <div class="demo-controls">
        <button @click="addRandomWord" class="btn btn-primary">添加随机词汇</button>
        <button @click="updateAllWords" class="btn btn-success">更新全部词汇</button>
        <button @click="clearAllWords" class="btn btn-danger">清空词汇</button>
      </div>
    </div>

    <!-- 词云组件 -->
    <div class="demo-content">
      <WordCloud
        :words="wordData"
        :width="wordCloudWidth"
        :height="wordCloudHeight"
        :font-size-range="[18, 72]"
        :color-list="customColorList"
        @word-click="handleWordClick"
      />
    </div>


  </div>
</template>

<script>
// 引入词云组件
import WordCloud from './WordCloud.vue';

export default {
  name: 'WordCloudDemo',
  components: {
    WordCloud
  },
  data() {
    return {
      // 词云宽高
      wordCloudWidth: 900,
      wordCloudHeight: 540,
      // 自定义颜色列表
      customColorList: [
        '#2f54eb', '#1890ff', '#096dd9', '#722ed1', '#9254de',
        '#fa541c', '#ff7d00', '#fa8c16', '#00b42a', '#52c41a'
      ],
      // 词汇数据（初始数据）
      wordData: [
        { text: 'Vue 2', weight: 20, desc: '前端框架' },
        { text: 'WordCloud', weight: 78, desc: '词云可视化库' },
        { text: 'npm', weight: 72, desc: '包管理工具' },
        { text: '前端开发', weight: 68, desc: '技术领域' },
        { text: '组件封装', weight: 65, desc: '开发技巧' },
        { text: '动态更新', weight: 60, desc: '核心功能' },
        { text: '中文适配', weight: 58, desc: '支持中文显示' },
        { text: '交互事件', weight: 55, desc: '点击/悬浮' },
        { text: '响应式', weight: 52, desc: '适配不同屏幕' },
        { text: '样式自定义', weight: 48, desc: '颜色/字体/间距' },
        { text: '性能优化', weight: 45, desc: '渲染效率' },
        { text: '开箱即用', weight: 42, desc: '快速集成' }
      ],
      // 悬浮词汇信息
      hoveredWord: null,
      //  tooltip 位置
      tooltipLeft: 0,
      tooltipTop: 0,
      // 点击记录
      clickLog: []
    };
  },
  methods: {
    /** 添加随机词汇（修正：变量名重复问题） */
    addRandomWord() {
      const randomTexts = [
        'JavaScript', 'HTML5', 'CSS3', 'ES6+', 'Webpack',
        'Vite', 'Element UI', 'Axios', 'ECharts', 'Node.js'
      ];
      const randomDescs = [ // 修正：原变量名 randomDesc → randomDescs（复数，避免与下方重复）
        '脚本语言', '标记语言', '样式语言', 'ECMAScript 6+', '构建工具',
        '新一代构建工具', 'UI组件库', 'HTTP请求库', '可视化库', '后端运行环境'
      ];
      const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
      const randomWeight = Math.floor(Math.random() * 50) + 30; // 权重 30-80
      const randomDesc = randomDescs[Math.floor(Math.random() * randomDescs.length)]; // 现在变量名唯一

      // 避免重复添加
      const isDuplicate = this.wordData.some(item => item.text === randomText);
      if (!isDuplicate) {
        this.wordData.push({
          text: randomText,
          weight: randomWeight,
          desc: randomDesc
        });
      } else {
        alert(`词汇「${randomText}」已存在！`);
      }
    },

    /** 更新全部词汇 */
    updateAllWords() {
      this.wordData = [
        { text: 'Vue 词云', weight: 95, desc: 'Vue 2 词云组件' },
        { text: 'npm 安装', weight: 88, desc: '通过 npm 快速安装' },
        { text: '动态数据', weight: 82, desc: '支持实时更新' },
        { text: '自定义样式', weight: 78, desc: '颜色/字体/间距可配置' },
        { text: '交互丰富', weight: 75, desc: '点击/悬浮事件' },
        { text: '中文友好', weight: 70, desc: '完美支持中文显示' },
        { text: '响应式布局', weight: 68, desc: '适配不同屏幕尺寸' },
        { text: '性能优异', weight: 65, desc: '高效渲染' },
        { text: '开箱即用', weight: 62, desc: '无需复杂配置' },
        { text: '扩展灵活', weight: 58, desc: '支持自定义功能' }
      ];
    },

    /** 清空词汇 */
    clearAllWords() {
      if (confirm('确定要清空所有词汇吗？')) {
        this.wordData = [];
        this.clickLog = [];
        this.hoveredWord = null;
      }
    },

    /** 处理词汇点击事件 */
    handleWordClick(word) {
      // 记录点击日志
      this.clickLog.unshift({
        text: word.text,
        weight: word.weight,
        time: Date.now()
      });
      // 限制日志最多 5 条
      if (this.clickLog.length > 5) {
        this.clickLog.pop();
      }
      alert(`点击了词汇：${word.text}（权重：${word.weight}）`);
    },
  }
};
</script>

<style scoped>
.word-cloud-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.demo-controls {
  display: flex;
  gap: 10px;
}

.demo-content {
  text-align: center;
  margin-bottom: 30px;
}

/* 自定义 tooltip */
.custom-tooltip {
  position: fixed;
  z-index: 9999;
  width: 200px;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none; /* 避免遮挡鼠标事件 */
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-text {
  font-size: 16px;
  font-weight: bold;
}

.tooltip-weight {
  font-size: 12px;
  color: #ccc;
}

.tooltip-body {
  font-size: 13px;
  color: #eee;
  line-height: 1.4;
}

/* 点击记录 */
.demo-log {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}


</style>
