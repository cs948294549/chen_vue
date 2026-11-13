/**
 * 看板公用格式化与计算
 * 只放纯函数，方便两个看板共用同一套口径文案
 */

// 带宽统一用 Gbps 展示，1G 以下退到 Mbps
export function formatBandwidth (gbps) {
  const v = Number(gbps) || 0
  if (v >= 1) return v.toFixed(v >= 10 ? 1 : 2) + 'G'
  return Math.round(v * 1000) + 'M'
}

export function formatPercent (v, digits) {
  const n = Number(v) || 0
  return n.toFixed(digits === undefined ? 1 : digits) + '%'
}

// 秒 → 12m / 3h20m / 2d4h
export function formatDuration (seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? h + 'h' + (m % 60) + 'm' : h + 'h'
  const d = Math.floor(h / 24)
  return h % 24 ? d + 'd' + (h % 24) + 'h' : d + 'd'
}

export function formatClock (ts) {
  const d = ts instanceof Date ? ts : new Date(ts)
  const p = n => (n < 10 ? '0' + n : '' + n)
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

export function formatDate (ts) {
  const d = ts instanceof Date ? ts : new Date(ts)
  const p = n => (n < 10 ? '0' + n : '' + n)
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

/**
 * 口径文案统一放在这里，两个看板引用同一份，
 * 避免一个人说 65% 一个人说 78% 最后发现是实时值和月峰值。
 */
export const CALIBER = {
  egressRealtime: '实时利用率 = 当前出方向带宽 ÷ 合同带宽（Zabbix，1 分钟采样）',
  egress95: '95 峰值利用率 = 本月 95 峰值 ÷ 合同带宽（Cacti，计费权威口径）',
  availability: '可用性达成率，统计口径不含计划内变更维护窗口（Zabbix SLA）',
  problemCount: '当前未恢复问题数，来自 Zabbix problem.get，按触发器优先级分级',
  coverage: '纳管设备数 ÷ CMDB 在管设备总数，缺口含未纳管与采集中断两类',
  bizCount: '网络承载的业务系统数，按 CMDB 产品线去重统计',
  outage: '故障影响时长 = 各 P1/P2 故障从触发到恢复的时长合计，不含计划内变更窗口',
  change: '变更次数来自平台变更工单，成功 = 按计划完成且未触发回滚',
  cost: '云平台月度账单合计（腾讯云 + 火山云），不含 IDC 机柜与带宽年付',
  forecast: '按近 30 天 95 峰值线性回归推算，为趋势参考，不构成容量承诺'
}
