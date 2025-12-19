<template>
  <div class="editor-wrapper">
    <div :id="container" style="width: 100%; height: 100%;border: 1px solid #ddd;border-radius: 4px;overflow: hidden;"></div>
  </div>
</template>

<script>
import SwitchEditor from '@/components/switchCli/SwitchEditor.js';

export default {
  name: 'CustomMonacoEditor',
  mixins: [SwitchEditor],
  props: {
    value: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false
    },
    devtype:{
      type: String,
      default: 'h3c'
    },
    container: {
      type: String,
      default: 'editor-container'
    },
  },
  watch:{
    value(newVal) {
      if (this.editor && this.editor.getValue() !== newVal) {
        this.editor.setValue(newVal);
      }
    },
  },
  methods: {
    // 3. 编辑器内容变化时，向外部触发事件
    emitContentChange() {
      const content = this.editor.getValue();
      // 通过 input 事件触发，支持 v-model 双向绑定
      this.$emit('input', content);
      // 额外提供一个 change 事件，传递完整信息
      this.$emit('change', {
        content,
        timestamp: new Date()
      });
    }
  },
  beforeDestroy() {
    console.log("销毁===")
    if (this.editor) {
      this.editor.dispose();
    }
  }
};
</script>

<style scoped>
.editor-wrapper {
  margin-top: 20px;
  height: 780px;
}

</style>
<style>
  .monaco-editor .suggest-widget {
    display: block !important;
    z-index: 1000;
  }
</style>
