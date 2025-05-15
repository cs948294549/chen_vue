<template>
  <div class="bg-gray-100 p-8 flex flex-col items-center">
    <h1 class="text-2xl font-bold mb-4">图片框选并记录坐标</h1>
    <input type="file" @change="handleFileChange" class="mb-4">
    <div id="image-container" ref="imageContainer" @mousedown="startSelection" @mousemove="updateSelection" @mouseup="endSelection">
      <img :src="imageUrl" alt="上传的图片" v-if="imageUrl" ref="uploadedImage">
      <div v-for="(selection, index) in allSelections" :key="index" :style="getSelectionStyle(selection)" class="selection-box"></div>
    </div>
    <button :disabled="!allSelections.length || isSubmitting" @click="submitData" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
      提交坐标
    </button>
    <div id="coordinates-display" class="mt-4">
      <p v-for="(sel, index) in allSelections" :key="index">框选 {{ index + 1 }}: X: {{ sel.x }}, Y: {{ sel.y }}, 宽度: {{ sel.width }}, 高度: {{ sel.height }}</p>
    </div>
    <button @click="clearAllRecords" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4">
      清除所有记录
    </button>
    <button @click="clearLastRecord" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4">
      清除最近一次记录
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageUrl: '',
      isSelecting: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      allSelections: [],
      isSubmitting: false
    };
  },
  methods: {
    handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.imageUrl = event.target.result;
          this.allSelections = [];
          this.isSubmitting = false;
        };
        reader.readAsDataURL(file);
      }
    },
    startSelection(e) {
      e.preventDefault();
      this.isSelecting = true;
      this.startX = e.offsetX;
      this.startY = e.offsetY;
      const newSelection = {
        x: this.startX,
        y: this.startY,
        width: 0,
        height: 0
      };
      this.allSelections.push(newSelection);
    },
    updateSelection(e) {
      if (this.isSelecting) {
        const rect = this.$refs.uploadedImage.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;

        const minX = Math.max(0, Math.min(this.startX, this.endX));
        const minY = Math.max(0, Math.min(this.startY, this.endY));
        const maxX = Math.min(this.$refs.uploadedImage.width, Math.max(this.startX, this.endX));
        const maxY = Math.min(this.$refs.uploadedImage.height, Math.max(this.startY, this.endY));

        const width = maxX - minX;
        const height = maxY - minY;

        const lastSelection = this.allSelections[this.allSelections.length - 1];
        lastSelection.x = minX;
        lastSelection.y = minY;
        lastSelection.width = width;
        lastSelection.height = height;
      }
    },
    endSelection() {
      if (this.isSelecting) {
        this.isSelecting = false;
        const lastSelection = this.allSelections[this.allSelections.length - 1];
        if (lastSelection.width === 0 || lastSelection.height === 0) {
          this.allSelections.pop();
        }
      }
    },
    submitData() {
      if (this.isSubmitting) return;
      this.isSubmitting = true;
      console.log('提交的所有坐标:', this.allSelections);
      alert('所有坐标已提交到后端（模拟）');
      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    },
    getSelectionStyle(selection) {
      return {
        left: `${selection.x}px`,
        top: `${selection.y}px`,
        width: `${selection.width}px`,
        height: `${selection.height}px`,
        border: '2px solid red',
        position: 'absolute',
        display: 'block'
      };
    },
    clearAllRecords() {
      this.allSelections = [];
    },
    clearLastRecord() {
      if (this.allSelections.length > 0) {
        this.allSelections.pop();
      }
    }
  }
};
</script>

<style scoped>
#image-container {
  position: relative;
  display: inline-block;
}

.selection-box {
  position: absolute;
  border: 2px solid red;
}
</style>    