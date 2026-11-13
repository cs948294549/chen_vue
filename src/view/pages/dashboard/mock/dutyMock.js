/**
 * 值班看板 mock 数据
 *
 * 字段结构刻意照着后续真实接口来设计：
 *   Zabbix problem.get → problems
 *   Zabbix net.if.*    → egress
 *   ElastiFlow         → topTalkers
 *   host.get + CMDB    → coverage / devices
 * 接真数据时只需要把 export 的 mock 换成 API 返回，字段不用动。
 */

// 出口分组：沿用 func_flow.py 里的四组
export const egressGroups = [
  {
    group: '博兴出口',
    dc: 'DC07',
    lines: ['pcs1_dc07_m01 Ethernet1/47', 'pcs2_dc07_m01 Ethernet1/47'],
    contractGbps: 6.5,
    currentGbps: 4.21,
    p95Gbps: 4.05,
    quotaGbps: 6.0,
    trend: [3.1, 3.4, 3.0, 3.6, 4.0, 3.8, 4.2, 4.4, 4.1, 3.9, 4.3, 4.21]
  },
  {
    group: '博兴入口',
    dc: 'DC07',
    lines: ['pcs1_dc07_m01 Ethernet1/47', 'pcs2_dc07_m01 Ethernet1/47'],
    contractGbps: 5.0,
    currentGbps: 2.1,
    p95Gbps: 2.62,
    quotaGbps: 4.5,
    trend: [1.8, 1.9, 2.2, 2.0, 2.4, 2.3, 2.1, 1.9, 2.2, 2.0, 2.1, 2.1]
  },
  {
    group: 'M5机房出口',
    dc: 'DC09',
    lines: ['dc09_fw1 出方向接口', 'dc09_fw2 出方向接口'],
    contractGbps: 4.0,
    currentGbps: 1.12,
    p95Gbps: 1.48,
    quotaGbps: 3.6,
    trend: [0.9, 1.0, 0.8, 1.1, 1.2, 1.0, 1.3, 1.1, 1.0, 1.2, 1.1, 1.12]
  },
  {
    group: 'M5机房入口',
    dc: 'DC09',
    lines: ['dc09_fw1 出方向接口', 'dc09_fw2 出方向接口'],
    contractGbps: 4.0,
    currentGbps: 2.04,
    p95Gbps: 2.31,
    quotaGbps: 3.6,
    trend: [1.7, 1.9, 2.0, 1.8, 2.1, 2.2, 2.0, 2.3, 2.1, 1.9, 2.0, 2.04]
  }
]

// 机房水位矩阵（DC01~DC19，取有业务的机房）
export const dataCenters = [
  { code: 'DC01', city: '北京', util: 48, problems: 0 },
  { code: 'DC02', city: '北京', util: 36, problems: 1 },
  { code: 'DC03', city: '博兴支付', util: 61, problems: 0 },
  { code: 'DC05', city: '顺义', util: 55, problems: 2 },
  { code: 'DC06', city: '上海', util: 43, problems: 0 },
  { code: 'DC07', city: '博兴', util: 72, problems: 3 },
  { code: 'DC08', city: '深圳', util: 39, problems: 0 },
  { code: 'DC09', city: 'M5', util: 58, problems: 1 },
  { code: 'DC19', city: '怀来', util: 66, problems: 4 }
]

