<!-- Parent.vue -->
<template>
  <div class="drag-container">
    <!-- 源容器 -->
    <div class="list-container">
      <h3>源容器</h3>
      <!-- 渲染源容器的子组件 -->
      <DragItem
        v-for="item in sourceList"
        :key="item.id"
        :item="item"
        @start-drag="handleDragStart" />
    </div>

    <!-- 目标容器 -->
    <div class="list-container">
      <h3>目标容器</h3>
      <!-- 渲染目标容器的子组件 -->
      <DragItem
        v-for="item in targetList"
        :key="item.id"
        :item="item"
        @start-drag="handleDragStart"
      />
      <!-- 目标容器的放置区域（监听drop事件） -->
      <div
        class="drop-area"
        @dragover.prevent
        @drop="(e) => handleDrop(e, 'target')"
      >
        拖到这里
      </div>
    </div>
  </div>
</template>

<script>
import DragItem from './dragChild.vue'; // 导入可拖拽子组件

export default {
  components: { DragItem },
  data() {
    return {
      // 源容器数据（初始子组件列表）
      sourceList: [
        { id: 1, name: '组件1', color: '#409EFF' },
        { id: 2, name: '组件2', color: '#67C23A' },
        { id: 3, name: '组件3', color: '#E6A23C' }
      ],
      // 目标容器数据（初始为空）
      targetList: [],
      draggedItem: null  // 存储正在拖拽的子组件数据
    };
  },
  methods: {
    // 1. 接收子组件的拖拽开始事件，存储拖拽的组件数据
    handleDragStart(item) {
      this.draggedItem = item;
    },

    // 2. 处理放置事件：将拖拽的组件添加到目标容器，从源容器删除
    handleDrop(e, targetType) {
      if (!this.draggedItem) return; // 防止无数据时触发

      // 步骤1：从源容器删除组件（判断组件原本属于哪个容器）
      if (this.sourceList.some(item => item.id === this.draggedItem.id)) {
        this.sourceList = this.sourceList.filter(item => item.id !== this.draggedItem.id);
      } else {
        this.targetList = this.targetList.filter(item => item.id !== this.draggedItem.id);
      }

      // 步骤2：添加到目标容器
      if (targetType === 'target') {
        this.targetList.push({ ...this.draggedItem }); // 深拷贝，避免引用问题
      } else {
        this.sourceList.push({ ...this.draggedItem });
      }

      // 步骤3：清空拖拽数据（避免重复触发）
      this.draggedItem = null;
    }
  }
};
</script>

<style scoped>
.drag-container {
  display: flex;
  gap: 40px;
  padding: 20px;
  background: #f5f5f5;
}

.list-container {
  width: 300px;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.drop-area {
  margin-top: 15px;
  padding: 20px;
  text-align: center;
  color: #999;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.drop-area:hover {
  border-color: #409EFF;
  color: #409EFF;
}
</style>
