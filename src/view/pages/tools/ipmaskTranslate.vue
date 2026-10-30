<!--网工工具：IP 掩码转换-->
<template>
  <div class="ipm-page">
    <!-- 标题栏 -->
    <div class="ipm-header">
      <div class="ipm-title">
        <i class="el-icon-connection"></i>IP 掩码转换
        <span class="ipm-subtitle">每行一个地址，支持 /24、空格 24、255.255.255.0、反掩码 0.0.0.255 等写法，自动归一到网络地址</span>
      </div>
    </div>

    <!-- 输出格式 -->
    <div class="ipm-filter">
      <span class="filter-label">输出格式</span>
      <el-radio-group v-model="mode" size="small" @change="tranAddress">
        <el-radio-button v-for="m in modes" :key="m.value" :label="m.value">{{ m.label }}</el-radio-button>
      </el-radio-group>
      <el-checkbox v-model="dedupe" @change="tranAddress">结果去重</el-checkbox>
      <span v-if="currentMode.sample" class="form-tip">示例：<span class="mono">{{ currentMode.sample }}</span></span>
    </div>

    <div class="ipm-body">
      <!-- 输入 -->
      <div class="ipm-panel ipm-left">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-edit-outline"></i>IP 地址</span>
          <span class="panel-actions">
            <el-button type="text" size="mini" icon="el-icon-magic-stick" @click="fillExample">示例</el-button>
            <el-button type="text" size="mini" icon="el-icon-delete" :disabled="!ip_input" @click="clearInput">清空</el-button>
          </span>
        </div>
        <el-input
          v-model="ip_input"
          type="textarea"
          class="ipm-textarea mono-input"
          resize="none"
          :placeholder="placeholder"
          @input="onInput">
        </el-input>
        <div class="panel-foot">
          <span>有效 {{ results.length }} 行</span>
          <el-popover v-if="errors.length" placement="top-start" width="360" trigger="hover">
            <div class="err-list">
              <div v-for="(e, idx) in errors" :key="idx" class="err-item">
                <span class="err-line">第 {{ e.line }} 行</span>
                <span class="mono">{{ e.text }}</span>
                <span class="err-msg">{{ e.msg }}</span>
              </div>
            </div>
            <span slot="reference" class="foot-error"><i class="el-icon-warning-outline"></i>{{ errors.length }} 行无法解析，已跳过</span>
          </el-popover>
        </div>
      </div>

      <!-- 结果 -->
      <div class="ipm-panel ipm-right">
        <div class="panel-head">
          <span class="panel-title"><i class="el-icon-finished"></i>转换结果</span>
          <span class="panel-actions">
            <span v-if="outputLines.length" class="meta-chip">{{ outputLines.length }} 条</span>
            <el-button size="mini" icon="el-icon-document-copy" :disabled="!ret_output" @click="copyText(ret_output)">复制</el-button>
          </span>
        </div>

        <div v-if="mode === '6'" key="detail" class="table-wrap">
          <el-table
            :data="detailRows"
            size="small"
            stripe
            border
            height="100%"
            class="ipm-table">
            <template slot="empty">
              <el-empty :image-size="80" description="在左侧输入 IP 地址后自动计算"></el-empty>
            </template>
            <el-table-column prop="cidr" label="网段" min-width="150" fixed>
              <template slot-scope="scope">
                <span class="mono strong">{{ scope.row.cidr }}</span>
                <i class="el-icon-document-copy copy-btn" title="复制" @click="copyText(scope.row.cidr)"></i>
              </template>
            </el-table-column>
            <el-table-column prop="mask" label="掩码" min-width="130">
              <template slot-scope="scope"><span class="mono">{{ scope.row.mask }}</span></template>
            </el-table-column>
            <el-table-column prop="wildcard" label="反掩码" min-width="120">
              <template slot-scope="scope"><span class="mono">{{ scope.row.wildcard }}</span></template>
            </el-table-column>
            <el-table-column label="可用地址" min-width="220">
              <template slot-scope="scope">
                <span class="mono">{{ scope.row.usable }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="broadcast" label="广播地址" min-width="120">
              <template slot-scope="scope">
                <span v-if="scope.row.broadcast" class="mono">{{ scope.row.broadcast }}</span>
                <span v-else class="empty-text">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="hosts" label="可用数" width="100" align="right">
              <template slot-scope="scope"><span class="mono">{{ scope.row.hostsText }}</span></template>
            </el-table-column>
            <el-table-column prop="raw" label="原始输入" min-width="150" show-overflow-tooltip>
              <template slot-scope="scope"><span class="mono sub-text">{{ scope.row.raw }}</span></template>
            </el-table-column>
          </el-table>
        </div>
        <el-input
          v-else
          key="text"
          :value="ret_output"
          type="textarea"
          class="ipm-textarea mono-input"
          resize="none"
          placeholder="在左侧输入 IP 地址后自动转换"
          readonly>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script>
  const MODES = [
    { value: '1', label: '前缀 /24', sample: '10.0.1.0/24' },
    { value: '2', label: '前缀 空格 24', sample: '10.0.1.0 24' },
    { value: '3', label: '掩码 255.255', sample: '10.0.1.0 255.255.255.0' },
    { value: '4', label: '反掩码', sample: '10.0.1.0 0.0.0.255' },
    { value: '5', label: '地址范围', sample: '10.0.1.0-10.0.1.255' },
    { value: '6', label: '详细信息', sample: '' },
  ]

  const EXAMPLE = [
    '10.0.1.15/24',
    '192.168.10.7 255.255.255.128',
    '172.16.5.9 20',
    '10.20.30.40 0.0.0.63',
    '100.64.0.1/31',
    '8.8.8.8',
  ].join('\n')

  const IP_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

  function ipToInt (str) {
    const m = IP_RE.exec(str)
    if (!m) return -1
    for (let i = 1; i <= 4; i++) {
      if (parseInt(m[i], 10) > 255) return -1
    }
    return ((parseInt(m[1], 10) << 24) | (parseInt(m[2], 10) << 16) | (parseInt(m[3], 10) << 8) | parseInt(m[4], 10)) >>> 0
  }

  function intToIp (n) {
    return (n >>> 24) + '.' + ((n >>> 16) & 0xFF) + '.' + ((n >>> 8) & 0xFF) + '.' + (n & 0xFF)
  }

  function lenToMask (len) {
    return len === 0 ? 0 : (0xFFFFFFFF << (32 - len)) >>> 0
  }

  // 低位连续全 1（如 0.0.0.255）
  function isLowOnes (n) {
    return ((n + 1) & n) === 0 || n === 0xFFFFFFFF
  }

  function bitCount (n) {
    let c = 0
    while (n) {
      c += n & 1
      n = n >>> 1
    }
    return c
  }

  // 解析一行，返回 { ip, len } 或 { error }
  function parseLine (line) {
    const parts = line.trim().split(/[\s\/]+/)
    const ip = ipToInt(parts[0])
    if (ip < 0) return { error: 'IP 地址不合法' }

    const maskStr = parts[1]
    // 只写了 IP 按主机地址 /32 处理
    if (maskStr === undefined || maskStr === '') return { ip: ip, len: 32 }

    if (/^\d{1,2}$/.test(maskStr)) {
      const len = parseInt(maskStr, 10)
      if (len > 32) return { error: '前缀长度超出 0-32' }
      return { ip: ip, len: len }
    }

    const m = ipToInt(maskStr)
    if (m < 0) return { error: '掩码不合法' }
    // 掩码：高位连续 1；反掩码：低位连续 1；0.0.0.0 按掩码 /0 处理
    if (isLowOnes((~m) >>> 0)) return { ip: ip, len: bitCount(m) }
    if (isLowOnes(m)) return { ip: ip, len: 32 - bitCount(m) }
    return { error: '掩码不连续' }
  }

  export default {
    data () {
      return {
        ip_input: '',
        mode: '1',
        modes: MODES,
        dedupe: false,
        results: [],
        errors: [],
        timer: null,
        placeholder: '每行一个，例如：\n\n10.0.1.15/24\n192.168.10.7 255.255.255.128\n172.16.5.9 20\n10.20.30.40 0.0.0.63'
      }
    },
    computed: {
      currentMode () {
        return MODES.filter(m => m.value === this.mode)[0] || MODES[0]
      },
      detailRows () {
        const seen = {}
        const rows = []
        this.results.forEach(r => {
          if (this.dedupe) {
            if (seen[r.cidr]) return
            seen[r.cidr] = 1
          }
          rows.push(r)
        })
        return rows
      },
      outputLines () {
        if (this.mode === '6') {
          return this.detailRows.map(r => [r.cidr, r.mask, r.wildcard, r.usable, r.broadcast || '-', r.hostsText].join('\t'))
        }
        const seen = {}
        const lines = []
        this.results.forEach(r => {
          let s
          if (this.mode === '2') s = r.network + ' ' + r.len
          else if (this.mode === '3') s = r.network + ' ' + r.mask
          else if (this.mode === '4') s = r.network + ' ' + r.wildcard
          else if (this.mode === '5') s = r.network + '-' + r.last
          else s = r.cidr
          if (this.dedupe) {
            if (seen[s]) return
            seen[s] = 1
          }
          lines.push(s)
        })
        return lines
      },
      ret_output () {
        if (!this.outputLines.length) return ''
        if (this.mode === '6') {
          return ['网段', '掩码', '反掩码', '可用地址', '广播地址', '可用数'].join('\t') + '\n' + this.outputLines.join('\n')
        }
        return this.outputLines.join('\n')
      }
    },
    beforeDestroy () {
      clearTimeout(this.timer)
    },
    methods: {
      onInput () {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.tranAddress, 300)
      },
      tranAddress () {
        clearTimeout(this.timer)
        const results = []
        const errors = []
        this.ip_input.split('\n').forEach((line, idx) => {
          if (/^\s*$/.test(line)) return
          const p = parseLine(line)
          if (p.error) {
            errors.push({ line: idx + 1, text: line.trim(), msg: p.error })
            return
          }
          const mask = lenToMask(p.len)
          const wildcard = (~mask) >>> 0
          const network = (p.ip & mask) >>> 0
          const last = (network | wildcard) >>> 0
          const size = Math.pow(2, 32 - p.len)

          let usable, broadcast, hosts
          if (p.len === 32) {
            usable = intToIp(network)
            broadcast = ''
            hosts = 1
          } else if (p.len === 31) {
            usable = intToIp(network) + ' - ' + intToIp(last)
            broadcast = ''
            hosts = 2
          } else {
            usable = intToIp(network + 1) + ' - ' + intToIp(last - 1)
            broadcast = intToIp(last)
            hosts = size - 2
          }

          results.push({
            raw: line.trim(),
            len: p.len,
            network: intToIp(network),
            cidr: intToIp(network) + '/' + p.len,
            mask: intToIp(mask),
            wildcard: intToIp(wildcard),
            last: intToIp(last),
            usable: usable,
            broadcast: broadcast,
            hosts: hosts,
            hostsText: String(hosts).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          })
        })
        this.results = results
        this.errors = errors
      },
      fillExample () {
        this.ip_input = EXAMPLE
        this.tranAddress()
      },
      clearInput () {
        this.ip_input = ''
        this.tranAddress()
      },
      copyText (text) {
        if (!text) return
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
          this.$message.success('已复制')
        } catch (e) {
          this.$message.error('复制失败')
        }
        document.body.removeChild(ta)
      },
    },
  };
