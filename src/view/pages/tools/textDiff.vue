<template>
  <div class="text-diff-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" size="small" @click="getDiffRes" :disabled="!input_src || !input_target">
        <i class="el-icon-refresh"></i> 对比
      </el-button>
      <el-button size="small" @click="clearAll">
        <i class="el-icon-delete"></i> 清空
      </el-button>
      <el-button size="small" @click="swapTexts">
        <i class="el-icon-sort"></i> 交换
      </el-button>
      <el-divider direction="vertical"></el-divider>
      <span class="info-text">
        <i class="el-icon-info"></i>
        输入两段文本后点击对比，或输入后自动对比
      </span>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-panel">
        <div class="panel-header">
          <span class="panel-title">文本1（原始）</span>
          <div class="header-actions">
            <span class="char-count">{{ input_src.length }} 字符 / {{ getLineCount(input_src) }} 行</span>
            <el-button type="text" size="mini" @click="input_src = ''">清空</el-button>
          </div>
        </div>
        <el-input
          type="textarea"
          class="text-input"
          placeholder="请输入原始文本..."
          v-model="input_src"
          @input="onInputChange">
        </el-input>
      </div>

      <div class="input-panel">
        <div class="panel-header">
          <span class="panel-title">文本2（对比）</span>
          <div class="header-actions">
            <span class="char-count">{{ input_target.length }} 字符 / {{ getLineCount(input_target) }} 行</span>
            <el-button type="text" size="mini" @click="input_target = ''">清空</el-button>
          </div>
        </div>
        <el-input
          type="textarea"
          class="text-input"
          placeholder="请输入对比文本..."
          v-model="input_target"
          @input="onInputChange">
        </el-input>
      </div>
    </div>

    <!-- 结果区域 -->
    <div class="result-section">
      <div class="result-header">
        <span class="panel-title">
          <i class="el-icon-document"></i> 对比结果
        </span>
        <div v-if="diff_result">
          <el-tag size="mini" type="success">已完成</el-tag>
        </div>
      </div>
      <div class="result-content" v-loading="loading">
        <div v-if="!diff_result && !loading" class="empty-state">
          <i class="el-icon-document-copy"></i>
          <p>输入文本后将显示对比结果</p>
        </div>
        <div v-else v-html="diff_result" class="diff-html-wrapper"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import tools_api from "@/api/mapis/tools_interface.js"

	export default {
	  name: 'tool_for_diff',
	  data () {
		  return{
			  input_src: "",
			  input_target: "",
			  diff_result: "",
			  loading: false,
			  autoCompareTimer: null
		  }
	  },
    mounted(){
    },
    beforeDestroy() {
      if (this.autoCompareTimer) {
        clearTimeout(this.autoCompareTimer);
      }
    },
	  methods:{
      getDiffRes(){
        if (!this.input_src || !this.input_target) {
          this.$message({
            showClose: true,
            message: '请输入要对比的文本内容',
            type: 'warning'
          });
          return;
        }

        this.loading = true;
        tools_api.checkDiffText({"src":this.input_src, "target":this.input_target, "flag": true}, {}).then((response)=>{
          this.loading = false;
          if(response.data.code==0){
            this.diff_result = response.data.data
          }else{
            this.$message({
              showClose: true,
              message: '处理失败！',
              type: 'error'
            });
          }
        }).catch((err)=>{
          this.loading = false;
          console.log("错误信息", err)
          this.$message({
            showClose: true,
            message: '提交失败！',
            type: 'error'
          });
        });
      },

      onInputChange() {
        // 防抖：输入停止后自动对比
        if (this.autoCompareTimer) {
          clearTimeout(this.autoCompareTimer);
        }
        if (this.input_src && this.input_target) {
          this.autoCompareTimer = setTimeout(() => {
            this.getDiffRes();
          }, 1000);
        }
      },

      clearAll() {
        this.input_src = "";
        this.input_target = "";
        this.diff_result = "";
      },

      swapTexts() {
        const temp = this.input_src;
        this.input_src = this.input_target;
        this.input_target = temp;
        if (this.input_src && this.input_target) {
          this.getDiffRes();
        }
      },

      getLineCount(text) {
        if (!text) return 0;
        return text.split('\n').length;
      }
	  },
	}
</script>

<style scoped>
.text-diff-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  background: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.toolbar {
  background: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-text {
  color: #909399;
  font-size: 13px;
  margin-left: 8px;
}

.input-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.input-panel {
  flex: 1;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-header {
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-count {
  font-size: 12px;
  color: #909399;
}

.text-input {
  flex: 1;
  min-height: 0;
}

.text-input >>> .el-textarea__inner {
  border: none;
  border-radius: 0 0 4px 4px;
  padding: 12px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  height: 150px;
  resize: none;
  background: #fafafa;
}

.result-section {
  flex: 1;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.result-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  min-height: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* 优化后端返回的 diff HTML 样式 */
.diff-html-wrapper >>> table.diff {
  width: 100% !important;
  border-collapse: collapse;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.diff-html-wrapper >>> table.diff td {
  padding: 4px 8px;
  border: 1px solid #e4e7ed;
  vertical-align: top;
}

.diff-html-wrapper >>> .diff_header {
  background-color: #f5f7fa !important;
  font-weight: 600;
  text-align: center !important;
  color: #606266;
  min-width: 50px;
  user-select: none;
}

.diff-html-wrapper >>> .diff_next {
  background-color: #ecf5ff !important;
  text-align: center;
  width: 40px;
}

.diff-html-wrapper >>> .diff_add {
  background-color: #e7faf0 !important;
  color: #067d4f;
}

.diff-html-wrapper >>> .diff_chg {
  background-color: #fff8e6 !important;
  color: #b8860b;
}

.diff-html-wrapper >>> .diff_sub {
  background-color: #fef0f0 !important;
  color: #d63c3c;
}

.diff-html-wrapper >>> td.diff_add {
  background-color: #f0f9ff !important;
}

.diff-html-wrapper >>> td.diff_chg {
  background-color: #fffbf0 !important;
}

.diff-html-wrapper >>> td.diff_sub {
  background-color: #fef5f5 !important;
}

/* 改进行内高亮样式 */
.diff-html-wrapper >>> span.diff_add {
  background-color: #a6f3d0 !important;
  padding: 2px 0;
  font-weight: 600;
}

.diff-html-wrapper >>> span.diff_sub {
  background-color: #fecaca !important;
  padding: 2px 0;
  font-weight: 600;
  text-decoration: line-through;
}

.diff-html-wrapper >>> span.diff_chg {
  background-color: #fde68a !important;
  padding: 2px 0;
  font-weight: 600;
}

/* 滚动条样式 */
.result-content::-webkit-scrollbar,
.text-input >>> .el-textarea__inner::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.result-content::-webkit-scrollbar-track,
.text-input >>> .el-textarea__inner::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.result-content::-webkit-scrollbar-thumb,
.text-input >>> .el-textarea__inner::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.result-content::-webkit-scrollbar-thumb:hover,
.text-input >>> .el-textarea__inner::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
