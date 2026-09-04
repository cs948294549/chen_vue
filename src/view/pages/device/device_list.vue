<template>
  <div>
    <!-- 搜索筛选区域 -->
    <div>
      <div v-if="table_info.length>0" style="margin-bottom: 10px;">
        <el-button type="primary" size="mini" @click="download_table">下载</el-button>
        <el-button type="success" size="mini" @click="openCustomCompare">配置对比</el-button>
      </div>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item label="设备IP">
            <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input placeholder="设备名称" v-model="filter_name" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="资产号">
            <el-input placeholder="资产号" v-model="filter_assert" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="设备描述">
            <el-input placeholder="描述" v-model="filter_desc" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
        </el-form>
      </el-row>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item label="型号">
            <el-input placeholder="型号" v-model="filter_model" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="版本">
            <el-input placeholder="版本" v-model="filter_version" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item label="补丁">
            <el-input placeholder="补丁" v-model="filter_feature" @keyup.enter.native="getViews" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading='isload' @click="getViews">筛选</el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>

    <!-- 设备列表表格 -->
    <el-table border :data.sync='table_info_show' @selection-change="handleSelectionChange" :default-sort = "{prop: 'port_id'}" size="mini">
      <el-table-column prop='sysname' label='设备名' show-overflow-tooltip min-width='28' align='center'>
      </el-table-column>
      <el-table-column prop='ip' label='设备IP' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='syscontact' label='资产号' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='hardware' label='型号' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='features' label='补丁' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='version' label='软件版本' show-overflow-tooltip min-width='15' align='center'>
      </el-table-column>
      <el-table-column prop='sysdesc' label='设备描述' show-overflow-tooltip min-width='20' align='center'>
      </el-table-column>
      <el-table-column prop='timestamp' label='采集时间' show-overflow-tooltip min-width='20' align='center'>
      </el-table-column>
      <el-table-column label='操作' min-width='12' align='center' fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="handleViewConfig(scope.row)">查看配置</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination @current-change='handleCurrentChange' :current-page='table_currentPage'  @size-change="handleSizeChange"
    :page-sizes="[2, 20, 50, 100, 200, 500]" :page-size="table_size" layout='total, sizes, prev, pager, next' :total='table_total' style='float: right'></el-pagination><br/>

    <!-- 配置查看抽屉 -->
    <el-drawer
      :title="'设备配置备份 - ' + current_device.sysname + ' (' + current_device.ip + ')'"
      :visible.sync="drawer_visible"
      direction="rtl"
      size="80%"
      :before-close="handleDrawerClose">

      <div class="drawer-content">
        <!-- 配置对比选择区域 -->
        <el-card shadow="never" class="compare-card" v-if="config_list.length > 0">
          <div slot="header" class="compare-header">
            <span>配置对比</span>
            <el-button size="mini" type="primary" :disabled="!can_compare" @click="handleCompare">开始对比</el-button>
          </div>
          <el-form label-width="80px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="历史版本" size="small">
                  <el-select v-model="compare_src" placeholder="请选择历史版本" style="width: 100%;" @change="handleHistoryVersionChange">
                    <el-option
                      v-for="item in historyVersionList"
                      :key="item.log_id"
                      :label="`#${item.log_id} - ${formatTime(item.updated_at)}`"
                      :value="item.log_id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前版本" size="small">
                  <el-select v-model="compare_target" placeholder="请选择当前版本" style="width: 100%;" @change="handleCurrentVersionChange">
                    <el-option
                      v-for="item in currentVersionList"
                      :key="item.log_id"
                      :label="`#${item.log_id} - ${formatTime(item.updated_at)}`"
                      :value="item.log_id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="对比模式" size="small">
                  <el-radio-group v-model="diff_mode">
                    <el-radio label="context">上下文对比（只显示变更部分）</el-radio>
                    <el-radio label="full">全文对比</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 配置备份列表 -->
        <el-card shadow="never" class="config-list-card">
          <div slot="header">
            <span>配置备份历史</span>
          </div>
          <el-table
            :data="config_list"
            border
            size="small"
            v-loading="config_loading"
            style="width: 100%">
            <el-table-column prop="log_id" label="序号" width="80" align="center"></el-table-column>
            <el-table-column label="备份时间" min-width="160" align="center">
              <template slot-scope="scope">
                {{ formatTime(scope.row.updated_at) }}
              </template>
            </el-table-column>
            <el-table-column label="最早采集时间" min-width="160" align="center">
              <template slot-scope="scope">
                {{ isConfigChanged(scope.row) ? '-' : formatTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="isConfigChanged(scope.row) ? 'success' : 'info'">
                  {{ isConfigChanged(scope.row) ? '新采集' : '区间合并' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备份类型" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="getBackupTypeTag(getBackupType(scope.row.change_id))">
                  {{ getBackupType(scope.row.change_id) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="250" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ getBackupNote(scope.row.change_id) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click="handleViewConfigDetail(scope.row)">查看</el-button>
                <el-button size="mini" type="text" @click="handleDownloadConfig(scope.row)">下载</el-button>
                <el-button size="mini" type="text" style="color: #f56c6c;" @click="handleDeleteConfig(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-drawer>

    <!-- 配置详情对话框 -->
    <el-dialog
      title="配置文件详情"
      :visible.sync="detail_dialog_visible"
      width="80%"
      top="5vh">
      <el-input
        type="textarea"
        v-model="config_detail_content"
        :rows="25"
        readonly
        style="font-family: 'Courier New', monospace; font-size: 13px;">
      </el-input>
      <span slot="footer">
        <el-button size="small" @click="detail_dialog_visible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="handleCopyConfig">复制</el-button>
      </span>
    </el-dialog>

    <!-- 配置对比结果抽屉 -->
    <el-drawer
      title="配置对比结果"
      :visible.sync="diff_drawer_visible"
      direction="rtl"
      size="90%"
      :before-close="handleDiffDrawerClose">
      <div class="drawer-content">
        <el-card shadow="never" class="diff-result-card">
          <div slot="header" class="diff-header">
            <span>对比统计</span>
            <div>
              <el-tag size="small" type="success">新增: {{ diff_stats.added }}</el-tag>
              <el-tag size="small" type="danger" style="margin-left: 10px;">删除: {{ diff_stats.deleted }}</el-tag>
              <el-tag size="small" type="warning" style="margin-left: 10px;">修改: {{ diff_stats.modified }}</el-tag>
            </div>
          </div>
          <div class="diff-content" v-html="diff_result" v-loading="diff_loading"></div>
        </el-card>
      </div>
    </el-drawer>

    <!-- 自定义配置对比对话框 -->
    <el-dialog
      title="自定义配置对比"
      :visible.sync="custom_compare_dialog_visible"
      width="70%"
      top="5vh"
      :before-close="handleCustomCompareClose">
      <el-form label-width="100px" size="small">
        <el-card shadow="never" class="compare-device-card">
          <div slot="header">历史版本</div>
          <el-form-item label="设备选择">
            <el-select
              v-model="custom_compare_src_device"
              placeholder="请选择或搜索设备"
              filterable
              @change="handleCustomSrcDeviceChange"
              style="width: 100%;">
              <el-option
                v-for="item in table_info"
                :key="item.ip"
                :label="`${item.sysname} (${item.ip})`"
                :value="item.ip">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="配置版本" v-if="custom_src_config_list.length > 0">
            <el-select
              v-model="custom_compare_src_version"
              placeholder="请选择配置版本"
              style="width: 100%;"
              v-loading="custom_src_loading">
              <el-option
                v-for="item in custom_src_config_list"
                :key="item.log_id"
                :label="`#${item.log_id} - ${formatTime(item.updated_at)}`"
                :value="item.log_id">
              </el-option>
            </el-select>
          </el-form-item>
          <div v-if="custom_compare_src_device && custom_src_config_list.length === 0" style="color: #999; text-align: center; padding: 10px;">
            该设备暂无配置备份记录
          </div>
        </el-card>

        <el-card shadow="never" class="compare-device-card" style="margin-top: 15px;">
          <div slot="header">当前版本</div>
          <el-form-item label="设备选择">
            <el-select
              v-model="custom_compare_target_device"
              placeholder="请选择或搜索设备"
              filterable
              @change="handleCustomTargetDeviceChange"
              style="width: 100%;">
              <el-option
                v-for="item in table_info"
                :key="item.ip"
                :label="`${item.sysname} (${item.ip})`"
                :value="item.ip">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="配置版本" v-if="custom_target_config_list.length > 0">
            <el-select
              v-model="custom_compare_target_version"
              placeholder="请选择配置版本"
              style="width: 100%;"
              v-loading="custom_target_loading">
              <el-option
                v-for="item in custom_target_config_list"
                :key="item.log_id"
                :label="`#${item.log_id} - ${formatTime(item.updated_at)}`"
                :value="item.log_id">
              </el-option>
            </el-select>
          </el-form-item>
          <div v-if="custom_compare_target_device && custom_target_config_list.length === 0" style="color: #999; text-align: center; padding: 10px;">
            该设备暂无配置备份记录
          </div>
        </el-card>

        <el-form-item label="对比模式" style="margin-top: 20px;">
          <el-radio-group v-model="custom_diff_mode">
            <el-radio label="context">上下文对比（只显示变更部分）</el-radio>
            <el-radio label="full">全文对比</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <span slot="footer">
        <el-button size="small" @click="handleCustomCompareClose">取消</el-button>
        <el-button
          size="small"
          type="primary"
          @click="handleCustomCompare"
          :disabled="!canCustomCompare">
          开始对比
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  import collector_api from "@/api/mapis/collector_interface.js"
  import config_api from "@/api/mapis/config_interface.js"
  import XLSX from 'xlsx'

  export default {
    components:{},
    data() {
      return {
        //table 用
        multipleSelection:"",
        table_currentPage:1,
        table_info:[],
        table_info_show:[],
        table_total:0,
        table_size:20,

        //筛选用
        filter_ip:"",
        filter_name:"",
        filter_desc:"",
        filter_assert: "",
        filter_model:"",
        filter_version:"",
        filter_feature:"",

        isload: false,

        // 配置查看抽屉相关
        drawer_visible: false,
        current_device: {},
        config_list: [],
        config_loading: false,

        // 配置对比相关
        compare_src: null,
        compare_target: null,
        diff_mode: 'context',  // 对比模式：context=上下文对比，full=全文对比
        diff_result: null,
        diff_stats: {
          added: 0,
          deleted: 0,
          modified: 0
        },
        diff_drawer_visible: false,
        diff_loading: false,

        // 配置详情对话框
        detail_dialog_visible: false,
        config_detail_content: '',

        // 自定义配置对比
        custom_compare_dialog_visible: false,
        custom_compare_src_device: null,
        custom_compare_target_device: null,
        custom_compare_src_version: null,
        custom_compare_target_version: null,
        custom_src_config_list: [],
        custom_target_config_list: [],
        custom_src_loading: false,
        custom_target_loading: false,
        custom_diff_mode: 'context',
      };
    },

    computed: {
      can_compare() {
        return this.compare_src && this.compare_target && this.compare_src !== this.compare_target
      },
      // 历史版本列表：根据当前版本筛选，只显示比当前版本旧的版本
      historyVersionList() {
        if (!this.compare_target) {
          return this.config_list
        }
        const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
        if (targetIndex === -1) {
          return this.config_list
        }
        // 返回当前版本之后的所有版本（索引更大的是更旧的版本）
        return this.config_list.slice(targetIndex + 1)
      },
      // 当前版本列表：根据历史版本筛选，只显示比历史版本新的版本
      currentVersionList() {
        if (!this.compare_src) {
          return this.config_list
        }
        const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
        if (srcIndex === -1) {
          return this.config_list
        }
        // 返回历史版本之前的所有版本（索引更小的是更新的版本）
        return this.config_list.slice(0, srcIndex)
      },
      // 自定义对比是否可以执行
      canCustomCompare() {
        return this.custom_compare_src_device &&
               this.custom_compare_target_device &&
               this.custom_compare_src_version &&
               this.custom_compare_target_version &&
               (this.custom_compare_src_device !== this.custom_compare_target_device ||
                this.custom_compare_src_version !== this.custom_compare_target_version)
      }
    },

    mounted() {
    },
    methods: {
      //表格自带方法
      handleSelectionChange(val){
        //表项多选
        this.multipleSelection = val;
      },
      //修改页码
      handleCurrentChange (val) {
        this.table_currentPage = val
        this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
      },
      //修改一页总数
      handleSizeChange(val){
        this.table_size = val
        this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
      },

      getViews(){
        let post_data = {}
        this.filter_ip = this.filter_ip.replace(/^\s*|\s*$/g,"")
        if(this.filter_ip!=""){
          post_data["ip"]=this.filter_ip
        }
        this.filter_name = this.filter_name.replace(/^\s*|\s*$/g,"")
        if(this.filter_name!=""){
          post_data["sysname"]=this.filter_name
        }
        this.filter_desc = this.filter_desc.replace(/^\s*|\s*$/g,"")
        if(this.filter_desc!=""){
          post_data["sysdesc_reg"]=this.filter_desc
        }
        this.filter_assert = this.filter_assert.replace(/^\s*|\s*$/g,"")
        if(this.filter_assert!=""){
          post_data["syscontact"]=this.filter_assert
        }

        this.filter_model = this.filter_model.replace(/^\s*|\s*$/g,"")
        if(this.filter_model!=""){
          post_data["hardware"]=this.filter_model
        }

        this.filter_version = this.filter_version.replace(/^\s*|\s*$/g,"")
        if(this.filter_version!=""){
          post_data["version"]=this.filter_version
        }

        this.filter_feature = this.filter_feature.replace(/^\s*|\s*$/g,"")
        if(this.filter_feature!=""){
          post_data["features"]=this.filter_feature
        }

        this.table_currentPage=1;
        this.table_total=0;
        this.table_size=20;

        let that = this
        this.isload=true
        collector_api.getDevs(post_data,{}).then(function(response){
          if(response.data!="failed"){
            that.table_info = response.data["data"]
            that.table_total = that.table_info.length
            that.table_info_show = that.table_info.slice((that.table_currentPage-1)*that.table_size,that.table_currentPage*that.table_size)
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      },

      // ==================== 配置查看相关 ====================
      handleViewConfig(row) {
        this.current_device = {
          sysname: row.sysname,
          ip: row.ip,
          hardware: row.hardware
        }
        this.drawer_visible = true
        this.compare_src = null
        this.compare_target = null
        this.diff_result = null
        this.loadConfigList()
      },

      loadConfigList() {
        // 加载设备的配置备份列表
        this.config_loading = true

        let that = this
        config_api.getConfigList({
          ip: this.current_device.ip
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            that.config_list = response.data.data || []
            if (that.config_list.length === 0) {
              that.$message({
                type: 'warning',
                message: '该设备暂无配置备份记录'
              })
            } else if (that.config_list.length >= 2) {
              // 设置默认对比版本：目标版本为最新版本，源版本为上一个版本
              that.compare_target = that.config_list[0].log_id
              that.compare_src = that.config_list[1].log_id
            } else if (that.config_list.length === 1) {
              // 只有一个版本时，两者都选择第一个版本
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

      handleDrawerClose() {
        this.drawer_visible = false
        this.config_list = []
        this.diff_result = null
      },

      getBackupTypeTag(type) {
        const typeMap = {
          '自动': 'success',
          '手动': 'primary',
          '变更': 'warning'
        }
        return typeMap[type] || 'info'
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

      isConfigChanged(row) {
        return row.created_at === row.updated_at
      },

      handleHistoryVersionChange() {
        // 历史版本变化时，清空之前的对比结果
        this.diff_result = null
        this.diff_drawer_visible = false

        // 如果选择的历史版本比当前版本新，清空当前版本选择
        if (this.compare_target && this.compare_src) {
          const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
          const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
          if (srcIndex <= targetIndex) {
            this.compare_target = null
          }
        }
      },

      handleCurrentVersionChange() {
        // 当前版本变化时，清空之前的对比结果
        this.diff_result = null
        this.diff_drawer_visible = false

        // 如果选择的当前版本比历史版本旧，清空历史版本选择
        if (this.compare_target && this.compare_src) {
          const srcIndex = this.config_list.findIndex(item => item.log_id === this.compare_src)
          const targetIndex = this.config_list.findIndex(item => item.log_id === this.compare_target)
          if (targetIndex >= srcIndex) {
            this.compare_src = null
          }
        }
      },

      handleDiffDrawerClose() {
        this.diff_drawer_visible = false
      },

      handleCompare() {
        if (!this.can_compare) {
          return
        }

        this.diff_loading = true
        this.diff_drawer_visible = true
        this.diff_result = '<p style="text-align: center; color: #999;">正在对比配置，请稍候...</p>'

        let that = this
        let full_diff = this.diff_mode === 'full'

        config_api.compareConfigs({
          src_id: this.compare_src,
          tar_id: this.compare_target,
          full_diff: full_diff
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            let result = response.data.data
            that.diff_stats = result.stats || {
              added: 0,
              deleted: 0,
              modified: 0
            }
            that.diff_result = result.html || '<p>无差异</p>'

            that.$message({
              type: 'success',
              message: '配置对比完成'
            })
          } else {
            that.diff_result = '<p style="color: #f56c6c;">配置对比失败</p>'
            that.$message({
              type: 'error',
              message: '配置对比失败'
            })
          }
          that.diff_loading = false
        }).catch(function(error) {
          console.log(error)
          that.diff_result = '<p style="color: #f56c6c;">配置对比失败</p>'
          that.diff_loading = false
          that.$message({
            type: 'error',
            message: '配置对比失败'
          })
        })
      },

      handleViewConfigDetail(row) {
        // 查看配置详情
        this.config_detail_content = '正在加载配置内容...'
        this.detail_dialog_visible = true

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
        // 下载配置文件
        let that = this
        config_api.getConfigDetail({
          log_id: row.log_id
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            let detail = response.data.data
            let content = detail.detail || ''

            // 创建下载
            let blob = new Blob([content], { type: 'text/plain' })
            let aTag = document.createElement('a')
            let filename = `${that.current_device.sysname}_${that.formatTime(row.created_at).replace(/[\s:]/g, '_')}.txt`
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

      handleDeleteConfig(row) {
        // 删除配置备份
        this.$confirm(`确认删除配置记录 #${row.log_id} (${this.formatTime(row.updated_at)}) 吗？`, '删除确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let that = this
          config_api.deleteConfig({
            log_id: row.log_id
          }, {}).then(function(response) {
            if (response.data && response.data.code === 0) {
              that.$message({
                type: 'success',
                message: '删除成功'
              })
              // 重新加载配置列表
              that.loadConfigList()
              // 如果删除的是对比选中的版本，清空对比选择
              if (that.compare_src === row.log_id) {
                that.compare_src = null
              }
              if (that.compare_target === row.log_id) {
                that.compare_target = null
              }
            } else {
              that.$message({
                type: 'error',
                message: response.data.message || '删除失败'
              })
            }
          }).catch(function(error) {
            console.log(error)
            that.$message({
              type: 'error',
              message: '删除失败'
            })
          })
        }).catch(() => {
          // 用户取消删除
        })
      },

      handleCopyConfig() {
        // 复制配置内容到剪贴板
        const textarea = document.createElement('textarea')
        textarea.value = this.config_detail_content
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)

        this.$message({
          type: 'success',
          message: '配置已复制到剪贴板'
        })
      },

      // ==================== 自定义配置对比相关 ====================
      openCustomCompare() {
        this.custom_compare_dialog_visible = true
        this.custom_compare_src_device = null
        this.custom_compare_target_device = null
        this.custom_compare_src_version = null
        this.custom_compare_target_version = null
        this.custom_src_config_list = []
        this.custom_target_config_list = []
        this.custom_diff_mode = 'context'
      },

      handleCustomCompareClose() {
        this.custom_compare_dialog_visible = false
      },

      handleCustomSrcDeviceChange(ip) {
        // 清空之前选择的版本
        this.custom_compare_src_version = null
        this.custom_src_config_list = []

        if (!ip) {
          return
        }

        // 加载设备的配置列表
        this.custom_src_loading = true
        let that = this
        config_api.getConfigList({
          ip: ip
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            that.custom_src_config_list = response.data.data || []
            // 默认选择最新版本
            if (that.custom_src_config_list.length > 0) {
              that.custom_compare_src_version = that.custom_src_config_list[0].log_id
            }
          } else {
            that.$message({
              type: 'error',
              message: '获取配置列表失败'
            })
          }
          that.custom_src_loading = false
        }).catch(function(error) {
          console.log(error)
          that.custom_src_loading = false
          that.$message({
            type: 'error',
            message: '获取配置列表失败'
          })
        })
      },

      handleCustomTargetDeviceChange(ip) {
        // 清空之前选择的版本
        this.custom_compare_target_version = null
        this.custom_target_config_list = []

        if (!ip) {
          return
        }

        // 加载设备的配置列表
        this.custom_target_loading = true
        let that = this
        config_api.getConfigList({
          ip: ip
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            that.custom_target_config_list = response.data.data || []
            // 默认选择最新版本
            if (that.custom_target_config_list.length > 0) {
              that.custom_compare_target_version = that.custom_target_config_list[0].log_id
            }
          } else {
            that.$message({
              type: 'error',
              message: '获取配置列表失败'
            })
          }
          that.custom_target_loading = false
        }).catch(function(error) {
          console.log(error)
          that.custom_target_loading = false
          that.$message({
            type: 'error',
            message: '获取配置列表失败'
          })
        })
      },

      handleCustomCompare() {
        if (!this.canCustomCompare) {
          return
        }

        // 关闭对话框
        this.custom_compare_dialog_visible = false

        // 打开对比结果抽屉
        this.diff_loading = true
        this.diff_drawer_visible = true
        this.diff_result = '<p style="text-align: center; color: #999;">正在对比配置，请稍候...</p>'

        let that = this
        let full_diff = this.custom_diff_mode === 'full'

        config_api.compareConfigs({
          src_id: this.custom_compare_src_version,
          tar_id: this.custom_compare_target_version,
          full_diff: full_diff
        }, {}).then(function(response) {
          if (response.data && response.data.code === 0) {
            let result = response.data.data
            that.diff_stats = result.stats || {
              added: 0,
              deleted: 0,
              modified: 0
            }
            that.diff_result = result.html || '<p>无差异</p>'

            that.$message({
              type: 'success',
              message: '配置对比完成'
            })
          } else {
            that.diff_result = '<p style="color: #f56c6c;">配置对比失败</p>'
            that.$message({
              type: 'error',
              message: '配置对比失败'
            })
          }
          that.diff_loading = false
        }).catch(function(error) {
          console.log(error)
          that.diff_result = '<p style="color: #f56c6c;">配置对比失败</p>'
          that.diff_loading = false
          that.$message({
            type: 'error',
            message: '配置对比失败'
          })
        })
      },

      // ==================== Excel导出相关 ====================
      download_table:function(){
      	this.downloadExcl(this.table_info);
      },
      downloadExcl:function(json, type){
      	let tmpDown;
      	let getjson=json;
      	let keys = getjson[0];
      	getjson.unshift({});
      	let keyMap = [];
      	for (let k in keys) {
      		keyMap.push(k);
      		getjson[0][k] = k;
      	}
      	let tmpdata = [];
      	getjson.map((v, i) => keyMap.map((k, j) => Object.assign({}, {
      		v: v[k],
      		position: (j > 25 ? this.getCharCol(j) : String.fromCharCode(65 + j)) + (i + 1)
      	}))).reduce((prev, next) => prev.concat(next)).forEach((v, i) => tmpdata[v.position] = {
      				v: v.v
      			});
      	let outputPos = Object.keys(tmpdata);
      	let tmpWB = {
      		SheetNames: ['mySheet'],
      		Sheets: {
      			'mySheet': Object.assign({},
      				tmpdata,
      				{
      					'!ref': outputPos[0] + ':' + outputPos[outputPos.length - 1]
      				})
      		}
      	};

      	tmpDown = new Blob([this.s2ab(XLSX.write(tmpWB,
      						{bookType:(type == undefined ? 'xlsx':type),bookSST: false, type: 'binary'}
      						))], {type: "" });

        let aTag = document.createElement('a')
        aTag.download = "device_list.xlsx"
        aTag.href = URL.createObjectURL(tmpDown)
        aTag.click()
        URL.revokeObjectURL(aTag.href)
      },
      s2ab:function(s){
      	let buf = new ArrayBuffer(s.length);
      	let view = new Uint8Array(buf);
      	for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
      	return buf;
      },
      getCharCol:function(n){
      	let temCol = '',
      	s = '',
      	m = 0
      	while (n > 0) {
      		m = n % 26 + 1
      		s = String.fromCharCode(m + 64) + s
      		n = (n - m) / 26
      	}
      	return s
      },
    },
  }
</script>

<style scoped>
.drawer-content {
  padding: 0 20px 20px 20px;
}

.compare-card {
  margin-bottom: 20px;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-result-card {
  margin-bottom: 20px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-content {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  max-height: 70vh;
  overflow-y: auto;
}

.diff-content >>> table {
  width: 100%;
  border-collapse: collapse;
}

.diff-content >>> td {
  padding: 2px 5px;
  word-break: break-all;
}

.config-list-card {
  margin-bottom: 20px;
}

.compare-device-card {
  background-color: #fafafa;
}

.compare-device-card >>> .el-card__header {
  background-color: #f0f0f0;
  font-weight: bold;
}
</style>