</script>

<style scoped>
.ipm-page {
  color: #303133;
}
.mono {
  font-family: Menlo, Consolas, "Courier New", monospace;
}
.mono-input /deep/ textarea {
  font-family: Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.strong {
  font-weight: 600;
}
.empty-text {
  color: #c0c4cc;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}
.form-tip {
  font-size: 12px;
  color: #909399;
}

/* 标题栏 */
.ipm-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ipm-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.ipm-title > i {
  margin-right: 8px;
  font-size: 18px;
  color: #409eff;
}
.ipm-subtitle {
  margin-left: 12px;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* 输出格式 */
.ipm-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px 4px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafbfc;
}
.ipm-filter > * {
  margin: 0 10px 8px 0;
}
.filter-label {
  font-size: 13px;
  color: #606266;
}
.ipm-filter .el-checkbox {
  margin-left: 6px;
}

/* 左右两栏 */
.ipm-body {
  display: flex;
  height: calc(100vh - 290px);
  min-height: 420px;
}
.ipm-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}
.ipm-left {
  flex: 0 0 36%;
  max-width: 480px;
  margin-right: 12px;
}
.ipm-right {
  flex: 1;
}
.panel-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
}
.panel-title i {
  margin-right: 6px;
  color: #409eff;
}
.panel-actions {
  display: flex;
  align-items: center;
}
.panel-actions .el-button {
  margin-left: 10px;
}
.meta-chip {
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 10px;
  color: #409eff;
  background: #ecf5ff;
  white-space: nowrap;
}
.ipm-textarea {
  flex: 1;
  min-height: 0;
}
.ipm-textarea /deep/ textarea {
  height: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 0;
}
.panel-foot {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  padding: 4px 12px;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
}
.foot-error {
  color: #e6a23c;
  cursor: default;
}
.foot-error i {
  margin-right: 4px;
}
.err-list {
  max-height: 240px;
  overflow: auto;
}
.err-item {
  display: flex;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}
.err-line {
  flex-shrink: 0;
  width: 60px;
  color: #909399;
}
.err-item .mono {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.err-msg {
  flex-shrink: 0;
  margin-left: 8px;
  color: #f56c6c;
}

/* 详细信息表格撑满剩余高度 */
.table-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}
.ipm-table {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.ipm-table /deep/ th {
  color: #606266;
  background-color: #f5f7fa !important;
}
.copy-btn {
  margin-left: 6px;
  color: #c0c4cc;
  cursor: pointer;
  visibility: hidden;
}
.ipm-table /deep/ tr:hover .copy-btn {
  visibility: visible;
}
.copy-btn:hover {
  color: #409eff;
}
</style>
