<!-- DragItem.vue -->
<template>
  <!-- 核心：添加draggable="true"，监听dragstart事件 -->
  <div
    class="drag-item"
    :style="{ backgroundColor: item.color }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragover.prevent
  >
    {{ item.name }}
  </div>
</template>

<script>
export default {
  props: {
    // 接收父组件传递的组件数据（如ID、名称、样式）
    item: {
      type: Object,
      required: true,
      default: () => ({ id: '', name: '', color: '#fff' })
    }
  },
  methods: {
    // 拖拽开始：将组件数据通过事件传递给父组件
    handleDragStart() {
      this.$emit('start-drag', this.item); // 触发父组件的@start-drag事件
    }
  }
};
</script>

<style scoped>
.drag-item {
  padding: 12px 15px;
  margin-bottom: 10px;
  color: #fff;
  border-radius: 4px;
  cursor: move;
  transition: transform 0.2s, box-shadow 0.2s;
}

.drag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 拖拽过程中添加半透明效果（可选） */
.drag-item[dragging] {
  opacity: 0.6;
}
</style>
