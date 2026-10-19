/*
 * ACL 规则条目的 AddressSpec / PortSpec 文本化与选项表
 * 字段定义见 docs/acl_policy_management_design.md 第 1.5 节
 */

// 地址位置可选类型（range 只在地址组条目里出现，不在此处）
export const addrTypeOptions = [
  { value: "any", label: "any（任意）" },
  { value: "network", label: "网段（CIDR）" },
  { value: "host", label: "主机（/32）" },
  { value: "addrgroup", label: "地址组" }
]

// 端口运算符，对应设计文档 1.6.3
export const PORT_OP_OPTIONS = ["eq", "gt", "lt", "neq", "range"]

// 端口运算符与参数个数固定对应
export const PORT_OP_ARITY = { eq: 1, gt: 1, lt: 1, neq: 1, range: 2 }

// 协议端口能力表，对应设计文档 1.6.2
const PORT_CAPABLE = ["tcp", "udp"]

export function protocolSupportsPort(protocol) {
  return PORT_CAPABLE.indexOf(protocol) !== -1
}

export function blankAddr() {
  return { type: "any" }
}

export function blankPort() {
  return { type: "direct", op: "eq", ports: [] }
}

export function blankEntry(seq) {
  return {
    seq: seq || 10,
    action: "permit",
    protocol: "ip",
    src: { type: "any" },
    src_port: null,
    dst: { type: "any" },
    dst_port: null,
    options: {}
  }
}

// AddressSpec -> 展示文本
export function addrSpecText(spec) {
  if (!spec) return "any"
  if (spec.type === "any") return "any"
  if (spec.type === "addrgroup") return spec.name ? `addrgroup ${spec.name}` : "addrgroup -"
  return spec.address || "-"
}

// PortSpec -> 展示文本；不限端口返回空串
export function portSpecText(spec) {
  if (!spec) return ""
  if (spec.type === "portgroup") return spec.name ? `portgroup ${spec.name}` : "portgroup -"
  if (spec.type === "direct") {
    const ports = (spec.ports || []).join(spec.op === "range" ? " " : " ")
    return `${spec.op} ${ports}`.trim()
  }
  return ""
}

// 端口值可能是 int（数字端口）或 string（服务名别名），统一转文本
export function portValueText(v) {
  return v === null || v === undefined ? "" : String(v)
}

export function formatTimestamp(ts) {
  if (!ts) return "-"
  const time = String(ts).length === 10 ? Number(ts) * 1000 : Number(ts)
  const d = new Date(time)
  const p = n => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
