<template>
  <el-dialog
    :title="title"
    :visible="visible"
    width="720px"
    :close-on-click-modal="false"
    append-to-body
    @update:visible="$emit('update:visible', $event)">
    <div v-if="draft" class="entry-editor">
      <el-form :model="draft" label-width="96px" size="small">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="序号">
              <el-input-number v-model="draft.seq" :min="1" :max="99999" :step="10" controls-position="right" style="width:100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="动作">
              <el-select v-model="draft.action" style="width:100%;">
                <el-option label="permit" value="permit"></el-option>
                <el-option label="deny" value="deny"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="协议">
              <el-select v-model="draft.protocol" style="width:100%;">
                <el-option v-for="p in protocolOptions" :key="p" :label="p" :value="p"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">源</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="源地址" :error="errors.src">
              <el-select v-model="draft.src.type" style="width:100%;" @change="onAddrTypeChange(draft.src)">
                <el-option v-for="t in addrTypes" :key="t.value" :label="t.label" :value="t.value"></el-option>
              </el-select>
              <el-input
                v-if="draft.src.type === 'network' || draft.src.type === 'host'"
                v-model="draft.src.address"
                :placeholder="draft.src.type === 'host' ? '如 10.8.83.96' : '如 10.32.0.0/14'"
                style="margin-top:6px;">
                <template slot="prepend"><i class="el-icon-connection"></i></template>
              </el-input>
              <el-select
                v-if="draft.src.type === 'addrgroup'"
                v-model="draft.src.name"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择或输入地址组名"
                style="width:100%;margin-top:6px;">
                <el-option v-for="n in addrGroups" :key="n" :label="n" :value="n"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="源端口" :error="errors.src_port">
              <port-spec-editor v-model="draft.src_port" :protocol="draft.protocol" :group-names="portGroups"></port-spec-editor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">目的</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目的地址" :error="errors.dst">
              <el-select v-model="draft.dst.type" style="width:100%;" @change="onAddrTypeChange(draft.dst)">
                <el-option v-for="t in addrTypes" :key="t.value" :label="t.label" :value="t.value"></el-option>
              </el-select>
              <el-input
                v-if="draft.dst.type === 'network' || draft.dst.type === 'host'"
                v-model="draft.dst.address"
                :placeholder="draft.dst.type === 'host' ? '如 10.8.83.96' : '如 10.32.0.0/14'"
                style="margin-top:6px;">
                <template slot="prepend"><i class="el-icon-connection"></i></template>
              </el-input>
              <el-select
                v-if="draft.dst.type === 'addrgroup'"
                v-model="draft.dst.name"
                filterable
                allow-create
                default-first-option
                clearable
                placeholder="选择或输入地址组名"
                style="width:100%;margin-top:6px;">
                <el-option v-for="n in addrGroups" :key="n" :label="n" :value="n"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的端口" :error="errors.dst_port">
              <port-spec-editor v-model="draft.dst_port" :protocol="draft.protocol" :group-names="portGroups"></port-spec-editor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">选项</el-divider>
        <el-form-item label="规则选项">
          <el-checkbox
            v-model="draft.options.established"
            :disabled="draft.protocol !== 'tcp'">established</el-checkbox>
          <div class="option-hint">
            <span v-if="draft.protocol !== 'tcp'">仅 tcp 协议支持 established</span>
            <span v-else>仅匹配已建立连接的后续报文</span>
          </div>
        </el-form-item>
      </el-form>

      <div class="preview">
        <span class="preview-label">配置预览</span>
        <code class="preview-text">{{ preview }}</code>
      </div>
    </div>

    <span slot="footer">
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" @click="confirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import PortSpecEditor from "./PortSpecEditor.vue"
import { addrTypeOptions, addrSpecText, portSpecText, blankAddr, protocolSupportsPort } from "@/view/pages/policy_manage/utils/spec_format"

