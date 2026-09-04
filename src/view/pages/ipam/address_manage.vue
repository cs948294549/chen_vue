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
        <div style="width: 800px;max-height: 800px;min-height: 100px;">
          <!-- IP地址搜索框 -->
          <div style="margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <el-input
              v-model="searchIpAddress"
              placeholder="输入IP地址搜索（例如：192.168.1.0）"
              clearable
              @input="handleSearchIp"
              @clear="clearSearchIp"
              prefix-icon="el-icon-search"
              size="small">
              <el-button slot="append" icon="el-icon-search" @click="searchAndLocateIp">定位</el-button>
            </el-input>
            <div v-if="searchResultText" style="margin-top: 8px; font-size: 12px;" :style="{color: searchResultColor}">
              <i :class="searchResultIcon"></i> {{ searchResultText }}
            </div>
          </div>

          <!-- 网段树 -->
          <div v-loading="tree_loading" element-loading-text="加载网段树...">
            <el-tree
              ref="ipTree"
              :data="net_data"
              node-key="id"
              @node-click="show_node"
              :default-expanded-keys="default_expand"
              :default-expand-all="false"
              :expand-on-click-node="false"
              :highlight-current="true"
              :filter-node-method="filterNode">
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
              <el-button type="success" size="small" icon="el-icon-s-operation" @click="openAllocateDialog">分配子网段</el-button>
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
                    active-text="仅已使用"
                    inactive-text="显示所有"
                    active-color="#67C23A"
                    inactive-color="#409EFF"
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

    <!-- 分配子网段对话框 -->
    <el-dialog title="分配子网段" :visible.sync="dialog_allocate_subnet" width="90%" :close-on-click-modal="false">
      <!-- 第一步：输入分配参数 -->
      <div v-if="!allocate_subnets.length" style="padding: 20px;">
        <el-alert
          title="当前网段信息"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;">
          <div style="font-size: 14px; line-height: 1.8;">
            <div><strong>父网段：</strong>{{ click_node_info.ip }}/{{ click_node_info.mask }}</div>
            <div><strong>IP范围：</strong>{{ intToIp(click_node_info.start_ip) }} - {{ intToIp(click_node_info.end_ip) }}</div>
            <div><strong>总IP数：</strong>{{ click_node_info.end_ip - click_node_info.start_ip + 1 }} 个</div>
            <div v-if="click_node_info.children && click_node_info.children.length"><strong>已有子网段：</strong>{{ click_node_info.children.length }} 个</div>
          </div>
        </el-alert>

        <el-form :model="allocate_params" size="medium" label-width="140px" style="max-width: 600px;">
          <el-form-item label="子网掩码长度">
            <el-select v-model="allocate_params.target_mask" placeholder="请选择掩码长度" style="width: 300px;">
              <el-option
                v-for="mask in available_masks"
                :key="mask"
                :label="`/${mask} (每个网段 ${Math.pow(2, 32 - mask)} 个IP)`"
                :value="mask">
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="起始IP地址">
            <el-input
              v-model="allocate_params.start_position"
              placeholder="可选，不填则从网段起始位置分配"
              style="width: 300px;"
              clearable>
            </el-input>
            <div style="color: #909399; font-size: 12px; margin-top: 5px;">
              指定从哪个IP地址开始分配（例如：{{ intToIp(click_node_info.start_ip) }}）
            </div>
          </el-form-item>

          <el-form-item label="分配数量">
            <el-input-number
              v-model="allocate_params.count"
              :min="1"
              :max="10"
              style="width: 300px;"
              placeholder="最多10个">
            </el-input-number>
            <div style="color: #909399; font-size: 12px; margin-top: 5px;">最多一次性分配10个子网段</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="calculateSubnets" icon="el-icon-s-operation">计算可分配网段</el-button>
            <el-button @click="dialog_allocate_subnet=false">取消</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步：展示并编辑分配结果 -->
      <div v-else style="padding: 10px;">
        <el-alert
          :title="`找到 ${allocate_subnets.length} 个可分配的连续网段`"
          type="success"
          :closable="false"
          style="margin-bottom: 15px;">
          <div style="font-size: 12px; color: #67C23A;">
            可以根据需要编辑各网段的属性，然后提交创建
          </div>
        </el-alert>

        <el-table
          :data="allocate_subnets"
          border
          stripe
          style="width: 100%"
          :header-cell-style="{background: '#F5F7FA', color: '#606266', fontWeight: '600'}">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>

          <el-table-column label="网段" width="150" align="center">
            <template slot-scope="scope">
              <span style="color: #409EFF; font-weight: 600;">{{ scope.row.ip }}/{{ scope.row.mask }}</span>
            </template>
          </el-table-column>

          <el-table-column label="IP范围" width="280">
            <template slot-scope="scope">
              <div style="font-size: 12px;">
                {{ intToIp(scope.row.start_ip) }} - {{ intToIp(scope.row.end_ip) }}
                <el-tag size="mini" type="info" style="margin-left: 5px;">
                  {{ scope.row.end_ip - scope.row.start_ip + 1 }} 个IP
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="网关" width="140">
            <template slot-scope="scope">
              <el-input v-model="scope.row.gateway" size="mini" placeholder="可选"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="区域" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.location" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="运营商" width="120">
            <template slot-scope="scope">
              <el-select v-model="scope.row.isp" size="mini" placeholder="选择" clearable>
                <el-option v-for="item in isp_options" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="用途" width="140">
            <template slot-scope="scope">
              <el-input v-model="scope.row.role" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="业务标签" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.label" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="110">
            <template slot-scope="scope">
              <el-select v-model="scope.row.status" size="mini">
                <el-option v-for="(item, key) in address_status_options" :key="key" :label="item" :value="key"></el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="描述" width="160">
            <template slot-scope="scope">
              <el-input v-model="scope.row.comment" size="mini" placeholder="可选"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="管理员" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.manage_user" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center">
            <template slot-scope="scope">
              <el-button
                type="danger"
                size="mini"
                icon="el-icon-delete"
                circle
                @click="removeAllocateSubnet(scope.$index)">
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; text-align: right;">
          <el-button @click="resetAllocate" icon="el-icon-refresh-left">重新计算</el-button>
          <el-button type="primary" @click="submitAllocateSubnets" icon="el-icon-check">提交创建 ({{ allocate_subnets.length }}个)</el-button>
        </div>
      </div>
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

      // IP地址搜索
      searchIpAddress: '',
      searchResultText: '',
      searchResultColor: '',
      searchResultIcon: '',

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
      pageSize: 100,

      // 分配子网段
      dialog_allocate_subnet: false,
      allocate_params: {
        target_mask: null,
        count: 1,
        start_position: ''
      },
      available_masks: [],
      allocate_subnets: []
    }
  },

  mounted() {
    this.getTreeNode()
  },

  methods: {
    // IP地址搜索处理
    handleSearchIp() {
      if (!this.searchIpAddress) {
        this.clearSearchIp()
        return
      }
    },

    // 清空搜索
    clearSearchIp() {
      this.searchResultText = ''
      this.searchResultColor = ''
      this.searchResultIcon = ''
      if (this.$refs.ipTree) {
        this.$refs.ipTree.filter('')
      }
    },

    // 搜索并定位IP
    searchAndLocateIp() {
      if (!this.searchIpAddress || !this.searchIpAddress.trim()) {
        this.$message({
          type: 'warning',
          message: '请输入要搜索的IP地址'
        })
        return
      }

      const searchIp = this.searchIpAddress.trim()

      // 验证IP地址格式
      if (!/^(\d+\.){3}\d+$/.test(searchIp)) {
        this.searchResultText = 'IP地址格式不正确'
        this.searchResultColor = '#F56C6C'
        this.searchResultIcon = 'el-icon-warning'
        return
      }

      // 将IP转换为整数用于范围判断
      const searchIpInt = this.ipToInt(searchIp)

      // 递归查找包含该IP的网段
      const findNodeByIp = (nodes, parentPath = []) => {
        for (let node of nodes) {
          const nodePath = [...parentPath, node.id]

          // start_ip和end_ip是字符串类型的整数，需要转换为数字进行比较
          const nodeStartIp = Number(node.start_ip)
          const nodeEndIp = Number(node.end_ip)

          // 判断IP是否在当前网段范围内
          if (searchIpInt >= nodeStartIp && searchIpInt <= nodeEndIp) {
            // 如果有子节点，继续在子节点中查找更精确的匹配
            if (node.children && node.children.length > 0) {
              const childResult = findNodeByIp(node.children, nodePath)
              if (childResult) {
                return childResult
              }
            }

            // 返回当前节点和路径
            return {
              node: node,
              path: nodePath
            }
          }
        }
        return null
      }

      const result = findNodeByIp(this.net_data)

      if (result) {
        // 展开父节点路径
        this.default_expand = result.path

        // 高亮并选中节点
        this.$nextTick(() => {
          if (this.$refs.ipTree) {
            this.$refs.ipTree.setCurrentKey(result.node.id)
          }

          // 触发节点点击事件，显示详细信息
          this.show_node(result.node)

          // 显示成功提示
          this.searchResultText = `已定位到网段: ${result.node.ip}/${result.node.mask}`
          this.searchResultColor = '#67C23A'
          this.searchResultIcon = 'el-icon-success'
        })
      } else {
        this.searchResultText = `未找到包含 ${searchIp} 的网段`
        this.searchResultColor = '#E6A23C'
        this.searchResultIcon = 'el-icon-info'
      }
    },

    // 树节点过滤方法
    filterNode(value, data) {
      if (!value) return true
      return data.ip.indexOf(value) !== -1
    },

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
        // 仅显示已使用：直接使用数据库返回的数据
        this.ipam_address_data_show = this.ipam_address_data
        this.ipam_address_total = this.ipam_address_data.length
      } else {
        // 显示所有：已使用+未使用
        const startIp = parseInt(this.click_node_info["start_ip"])
        const endIp = parseInt(this.click_node_info["end_ip"])
        const totalIps = endIp - startIp + 1  // 包含起始和结束IP
        this.ipam_address_total = totalIps
        this.ipam_address_data_show = null // 标记为显示所有模式
      }

      this.currentPage = 1
      this.updatePageData()
    },

    // 更新当前页数据
    updatePageData() {
      if (this.ipam_address_data_show !== null) {
        // 仅已使用模式：直接分页
        const start = (this.currentPage - 1) * this.pageSize
        const end = start + this.pageSize
        this.ipam_address_data_page = this.ipam_address_data_show.slice(start, end)
      } else {
        // 显示所有模式：按需生成当前页的所有IP（已使用+未使用）
        const startIp = parseInt(this.click_node_info["start_ip"])
        const endIp = parseInt(this.click_node_info["end_ip"])

        // 构建已使用IP的映射表，方便快速查找
        const usedIpMap = {}
        this.ipam_address_data.forEach(item => {
          usedIpMap[parseInt(item.ip_deci)] = item
        })

        const pageData = []
        const skipCount = (this.currentPage - 1) * this.pageSize
        const startIndex = startIp + skipCount
        const endIndex = Math.min(startIndex + this.pageSize, endIp + 1)

        // 生成当前页的IP列表
        for (let i = startIndex; i < endIndex; i++) {
          if (usedIpMap[i]) {
            // 已使用的IP，使用数据库中的数据
            pageData.push(usedIpMap[i])
          } else {
            // 未使用的IP，生成空记录
            pageData.push({
              "ip_deci": i,
              "ip_addr": this.intToIp(i),
              "collect_type": "",
              "admin_status": "",
              "comment": "",
              "update_time": ""
            })
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
      // console.log('开始加载，tree_loading:', this.tree_loading)

      ipam_api.getNetworkAddressTree(post_data, {}).then(function(response) {
        // console.log('接口返回:', response.data)
        if (response.data.code === 0) {
          that.net_data = response.data.data || []
          // console.log('设置数据，条数:', that.net_data.length)
        } else {
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          })
        }
      }).catch(function(error) {
        // console.log(error)
        that.$message({
          type: 'error',
          message: '查询失败，请重试'
        })
      }).finally(function() {
        that.tree_loading = false  // 加载完成
        // console.log('加载完成，tree_loading:', that.tree_loading)
      })
    },

    // 删除网段
    del_address(info) {
      // console.log("删除网段====", JSON.stringify(info))

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
          // console.log(error)
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
      // console.log("修改网段====", JSON.stringify(this.address_view_option))
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
      // console.log("新增网段====", JSON.stringify(this.address_view_option))
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

      // console.log("提交数据====", JSON.stringify(post_data))
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
      // console.log("计算网段范围====", net_addr)
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
        // console.log(start_ip, end_ip)

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
      return ((parseInt(parts[0]) << 24) >>> 0) + (parseInt(parts[1]) << 16) + (parseInt(parts[2]) << 8) + parseInt(parts[3])
    },

    // 新增保留IP
    addReserveIp() {
      // console.log("新增保留IP====", JSON.stringify(this.reserve_ip_option))

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
    },

    // 打开分配子网段对话框
    openAllocateDialog() {
      // 验证当前网段掩码长度
      const currentMask = parseInt(this.click_node_info.mask)
      if (currentMask >= 30) {
        this.$message({
          type: 'warning',
          message: '当前网段掩码长度已达到/30或更大，无法继续分配子网段'
        })
        return
      }

      // 生成可选的掩码长度（从当前掩码+1到30）
      this.available_masks = []
      for (let i = currentMask + 1; i <= 30; i++) {
        this.available_masks.push(i)
      }

      // 重置参数
      this.allocate_params = {
        target_mask: currentMask + 1,
        count: 1,
        start_position: ''
      }
      this.allocate_subnets = []
      this.dialog_allocate_subnet = true
    },

    // 计算可分配的子网段
    calculateSubnets() {
      if (!this.allocate_params.target_mask) {
        this.$message({
          type: 'warning',
          message: '请选择子网掩码长度'
        })
        return
      }

      if (!this.allocate_params.count || this.allocate_params.count < 1 || this.allocate_params.count > 10) {
        this.$message({
          type: 'warning',
          message: '分配数量必须在1-10之间'
        })
        return
      }

      const targetMask = parseInt(this.allocate_params.target_mask)
      const count = parseInt(this.allocate_params.count)
      const parentStartIp = parseInt(this.click_node_info.start_ip)
      const parentEndIp = parseInt(this.click_node_info.end_ip)

      // 计算子网段大小
      const subnetSize = Math.pow(2, 32 - targetMask)

      // 确定起始位置
      let startIP = parentStartIp
      if (this.allocate_params.start_position && this.allocate_params.start_position.trim()) {
        // 验证起始IP格式
        const startIpStr = this.allocate_params.start_position.trim()
        if (!/^(\d+\.){3}\d+$/.test(startIpStr)) {
          this.$message({
            type: 'warning',
            message: '起始IP地址格式不正确'
          })
          return
        }

        const specifiedStartIp = this.ipToInt(startIpStr)

        // 验证起始IP是否在父网段范围内
        if (specifiedStartIp < parentStartIp || specifiedStartIp > parentEndIp) {
          this.$message({
            type: 'warning',
            message: `起始IP必须在父网段范围内 (${this.intToIp(parentStartIp)} - ${this.intToIp(parentEndIp)})`
          })
          return
        }

        startIP = specifiedStartIp
      }

      // 获取已占用的IP段
      const occupiedRanges = []
      if (this.click_node_info.children && this.click_node_info.children.length > 0) {
        this.click_node_info.children.forEach(child => {
          occupiedRanges.push({
            start: parseInt(child.start_ip),
            end: parseInt(child.end_ip)
          })
        })
      }

      // 从指定位置开始，寻找连续的可用空间
      const availableSubnets = []
      let currentIP = startIP

      // 确保起始位置对齐到子网边界
      const alignmentBase = parentStartIp
      const offset = (currentIP - alignmentBase) % subnetSize
      if (offset !== 0) {
        currentIP += (subnetSize - offset)
      }

      while (currentIP + subnetSize - 1 <= parentEndIp && availableSubnets.length < count) {
        const subnetEnd = currentIP + subnetSize - 1

        // 检查是否与已有网段冲突
        let isConflict = false
        for (let range of occupiedRanges) {
          if (!(subnetEnd < range.start || currentIP > range.end)) {
            isConflict = true
            break
          }
        }

        if (!isConflict) {
          // 计算网络地址
          const networkIp = this.intToIp(currentIP)

          availableSubnets.push({
            ip: networkIp,
            mask: targetMask,
            start_ip: currentIP,
            end_ip: subnetEnd,
            // 继承父网段的字段
            gateway: this.click_node_info.gateway || '',
            location: this.click_node_info.location || '',
            isp: this.click_node_info.isp || '',
            role: this.click_node_info.role || '',
            label: this.click_node_info.label || '',
            status: this.click_node_info.status || '1',
            comment: '',
            manage_user: this.click_node_info.manage_user || ''
          })
        }

        // 移动到下一个子网位置
        currentIP += subnetSize
      }

      if (availableSubnets.length === 0) {
        this.$message({
          type: 'warning',
          message: '从指定位置未找到可分配的连续网段，请尝试减少分配数量、选择更大的掩码长度或更改起始位置'
        })
        return
      }

      if (availableSubnets.length < count) {
        this.$message({
          type: 'warning',
          message: `从指定位置仅找到 ${availableSubnets.length} 个可分配网段，少于请求的 ${count} 个`
        })
      }

      this.allocate_subnets = availableSubnets
    },

    // 移除分配列表中的某个网段
    removeAllocateSubnet(index) {
      this.$confirm('确认删除这个待分配的网段吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.allocate_subnets.splice(index, 1)
        if (this.allocate_subnets.length === 0) {
          this.$message({
            type: 'info',
            message: '已清空分配列表'
          })
        }
      }).catch(() => {})
    },

    // 重新计算
    resetAllocate() {
      this.allocate_subnets = []
    },

    // 提交创建子网段
    submitAllocateSubnets() {
      if (this.allocate_subnets.length === 0) {
        this.$message({
          type: 'warning',
          message: '没有需要创建的网段'
        })
        return
      }

      this.$confirm(`确认创建 ${this.allocate_subnets.length} 个子网段吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 构建提交数据
        const submitData = this.allocate_subnets.map(subnet => {
          return {
            ip: subnet.ip,
            mask: subnet.mask.toString(),
            gateway: subnet.gateway,
            status: subnet.status,
            location: subnet.location,
            isp: subnet.isp,
            role: subnet.role,
            label: subnet.label,
            comment: subnet.comment,
            manage_user: subnet.manage_user
          }
        })

        // 打印提交内容
        console.log('==========批量创建网段提交数据==========')
        console.log('提交数量：', submitData.length)
        console.log('详细数据：', JSON.stringify(submitData, null, 2))
        console.log('========================================')

        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: `正在创建 ${submitData.length} 个网段...`,
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        // 调用批量创建接口
        const that = this
        ipam_api.batchAddNetworkAddress({ networks: submitData }, {})
          .then(response => {
            loading.close()

            if (response.data.code === 0) {
              const result = response.data.data

              // 全部成功
              that.$message({
                type: 'success',
                message: result.message,
                duration: 3000
              })

              // 创建成功后刷新树并关闭对话框
              that.dialog_allocate_subnet = false
              that.allocate_subnets = []
              that.getTreeNode()
            } else {
              // 失败情况，显示详细信息
              const result = response.data.data
              let errorMessage = result.message

              if (result.failed_items && result.failed_items.length > 0) {
                errorMessage += '\n\n失败详情:\n' +
                  result.failed_items.map(item => `${item.ip}/${item.mask}: ${item.error}`).join('\n')
              }

              that.$alert(errorMessage, '批量创建失败', {
                type: 'error',
                confirmButtonText: '确定'
              })
            }
          })
          .catch(error => {
            loading.close()
            console.error('批量创建网段异常：', error)
            that.$message({
              type: 'error',
              message: '批量创建失败，请重试',
              duration: 3000
            })
          })
      }).catch(() => {})
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
