<template>
  <div class="port-spec-editor">
    <el-radio-group v-model="mode" size="mini" @change="onModeChange" :disabled="!portEnabled">
      <el-radio-button label="none">不限</el-radio-button>
      <el-radio-button label="direct">端口</el-radio-button>
      <el-radio-button label="portgroup">端口组</el-radio-button>
    </el-radio-group>

    <div v-if="!portEnabled" class="port-disabled-hint">
      协议 {{ protocol }} 不支持端口配置
    </div>

    <div v-else-if="mode === 'direct'" class="direct-block">
      <el-select v-model="op" size="mini" style="width:96px;" @change="onOpChange">
        <el-option v-for="o in opOptions" :key="o" :label="o" :value="o"></el-option>
      </el-select>

      <template v-if="op === 'range'">
        <el-input :value="ports[0]" size="mini" placeholder="起" style="width:88px;margin-left:6px;"
          @input="onRangeInput(0, $event)"></el-input>
        <span class="range-sep">-</span>
        <el-input :value="ports[1]" size="mini" placeholder="止" style="width:88px;"
          @input="onRangeInput(1, $event)"></el-input>
      </template>

      <template v-else>
        <el-tag
          v-for="(p, idx) in ports"
          :key="idx"
          closable
          size="mini"
          style="margin-left:6px;"
          @close="removePort(idx)">{{ p }}</el-tag>
        <el-input
          v-model="portInput"
          size="mini"
          placeholder="端口或服务名"
          style="width:130px;margin-left:6px;"
          @keyup.enter.native="addPort"
          @blur="addPort">
          <el-button slot="append" icon="el-icon-plus" @click="addPort"></el-button>
        </el-input>
      </template>
    </div>

    <div v-else-if="mode === 'portgroup'" class="direct-block">
      <el-select v-model="groupName" size="mini" filterable allow-create default-first-option clearable
        placeholder="选择或输入端口组名，如 og_port_web" style="width:100%;" @change="emit">
        <el-option v-for="n in groupNames" :key="n" :label="n" :value="n"></el-option>
      </el-select>
    </div>

    <div class="port-hint">{{ hintText }}</div>
  </div>
</template>

<script>
import { PORT_OP_OPTIONS, protocolSupportsPort } from "@/view/pages/policy_manage/utils/spec_format"

export default {
  name: "PortSpecEditor",
  props: {
    value: { type: Object, default: null },
    protocol: { type: String, default: "ip" },
    groupNames: { type: Array, default: () => [] }
  },
  data() {
    return {
      mode: "none",
      op: "eq",
      ports: [],
      portInput: "",
      groupName: ""
    }
  },
  computed: {
    portEnabled() {
      return protocolSupportsPort(this.protocol)
    },
    opOptions() {
      return PORT_OP_OPTIONS
    },
    // 多端口仅 eq 支持（设计文档 1.6.3：eq 可多值，其余恒为 1 个元素）
    hintText() {
      if (!this.portEnabled) return ""
      if (this.mode === "none") return "不限制端口"
      if (this.mode === "portgroup") return "引用已定义的端口组"
      if (this.op === "range") return "range 需填写起始与结束端口"
      if (this.op === "eq") return "可添加多个端口，回车确认"
      return `${this.op} 仅支持单个端口`
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(val) { this.fromValue(val) }
    },
    protocol() {
      if (!this.portEnabled) {
        this.mode = "none"
        this.emit()
      }
    }
  },
  methods: {
    fromValue(val) {
      if (!val) {
        this.mode = "none"
        this.op = "eq"
        this.ports = []
        this.portInput = ""
        this.groupName = ""
        return
      }
      if (val.type === "portgroup") {
        this.mode = "portgroup"
        this.groupName = val.name || ""
        return
      }
      if (val.type === "direct") {
        this.mode = "direct"
        this.op = val.op || "eq"
        this.ports = (val.ports || []).slice()
        return
      }
      this.mode = "none"
    },
    onModeChange() {
      this.portInput = ""
      this.emit()
    },
    onOpChange() {
      if (this.op === "range") {
        this.ports = [this.ports[0] || "", this.ports[1] || ""]
      } else if (this.ports.length > 1) {
        this.ports = this.ports.slice(0, 1)
      }
      this.emit()
    },
    onRangeInput(idx, val) {
      const ports = (this.ports || []).slice()
      ports[idx] = val
      this.ports = ports
      this.emit()
    },
    addPort() {
      const raw = String(this.portInput || "").trim()
      if (!raw) return
      const val = /^\d+$/.test(raw) ? Number(raw) : raw
      if (this.op === "eq") {
        if (!this.ports.includes(val)) this.ports.push(val)
      } else {
        this.ports = [val]
      }
      this.portInput = ""
      this.emit()
    },
    removePort(idx) {
      this.ports.splice(idx, 1)
      this.emit()
    },
    emit() {
      if (!this.portEnabled || this.mode === "none") {
        this.$emit("input", null)
        return
      }
      if (this.mode === "portgroup") {
        this.$emit("input", { type: "portgroup", name: this.groupName })
        return
      }
      const ports = this.ports.filter(p => p !== "" && p !== null && p !== undefined)
      if (ports.length === 0) {
        this.$emit("input", { type: "direct", op: this.op, ports: [] })
        return
      }
      this.$emit("input", { type: "direct", op: this.op, ports })
    }
  }
}
</script>

<style scoped>
.port-spec-editor { width: 100%; }
.direct-block { margin-top: 8px; display: flex; align-items: center; flex-wrap: wrap; }
.range-sep { margin: 0 4px; color: #909399; }
.port-hint { color: #909399; font-size: 12px; margin-top: 4px; }
.port-disabled-hint { color: #C0C4CC; font-size: 12px; margin-top: 8px; }
</style>