export default {
  name: "EntryEditorDialog",
  components: { PortSpecEditor },
  props: {
    visible: { type: Boolean, default: false },
    entry: { type: Object, default: null },
    // "create" | "edit" | "view"
    mode: { type: String, default: "create" },
    // 可选组名清单，用于下拉选择（仍允许手工输入未登记的组名）
    addrGroups: { type: Array, default: () => [] },
    portGroups: { type: Array, default: () => [] }
  },
  data() {
    return {
      protocolOptions: ["ip", "tcp", "udp"],
      addrTypes: addrTypeOptions,
      draft: null,
      errors: {}
    }
  },
  computed: {
    title() {
      const map = { create: "添加规则条目", edit: "编辑规则条目", view: "查看规则条目" }
      return map[this.mode] || "规则条目"
    },
    preview() {
      if (!this.draft) return ""
      const d = this.draft
      // 顺序遵循设计文档 1.6.1：seq action protocol <src> [src_port] <dst> [dst_port] [options]
      // 端口紧跟各自地址之后，为 null 时整个位置省略
      const parts = [
        d.seq,
        d.action,
        d.protocol,
        addrSpecText(d.src),
        portSpecText(d.src_port),
        addrSpecText(d.dst),
        portSpecText(d.dst_port)
      ]
      if (d.options && d.options.established) parts.push("established")
      return parts.filter(v => v !== "" && v !== null && v !== undefined).join(" ")
    }
  },
  watch: {
    visible(val) {
      if (val) this.reset()
    },
    "draft.protocol"(val) {
      if (val !== "tcp" && this.draft) this.draft.options.established = false
    }
  },
  methods: {
    reset() {
      const src = this.entry || {}
      this.errors = {}
      this.draft = {
        seq: src.seq || 10,
        action: src.action || "permit",
        protocol: src.protocol || "ip",
        src: cloneAddr(src.src),
        src_port: clonePort(src.src_port),
        dst: cloneAddr(src.dst),
        dst_port: clonePort(src.dst_port),
        options: { ...(src.options || {}) }
      }
    },
    onAddrTypeChange(spec) {
      spec.address = ""
      spec.name = ""
      this.$set(this.errors, spec === this.draft.src ? "src" : "dst", "")
    },
    close() {
      this.$emit("update:visible", false)
    },
    validate() {
      const e = {}
      const d = this.draft
      ;["src", "dst"].forEach(key => {
        const spec = d[key]
        if (spec.type === "network" && !spec.address) {
          e[key] = "请输入网段，如 10.32.0.0/14"
        } else if (spec.type === "host" && !spec.address) {
          e[key] = "请输入主机地址，如 10.8.83.96"
        } else if (spec.type === "addrgroup" && !spec.name) {
          e[key] = "请输入地址组名"
        }
      })
      ;["src_port", "dst_port"].forEach(key => {
        const spec = d[key]
        if (!spec) return
        // 协议不支持端口时编辑器是禁用的，此时不应因残留 spec 卡住保存
        if (!protocolSupportsPort(d.protocol)) return
        if (spec.type === "portgroup" && !spec.name) {
          e[key] = "请输入端口组名"
        } else if (spec.type === "direct") {
          if (!spec.ports || spec.ports.length === 0 || spec.ports.every(p => p === "" || p === null)) {
            e[key] = "请输入端口"
          }
        }
      })
      this.errors = e
      return Object.keys(e).length === 0
    },
    confirm() {
      if (this.mode === "view") return this.close()
      if (!this.validate()) {
        this.$message.warning("请完善条目配置")
        return
      }
      this.$emit("save", {
        seq: Number(this.draft.seq) || 10,
        action: this.draft.action,
        protocol: this.draft.protocol,
        src: cleanAddr(this.draft.src),
        src_port: cleanPort(this.draft.src_port, this.draft.protocol),
        dst: cleanAddr(this.draft.dst),
        dst_port: cleanPort(this.draft.dst_port, this.draft.protocol),
        options: cleanOptions(this.draft.options)
      })
      this.close()
    }
  }
}

// address / name 两个键始终存在，否则切换类型时新增属性不响应式，v-model 写不进去
function cloneAddr(spec) {
  if (!spec) return { type: "any", address: "", name: "" }
  if (spec.type === "any") return { type: "any", address: "", name: "" }
  if (spec.type === "addrgroup") return { type: "addrgroup", address: "", name: spec.name || "" }
  return { type: spec.type, address: spec.address || "", name: "" }
}

function clonePort(spec) {
  if (!spec) return null
  if (spec.type === "portgroup") return { type: "portgroup", name: spec.name || "" }
  if (spec.type === "direct") {
    return { type: "direct", op: spec.op || "eq", ports: (spec.ports || []).slice() }
  }
  return null
}

// 去掉空字段，保持设计文档的「键始终存在」约定
function cleanAddr(spec) {
  if (spec.type === "any") return { type: "any" }
  if (spec.type === "addrgroup") return { type: "addrgroup", name: spec.name }
  const address = String(spec.address || "").trim()
  if (spec.type === "host" && address && !address.includes("/")) {
    return { type: "host", address: address + "/32" }
  }
  return { type: spec.type, address }
}

function cleanPort(spec, protocol) {
  if (!spec) return null
  if (!protocolSupportsPort(protocol)) return null
  if (spec.type === "portgroup") {
    if (!spec.name) return null
    return { type: "portgroup", name: spec.name }
  }
  if (spec.type === "direct") {
    const ports = (spec.ports || [])
      .filter(p => p !== "" && p !== null && p !== undefined)
      .map(p => (typeof p === "string" && /^\d+$/.test(p.trim()) ? Number(p.trim()) : p))
    if (ports.length === 0) return null
    return { type: "direct", op: spec.op, ports }
  }
  return null
}

function cleanOptions(options) {
  const out = {}
  Object.keys(options || {}).forEach(k => {
    if (options[k]) out[k] = true
  })
  return out
}
</script>

<style scoped>
.entry-editor { max-height: 62vh; overflow-y: auto; padding-right: 4px; }
.option-hint { color: #909399; font-size: 12px; line-height: 18px; }
.preview {
  margin-top: 8px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.preview-label { color: #909399; font-size: 12px; margin-right: 8px; }
.preview-text { font-family: 'Courier New', monospace; font-size: 13px; color: #303133; word-break: break-all; }
</style>
