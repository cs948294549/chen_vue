<template>
  <div>
    <div>
      <el-row>
        <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
          <el-form-item>
            <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增设备</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="danger" icon="el-icon-delete" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">
              批量删除 ({{ multipleSelection.length }})
            </el-button>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input placeholder="IP地址或设备名称" v-model="filter_search" @keyup.enter.native="getIpList" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading='isload' @click="getIpList">查询</el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </div>

    <el-table border :data.sync='table_info_show' @selection-change="handleSelectionChange" size="mini">
      <el-table-column type="selection" width="55" align='center'></el-table-column>
      <el-table-column prop='ip' label='IP地址' show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop='sysname' label='设备名称' show-overflow-tooltip min-width='28' align='center'></el-table-column>
      <el-table-column prop='community' label='SNMP Community' show-overflow-tooltip min-width='15' align='center'></el-table-column>
      <el-table-column prop='admin_status' label='管理状态' show-overflow-tooltip min-width='10' align='center'>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.admin_status === '0'" size="small" type="success">正常</el-tag>
          <el-tag v-else size="small" type="danger">屏蔽</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop='timestamp' label='更新时间' show-overflow-tooltip min-width='20' align='center'>
        <template slot-scope="scope">
          {{ formatTimestamp(scope.row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label='操作' width='200' align='center' fixed="right">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination @current-change='handleCurrentChange' :current-page='table_currentPage' @size-change="handleSizeChange"
      :page-sizes="[20, 50, 100, 200]" :page-size="table_size" layout='total, sizes, prev, pager, next' :total='table_total' style='float: right'></el-pagination><br/>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="700px" :close-on-click-modal="false">
      <el-form ref="ipForm" :model="formData" :rules="formRules" label-width="140px" size="small">
        <el-form-item v-if="!isEdit" label="IP地址" prop="ip_list">
          <el-input
            type="textarea"
            v-model="formData.ip_list"
            placeholder="请输入IP地址，每行一个&#10;例如:&#10;192.168.1.1&#10;192.168.1.2"
            :rows="5"
            clearable>
          </el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="IP地址" prop="ip">
          <el-input v-model="formData.ip" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="设备名称" prop="sysname">
          <el-input v-model="formData.sysname" placeholder="请输入设备名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="Community" prop="community">
          <el-input v-model="formData.community" placeholder="默认: vdiannet" clearable></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="管理状态" prop="admin_status">
          <el-radio-group v-model="formData.admin_status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">屏蔽</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- 检测结果表格 -->
      <div v-if="!isEdit && detectionResults.length > 0" style="margin-top: 20px;">
        <el-divider>检测结果</el-divider>
        <el-table :data="detectionResults" border size="mini" max-height="300">
          <el-table-column prop="ip" label="IP地址" width="150" align="center"></el-table-column>
          <el-table-column prop="sysname" label="设备名称" show-overflow-tooltip align="center"></el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.status === 'success'" size="small" type="success">成功</el-tag>
              <el-tag v-else size="small" type="danger">失败</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button v-if="!isEdit && detectionResults.length === 0" type="primary" @click="handleDetection" :loading="submitLoading">检 测</el-button>
        <el-button v-if="!isEdit && detectionResults.length > 0" type="success" @click="handleBatchSubmit" :loading="submitLoading">提 交</el-button>
        <el-button v-if="isEdit" type="primary" @click="handleSubmit" :loading="submitLoading">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import iplist_api from "@/api/mapis/iplist_interface.js"
import collector_api from "@/api/mapis/collector_interface.js"

export default {
  data() {
    return {
      // table 用
      multipleSelection: [],
      table_currentPage: 1,
      table_info: [],
      table_info_show: [],
      table_total: 0,
      table_size: 20,

      // 筛选用
      filter_search: "",

      isload: false,

      // 对话框
      dialogVisible: false,
      dialogTitle: '新增设备',
      isEdit: false,
      submitLoading: false,

      // 检测结果
      detectionResults: [],

      // 表单数据
      formData: {
        ip: '',
        ip_list: '',
        sysname: '',
        community: 'vdiannet',
        admin_status: '0'
      },

      // 表单验证规则
      formRules: {
        ip: [
          { required: true, message: '请输入IP地址', trigger: 'blur' },
          { pattern: /^(\d+\.){3}\d+$/, message: 'IP地址格式不正确', trigger: 'blur' }
        ],
        ip_list: [
          { required: true, message: '请输入IP地址', trigger: 'blur' }
        ],
        sysname: [
          { required: true, message: '请输入设备名称', trigger: 'blur' },
          { min: 1, max: 300, message: '设备名称长度在1到300个字符', trigger: 'blur' }
        ],
        community: [
          { required: true, message: '请输入Community', trigger: 'blur' },
          { max: 100, message: 'Community长度不超过100个字符', trigger: 'blur' }
        ],
        admin_status: [
          { required: true, message: '请选择管理状态', trigger: 'change' }
        ]
      }
    }
  },

  mounted() {
    this.getIpList()
  },

  methods: {
    // 表格自带方法
    handleSelectionChange(val) {
      this.multipleSelection = val
    },

    // 修改页码
    handleCurrentChange(val) {
      this.table_currentPage = val
      this.table_info_show = this.table_info.slice((this.table_currentPage - 1) * this.table_size, this.table_currentPage * this.table_size)
    },

    // 修改一页总数
    handleSizeChange(val) {
      this.table_size = val
      this.table_info_show = this.table_info.slice((this.table_currentPage - 1) * this.table_size, this.table_currentPage * this.table_size)
    },

    // 获取设备IP清单列表
    getIpList() {
      let post_data = {}
      this.filter_search = this.filter_search.replace(/^\s*|\s*$/g, "")
      if (this.filter_search != "") {
        post_data["search"] = this.filter_search
      }

      this.table_currentPage = 1
      this.table_total = 0

      let that = this
      this.isload = true

      iplist_api.getIpList(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.table_info = response.data.data || []
          that.table_total = that.table_info.length
          that.table_info_show = that.table_info.slice((that.table_currentPage - 1) * that.table_size, that.table_currentPage * that.table_size)
        } else {
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          })
        }
        that.isload = false
      }).catch(function(error) {
        console.log(error)
        that.isload = false
        that.$message({
          type: 'error',
          message: '查询失败，请重试'
        })
      })
    },

    // 新增
    handleAdd() {
      this.dialogTitle = '新增设备'
      this.isEdit = false
      this.detectionResults = []
      this.formData = {
        ip: '',
        ip_list: '',
        sysname: '',
        community: 'vdiannet',
        admin_status: '0'
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.ipForm) {
          this.$refs.ipForm.clearValidate()
        }
      })
    },

    // 编辑
    handleEdit(row) {
      this.dialogTitle = '编辑设备'
      this.isEdit = true
      this.formData = {
        ip: row.ip,
        sysname: row.sysname,
        community: row.community,
        admin_status: row.admin_status
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.ipForm) {
          this.$refs.ipForm.clearValidate()
        }
      })
    },

    // 检测设备
    handleDetection() {
      this.$refs.ipForm.validate(valid => {
        if (valid) {
          this.submitLoading = true
          this.detectionResults = []

          // 解析IP列表
          let ip_list = this.formData.ip_list.split('\n').map(ip => ip.trim()).filter(ip => ip !== '')

          if (ip_list.length === 0) {
            this.$message({
              type: 'warning',
              message: '请输入至少一个IP地址'
            })
            this.submitLoading = false
            return
          }

          let that = this
          let community = this.formData.community || 'vdiannet'
          let completedCount = 0

          // 批量检测每个IP
          ip_list.forEach(function(ip) {
            let snmp_data = {
              ip: ip,
              community: community,
              oid: '1.3.6.1.2.1.1.5.0'  // sysName OID
            }

            collector_api.getSNMPGET(snmp_data, {}).then(function(response) {
              if (response.data.code === 0 && response.data.data) {
                // SNMP验证成功，获取到设备名
                that.detectionResults.push({
                  ip: ip,
                  sysname: response.data.data,
                  status: 'success'
                })
              } else {
                // SNMP验证失败
                that.detectionResults.push({
                  ip: ip,
                  sysname: '获取失败',
                  status: 'failed'
                })
              }
              completedCount++
              if (completedCount === ip_list.length) {
                that.submitLoading = false
                that.$message({
                  type: 'info',
                  message: `检测完成，成功: ${that.detectionResults.filter(r => r.status === 'success').length}，失败: ${that.detectionResults.filter(r => r.status === 'failed').length}`
                })
              }
            }).catch(function(error) {
              console.log(error)
              that.detectionResults.push({
                ip: ip,
                sysname: '连接失败',
                status: 'failed'
              })
              completedCount++
              if (completedCount === ip_list.length) {
                that.submitLoading = false
                that.$message({
                  type: 'info',
                  message: `检测完成，成功: ${that.detectionResults.filter(r => r.status === 'success').length}，失败: ${that.detectionResults.filter(r => r.status === 'failed').length}`
                })
              }
            })
          })
        }
      })
    },

    // 批量提交成功的设备
    handleBatchSubmit() {
      let successList = this.detectionResults.filter(r => r.status === 'success')

      if (successList.length === 0) {
        this.$message({
          type: 'warning',
          message: '没有检测成功的设备可以提交'
        })
        return
      }

      this.submitLoading = true
      let that = this
      let community = this.formData.community || 'vdiannet'

      // 构建设备列表
      let deviceList = successList.map(device => ({
        ip: device.ip,
        sysname: device.sysname,
        community: community,
        admin_status: '0',
        timestamp: Math.floor(Date.now() / 1000).toString()
      }))

      let post_data = {
        ip_list: deviceList
      }

      iplist_api.batchAddOrUpdateIp(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.$message({
            type: 'success',
            message: `批量处理完成，共 ${successList.length} 条`
          })
          that.dialogVisible = false
          that.getIpList()
        } else {
          that.$message({
            type: 'error',
            message: response.data.message || '批量处理失败'
          })
        }
        that.submitLoading = false
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '批量处理失败，请重试'
        })
        that.submitLoading = false
      })
    },

    // 提交表单（仅用于编辑）
    handleSubmit() {
      this.$refs.ipForm.validate(valid => {
        if (valid) {
          this.submitData()
        }
      })
    },

    // 提交数据（仅用于编辑）
    submitData() {
      this.submitLoading = true
      let post_data = {
        ip: this.formData.ip,
        sysname: this.formData.sysname,
        community: this.formData.community || 'vdiannet',
        admin_status: this.formData.admin_status,
        timestamp: Math.floor(Date.now() / 1000).toString()
      }

      let that = this

      iplist_api.updateIp(post_data, {}).then(function(response) {
        if (response.data.code === 0) {
          that.$message({
            type: 'success',
            message: '修改成功'
          })
          that.dialogVisible = false
          that.getIpList()
        } else {
          that.$message({
            type: 'error',
            message: response.data.message || '修改失败'
          })
        }
        that.submitLoading = false
      }).catch(function(error) {
        console.log(error)
        that.$message({
          type: 'error',
          message: '修改失败，请重试'
        })
        that.submitLoading = false
      })
    },

    // 删除
    handleDelete(row) {
      this.$confirm(`确认删除设备 ${row.sysname} (${row.ip}) 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let post_data = {
          ip: row.ip
        }
        let that = this

        iplist_api.deleteIp(post_data, {}).then(function(response) {
          if (response.data.code === 0) {
            that.$message({
              type: 'success',
              message: '删除成功'
            })
            that.getIpList()
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
            message: '删除失败，请重试'
          })
        })
      }).catch(() => {
        // 取消删除
      })
    },

    // 批量删除
    handleBatchDelete() {
      if (this.multipleSelection.length === 0) {
        this.$message({
          type: 'warning',
          message: '请先选择要删除的数据'
        })
        return
      }

      this.$confirm(`确认删除选中的 ${this.multipleSelection.length} 条数据吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let post_data = {
          ip_list: this.multipleSelection.map(item => item.ip)
        }
        let that = this

        iplist_api.batchDeleteIp(post_data, {}).then(function(response) {
          if (response.data.code === 0) {
            that.$message({
              type: 'success',
              message: '批量删除成功'
            })
            that.getIpList()
          } else {
            that.$message({
              type: 'error',
              message: response.data.message || '批量删除失败'
            })
          }
        }).catch(function(error) {
          console.log(error)
          that.$message({
            type: 'error',
            message: '批量删除失败，请重试'
          })
        })
      }).catch(() => {
        // 取消删除
      })
    },

    // 格式化时间戳
    formatTimestamp(timestamp) {
      if (!timestamp || timestamp === '' || timestamp === '0') return '-'

      // 如果timestamp是秒级时间戳（10位），转换为毫秒
      let ts = parseInt(timestamp)
      if (ts < 10000000000) {
        ts = ts * 1000
      }

      const date = new Date(ts)

      // 检查日期是否有效
      if (isNaN(date.getTime())) return '-'

      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      const s = String(date.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${d} ${h}:${min}:${s}`
    }
  }
}
</script>

<style>
</style>
