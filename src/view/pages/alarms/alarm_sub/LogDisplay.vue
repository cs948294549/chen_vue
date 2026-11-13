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

    <!-- 原始日志已超过7天保留期，提示而非当成查询失败 -->
    <el-alert
      v-if="expired"
      title="该告警原始日志已超过7天保留期，已被清理，仅保留告警本身的统计信息"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 10px;"
    />

    <!-- Element UI 滚动条组件，实现优雅纵向滚动 -->
    <el-scrollbar class="log-scroll-container" height="100%">
      <!-- 日志列表容器 -->
      <div class="log-list">
        <!-- 空日志提示 -->
        <div class="log-empty-tip" v-if="logData.length === 0">
          {{ expired ? '日志已过期清理，无数据可展示' : '暂无日志数据可展示' }}
        </div>
        <!-- 日志条目循环渲染 -->
        <div
          class="log-item"
          v-for="(log, index) in formattedLogData"
          :key="index"
          :class="{
            'log-item-unhandled': log.is_read === 0,
            'log-item-handled': log.is_read !== 0
          }"
        >
          <!-- 左侧状态标识（区分未读/已读） -->
          <div class="log-status-tag"></div>
          <!-- 日志内容（等宽字体，还原服务器日志效果）

               时间和事件码加了 user-select:none —— 它们是管线补上的
               （采集时间、归一化事件码），不是设备发的原文。划选复制时
               只应该拿到 msg，混进这两列粘出去就不是一条能直接搜的日志了 -->
          <span class="handler-time">{{ log.formatIngestTime }}</span>
          <!-- 事件码为空时用占位块撑住同样宽度，不然那一行的 msg 会左移，
               整列就对不齐了。title 兜住超长被截断的（最长 17 个字符的
               MAC_FLAP_SUPPRESS 放得下，更长的鼠标悬停看全名） -->
          <span class="handler-name" v-if="log.event_code" :title="log.event_code">{{ log.event_code }}</span>
          <span class="handler-name-placeholder" v-else></span>
          <span class="handler-msg">{{ log.msg }}</span>
        </div>
      </div>
    </el-scrollbar>
  </el-card>
</template>

<script>
export default {
  name: 'LogDisplay',
  props: {
    // 父组件传入的日志数组（必传），alarm_log 原子记录
    logData: {
      type: Array,
      required: true,
      validator: (value) => {
        if (value.length === 0) return true;
        return value.every(item => item.hasOwnProperty('msg'));
      }
    },
    // 日志是否已超过7天保留期被清理
    expired: {
      type: Boolean,
      default: false
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
    // 格式化日志数据（确保 is_read 为数字类型，避免类型错误）
    formattedLogData() {
      return this.logData.map(log => ({
        ...log,
        is_read: Number(log.is_read) || 0,
        formatIngestTime: this.formatTime(log.ingest_ts)
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
  },
  methods: {
    /**
     * 只给时分秒，不带日期
     *
     * 日期是冗余的：弹窗标题和告警那一行已经写了时间范围，而 msg 原文
     * 里也带着设备自报的完整时间。这一列的作用是让人看清同一秒内几条
     * 日志的先后，8 个字符定宽正好对齐（等宽字体）
     */
    formatTime(time) {
      if (!time) return '--:--:--';
      time = time.toString();
      const date = new Date(time.length === 10 ? time * 1000 : Number(time));
      if (isNaN(date.getTime())) return '--:--:--';
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
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

/* 时间和事件码：定宽 + 不参与选中
 *
 * 定宽用 ch（等宽字体下 1ch = 一个字符宽），msg 才会从同一个横坐标起，
 * 竖着扫一眼就能对比。原来没给宽度，事件码从 IF_UP(5) 到
 * UNKNOWN_MNEMONIC(16) 长短不一，msg 的起点跟着飘。
 *
 * user-select:none 是另一件事：这两列是管线补的（采集时间、归一化
 * 事件码），不是设备发的原文。划选复制时只该拿到 msg
 */
.handler-name {
  color: #4fc3f7;
  width: 18ch;
  flex-shrink: 0;
  margin-left: 10px;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 事件码为空时（理论上不该有）也要占住位置，否则那一行的 msg 会左移 */
.handler-name-placeholder {
  width: 18ch;
  flex-shrink: 0;
  margin-left: 10px;
  margin-right: 10px;
  user-select: none;
}

/* msg 反过来要能自由选中。flex:1 吃掉剩余宽度，长日志自己换行 */
.handler-msg {
  color: #f8f9fa;
  flex: 1;
  min-width: 0;
  word-break: break-all;
  user-select: text;
  -webkit-user-select: text;
}

.handler-time {
  color: #90a4ae;
  font-size: 13px;
  width: 8ch;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
