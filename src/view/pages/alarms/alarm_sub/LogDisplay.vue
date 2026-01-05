<template>
  <el-card
    class="log-display-card"
    shadow="hover"
  >
    <!-- 自定义 el-card header 插槽（替代原 header 配置对象） -->
    <template slot="header"> <!-- Vue 2.6+ 支持 # 简写，等价于 slot="header" -->
      <div class="card-header-container">
        <!-- 卡片标题 -->
        <span class="card-title-text">{{ cardTitle }}</span>
        <!-- 右侧额外内容（支持 HTML/DOM，添加自定义样式） -->
        <span class="log-count-tip">共 {{ logData.length }} 条日志</span>
      </div>
    </template>

    <!-- Element UI 滚动条组件，实现优雅纵向滚动 -->
    <el-scrollbar class="log-scroll-container" height="100%">
      <!-- 日志列表容器 -->
      <div class="log-list">
        <!-- 空日志提示 -->
        <div class="log-empty-tip" v-if="logData.length === 0">
          暂无日志数据可展示
        </div>
        <!-- 日志条目循环渲染 -->
        <div
          class="log-item"
          v-for="(log, index) in formattedLogData"
          :key="index"
          :class="{
            'log-item-unhandled': log.status === 0,
            'log-item-handled': log.status !== 0
          }"
        >
          <!-- 左侧状态标识（区分未处理/已处理） -->
          <div class="log-status-tag"></div>
          <!-- 日志内容（等宽字体，还原服务器日志效果） -->
          <div class="log-message">{{ log.msg }}</div>
        </div>
      </div>
    </el-scrollbar>
  </el-card>
</template>

<script>
export default {
  name: 'LogDisplay',
  props: {
    // 父组件传入的日志数组（必传）
    logData: {
      type: Array,
      required: true,
      validator: (value) => {
        // 数据格式校验：数组中的每个元素必须包含 message 字段
        if (value.length === 0) return true;
        return value.every(item => item.hasOwnProperty('msg') && item.hasOwnProperty('status'));
      }
    },
    // 可选：卡片标题（自定义）
    cardTitle: {
      type: String,
      default: '服务器日志展示'
    },
    // 可选：日志容器高度（默认 600px）
    containerHeight: {
      type: [String, Number],
      default: '600px'
    }
  },
  computed: {
    // 卡片头部配置
    logCardHeader() {
      return {
        text: this.cardTitle,
        extra: `<span class="log-count-tip">共 ${this.logData.length} 条日志</span>`
      };
    },
    // 格式化日志数据（确保 status 为数字类型，避免类型错误）
    formattedLogData() {
      return this.logData.map(log => ({
        ...log,
        status: Number(log.status) || 0 // 兼容非数字类型 status，默认转为 0（未处理）
      }));
    }
  },
  mounted() {
    // 初始化：设置滚动容器高度
    this.$nextTick(() => {
      const scrollContainer = this.$el.querySelector('.log-scroll-container');
      if (scrollContainer) {
        scrollContainer.style.height = this.containerHeight;
      }
    });
  }
};
</script>

<style scoped>
/* 卡片容器样式 */
.log-display-card {
  width: 98%;
  margin: 0 auto;
  box-sizing: border-box;
}

/* 滚动容器样式 */
.log-scroll-container {
  --el-scrollbar-background-color: #f8f9fa;
}

/* 日志列表容器 */
.log-list {
  width: 100%;
  min-height: 100%;
  background-color: #1e1e1e; /* 深色背景，更贴近服务器日志终端 */
  font-family: "Consolas", "Monaco", "Menlo", "Courier New", monospace; /* 等宽字体，还原日志原生效果 */
  font-size: 14px;
  line-height: 1.6; /* 固定行高，保证日志排版整齐 */
  box-sizing: border-box;
}

/* 空日志提示 */
.log-empty-tip {
  color: #999;
  text-align: center;
  padding: 50px 0;
  font-size: 14px;
}

/* 单个日志条目样式 */
.log-item {
  display: flex;
  align-items: flex-start;
  padding: 2px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* 细分隔线，不破坏整体感 */
  transition: background-color 0.2s ease;
}

/* 未处理日志（status: 0）样式 */
.log-item-unhandled {
  color: #f8f9fa; /* 亮白色字体，突出未处理日志 */
  background-color: rgba(255, 193, 7, 0.05); /* 浅黄背景，轻微高亮 */
}

/* 已处理日志（status != 0）样式 */
.log-item-handled {
  color: #adb5bd; /* 灰色字体，区分已处理日志 */
  background-color: transparent;
}

/* 日志条目 hover 效果 */
.log-item:hover {
  background-color: rgba(13, 110, 253, 0.1); /* 浅蓝高亮，提升可操作性 */
}

/* 左侧状态标识 */
.log-status-tag {
  width: 4px;
  height: 16px;
  margin-right: 12px;
  margin-top: 3px;
  border-radius: 2px;
  flex-shrink: 0; /* 固定宽度，不被挤压 */
}

/* 未处理日志标识（黄色） */
.log-item-unhandled .log-status-tag {
  background-color: #ffc107;
}

/* 已处理日志标识（灰色） */
.log-item-handled .log-status-tag {
  background-color: #6c757d;
}

/* 日志内容样式（等宽字体，自动换行） */
.log-message {
  flex: 1;
  word-wrap: break-word; /* 长日志自动换行，避免横向溢出 */
  white-space: pre-line; /* 保留日志中的换行符，还原原始格式 */
}

/* 日志数量提示 */
.log-count-tip {
  font-size: 12px;
  color: #909399;
}
</style>
