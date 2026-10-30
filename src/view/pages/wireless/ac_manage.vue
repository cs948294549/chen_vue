<template>
  <div class="ac-manage">
    <div class="ac-manage__card">
      <div class="ac-manage__bar">
        <span class="ac-manage__title">AC 管理</span>
        <span class="ac-manage__tip">AC 通过 SNMP 采集 AP / 射频 / SSID / 终端数据</span>
        <div class="ac-manage__spacer"></div>
        <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="loadList">刷新</el-button>
        <el-button size="mini" type="primary" icon="el-icon-plus" @click="openDialog()">新增 AC</el-button>
      </div>

      <div class="ac-manage__body">
        <el-table :data="list" size="mini" border height="100%" v-loading="loading">
          <el-table-column prop="ac_name" label="名称" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="vendor" label="厂商" width="90" align="center">
            <template slot-scope="scope">{{ vendorLabel(scope.row.vendor) }}</template>
          </el-table-column>
          <el-table-column prop="model" label="型号" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="mgmt_ip" label="管理 IP" min-width="130">
            <template slot-scope="scope">
              <span class="mono">{{ scope.row.mgmt_ip }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="last_status" label="最近采集" width="100" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="statusOf(scope.row.last_status).type">
                {{ statusOf(scope.row.last_status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ap_count" label="AP 数" width="80" align="center"></el-table-column>
          <el-table-column label="操作" width="280" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" :loading="testingId === scope.row.ac_id"
                @click="handleTestRow(scope.row)">测试连通性</el-button>
              <el-button type="text" size="mini" :loading="collectingId === scope.row.ac_id"
                @click="handleCollect(scope.row)">立即采集</el-button>
              <el-button type="text" size="mini" @click="openDialog(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" class="is-danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      :title="form.ac_id ? '编辑 AC' : '新增 AC'"
      :visible.sync="dialogVisible"
      width="520px"
      :close-on-click-modal="false"
      @closed="testResult = null">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px" size="mini">
        <el-form-item label="名称" prop="ac_name">
          <el-input v-model.trim="form.ac_name" placeholder="如：C座主AC"></el-input>
        </el-form-item>
        <el-form-item label="厂商" prop="vendor">
          <el-select v-model="form.vendor" placeholder="请选择" style="width: 100%">
            <el-option v-for="v in vendorOptions" :key="v.value" :label="v.label" :value="v.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="管理 IP" prop="mgmt_ip">
          <el-input v-model.trim="form.mgmt_ip" placeholder="如：10.20.1.10"></el-input>
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model.trim="form.model" placeholder="如：AC6508"></el-input>
        </el-form-item>
        <el-form-item label="Community" prop="community">
          <el-input v-model="form.community" show-password
            :placeholder="form.ac_id ? '留空表示不修改' : 'SNMP 只读团体字'"></el-input>
        </el-form-item>
      </el-form>

      <div v-if="testResult" class="test-result" :class="testResult.ok ? 'is-ok' : 'is-fail'">
        <template v-if="testResult.ok">
          <div><i class="el-icon-success"></i> 连通正常，耗时 {{ testResult.elapsed_ms }} ms</div>
          <div class="test-result__row">sysName：{{ testResult.sysname || '--' }}</div>
          <div class="test-result__row">sysDescr：{{ testResult.sysdescr || '--' }}</div>
        </template>
        <div v-else><i class="el-icon-error"></i> {{ testResult.message }}</div>
      </div>

      <span slot="footer">
        <el-button size="mini" class="dialog-test" :loading="dialogTesting" @click="handleTestForm">测试连通性</el-button>
        <el-button size="mini" @click="dialogVisible = false">取消</el-button>
        <el-button size="mini" type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import wifiApi from '@/api/mapis/wifi_interface'

const VENDORS = [
  { value: 'huawei', label: '华为' },
  { value: 'h3c', label: '华三' },
  { value: 'ruijie', label: '锐捷' },
  { value: 'fortinet', label: '飞塔' }
]

const STATUS = {
  online: { type: 'success', label: '正常' },
  offline: { type: 'danger', label: '失败' },
  unknown: { type: 'info', label: '未采集' }
}

const IPV4_RE = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

function emptyForm() {
  return { ac_id: null, ac_name: '', vendor: 'huawei', model: '', mgmt_ip: '', community: '' }
}

export default {
  name: 'WifiAcManage',

  data() {
    const checkIp = (rule, value, cb) => {
      if (!value) return cb(new Error('请输入管理 IP'))
      if (!IPV4_RE.test(value)) return cb(new Error('IP 格式不正确'))
      cb()
    }
    // 新增必填；编辑时留空表示沿用原团体字
    const checkCommunity = (rule, value, cb) => {
      if (!this.form.ac_id && !value) return cb(new Error('请输入 SNMP 团体字'))
      cb()
    }
    return {
      list: [],
      loading: false,
      testingId: null,
      collectingId: null,
      vendorOptions: VENDORS,
      dialogVisible: false,
      dialogTesting: false,
      saving: false,
      testResult: null,
      form: emptyForm(),
      rules: {
        ac_name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        vendor: [{ required: true, message: '请选择厂商', trigger: 'change' }],
        mgmt_ip: [{ required: true, validator: checkIp, trigger: 'blur' }],
        community: [{ validator: checkCommunity, trigger: 'blur' }]
      }
    }
  },

  created() {
    this.loadList()
  },

  methods: {
    errMsg(err, fallback) {
      return (err && err.message) || fallback
    },

    loadList() {
      this.loading = true
      wifiApi.getAcList().then(res => {
        this.list = res.list || []
        this.loading = false
      }).catch(err => {
        this.loading = false
        this.$message.error(this.errMsg(err, '加载 AC 列表失败'))
      })
    },

    vendorLabel(val) {
      const v = VENDORS.find(x => x.value === val)
      return v ? v.label : (val || '--')
    },

    statusOf(val) {
      return STATUS[val] || STATUS.unknown
    },

    /* ---------- 新增 / 编辑 ---------- */

    openDialog(row) {
      this.form = row
        ? {
            ac_id: row.ac_id,
            ac_name: row.ac_name,
            vendor: row.vendor,
            model: row.model,
            mgmt_ip: row.mgmt_ip,
            community: ''
          }
        : emptyForm()
      this.testResult = null
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },

    // 弹窗内测试：只需 IP 合法即可，不要求整张表单填完
    handleTestForm() {
      this.$refs.form.validateField('mgmt_ip', msg => {
        if (msg) return
        this.dialogTesting = true
        this.testResult = null
        wifiApi.testAc({ ...this.form }).then(res => {
          this.dialogTesting = false
          this.testResult = res
        }).catch(err => {
          this.dialogTesting = false
          this.testResult = { ok: false, message: this.errMsg(err, '连接失败') }
        })
      })
    },

    handleSave() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.saving = true
        wifiApi.saveAc({ ...this.form }).then(() => {
          this.saving = false
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.loadList()
        }).catch(err => {
          this.saving = false
          this.$message.error(this.errMsg(err, '保存失败'))
        })
      })
    },

    /* ---------- 行操作 ---------- */

    handleTestRow(row) {
      this.testingId = row.ac_id
      wifiApi.testAc(row).then(res => {
        this.testingId = null
        const h = this.$createElement
        this.$alert(h('div', { style: 'font-size:12px;line-height:1.8;word-break:break-all' }, [
          h('div', `耗时：${res.elapsed_ms} ms`),
          h('div', `sysName：${res.sysname || '--'}`),
          h('div', `sysDescr：${res.sysdescr || '--'}`)
        ]), `${row.ac_name} 连通正常`, { type: 'success' }).catch(() => {})
      }).catch(err => {
        this.testingId = null
        this.$message.error(this.errMsg(err, '连接失败'))
      })
    },

    handleCollect(row) {
      this.collectingId = row.ac_id
      wifiApi.collectAc(row.ac_id).then(res => {
        this.collectingId = null
        this.$message.success(`采集完成：${res.ap_count} 个 AP，耗时 ${res.elapsed_ms} ms`)
        this.loadList()
      }).catch(err => {
        this.collectingId = null
        this.$message.error(this.errMsg(err, '采集失败'))
        this.loadList()
      })
    },

    handleDelete(row) {
      this.$confirm(
        `删除 AC「${row.ac_name}」？其下 ${row.ap_count} 个 AP 及射频/SSID/终端数据会一并删除，并从地图上移除`,
        '提示',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
      ).then(() => wifiApi.deleteAc(row.ac_id)).then(() => {
        this.$message.success('已删除')
        this.loadList()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error(this.errMsg(err, '删除失败'))
      })
    }
  }
}
</script>

<style scoped>
.ac-manage {
  height: calc(100vh - 100px);
  padding: 10px;
  box-sizing: border-box;
  background: #f0f2f5;
}

.ac-manage__card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  box-sizing: border-box;
}

.ac-manage__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.ac-manage__title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
}

.ac-manage__tip {
  font-size: 12px;
  color: #909399;
}

.ac-manage__spacer {
  flex: 1;
}

.ac-manage__body {
  flex: 1;
  min-height: 0;
}

.mono {
  font-family: Menlo, Consolas, monospace;
}

.is-danger {
  color: #f56c6c;
}

.test-result {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.7;
}

.test-result.is-ok {
  background: #f0f9eb;
  color: #67c23a;
}

.test-result.is-fail {
  background: #fef0f0;
  color: #f56c6c;
}

.test-result__row {
  color: #606266;
  word-break: break-all;
}

.dialog-test {
  float: left;
}
</style>
