<template>
  <div class="device-list">
    <!-- 搜索筛选区域 -->
    <div class="search-panel">
      <el-form class="filter-grid" size="small" label-width="70px" @submit.native.prevent>
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
          <el-input placeholder="设备描述" v-model="filter_desc" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="型号">
          <el-input placeholder="型号" v-model="filter_model" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="版本">
          <el-input placeholder="软件版本" v-model="filter_version" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="补丁">
          <el-input placeholder="补丁" v-model="filter_feature" @keyup.enter.native="getViews" clearable></el-input>
        </el-form-item>
        <el-form-item label="配置变更">
          <el-select placeholder="不限" v-model="filter_changed" @change="getViews" clearable>
            <el-option label="最近3天变更" value="3"></el-option>
            <el-option label="最近7天变更" value="7"></el-option>
            <el-option label="最近30天变更" value="30"></el-option>
            <el-option label="有变更记录" value="all"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="search-actions">
        <el-button size="small" icon="el-icon-refresh-left" @click="resetFilter">重置</el-button>
        <el-button size="small" type="primary" icon="el-icon-search" :loading="isload" @click="getViews">查询</el-button>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="list-toolbar">
      <div class="list-title">
        <i class="el-icon-s-grid"></i>设备列表
        <span v-if="searched" class="list-count">{{ table_total }}</span>
      </div>
      <div>
        <el-button size="small" icon="el-icon-copy-document" @click="openCustomCompare">配置对比</el-button>
        <el-button size="small" icon="el-icon-download" :disabled="table_info.length === 0" @click="download_table">导出</el-button>
      </div>
    </div>

    <el-table :data="table_info_show" v-loading="isload" size="small" stripe class="dev-table">
      <template slot="empty">
        <el-empty :image-size="80" :description="searched ? '未查询到设备' : '请输入筛选条件后点击查询'"></el-empty>
      </template>
      <el-table-column prop="sysname" label="设备名" min-width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          <router-link class="dev-link" :to="detailLink(scope.row.ip)">{{ scope.row.sysname || scope.row.ip }}</router-link>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="设备IP" min-width="140">
        <template slot-scope="scope">
          <span class="mono">{{ scope.row.ip }}</span>
          <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.ip)"></i>
        </template>
      </el-table-column>
      <el-table-column label="厂商" width="90" align="center">
        <template slot-scope="scope">
          <el-tag v-if="vendorOf(scope.row)" size="mini" :type="vendorOf(scope.row).type">{{ vendorOf(scope.row).name }}</el-tag>
          <span v-else class="empty-text">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="hardware" label="型号" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="version" label="软件版本" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="features" label="补丁" min-width="110" show-overflow-tooltip></el-table-column>
      <el-table-column prop="syscontact" label="资产号" min-width="110" show-overflow-tooltip></el-table-column>
      <el-table-column prop="sysdesc" label="设备描述" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="timestamp" label="采集时间" width="160"></el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-tickets" @click="handleViewConfig(scope.row)">配置</el-button>
          <el-button size="mini" type="text" icon="el-icon-upload2" :loading="!!backup_loading[scope.row.ip]" @click="handleBackupConfig(scope.row)">备份</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        :current-page="table_currentPage"
        :page-sizes="[20, 50, 100, 200, 500]"
        :page-size="table_size"
        layout="total, sizes, prev, pager, next"
        :total="table_total"></el-pagination>
    </div>

    <!-- 配置备份抽屉 -->
    <el-drawer
      :visible.sync="drawer_visible"
      direction="rtl"
      size="80%"
      :before-close="handleDrawerClose">
      <div slot="title" class="drawer-title">
        <i class="el-icon-tickets"></i>
        <span class="drawer-title-main">配置备份</span>
        <span class="drawer-title-sub">{{ current_device.sysname }}</span>
        <span class="drawer-title-sub mono">{{ current_device.ip }}</span>
        <el-tag v-if="current_device.hardware" size="mini" type="info">{{ current_device.hardware }}</el-tag>
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
              <el-button size="mini" type="primary" icon="el-icon-upload2" :loading="!!backup_loading[current_device.ip]" @click="handleBackupConfig(current_device)">立即备份</el-button>
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
            <el-table-column label="操作" width="170" fixed="right">
              <template slot-scope="scope">
                <el-button size="mini" type="text" @click="handleViewConfigDetail(scope.row)">查看</el-button>
                <el-button size="mini" type="text" @click="handleDownloadConfig(scope.row)">下载</el-button>
                <el-button size="mini" type="text" class="danger-text" @click="handleDeleteConfig(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <!-- 配置详情 -->
    <el-dialog
      :title="detail_title"
      :visible.sync="detail_dialog_visible"
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
        <el-button size="small" type="primary" @click="detail_dialog_visible = false">关闭</el-button>
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

    <!-- 自定义配置对比 -->
    <el-dialog
      title="自定义配置对比"
      :visible.sync="custom_compare_dialog_visible"
      width="820px"
      top="8vh"
      :before-close="handleCustomCompareClose">
      <div v-if="table_info.length === 0" class="custom-tip">
        <i class="el-icon-warning-outline"></i>设备下拉框的候选项来自设备列表的查询结果，请先在列表中查询设备
      </div>
      <div class="custom-compare">
        <div class="custom-side">
          <div class="custom-side-header custom-side-src">历史版本</div>
          <div class="custom-side-body">
            <div class="custom-label">设备</div>
            <el-select
              v-model="custom_compare_src_device"
              size="small"
              placeholder="请选择或搜索设备"
              filterable
              @change="handleCustomSrcDeviceChange">
              <el-option v-for="item in table_info" :key="item.ip" :label="`${item.sysname} (${item.ip})`" :value="item.ip">
                <span>{{ item.sysname }}</span>
                <span class="option-extra mono">{{ item.ip }}</span>
              </el-option>
            </el-select>
            <div class="custom-label">配置版本</div>
            <el-select
              v-model="custom_compare_src_version"
              size="small"
              :placeholder="custom_src_loading ? '加载中...' : (custom_compare_src_device && custom_src_config_list.length === 0 ? '该设备暂无配置备份记录' : '请选择配置版本')"
              :disabled="!custom_compare_src_device || custom_src_loading || custom_src_config_list.length === 0">
              <el-option v-for="item in custom_src_config_list" :key="item.log_id" :label="versionLabel(item)" :value="item.log_id">
                <span>{{ versionLabel(item) }}</span>
                <span class="option-extra">{{ getBackupType(item.change_id) }}</span>
              </el-option>
            </el-select>
          </div>
        </div>

        <div class="custom-middle">
          <el-tooltip content="交换历史版本与当前版本" placement="top">
            <el-button circle size="small" icon="el-icon-sort" class="swap-btn" @click="swapCustomCompare"></el-button>
          </el-tooltip>
        </div>

        <div class="custom-side">
          <div class="custom-side-header custom-side-tar">当前版本</div>
          <div class="custom-side-body">
            <div class="custom-label">设备</div>
            <el-select
              v-model="custom_compare_target_device"
              size="small"
              placeholder="请选择或搜索设备"
              filterable
              @change="handleCustomTargetDeviceChange">
              <el-option v-for="item in table_info" :key="item.ip" :label="`${item.sysname} (${item.ip})`" :value="item.ip">
                <span>{{ item.sysname }}</span>
                <span class="option-extra mono">{{ item.ip }}</span>
              </el-option>
            </el-select>
            <div class="custom-label">配置版本</div>
            <el-select
              v-model="custom_compare_target_version"
              size="small"
              :placeholder="custom_target_loading ? '加载中...' : (custom_compare_target_device && custom_target_config_list.length === 0 ? '该设备暂无配置备份记录' : '请选择配置版本')"
              :disabled="!custom_compare_target_device || custom_target_loading || custom_target_config_list.length === 0">
              <el-option v-for="item in custom_target_config_list" :key="item.log_id" :label="versionLabel(item)" :value="item.log_id">
                <span>{{ versionLabel(item) }}</span>
                <span class="option-extra">{{ getBackupType(item.change_id) }}</span>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <div class="custom-mode">
        <span class="custom-label">对比模式</span>
        <el-radio-group v-model="custom_diff_mode" size="small">
          <el-radio-button label="context">仅变更部分</el-radio-button>
          <el-radio-button label="full">全文</el-radio-button>
        </el-radio-group>
      </div>

      <span slot="footer">
        <el-button size="small" @click="handleCustomCompareClose">取消</el-button>
        <el-button
          size="small"
          type="primary"
          icon="el-icon-s-operation"
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

  const VENDORS = [
    {reg: /h3c/i, name: "H3C", type: ""},
    {reg: /huawei|huarong/i, name: "Huawei", type: "danger"},
    {reg: /cisco/i, name: "Cisco", type: "primary"},
    {reg: /ruijie/i, name: "Ruijie", type: "warning"},
    {reg: /arista/i, name: "Arista", type: "success"},
    {reg: /juniper/i, name: "Juniper", type: "info"},
  ]

  export default {
    components:{},
    data() {
      return {
        //table 用
        table_currentPage:1,
        table_info:[],
        table_info_show:[],
        table_total:0,
        table_size:20,
        searched: false,

        //筛选用
        filter_ip:"",
        filter_name:"",
        filter_desc:"",
        filter_assert: "",
        filter_model:"",
        filter_version:"",
        filter_feature:"",
        filter_changed:"",

        isload: false,

        // 手动备份中的设备，key 为设备IP
        backup_loading: {},

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
        diff_src_label: '',
        diff_tar_label: '',
        diff_drawer_visible: false,
        diff_loading: false,

        // 配置详情对话框
        detail_dialog_visible: false,
        detail_title: '配置文件详情',
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

    methods: {
      //表格分页
      updatePage(){
        this.table_total = this.table_info.length
        this.table_info_show = this.table_info.slice((this.table_currentPage-1)*this.table_size,this.table_currentPage*this.table_size)
      },
      //修改页码
      handleCurrentChange (val) {
        this.table_currentPage = val
        this.updatePage()
      },
      //修改一页总数
      handleSizeChange(val){
        this.table_size = val
        this.table_currentPage = 1
        this.updatePage()
      },

      vendorOf(row){
        const desc = row.sysdesc || ""
        for(let i=0;i<VENDORS.length;i++){
          if(VENDORS[i].reg.test(desc)){
            return VENDORS[i]
          }
        }
        return null
      },
      detailLink(ip){
        return {path: '/pages/device/device_detail', query: {dev: ip}}
      },
      versionLabel(item){
        return `#${item.log_id}  ${this.formatTime(item.updated_at)}`
      },

      resetFilter(){
        this.filter_ip = ""
        this.filter_name = ""
        this.filter_desc = ""
        this.filter_assert = ""
        this.filter_model = ""
        this.filter_version = ""
        this.filter_feature = ""
        this.filter_changed = ""
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

        let that = this
        this.isload=true

        // 变更筛选条件：空表示不限，all表示曾有变更，数字表示最近N天
        let changed_param = null
        if(this.filter_changed){
          changed_param = {}
          if(this.filter_changed!="all"){
            changed_param["days"]=parseInt(this.filter_changed)
          }
        }

        let dev_request = collector_api.getDevs(post_data,{})
        let request_list = [dev_request]
        if(changed_param!=null){
          request_list.push(config_api.getChangedDevices(changed_param,{}))
        }

        Promise.all(request_list).then(function(results){
          let dev_response = results[0]
          let dev_list = dev_response.data ? dev_response.data["data"] : null
          if(!Array.isArray(dev_list)){
            throw new Error("设备列表查询失败")
          }

          if(changed_param!=null){
            let changed_response = results[1]
            if(!changed_response.data || changed_response.data.code !== 0){
              throw new Error("变更设备列表查询失败")
            }
            // 变更接口返回的字段与设备列表一致，这里只借它的IP集合做过滤
            let changed_ips = {}
            let changed_data = changed_response.data.data || []
            for(let i=0;i<changed_data.length;i++){
              changed_ips[changed_data[i].ip] = changed_data[i]
            }
            dev_list = dev_list.filter(function(item){
              return changed_ips.hasOwnProperty(item.ip)
            })
          }

          that.table_info = dev_list
          that.updatePage()
          that.searched = true
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

      // ==================== 配置备份相关 ====================
      handleBackupConfig(row) {
        // 手动备份设备配置：后端登录设备采集当前配置，与最新备份对比后保存
        this.$confirm(`确认立即备份设备 ${row.sysname} (${row.ip}) 的配置吗？`, '备份确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }).then(() => {
          let that = this
          this.$set(this.backup_loading, row.ip, true)
          config_api.backupConfig({
            ip: row.ip
          }, {}).then(function(response) {
            if (response.data && response.data.code === 0) {
              that.$message({
                type: 'success',
                message: `${row.sysname} 备份成功：${response.data.message}`
              })
              // 如果正在查看该设备的配置历史，刷新列表
              if (that.drawer_visible && that.current_device.ip === row.ip) {
                that.loadConfigList()
              }
            } else {
              that.$message({
                type: 'error',
                message: `${row.sysname} 备份失败：${(response.data && response.data.message) || '未知错误'}`
              })
            }
            that.$set(that.backup_loading, row.ip, false)
          }).catch(function(error) {
            console.log(error)
            that.$set(that.backup_loading, row.ip, false)
            that.$message({
              type: 'error',
              message: `${row.sysname} 备份失败`
            })
          })
        }).catch(() => {
          // 用户取消备份
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
        this.config_list = []
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
            if (that.config_list.length >= 2) {
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
        const find = id => this.config_list.find(item => item.log_id === id) || {log_id: id}
        const name = this.current_device.sysname || this.current_device.ip
        this.runCompare(
          this.compare_src,
          this.compare_target,
          this.diff_mode === 'full',
          `${name}  ${this.versionLabel(find(this.compare_src))}`,
          `${name}  ${this.versionLabel(find(this.compare_target))}`
        )
      },

      // 后端返回 difflib 生成的完整 HTML 页面，自带的 <style> 里有全局 td 样式，
      // 直接 v-html 会污染整个页面的表格，这里只保留 body 内容，样式由本组件提供
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

      handleViewConfigDetail(row) {
        // 查看配置详情
        this.detail_title = `配置详情 - ${this.current_device.sysname || this.current_device.ip}  ${this.versionLabel(row)}`
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
              // 如果删除的是对比选中的版本，清空对比选择
              if (that.compare_src === row.log_id) {
                that.compare_src = null
              }
              if (that.compare_target === row.log_id) {
                that.compare_target = null
              }
              // 重新加载配置列表
              that.loadConfigList()
            } else {
              that.$message({
                type: 'error',
                message: (response.data && response.data.message) || '删除失败'
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

      // 交换两侧的设备与版本
      swapCustomCompare() {
        const device = this.custom_compare_src_device
        const version = this.custom_compare_src_version
        const list = this.custom_src_config_list
        this.custom_compare_src_device = this.custom_compare_target_device
        this.custom_compare_src_version = this.custom_compare_target_version
        this.custom_src_config_list = this.custom_target_config_list
        this.custom_compare_target_device = device
        this.custom_compare_target_version = version
        this.custom_target_config_list = list
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

        const label = (ip, list, id) => {
          const dev = this.table_info.find(item => item.ip === ip) || {}
          const ver = list.find(item => item.log_id === id) || {log_id: id}
          return `${dev.sysname || ip}  ${this.versionLabel(ver)}`
        }
        const src_label = label(this.custom_compare_src_device, this.custom_src_config_list, this.custom_compare_src_version)
        const tar_label = label(this.custom_compare_target_device, this.custom_target_config_list, this.custom_compare_target_version)

        // 关闭对话框，打开对比结果抽屉
        this.custom_compare_dialog_visible = false
        this.runCompare(
          this.custom_compare_src_version,
          this.custom_compare_target_version,
          this.custom_diff_mode === 'full',
          src_label,
          tar_label
        )
      },

      // ==================== Excel导出相关 ====================
      download_table(){
        if (this.table_info.length === 0) {
          return
        }
        const sheet = XLSX.utils.json_to_sheet(this.table_info)
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book, sheet, 'devices')
        const d = new Date()
        const pad = n => String(n).padStart(2, '0')
        XLSX.writeFile(book, `device_list_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.xlsx`)
      },
    },
  }
</script>

<style scoped>
.device-list {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.empty-text {
  color: #c0c4cc;
}
.danger-text {
  color: #f56c6c;
}
.danger-text:hover,
.danger-text:focus {
  color: #f78989;
}

/* 搜索区 */
.search-panel {
  padding: 14px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background-color: #fafbfc;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 16px;
}
.filter-grid /deep/ .el-form-item {
  margin-bottom: 10px;
}
.filter-grid /deep/ .el-select {
  width: 100%;
}
.search-actions {
  text-align: right;
  padding-bottom: 10px;
}

/* 列表工具栏 */
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 10px;
}
.list-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}
.list-title > i {
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

/* 设备表格 */
.dev-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.dev-link {
  font-weight: 500;
  color: #409eff;
  text-decoration: none;
}
.dev-link:hover {
  text-decoration: underline;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.dev-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
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
.drawer-title .el-tag {
  margin-left: 12px;
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

/* 自定义对比 */
.custom-tip {
  margin-bottom: 12px;
  padding: 8px 12px;
  font-size: 13px;
  color: #e6a23c;
  background-color: #fdf6ec;
  border-radius: 4px;
}
.custom-tip i {
  margin-right: 6px;
}
.custom-compare {
  display: flex;
  align-items: stretch;
}
.custom-side {
  flex: 1;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}
.custom-side-header {
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}
.custom-side-src { border-top: 3px solid #f56c6c; }
.custom-side-tar { border-top: 3px solid #67c23a; }
.custom-side-body {
  padding: 4px 14px 14px;
}
.custom-side-body .el-select {
  width: 100%;
}
.custom-label {
  margin: 10px 0 6px;
  font-size: 12px;
  color: #909399;
}
.custom-middle {
  display: flex;
  align-items: center;
  padding: 0 12px;
}
.swap-btn {
  transform: rotate(90deg);
}
.custom-mode {
  display: flex;
  align-items: center;
  margin-top: 16px;
}
.custom-mode .custom-label {
  margin: 0 12px 0 0;
}
</style>
