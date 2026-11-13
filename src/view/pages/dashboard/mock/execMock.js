/**
 * 领导看板 mock 数据
 *
 * 面向月度复盘：每日 08:00 定版快照，当天不再变化。
 * 所有数字都是聚合口径，不含设备名和内网 IP。
 */

// 报告期信息
export const report = {
  title: '网络运行月报',
  period: '2026 年 11 月',
  asOf: '2026-11-09',
  asOfNote: '数据截至昨日 24:00 定版',
  theme: 'light'
}

// 核心 KPI：一行五个大数
export const kpis = [
  {
    key: 'availability',
    label: '网络可用性',
    value: '99.96',
    unit: '%',
    delta: 0.02,
    deltaUnit: 'pp',
    goodWhenUp: true,
    compare: '较上月',
    caliber: 'availability',
    spark: [99.91, 99.93, 99.92, 99.95, 99.94, 99.96, 99.96]
  },
  {
    key: 'quota',
    label: '出口最高水位',
    value: '78',
    unit: '%',
    delta: 6,
    deltaUnit: 'pp',
    goodWhenUp: false,
    compare: '较上月',
    caliber: 'egress95',
    spark: [62, 64, 68, 70, 71, 76, 78]
  },
  {
    key: 'biz',
    label: '承载业务数',
    value: '42',
    unit: '个',
    delta: 3,
    deltaUnit: '',
    goodWhenUp: true,
    compare: '较上月',
    caliber: 'bizCount',
    spark: [36, 37, 38, 39, 40, 41, 42]
  },
  {
    key: 'outage',
    label: '故障影响时长',
    value: '42',
    unit: '分钟',
    delta: -65,
    deltaUnit: '%',
    goodWhenUp: false,
    compare: '较上月',
    caliber: 'outage',
    spark: [120, 96, 88, 70, 60, 51, 42]
  },
  {
    key: 'cost',
    label: '网络成本',
    value: '38.6',
    unit: '万元',
    delta: -3.1,
    deltaUnit: '%',
    goodWhenUp: false,
    compare: '较上月',
    caliber: 'cost',
    spark: [41.2, 40.8, 40.1, 39.7, 39.4, 39.0, 38.6]
  }
]

// 出口 95 峰值 vs 合同带宽（近 6 个月）
// 单图两条线，同一单位，不搞双轴
export const capacityTrend = {
  months: ['6月', '7月', '8月', '9月', '10月', '11月'],
  series: [
    {
      name: '95 峰值利用率',
      unit: '%',
      data: [62, 64, 68, 70, 74, 78]
    },
    {
      name: '安全水位线',
      unit: '%',
      data: [80, 80, 80, 80, 80, 80],
      dashed: true
    }
  ],
  // 各出口分解（横向条形，按水位排序）
  byGroup: [
    { name: 'DC07 博兴出口', util: 78, contract: '6.5G', p95: '5.07G' },
    { name: 'DC19 怀来出口', util: 71, contract: '4.0G', p95: '2.84G' },
    { name: 'DC09 M5 出口', util: 63, contract: '4.0G', p95: '2.52G' },
    { name: 'DC03 支付出口', util: 55, contract: '2.0G', p95: '1.10G' },
    { name: 'DC05 顺义出口', util: 41, contract: '2.0G', p95: '0.82G' }
  ]
}

// 各机房可用性达成（月度热力，按周）
export const availabilityHeat = {
  weeks: ['W1', 'W2', 'W3', 'W4'],
  rows: [
    { code: 'DC01', city: '北京', cells: [100, 100, 99.99, 100] },
    { code: 'DC02', city: '北京', cells: [100, 99.98, 100, 100] },
    { code: 'DC03', city: '博兴支付', cells: [100, 100, 100, 100] },
    { code: 'DC05', city: '顺义', cells: [99.99, 99.95, 100, 99.98] },
    { code: 'DC06', city: '上海', cells: [100, 100, 100, 99.99] },
    { code: 'DC07', city: '博兴', cells: [99.97, 99.99, 99.98, 100] },
    { code: 'DC08', city: '深圳', cells: [100, 100, 100, 100] },
    { code: 'DC09', city: 'M5', cells: [100, 99.99, 100, 100] },
    { code: 'DC19', city: '怀来', cells: [99.94, 100, 99.96, 99.99] }
  ],
  // 达成标准：99.95 为达标线
  target: 99.95
}

// 容量预测：按近 30 天 95 峰值线性回归
export const forecast = [
  { name: 'DC07 博兴出口', current: 78, growthPerMonth: 4.2, monthsLeft: 2.5, status: 'critical' },
  { name: 'DC19 怀来出口', current: 71, growthPerMonth: 2.1, monthsLeft: 4.3, status: 'warning' },
  { name: 'DC09 M5 出口', current: 63, growthPerMonth: 1.4, monthsLeft: 12.1, status: 'good' },
  { name: 'DC03 支付出口', current: 55, growthPerMonth: 0.6, monthsLeft: 41.7, status: 'good' }
]

// 过程指标：故障与变更（两个独立小图，不做双轴）
export const processMetrics = {
  weeks: ['W1', 'W2', 'W3', 'W4'],
  outageMinutes: [18, 12, 8, 4],
  changes: [14, 11, 9, 12],
  changeSuccess: [13, 11, 9, 12]
}

// 环比对照说明，领导最常问"为什么变了"
export const highlights = [
  { type: 'good', text: '故障影响时长环比下降 65%，主要来自 DC19 双上行改造' },
  { type: 'warning', text: 'DC07 出口 95 峰值 78%，按当前增速约 2.5 个月触及 80% 安全线' },
  { type: 'good', text: '本月变更 46 次，成功率 97.8%，无变更引发的 P1 故障' }
]