// 当前未恢复问题（对应 problem.get）
// clock 用相对分钟数，组件里渲染成"持续 12m"
export const problems = [
  {
    eventid: '10241',
    severity: 5,
    name: 'Vlan100 接口 down',
    host: 'dc07-csw1',
    ip: '10.20.7.1',
    clock: 12,
    acknowledged: false,
    object: 'net.if.status[Vlan100]'
  },
  {
    eventid: '10239',
    severity: 4,
    name: 'EBGP 邻居 10.35.201.9 建立失败',
    host: 'pcs1_dc07_m01',
    ip: '10.35.7.1',
    clock: 26,
    acknowledged: false,
    object: 'bgp.peer.state[10.35.201.9]'
  },
  {
    eventid: '10233',
    severity: 3,
    name: '光模块接收功率过低 (-19.4 dBm)',
    host: 'pcs2_dc09_m01',
    ip: '10.35.9.2',
    clock: 41,
    acknowledged: true,
    object: 'dom.rx.power[Ethernet1/47]'
  },
  {
    eventid: '10230',
    severity: 3,
    name: 'CPU 使用率持续高于 90%',
    host: 'dc19-dsw2',
    ip: '10.20.19.12',
    clock: 67,
    acknowledged: true,
    object: 'system.cpu.util'
  },
  {
    eventid: '10228',
    severity: 2,
    name: '接口错包率超阈值 (Gi0/12 0.42%)',
    host: 'dc05-csw2',
    ip: '10.20.5.2',
    clock: 95,
    acknowledged: true,
    object: 'net.if.errors[Gi0/12]'
  },
  {
    eventid: '10225',
    severity: 2,
    name: 'TCAM 使用率 78%，接近预警线',
    host: 'dc07-csw2',
    ip: '10.20.7.2',
    clock: 133,
    acknowledged: true,
    object: 'tcam.util.acl'
  },
  {
    eventid: '10221',
    severity: 2,
    name: '出口带宽利用率连续 10 分钟超 80%',
    host: 'pcs1_dc07_m01',
    ip: '10.35.7.1',
    clock: 168,
    acknowledged: true,
    object: 'net.if.out.util[Ethernet1/47]'
  },
  {
    eventid: '10219',
    severity: 1,
    name: '设备配置近 24 小时发生变更',
    host: 'dc09-dsw1',
    ip: '10.20.9.1',
    clock: 214,
    acknowledged: true,
    object: 'config.diff'
  },
  {
    eventid: '10214',
    severity: 1,
    name: 'SNMP 采集两次超时',
    host: 'rsw1_corp_wf_m1_11',
    ip: '10.60.31.11',
    clock: 302,
    acknowledged: true,
    object: 'zabbix.agent.ping'
  },
  {
    eventid: '10208',
    severity: 1,
    name: '电源模块 PSU2 状态 unknown',
    host: 'dc02-rsw3',
    ip: '10.20.2.33',
    clock: 421,
    acknowledged: true,
    object: 'power.supply[2]'
  }
]

// L3 大流量 Top N（ElastiFlow，5 分钟窗口，带业务归属与环比）
export const topTalkers = [
  { ip: '10.41.22.37', owner: '视频转码-生产', biz: '视频', gbps: 1.24, delta: 38 },
  { ip: '10.41.108.5', owner: 'CDN 回源', biz: 'CDN', gbps: 0.88, delta: 6 },
  { ip: '10.32.5.91', owner: '大数据离线集群', biz: '数据', gbps: 0.62, delta: -4 },
  { ip: '10.41.77.14', owner: '图片处理-worker', biz: '电商', gbps: 0.47, delta: 71 },
  { ip: '10.28.90.3', owner: '日志采集-ES', biz: '基础', gbps: 0.31, delta: 2 }
]

// 设备与链路健康
export const health = {
  online: 812,
  managed: 818,
  total: 826,
  collecting: 806,
  cpuTop: [
    { host: 'dc19-dsw2', value: 92 },
    { host: 'dc07-csw1', value: 78 },
    { host: 'dc05-csw2', value: 71 }
  ],
  linkTop: [
    { name: 'pcs1_dc07_m01 Eth1/47', util: 87 },
    { name: 'dc07-csw1 Po1', util: 74 },
    { name: 'dc19-csw1 Eth1/54', util: 61 },
    { name: 'dc09-fw1 出方向', util: 56 },
    { name: 'dc05-cbs1 Eth1/1', util: 44 }
  ]
}

// 采集中断 / 未纳管清单（缺口明细）
export const coverageGap = [
  { host: 'dc03-fw2', ip: '10.35.3.2', reason: 'SNMP 认证失败', type: '采集中断' },
  { host: 'dc06-csw3', ip: '10.20.6.3', reason: '采集超时 3 次', type: '采集中断' },
  { host: 'dc08-dsw2', ip: '10.20.8.2', reason: 'CMDB 有、Zabbix 无', type: '未纳管' }
]

// 24h 出口总流量（用于趋势区）
export const egressTrend24h = (function () {
  const hours = []
  const inflow = []
  const outflow = []
  for (let i = 0; i < 24; i++) {
    hours.push((i < 10 ? '0' + i : i) + ':00')
    // 白天高、夜间低，业务高峰在 20-22 点
    const base = 3.2 + 2.4 * Math.sin(((i - 6) / 24) * Math.PI * 2)
    const night = i < 6 ? -1.1 : 0
    outflow.push(Number(Math.max(0.8, base + night + (i % 3) * 0.18).toFixed(2)))
    inflow.push(Number(Math.max(0.6, base * 0.62 + night + (i % 4) * 0.12).toFixed(2)))
  }
  return { hours, outflow, inflow }
})()

// 进行中的变更工单（接 AlterationManageDB）
export const activeChange = {
  atId: 'AT-20261110-0042',
  title: 'DC19 新增 DSW 上线割接',
  window: '14:00 - 18:00',
  owner: '网络组',
  affected: 'DC19',
  progress: 35
}

// 采集元信息，看板右下角标数据来源
export const meta = {
  refreshedAt: null,
  sources: ['Zabbix', 'ElastiFlow', 'CMDB', '平台工单']
}
