<template>
  <div style="padding: 20px; background: #F0F2F5; min-height: 100vh;">
    <div style="margin-bottom: 20px;">
      <el-card shadow="hover" :body-style="{padding: '15px'}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center;">
            <i class="el-icon-s-grid" style="font-size: 24px; color: #409EFF; margin-right: 12px;"></i>
            <span style="font-size: 18px; font-weight: 600; color: #303133;">IP地址管理</span>
          </div>
          <el-button type="primary" size="medium" icon="el-icon-plus" @click="dialog_view_cfg=true;address_view_option={}">新增网段</el-button>
        </div>
      </el-card>
    </div>
    <div style="display: flex;">
      <el-scrollbar style="height: 100%;margin: 10px;">
        <div style="width: 800px;max-height: 800px;min-height: 100px;" v-loading="tree_loading" element-loading-text="加载网段树...">
          <el-tree
            :data="net_data"
            node-key="id"
            @node-click="show_node"
            :default-expanded-keys="default_expand"
            :default-expand-all="false"
            :expand-on-click-node="false"
            :highlight-current="true">
            <span class="custom-tree-node" slot-scope="{ node, data }">
              <span style="display: flex; align-items: center; width: 100%;">
                <i :class="data.children && data.children.length > 0 ? 'el-icon-folder' : 'el-icon-document'"
                   :style="{color: data.children && data.children.length > 0 ? '#E6A23C' : '#67C23A', marginRight: '8px', fontSize: '16px'}"></i>
                <span style="flex: 1;">
                  <span style="font-weight: 600; color: #303133;">{{ data.ip }}/{{data.mask}}</span>
                  <el-tag v-if="data.status == '1'" size="mini" type="success" style="margin-left: 8px;">使用中</el-tag>
                  <el-tag v-if="data.status == '2'" size="mini" type="danger" style="margin-left: 8px;">已废弃</el-tag>
                  <el-tag v-if="data.status == '3'" size="mini" type="info" style="margin-left: 8px;">空闲</el-tag>
                  <span style="margin-left: 8px; color: #909399; font-size: 12px;">{{data.location}}</span>
                  <span style="margin-left: 8px; color: #606266; font-size: 12px;">{{data.role}}</span>
                  <span v-if="data.used_per" style="margin-left: 8px; padding: 2px 6px; background: #F2F6FC; border-radius: 3px; font-size: 11px; color: #909399;">
                    使用率: {{data.used_per}}
                  </span>
                </span>
              </span>
            </span>
          </el-tree>
        </div>
      </el-scrollbar>

      <div v-if="Object.keys(click_node_info).length>0" style="flex: 1; padding: 0 20px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center;">
              <i class="el-icon-location-information" style="font-size: 24px; color: #FFF; margin-right: 12px;"></i>
              <span style="font-size: 18px; font-weight: 600; color: #FFF;">
                {{ click_node_info.ip }}/{{click_node_info.mask}}
              </span>
              <el-tag size="small" style="margin-left: 12px;" type="info">{{click_node_info.location}}</el-tag>
              <el-tag size="small" style="margin-left: 8px;" type="success">{{click_node_info.role}}</el-tag>
            </div>
            <div>
              <el-button type="warning" size="small" icon="el-icon-edit" @click="dialog_view_cfg_update=true;address_view_option=click_node_info">修改</el-button>
              <el-button type="danger" size="small" icon="el-icon-delete" @click="del_address(click_node_info)">删除</el-button>
            </div>
          </div>

          <el-card shadow="hover" style="margin-bottom: 20px;">
            <div slot="header" style="display: flex; align-items: center;">
              <i class="el-icon-document" style="margin-right: 8px; color: #409EFF;"></i>
              <span style="font-weight: 600;">网段详细信息</span>
            </div>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-s-grid"></i>
                    <span>子网</span>
                  </div>
                  <div class="info-value">{{click_node_info.ip}}/{{click_node_info.mask}}</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-s-flag"></i>
                    <span>用途</span>
                  </div>
                  <div class="info-value">{{click_node_info.role}}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-info"></i>
                    <span>状态</span>
                  </div>
                  <div class="info-value">
                    <el-tag v-if="click_node_info.status == '1'" size="small" type="success">使用中</el-tag>
                    <el-tag v-if="click_node_info.status == '2'" size="small" type="danger">已废弃</el-tag>
                    <el-tag v-if="click_node_info.status == '3'" size="small" type="info">空闲</el-tag>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-location-outline"></i>
                    <span>区域</span>
                  </div>
                  <div class="info-value">{{click_node_info.location}}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-sort"></i>
                    <span>IP范围</span>
                  </div>
                  <div class="info-value">
                    {{intToIp(click_node_info.start_ip)}} - {{intToIp(click_node_info.end_ip)}}
                    <el-tag size="mini" type="info" style="margin-left: 10px;">
                      合计 {{click_node_info.end_ip-click_node_info.start_ip-1}} 个
                    </el-tag>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-connection"></i>
                    <span>ISP</span>
                  </div>
                  <div class="info-value">{{click_node_info.isp || '-'}}</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-link"></i>
                    <span>网关</span>
                  </div>
                  <div class="info-value">{{click_node_info.gateway || '-'}}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-location-outline"></i>
                    <span>区域</span>
                  </div>
                  <div class="info-value">{{click_node_info.location}}</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-collection-tag"></i>
                    <span>业务标签</span>
                  </div>
                  <div class="info-value">{{click_node_info.label || '-'}}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-edit-outline"></i>
                    <span>描述</span>
                  </div>
                  <div class="info-value">{{click_node_info.comment || '-'}}</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-pie-chart"></i>
                    <span>使用率</span>
                  </div>
                  <div class="info-value">
                    <el-progress :percentage="parseFloat(click_node_info.used_per) || 0" :color="getProgressColor(click_node_info.used_per)"></el-progress>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <div class="info-label">
                    <i class="el-icon-time"></i>
                    <span>更新时间</span>
                  </div>
                  <div class="info-value">{{formatDate(click_node_info.update_time*1000)}}</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>

        <div style="margin-top: 20px;margin-bottom: 10px;">
          <div v-if="click_node_info.children && click_node_info.children.length>0">
            <el-alert
              title="此网段包含子网段，请在左侧树中选择具体子网段查看IP地址信息"
              type="info"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
          <div v-else>
            <el-card shadow="hover">
              <div slot="header" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">
                  <i class="el-icon-s-grid" style="margin-right: 8px; color: #409EFF; font-size: 18px;"></i>
                  <span style="font-weight: 600; font-size: 16px;">IP地址列表</span>
                  <el-tag size="small" type="success" style="margin-left: 12px;">
                    当前页: {{ipam_address_data_page.length}} / 总计: {{ipam_address_total}}
                  </el-tag>
                </div>
                <div style="display: flex; align-items: center;">
                  <el-button type="success" size="small" icon="el-icon-plus" @click="dialog_add_reserve_ip=true;reserve_ip_option={}">新增保留IP</el-button>
                  <el-switch
                    v-model="filter_address_flag"
                    @change="tran_status_address"
                    active-text="已使用"
                    inactive-text="未使用"
                    active-color="#67C23A"
                    inactive-color="#909399"
                    style="margin-left: 15px;">
                  </el-switch>
                </div>
              </div>
              <el-table
                  :data="ipam_address_data_page"
                  style="width: 100%"
                  height="350"
                  stripe
                  :header-cell-style="{background: '#F5F7FA', color: '#606266', fontWeight: '600'}">
                  <el-table-column
                    prop="ip_addr"
                    label="IP地址"
                    width="150">
                    <template slot-scope="scope">
                      <span style="color: #409EFF; font-weight: 500;">
                        <i class="el-icon-position" style="margin-right: 4px;"></i>
                        {{ scope.row.ip_addr }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="collect_type"
                    label="采集类型"
                    width="130">
                    <template slot-scope="scope">
                      <el-tag v-if="scope.row.collect_type" size="small" type="success">
                        {{ scope.row.collect_type }}
                      </el-tag>
                      <span v-else style="color: #C0C4CC;">未使用</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="comment"
                    label="描述"
                    min-width="200"
                    show-overflow-tooltip>
                  </el-table-column>
                  <el-table-column
                    prop="update_time"
                    label="更新时间"
                    width="200">
                    <template slot-scope="scope">
                      <span v-if="scope.row.update_time" style="color: #909399;">
                        <i class="el-icon-time" style="margin-right: 4px;"></i>
                        {{ formatDate(scope.row.update_time * 1000) }}
                      </span>
                      <span v-else style="color: #C0C4CC;">-</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="操作"
                    width="100"
                    fixed="right">
                    <template slot-scope="scope">
                      <el-button
                        v-if="scope.row.collect_type"
                        type="danger"
                        size="mini"
                        icon="el-icon-delete"
                        @click="deleteIpAddress(scope.row)">
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              <div style="margin-top: 15px; text-align: right;">
                <el-pagination
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                  :current-page="currentPage"
                  :page-sizes="[50, 100, 200, 500]"
                  :page-size="pageSize"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="ipam_address_total">
                </el-pagination>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增网段对话框 -->
    <el-dialog title="新增网段" :visible.sync="dialog_view_cfg" width="50%">
      <el-form v-model="address_view_option" size="mini" label-width="100px">
        <el-form-item label="网段">
          <el-input style="width: 500px;" placeholder="示例: 192.168.1.0/24" v-model="address_view_option.netaddr" @change="cal_ip_address(address_view_option.netaddr)" clearable></el-input>
          <div>开始IP: {{address_view_option.start_ip}} 结束IP:{{address_view_option.end_ip}}</div>
        </el-form-item>

        <el-form-item label="网关">
          <el-input style="width: 500px;" placeholder="可不填" v-model="address_view_option.gateway" clearable></el-input>
        </el-form-item>

        <el-form-item label="区域">
          <el-input style="width: 500px;" placeholder="区域" v-model="address_view_option.location" clearable></el-input>
        </el-form-item>
        <el-form-item label="运营商">
          <el-select v-model="address_view_option.isp" placeholder="isp" clearable>
            <el-option v-for="item in isp_options" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="用途">
          <el-input style="width: 500px;" placeholder="用途" v-model="address_view_option.role" clearable></el-input>
        </el-form-item>
        <el-form-item label="业务标签">
          <el-input style="width: 500px;" placeholder="业务标签" v-model="address_view_option.label" clearable></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="address_view_option.status" placeholder="状态" clearable>
            <el-option v-for="(item, key) in address_status_options" :key="key" :label="item" :value="key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            type="textarea"
            :rows="3"
            resize="none"
            style="width: 500px;"
            placeholder="请输入描述"
            v-model="address_view_option.comment">
          </el-input>
        </el-form-item>
        <el-form-item label="管理员">
          <el-input style="width: 500px;" placeholder="管理员" v-model="address_view_option.manage_user" clearable></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="createAddress">确认</el-button>
          <el-button @click="dialog_view_cfg=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 修改网段对话框 -->
    <el-dialog title="修改网段" :visible.sync="dialog_view_cfg_update" width="50%">
      <el-form v-model="address_view_option" size="mini" label-width="100px">
        <el-form-item label="网段信息">
          <div>{{ address_view_option.ip }}/{{address_view_option.mask}}</div>
        </el-form-item>

        <el-form-item label="网关">
          <el-input style="width: 500px;" placeholder="可不填" v-model="address_view_option.gateway" clearable></el-input>
        </el-form-item>

        <el-form-item label="区域">
          <el-input style="width: 500px;" placeholder="区域" v-model="address_view_option.location" clearable></el-input>
        </el-form-item>
        <el-form-item label="运营商">
          <el-select v-model="address_view_option.isp" placeholder="isp" clearable>
            <el-option v-for="item in isp_options" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="用途">
          <el-input style="width: 500px;" placeholder="用途" v-model="address_view_option.role" clearable></el-input>
        </el-form-item>
        <el-form-item label="业务标签">
          <el-input style="width: 500px;" placeholder="业务标签" v-model="address_view_option.label" clearable></el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="address_view_option.status" placeholder="状态" clearable>
            <el-option v-for="(item, key) in address_status_options" :key="key" :label="item" :value="key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            type="textarea"
            :rows="3"
            resize="none"
            style="width: 500px;"
            placeholder="请输入描述"
            v-model="address_view_option.comment">
          </el-input>
        </el-form-item>
        <el-form-item label="管理员">
          <el-input style="width: 500px;" placeholder="管理员" v-model="address_view_option.manage_user" clearable></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="updateAddress">确认</el-button>
          <el-button @click="dialog_view_cfg_update=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 新增保留IP对话框 -->
    <el-dialog title="新增固定保留IP" :visible.sync="dialog_add_reserve_ip" width="40%">
      <el-form v-model="reserve_ip_option" size="small" label-width="120px">
        <el-form-item label="IP地址">
          <el-input style="width: 400px;" placeholder="例如: 192.168.1.1" v-model="reserve_ip_option.ip_addr" clearable></el-input>
        </el-form-item>

        <el-form-item label="采集类型">
          <el-input style="width: 400px;" placeholder="例如: 手动保留、网关、DNS等" v-model="reserve_ip_option.collect_type" clearable></el-input>
        </el-form-item>

        <el-form-item label="管理状态">
          <el-input style="width: 400px;" placeholder="例如: 在用、预留等" v-model="reserve_ip_option.admin_status" clearable></el-input>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            type="textarea"
            :rows="3"
            resize="none"
            style="width: 400px;"
            placeholder="请输入描述信息"
            v-model="reserve_ip_option.comment">
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="addReserveIp">确认</el-button>
          <el-button @click="dialog_add_reserve_ip=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import ipam_api from "@/api/mapis/ipam_interface.js"

export default {
  data() {
    return {
      net_data: [],
      default_expand: [],
      tree_loading: false,  // 树形图加载状态

      // 新增网段配置
      dialog_view_cfg: false,
      address_view_option: {},
      isp_options: ["静态三线", "BGP", "电信", "移动", "联通", "阿里云", "海外线路", "IPv6出口", "私有"],
      address_status_options: {
        "1": "使用中",
        "2": "已废弃",
        "3": "空闲"
      },

      // 修改网段信息
      dialog_view_cfg_update: false,

      // 新增保留IP
      dialog_add_reserve_ip: false,
      reserve_ip_option: {},

      // 当前选中节点
      click_node_info: {},

      // IP地址过滤
      filter_address_flag: false,
      ipam_address_data: [],
      ipam_address_data_show: [],
      ipam_address_data_page: [],
      ipam_address_total: 0,

      // 分页
      currentPage: 1,
      pageSize: 100
    }
  },

  mounted() {
    this.getTreeNode()
  },

  methods: {
    // 点击树节点
    show_node(node) {
      console.log("点击了====", node)
      this.click_node_info = node
      this.filter_address_flag = false
      let that = this

      if (this.click_node_info.children && this.click_node_info.children.length > 0) {
        console.log("展示子网段")
      } else {
        // 查询IP地址列表
        let post_data = {}
        post_data["start_ip"] = this.click_node_info["start_ip"]
        post_data["end_ip"] = this.click_node_info["end_ip"]
        this.ipam_address_data = []

        ipam_api.getIpamAddressList(post_data, {}).then(function(response) {
          if (response.data.code === 0 && response.data.data) {
            // 只存储已使用的IP地址
            that.ipam_address_data = response.data.data || []
            that.tran_status_address(false)
            that.$message({
              type: 'success',
              message: '查询成功'
            })
          } else {
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            })
          }
        }).catch(function(error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          })
        })
      }
    },

    // 切换IP地址显示状态
    tran_status_address(val) {
      if (val) {
        // 显示已使用：直接使用数据库返回的数据
        this.ipam_address_data_show = this.ipam_address_data
        this.ipam_address_total = this.ipam_address_data.length
      } else {
        // 显示未使用：计算总数，但不生成所有记录
        const startIp = parseInt(this.click_node_info["start_ip"])
        const endIp = parseInt(this.click_node_info["end_ip"])
        const totalIps = endIp - startIp
        const usedIpSet = new Set(this.ipam_address_data.map(item => parseInt(item.ip_deci)))

        // 计算未使用的IP总数
        this.ipam_address_total = totalIps - usedIpSet.size
        this.ipam_address_data_show = null // 标记为未使用模式
      }

      this.currentPage = 1
      this.updatePageData()
    },

    // 更新当前页数据
    updatePageData() {
      if (this.ipam_address_data_show !== null) {
        // 已使用模式：直接分页
        const start = (this.currentPage - 1) * this.pageSize
        const end = start + this.pageSize
        this.ipam_address_data_page = this.ipam_address_data_show.slice(start, end)
      } else {
        // 未使用模式：按需生成当前页的未使用IP
        const startIp = parseInt(this.click_node_info["start_ip"])
        const endIp = parseInt(this.click_node_info["end_ip"])
        const usedIpSet = new Set(this.ipam_address_data.map(item => parseInt(item.ip_deci)))

        const pageData = []
        let count = 0
        const skipCount = (this.currentPage - 1) * this.pageSize

        // 遍历IP范围，跳过已使用的，只收集当前页需要的未使用IP
        for (let i = startIp; i < endIp && pageData.length < this.pageSize; i++) {
          if (!usedIpSet.has(i)) {
            if (count >= skipCount) {
              pageData.push({
                "ip_deci": i,
                "ip_addr": this.intToIp(i),
                "collect_type": "",
                "admin_status": "",
                "comment": "",
                "update_time": ""
              })
            }
            count++
          }
        }

        this.ipam_address_data_page = pageData
      }
    },

    // 每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.updatePageData()
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.currentPage = val
      this.updatePageData()
    },

    // 获取树形结构数据
    getTreeNode() {
      let post_data = {}
      let that = this
      this.net_data = []
      this.tree_loading = true  // 开始加载
      console.log('开始加载，tree_loading:', this.tree_loading)

      ipam_api.getNetworkAddressTree(post_data, {}).then(function(response) {
        console.log('接口返回:', response.data)
        if (response.data.code === 0) {
          that.net_data = response.data.data || []
          console.log('设置数据，条数:', that.net_data.length)
        } else {
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '查询失败，请重试'
        })
      }).finally(function() {
        that.tree_loading = false  // 加载完成
        console.log('加载完成，tree_loading:', that.tree_loading)
      })
    },

    // 删除网段
    del_address(info) {
      console.log("删除网段====", JSON.stringify(info))

      this.$confirm('此操作将删除该记录, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let post_data = {}
        post_data["ip"] = info["ip"]
        post_data["mask"] = info["mask"]

        let that = this
        ipam_api.deleteNetworkAddress(post_data, {}).then(function(response) {
          if (response.data.code === 0) {
            that.$message({
              type: 'success',
              message: '删除成功'
            })
            that.getTreeNode()
            that.click_node_info = {}
          } else {
            that.$message({
              type: 'error',
              message: '删除失败，请重试'
            })
          }
        }).catch(function(error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '删除失败，请重试'
          })
        })
      }).catch((e) => {
        console.log(e)
      })
    },

    // 修改网段
    updateAddress() {
      console.log("修改网段====", JSON.stringify(this.address_view_option))
      let that = this
      let post_data = {}

      post_data["ip"] = this.address_view_option["ip"]
      post_data["mask"] = this.address_view_option["mask"]
      post_data["gateway"] = this.address_view_option["gateway"]
      post_data["status"] = this.address_view_option["status"]
      post_data["location"] = this.address_view_option["location"]
      post_data["isp"] = this.address_view_option["isp"]
      post_data["role"] = this.address_view_option["role"]
      post_data["label"] = this.address_view_option["label"]
      post_data["comment"] = this.address_view_option["comment"]
      post_data["manage_user"] = this.address_view_option["manage_user"]

      ipam_api.updateNetworkAddress(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.dialog_view_cfg_update = false
          that.getTreeNode()
          that.$message({
            type: 'success',
            message: '修改成功'
          })
        } else {
          that.$message({
            type: 'error',
            message: '修改失败，请重试'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '修改失败，请重试'
        })
      })
    },

    // 新增网段
    createAddress() {
      console.log("新增网段====", JSON.stringify(this.address_view_option))
      let that = this
      let post_data = {}
      let adds = this.address_view_option.netaddr.split("/")

      post_data["ip"] = adds[0]
      post_data["mask"] = adds[1]
      post_data["gateway"] = this.address_view_option["gateway"] || ""
      post_data["status"] = this.address_view_option["status"] || "1"
      post_data["location"] = this.address_view_option["location"] || ""
      post_data["isp"] = this.address_view_option["isp"] || ""
      post_data["role"] = this.address_view_option["role"] || ""
      post_data["label"] = this.address_view_option["label"] || ""
      post_data["comment"] = this.address_view_option["comment"] || ""
      post_data["manage_user"] = this.address_view_option["manage_user"] || ""

      console.log("提交数据====", JSON.stringify(post_data))
      ipam_api.addNetworkAddress(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.dialog_view_cfg = false
          that.getTreeNode()
          that.$message({
            type: 'success',
            message: '添加成功'
          })
        } else {
          that.$message({
            type: 'error',
            message: '添加失败，请重试'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '添加失败，请重试'
        })
      })
    },

    // 计算网段范围
    cal_ip_address(net_addr) {
      console.log("计算网段范围====", net_addr)
      if (/(\d+\.){3}\d+\/\d+/.test(net_addr)) {
        this.address_view_option.netaddr = this.address_view_option.netaddr.replace(/^\s*|\s*$/g, "")
        let net_array = net_addr.split("/")
        let ip = net_array[0]
        let mask_str = net_array[1]

        let mask_array = this.getMask(parseInt(mask_str)).split(".")
        let re_mask_array = this.getReMask(parseInt(mask_str)).split(".")

        let start_ip = ip.split(".").reduce(function(new_ip, item, idx) {
          if (idx == 0) {
            return "" + new_ip + (item & mask_array[idx])
          } else {
            return new_ip + "." + (item & mask_array[idx])
          }
        }, "")

        let end_ip = start_ip.split(".").reduce(function(new_ip, item, idx) {
          if (idx == 0) {
            return "" + new_ip + (item ^ re_mask_array[idx])
          } else {
            return new_ip + "." + (item ^ re_mask_array[idx])
          }
        }, "")

        this.address_view_option.start_ip = start_ip
        this.address_view_option.end_ip = end_ip
        console.log(start_ip, end_ip)

        let cal_ip = start_ip + "/" + mask_str
        if (this.address_view_option.netaddr != cal_ip) {
          this.address_view_option.netaddr = cal_ip
          this.$message({
            type: 'info',
            message: '网段已规范化为: ' + cal_ip
          })
        }
        this.$forceUpdate()
      }
    },

    // 获取子网掩码
    getMask(leng) {
      if (leng >= 0 && leng <= 32) {
        return ('1'.repeat(leng) + '0'.repeat(32 - leng)).match(/.{1,8}/g).map(function(s) {
          return parseInt(s, 2)
        }).join('.')
      }
    },

    // 获取反向掩码
    getReMask(leng) {
      if (leng >= 0 && leng <= 32) {
        return ('0'.repeat(leng) + '1'.repeat(32 - leng)).match(/.{1,8}/g).map(function(s) {
          return parseInt(s, 2)
        }).join('.')
      }
    },

    // 整数转IP
    intToIp(INT) {
      INT = parseInt(INT)
      if (INT < 0 || INT > 0xFFFFFFFF) {
        return "0.0.0.0"
      }
      return (INT >>> 24) + "." + (INT >> 16 & 0xFF) + "." + (INT >> 8 & 0xFF) + "." + (INT & 0xFF)
    },

    // IP转整数
    ipToInt(ip) {
      const parts = ip.split('.')
      return (parseInt(parts[0]) << 24) + (parseInt(parts[1]) << 16) + (parseInt(parts[2]) << 8) + parseInt(parts[3])
    },

    // 新增保留IP
    addReserveIp() {
      console.log("新增保留IP====", JSON.stringify(this.reserve_ip_option))

      if (!this.reserve_ip_option.ip_addr) {
        this.$message({
          type: 'warning',
          message: 'IP地址不能为空'
        })
        return
      }

      // 验证IP地址格式
      if (!/^(\d+\.){3}\d+$/.test(this.reserve_ip_option.ip_addr)) {
        this.$message({
          type: 'warning',
          message: 'IP地址格式不正确'
        })
        return
      }

      let that = this
      let post_data = {}
      post_data["data_list"] = [{
        "ip_deci": this.ipToInt(this.reserve_ip_option.ip_addr),
        "ip_addr": this.reserve_ip_option.ip_addr,
        "collect_type": this.reserve_ip_option.collect_type || "手动保留",
        "admin_status": this.reserve_ip_option.admin_status || "",
        "comment": this.reserve_ip_option.comment || ""
      }]

      ipam_api.batchAddIpamAddress(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.dialog_add_reserve_ip = false
          that.reserve_ip_option = {}
          // 刷新当前节点的IP列表
          if (Object.keys(that.click_node_info).length > 0) {
            that.show_node(that.click_node_info)
          }
          that.$message({
            type: 'success',
            message: '添加成功'
          })
        } else {
          that.$message({
            type: 'error',
            message: response.data.message || '添加失败，请重试'
          })
        }
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '添加失败，请重试'
        })
      })
    },

    // 格式化日期
    formatDate: function(value) {
      if (!value) return ""
      let date = new Date(value)
      let y = date.getFullYear()
      let MM = date.getMonth() + 1
      MM = MM < 10 ? ('0' + MM) : MM
      let d = date.getDate()
      d = d < 10 ? ('0' + d) : d
      let h = date.getHours()
      h = h < 10 ? ('0' + h) : h
      let m = date.getMinutes()
      let s = date.getSeconds()
      m = m < 10 ? ('0' + m) : m
      s = s < 10 ? ('0' + s) : s
      return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s
    },

    // 根据使用率获取进度条颜色
    getProgressColor(used_per) {
      const percent = parseFloat(used_per) || 0
      if (percent < 50) {
        return '#67C23A'
      } else if (percent < 80) {
        return '#E6A23C'
      } else {
        return '#F56C6C'
      }
    },

    // 删除IP地址
    deleteIpAddress(row) {
      this.$confirm('确认删除该IP地址吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let that = this
        let post_data = {
          "ip_deci": row.ip_deci
        }

        ipam_api.deleteIpamAddress(post_data, {}).then(function(response) {
          if (response.data.code === 0) {
            that.$message({
              type: 'success',
              message: '删除成功'
            })
            // 刷新当前节点的IP列表
            if (Object.keys(that.click_node_info).length > 0) {
              that.show_node(that.click_node_info)
            }
          } else {
            that.$message({
              type: 'error',
              message: response.data.message || '删除失败，请重试'
            })
          }
        }).catch(function(error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '删除失败，请重试'
          })
        })
      }).catch(() => {
        // 取消删除
      })
    }
  }
}
</script>

