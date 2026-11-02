<template>
  <div>
    <!-- 配置对比抽屉 -->
    <el-drawer
      :visible.sync="drawerVisible"
      direction="rtl"
      size="90%"
      :before-close="handleClose">
      <div slot="title" class="drawer-title">
        <i class="el-icon-copy-document"></i>
        <span class="drawer-title-main">配置备份对比</span>
        <span class="drawer-title-sub">{{ deviceInfo.sysname }}</span>
        <span class="drawer-title-sub mono">{{ deviceInfo.ip }}</span>
      </div>

      <div class="drawer-content">
        <!-- 版本对比 -->
        <div class="section" v-if="config_list.length > 0">
          <div class="section-header">
            <span class="section-title"><i class="el-icon-copy-document"></i>版本对比</span>
          </div>
          <div class="compare-bar">
            <div class="compare-field">
              <div class="compare-label">历史版本</div>
              <el-select v-model="compare_src" size="small" placeholder="请选择历史版本" @change="handleHistoryVersionChange">
                <el-option v-for="item in historyVersionList" :key="item.log_id" :label="versionLabel(item)" :value="item.log_id">
                  <span>{{ versionLabel(item) }}</span>
                  <span class="option-extra">{{ getBackupType(item.change_id) }}</span>
                </el-option>
              </el-select>
            </div>
            <i class="el-icon-right compare-arrow"></i>
            <div class="compare-field">
              <div class="compare-label">当前版本</div>
              <el-select v-model="compare_target" size="small" placeholder="请选择当前版本" @change="handleCurrentVersionChange">
                <el-option v-for="item in currentVersionList" :key="item.log_id" :label="versionLabel(item)" :value="item.log_id">
                  <span>{{ versionLabel(item) }}</span>
                  <span class="option-extra">{{ getBackupType(item.change_id) }}</span>
                </el-option>
              </el-select>
            </div>
            <div class="compare-field compare-mode">
              <div class="compare-label">对比模式</div>
              <el-radio-group v-model="diff_mode" size="small">
                <el-radio-button label="context">仅变更部分</el-radio-button>
                <el-radio-button label="full">全文</el-radio-button>
              </el-radio-group>
            </div>
            <el-button class="compare-btn" size="small" type="primary" icon="el-icon-s-operation" :disabled="!can_compare" @click="handleCompare">开始对比</el-button>
          </div>
        </div>

        <!-- 备份历史 -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">
              <i class="el-icon-time"></i>备份历史
              <span class="list-count">{{ config_list.length }}</span>
            </span>
            <div>
              <el-button size="mini" icon="el-icon-refresh" @click="loadConfigList">刷新</el-button>
            </div>
          </div>
          <el-table :data="config_list" size="small" stripe v-loading="config_loading">
            <template slot="empty">
              <el-empty :image-size="70" description="该设备暂无配置备份记录"></el-empty>
            </template>
            <el-table-column prop="log_id" label="序号" width="80" align="center">
              <template slot-scope="scope">
                <span class="mono">#{{ scope.row.log_id }}</span>
              </template>
            </el-table-column>
            <el-table-column label="备份时间" min-width="160">
              <template slot-scope="scope">
                <span>{{ formatTime(scope.row.updated_at) }}</span>
                <el-tag v-if="scope.$index === 0" size="mini" effect="dark" class="latest-tag">最新</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最早采集时间" min-width="160">
              <template slot-scope="scope">
                <span v-if="isConfigChanged(scope.row)" class="empty-text">-</span>
                <span v-else>{{ formatTime(scope.row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tooltip placement="top" :content="isConfigChanged(scope.row) ? '本次采集的配置与上一版本不同' : '多次采集配置未变化，合并为一条记录'">
                  <el-tag size="mini" :type="isConfigChanged(scope.row) ? 'success' : 'info'">
                    {{ isConfigChanged(scope.row) ? '新采集' : '区间合并' }}
                  </el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="备份类型" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="mini" :type="getBackupTypeTag(getBackupType(scope.row.change_id))">
                  {{ getBackupType(scope.row.change_id) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="220" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ getBackupNote(scope.row.change_id) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click="handleViewConfigDetail(scope.row)">查看</el-button>
                <el-button size="mini" type="text" @click="handleDownloadConfig(scope.row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <!-- 配置详情 -->
    <el-dialog
      :title="config_detail_title"
      :visible.sync="config_detail_dialog_visible"
      width="80%"
      top="5vh"
      class="detail-dialog">
      <el-input
        class="output-box"
        type="textarea"
        v-model="config_detail_content"
        :rows="28"
        resize="none"
        readonly>
      </el-input>
      <span slot="footer">
        <el-button size="small" icon="el-icon-document-copy" @click="handleCopyConfig">复制</el-button>
        <el-button size="small" type="primary" @click="config_detail_dialog_visible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 配置对比结果 -->
    <el-drawer
      :visible.sync="diff_drawer_visible"
      direction="rtl"
      size="90%"
      :before-close="handleDiffDrawerClose">
      <div slot="title" class="drawer-title">
        <i class="el-icon-copy-document"></i>
        <span class="drawer-title-main">配置对比结果</span>
      </div>
      <div class="drawer-content">
        <div class="diff-summary">
          <div class="diff-sides">
            <div class="diff-side diff-side-src">
              <span class="diff-side-label">历史版本</span>
              <span class="diff-side-value">{{ diff_src_label || '-' }}</span>
            </div>
            <i class="el-icon-right compare-arrow"></i>
            <div class="diff-side diff-side-tar">
              <span class="diff-side-label">当前版本</span>
              <span class="diff-side-value">{{ diff_tar_label || '-' }}</span>
            </div>
          </div>
          <div class="diff-stats">
            <span class="stat-chip stat-add">+ 新增 {{ diff_stats.added }}</span>
            <span class="stat-chip stat-del">- 删除 {{ diff_stats.deleted }}</span>
            <span class="stat-chip stat-mod">~ 修改 {{ diff_stats.modified }}</span>
          </div>
        </div>
        <div class="diff-legend">
          <span><i class="legend-box legend-add"></i>新增</span>
          <span><i class="legend-box legend-chg"></i>修改</span>
          <span><i class="legend-box legend-sub"></i>删除</span>
        </div>
        <div class="diff-content" v-html="diff_result" v-loading="diff_loading"></div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import config_api from "@/api/mapis/config_interface.js"

export default {
  name: 'ConfigCompareDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    deviceInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      config_list: [],
      config_loading: false,
      compare_src: null,
      compare_target: null,
      diff_mode: 'context',
      diff_result: null,
      diff_stats: {
        added: 0,
        deleted: 0,
        modified: 0
      },
      diff_src_label: '',
      diff_tar_label: '',
      diff_drawer_visible: false,
      diff_loading: false,
      config_detail_dialog_visible: false,
      config_detail_title: '配置文件详情',
      config_detail_content: '',
    }
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    can_compare() {
      return this.compare_src && this.compare_target && this.compare_src !== this.compare_target
    },
    historyVersionList() {
      if (!this.compare_target) {
        return this.config_list
      }
      const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
      if (targetIndex === -1) {
        return this.config_list
      }
      return this.config_list.slice(targetIndex + 1)
    },
    currentVersionList() {
      if (!this.compare_src) {
        return this.config_list
      }
      const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
      if (srcIndex === -1) {
        return this.config_list
      }
      return this.config_list.slice(0, srcIndex)
    }
  },
  watch: {
    visible(val) {
      if (val && this.deviceInfo.ip) {
        this.loadConfigList()
      }
    }
  },
  methods: {
    loadConfigList() {
      if (!this.deviceInfo.ip) {
        return
      }
      this.config_loading = true
      let that = this
      config_api.getConfigList({
        ip: this.deviceInfo.ip
      }, {}).then(function(response) {
        if (response.data && response.data.code === 0) {
          that.config_list = response.data.data || []
          if (that.config_list.length >= 2) {
            that.compare_target = that.config_list[0].log_id
            that.compare_src = that.config_list[1].log_id
          } else if (that.config_list.length === 1) {
            that.compare_target = that.config_list[0].log_id
            that.compare_src = that.config_list[0].log_id
          }
        } else {
          that.$message({
            type: 'error',
            message: '获取配置列表失败'
          })
        }
        that.config_loading = false
      }).catch(function(error) {
        console.log(error)
        that.config_loading = false
        that.$message({
          type: 'error',
          message: '获取配置列表失败'
        })
      })
    },
    versionLabel(item) {
      return `#${item.log_id}  ${this.formatTime(item.updated_at)}`
    },
    formatTime(timestamp) {
      if (!timestamp) {
        return ''
      }
      let date = new Date(parseInt(timestamp) * 1000)
      let pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    },
    getBackupType(change_id) {
      return change_id ? '变更' : '自动'
    },
    getBackupNote(change_id) {
      return change_id ? `变更单号: ${change_id}` : '定期自动备份'
    },
    getBackupTypeTag(type) {
      const typeMap = {
        '自动': 'success',
        '手动': 'primary',
        '变更': 'warning'
      }
      return typeMap[type] || 'info'
    },
    isConfigChanged(row) {
      return row.created_at === row.updated_at
    },
    handleHistoryVersionChange() {
      this.diff_result = null
      this.diff_drawer_visible = false
      if (this.compare_target && this.compare_src) {
        const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
        const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
        if (srcIndex <= targetIndex) {
          this.compare_target = null
        }
      }
    },
    handleCurrentVersionChange() {
      this.diff_result = null
      this.diff_drawer_visible = false
      if (this.compare_target && this.compare_src) {
        const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
        const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
        if (targetIndex >= srcIndex) {
          this.compare_src = null
        }
      }
    },
    handleCompare() {
      if (!this.can_compare) {
        return
      }
      const find = id => this.config_list.find(item => item.log_id === id) || {log_id: id}
      const name = this.deviceInfo.sysname || this.deviceInfo.ip
      this.runCompare(
        this.compare_src,
        this.compare_target,
        this.diff_mode === 'full',
        `${name}  ${this.versionLabel(find(this.compare_src))}`,
        `${name}  ${this.versionLabel(find(this.compare_target))}`
      )
    },
    cleanDiffHtml(html) {
      if (!html) {
        return ''
      }
      let m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
      let body = m ? m[1] : html
      return body.replace(/<style[\s\S]*?<\/style>/gi, '')
    },
    runCompare(src_id, tar_id, full_diff, src_label, tar_label) {
      this.diff_loading = true
      this.diff_drawer_visible = true
      this.diff_src_label = src_label
      this.diff_tar_label = tar_label
      this.diff_stats = {added: 0, deleted: 0, modified: 0}
      this.diff_result = '<p class="diff-msg">正在对比配置，请稍候...</p>'

      let that = this
      config_api.compareConfigs({
        src_id: src_id,
        tar_id: tar_id,
        full_diff: full_diff
      }, {}).then(function(response) {
        if (response.data && response.data.code === 0) {
          let result = response.data.data || {}
          that.diff_stats = result.stats || {
            added: 0,
            deleted: 0,
            modified: 0
          }
          that.diff_result = that.cleanDiffHtml(result.html) || '<p class="diff-msg">无差异</p>'
          that.$message({
            type: 'success',
            message: '配置对比完成'
          })
        } else {
          that.diff_result = '<p class="diff-msg diff-msg-error">配置对比失败</p>'
          that.$message({
            type: 'error',
            message: '配置对比失败'
          })
        }
        that.diff_loading = false
      }).catch(function(error) {
        console.log(error)
        that.diff_result = '<p class="diff-msg diff-msg-error">配置对比失败</p>'
        that.diff_loading = false
        that.$message({
          type: 'error',
          message: '配置对比失败'
        })
      })
    },
    handleDiffDrawerClose() {
      this.diff_drawer_visible = false
    },
    handleViewConfigDetail(row) {
      this.config_detail_title = `配置详情 - ${this.deviceInfo.sysname || this.deviceInfo.ip}  ${this.versionLabel(row)}`
      this.config_detail_content = '正在加载配置内容...'
      this.config_detail_dialog_visible = true

      let that = this
      config_api.getConfigDetail({
        log_id: row.log_id
      }, {}).then(function(response) {
        if (response.data && response.data.code === 0) {
          let detail = response.data.data
          that.config_detail_content = detail.detail || '配置内容为空'
        } else {
          that.config_detail_content = '加载配置失败'
          that.$message({
            type: 'error',
            message: '获取配置详情失败'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.config_detail_content = '加载配置失败'
        that.$message({
          type: 'error',
          message: '获取配置详情失败'
        })
      })
    },
    handleDownloadConfig(row) {
      let that = this
      config_api.getConfigDetail({
        log_id: row.log_id
      }, {}).then(function(response) {
        if (response.data && response.data.code === 0) {
          let detail = response.data.data
          let content = detail.detail || ''

          let blob = new Blob([content], { type: 'text/plain' })
          let aTag = document.createElement('a')
          let filename = `${that.deviceInfo.sysname}_${that.formatTime(row.created_at).replace(/[\s:]/g, '_')}.txt`
          aTag.download = filename
          aTag.href = URL.createObjectURL(blob)
          aTag.click()
          URL.revokeObjectURL(aTag.href)

          that.$message({
            type: 'success',
            message: '配置文件下载成功'
          })
        } else {
          that.$message({
            type: 'error',
            message: '获取配置内容失败'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '下载配置失败'
        })
      })
    },
    handleCopyConfig() {
      this.copyText(this.config_detail_content, '配置已复制到剪贴板')
    },
    copyText(text, msg) {
      if (!text) {
        return
      }
      const done = () => this.$message({type: 'success', message: msg || ('已复制：' + text), duration: 1500})
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done)
        return
      }
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      done()
    },
    handleClose() {
      this.drawerVisible = false
      this.config_list = []
      this.diff_result = null
    }
  }
}
</script>

<style scoped>
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}

/* 抽屉通用 */
.drawer-title {
  display: flex;
  align-items: center;
  color: #303133;
}
.drawer-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.drawer-title-main {
  font-size: 16px;
  font-weight: 600;
}
.drawer-title-sub {
  margin-left: 12px;
  font-size: 14px;
  color: #606266;
}
.drawer-content {
  padding: 0 20px 20px;
}
.section {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}
.section-title > i {
  margin-right: 6px;
  color: #409eff;
}
.list-count {
  margin-left: 8px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 9px;
  color: #409eff;
  background-color: #ecf5ff;
}
.latest-tag {
  margin-left: 6px;
}
.option-extra {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: #909399;
}

/* 版本对比条 */
.compare-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}
.compare-field {
  margin-right: 12px;
}
.compare-field .el-select {
  width: 260px;
}
.compare-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #909399;
}
.compare-arrow {
  margin: 0 12px 8px 0;
  font-size: 18px;
  color: #c0c4cc;
}
.compare-mode {
  margin-left: 12px;
}
.compare-btn {
  margin-left: auto;
}

/* 配置详情：终端风格 */
.output-box /deep/ .el-textarea__inner {
  padding: 10px 12px;
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #d4d4d4;
  background-color: #1e1e1e;
  border-color: #1e1e1e;
}
.detail-dialog /deep/ .el-dialog__body {
  padding: 10px 20px;
}

/* 对比结果 */
.diff-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  background-color: #f5f7fa;
}
.diff-sides {
  display: flex;
  align-items: center;
}
.diff-side {
  display: flex;
  align-items: center;
  margin-right: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  background-color: #fff;
  border: 1px solid #ebeef5;
}
.diff-side-src { border-left: 3px solid #f56c6c; }
.diff-side-tar { border-left: 3px solid #67c23a; }
.diff-side-label {
  margin-right: 8px;
  font-size: 12px;
  color: #909399;
}
.diff-side-value {
  font-size: 13px;
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.diff-sides .compare-arrow {
  margin: 0 12px 0 0;
}
.stat-chip {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}
.stat-add { color: #1a7f37; background-color: #dafbe1; }
.stat-del { color: #cf222e; background-color: #ffebe9; }
.stat-mod { color: #9a6700; background-color: #fff8c5; }
.diff-legend {
  margin: 10px 0 8px;
  font-size: 12px;
  color: #909399;
}
.diff-legend > span {
  margin-right: 16px;
}
.legend-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 4px;
  vertical-align: -2px;
  border-radius: 2px;
}
.legend-add { background-color: #abf2bc; }
.legend-chg { background-color: #fae17d; }
.legend-sub { background-color: #ffb3ad; }

.diff-content {
  min-height: 200px;
  max-height: calc(100vh - 230px);
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}
.diff-content /deep/ table.diff {
  width: 100%;
  border-collapse: collapse;
  border: none;
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.diff-content /deep/ table.diff thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 6px 8px;
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.diff-content /deep/ table.diff td {
  padding: 0 8px;
  vertical-align: top;
  text-align: left;
  word-break: break-all;
}
.diff-content /deep/ td.diff_header {
  width: 44px;
  text-align: right;
  color: #909399;
  background-color: #fafafa;
  user-select: none;
}
.diff-content /deep/ td.diff_next {
  width: 18px;
  text-align: center;
  background-color: #fafafa;
}
.diff-content /deep/ td.diff_next a {
  color: #409eff;
  text-decoration: none;
}
.diff-content /deep/ tbody + tbody {
  border-top: 1px dashed #dcdfe6;
}
.diff-content /deep/ .diff_add { background-color: #abf2bc; }
.diff-content /deep/ .diff_chg { background-color: #fae17d; }
.diff-content /deep/ .diff_sub { background-color: #ffb3ad; }
.diff-content /deep/ table[summary="Legends"] {
  display: none;
}
.diff-content /deep/ .diff-msg {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}
.diff-content /deep/ .diff-msg-error {
  color: #f56c6c;
}
</style>
