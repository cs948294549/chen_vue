/**
 * 看板统一配色
 *
 * 分类色按固定顺序取用，不循环、不按排名重新上色；
 * 状态色只表达状态，永远不拿来当"第 N 条系列"，且始终配图标 + 文字。
 * 数值已通过色盲与对比度校验，改动请重新跑校验，不要凭肉眼调。
 */

// 状态色（固定，深色浅色通用）
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b'
}

// 深色（值班看板）
export const DARK = {
  page: '#0d0e11',
  surface: '#16181c',
  surface2: '#1d2026',
  ink: '#ffffff',
  ink2: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  border: 'rgba(255,255,255,0.10)',
  track: '#262a31',
  series: ['#3987e5', '#d95926', '#199e70', '#c98500'],
  // 深色面上的顺序色带：值越大越亮
  ramp: ['#1b2836', '#1f3a55', '#24507a', '#2a67a0', '#3180c6', '#3987e5']
}

// 浅色（领导看板）
export const LIGHT = {
  page: '#f5f5f3',
  surface: '#fcfcfb',
  surface2: '#f4f3ef',
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  track: '#e8e7e1',
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
  // 浅色面上的顺序色带：值越大越深
  ramp: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95']
}

/**
 * Zabbix 触发器优先级 → 看板分级
 * 5-4 Disaster/High → P1，3-2 Average/Warning → P2，1 Information → P3
 * 0 Not classified 不进看板
 */
export const SEVERITY = {
  P1: { key: 'P1', label: 'P1 严重', color: STATUS.critical, shape: 'circle' },
  P2: { key: 'P2', label: 'P2 警告', color: STATUS.serious, shape: 'triangle' },
  P3: { key: 'P3', label: 'P3 提示', color: STATUS.warning, shape: 'square' }
}

export function severityOf (priority) {
  const p = Number(priority)
  if (p >= 4) return SEVERITY.P1
  if (p >= 2) return SEVERITY.P2
  return SEVERITY.P3
}

/**
 * 主题 → CSS 变量，挂在看板根节点上，
 * 公共组件只读 var(--dash-*)，不需要知道自己在哪个主题里。
 */
export function cssVars (theme) {
  return {
    '--dash-page': theme.page,
    '--dash-surface': theme.surface,
    '--dash-surface2': theme.surface2,
    '--dash-ink': theme.ink,
    '--dash-ink2': theme.ink2,
    '--dash-muted': theme.muted,
    '--dash-grid': theme.grid,
    '--dash-border': theme.border,
    '--dash-track': theme.track
  }
}

/**
 * 单值 → 状态色。谨慎使用，只用于"这是好是坏"能一句话说清的地方。
 */
export function statusOf (value, warn, danger) {
  if (value >= danger) return STATUS.critical
  if (value >= warn) return STATUS.warning
  return STATUS.good
}