<style scoped>
.net_address {
  border: solid 1px #add9c0;
  border-collapse: collapse;
}

.net_lb {
  font-weight: bolder;
  text-align: right;
  padding: 6px;
  width: 120px;
}

.net_vl {
  text-align: left;
  padding: 6px;
  border-left: solid 1px lightgray;
  white-space: pre;
}

/* 信息项样式 */
.info-item {
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.info-label i {
  margin-right: 6px;
  color: #409EFF;
}

.info-value {
  font-size: 14px;
  color: #303133;
  padding-left: 20px;
}

/* 树节点样式优化 */
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.custom-tree-node:hover {
  background-color: #F5F7FA;
}

/* 增加树节点的点击区域 */
::v-deep .el-tree-node__content {
  height: 36px;
  padding: 4px 0;
}

/* 当前选中节点高亮 */
::v-deep .el-tree-node.is-current > .el-tree-node__content {
  background-color: #E6F7FF;
  border-left: 3px solid #409EFF;
}

/* 树的整体样式 */
::v-deep .el-tree {
  background-color: #FAFAFA;
  padding: 10px;
  border-radius: 4px;
}

/* 展开/收起图标样式 */
::v-deep .el-tree-node__expand-icon {
  font-size: 16px;
  color: #606266;
}

::v-deep .el-tree-node__expand-icon.is-leaf {
  color: transparent;
}

/* 卡片样式优化 */
::v-deep .el-card {
  border-radius: 8px;
  transition: all 0.3s;
}

::v-deep .el-card__header {
  background-color: #F9FAFB;
  border-bottom: 1px solid #EBEEF5;
  padding: 15px 20px;
}

::v-deep .el-card__body {
  padding: 20px;
}
</style>
