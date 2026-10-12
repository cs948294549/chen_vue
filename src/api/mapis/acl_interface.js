/*
ACL 管理相关接口（含模拟数据，后端就绪后替换为真实 axios 调用）
*/

const FP1 = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
const FP2 = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'
const FP3 = 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'

const MOCK_STANDARDS = [
  {
    id: 1, name: 'PERMIT_INTERNET_OUT', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced',
    fingerprint: FP1, rule_count: 3, description: '允许内网访问互联网出口', is_active: 1,
    created_at: '1726300000', updated_at: '1726300000', created_by: 'admin',
    entries: [
      { seq: 10, action: 'permit', protocol: 'tcp', src: { type: 'network', address: '10.0.0.0/8' }, src_port: null, dst: { type: 'any' }, dst_port: { type: 'direct', op: 'eq', ports: [80] }, options: {} },
      { seq: 20, action: 'permit', protocol: 'tcp', src: { type: 'network', address: '10.0.0.0/8' }, src_port: null, dst: { type: 'any' }, dst_port: { type: 'direct', op: 'eq', ports: [443] }, options: {} },
      { seq: 100, action: 'deny', protocol: 'ip', src: { type: 'any' }, src_port: null, dst: { type: 'any' }, dst_port: null, options: {} }
    ]
  },
  {
    id: 2, name: '2000', acl_number: 2000, acl_type: 'ipv4', acl_kind: 'basic',
    fingerprint: FP2, rule_count: 2, description: '允许管理网段访问', is_active: 1,
    created_at: '1726200000', updated_at: '1726200000', created_by: 'admin',
    entries: [
      { seq: 5, action: 'permit', protocol: 'ip', src: { type: 'network', address: '172.16.0.0/16' }, src_port: null, dst: { type: 'any' }, dst_port: null, options: {} },
      { seq: 100, action: 'deny', protocol: 'ip', src: { type: 'any' }, src_port: null, dst: { type: 'any' }, dst_port: null, options: {} }
    ]
  },
  {
    id: 3, name: 'DENY_SCAN_IN', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced',
    fingerprint: FP3, rule_count: 2, description: '拒绝端口扫描流量入方向', is_active: 0,
    created_at: '1726100000', updated_at: '1726100000', created_by: 'netops',
    entries: [
      { seq: 10, action: 'deny', protocol: 'tcp', src: { type: 'any' }, src_port: null, dst: { type: 'network', address: '10.100.0.0/16' }, dst_port: { type: 'direct', op: 'range', ports: [1, 1024] }, options: { log: true } },
      { seq: 100, action: 'permit', protocol: 'ip', src: { type: 'any' }, src_port: null, dst: { type: 'any' }, dst_port: null, options: {} }
    ]
  }
]

const MOCK_RECORDS = [
  { id: 1, device_ip: '10.1.1.1', device_name: 'dc01-csw01', vendor: 'cisco_nx', acl_name: 'PERMIT_INTERNET_OUT', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', rule_count: 3, fingerprint: FP1, dangling_count: 0, entries: MOCK_STANDARDS[0].entries, collected_at: '1726380000' },
  { id: 2, device_ip: '10.1.1.2', device_name: 'dc01-csw02', vendor: 'cisco_nx', acl_name: 'PERMIT_INTERNET_OUT', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', rule_count: 3, fingerprint: FP1, dangling_count: 0, entries: MOCK_STANDARDS[0].entries, collected_at: '1726380000' },
  { id: 3, device_ip: '10.2.1.1', device_name: 'dc02-csw01', vendor: 'cisco_nx', acl_name: 'PERMIT_INTERNET_OUT', acl_number: null, acl_type: 'ipv4', acl_kind: 'advanced', rule_count: 2, fingerprint: 'drifted000000000000000000000000000000000000000000000000000000000000', dangling_count: 0, entries: [MOCK_STANDARDS[0].entries[0], MOCK_STANDARDS[0].entries[2]], collected_at: '1726370000' },
  { id: 4, device_ip: '10.1.1.1', device_name: 'dc01-csw01', vendor: 'cisco_nx', acl_name: '2000', acl_number: 2000, acl_type: 'ipv4', acl_kind: 'basic', rule_count: 2, fingerprint: FP2, dangling_count: 0, entries: MOCK_STANDARDS[1].entries, collected_at: '1726380000' }
]

const MOCK_ISSUES = [
  { id: 1, object_type: 'acl', standard_id: 1, standard_name: 'PERMIT_INTERNET_OUT', device_ip: '10.2.1.1', device_name: 'dc02-csw01', device_vendor: 'cisco_nx', issue_type: 'drifted', dangling_refs: null, standard_entries: MOCK_STANDARDS[0].entries, device_entries: [MOCK_STANDARDS[0].entries[0], MOCK_STANDARDS[0].entries[2]], status: 'pending', change_ticket_id: null, created_by: 'system', created_at: '1726400000', processed_at: null, remark: '' },
  { id: 2, object_type: 'acl', standard_id: 1, standard_name: 'PERMIT_INTERNET_OUT', device_ip: '10.3.1.1', device_name: 'dc03-csw01', device_vendor: 'huawei', issue_type: 'missing', dangling_refs: null, standard_entries: MOCK_STANDARDS[0].entries, device_entries: [], status: 'pending', change_ticket_id: null, created_by: 'admin', created_at: '1726390000', processed_at: null, remark: '新增设备需补充配置' }
]

let nextStandardId = 4
let nextIssueId = 3
const standards = MOCK_STANDARDS.map(s => ({ ...s }))
const issues = MOCK_ISSUES.map(i => ({ ...i }))

function mock(data) {
  return Promise.resolve({ data: { code: 0, data } })
}

export default {
  getStandardsList(data) {
    let list = standards.slice()
    if (data && data.is_active !== undefined && data.is_active !== '') {
      list = list.filter(s => s.is_active === data.is_active)
    }
    if (data && data.keyword) {
      list = list.filter(s => s.name.includes(data.keyword))
    }
    return mock(list.map(s => ({ ...s, entries: undefined })))
  },

  getStandardDetail(data) {
    const s = standards.find(s => s.id === data.id)
    return mock(s ? { ...s } : null)
  },

  createStandard(data) {
    const s = { ...data, id: nextStandardId++, created_at: String(Math.floor(Date.now() / 1000)), updated_at: String(Math.floor(Date.now() / 1000)), rule_count: (data.entries || []).length }
    standards.push(s)
    return mock({ id: s.id })
  },

  updateStandard(data) {
    const idx = standards.findIndex(s => s.id === data.id)
    if (idx !== -1) {
      standards[idx] = { ...standards[idx], ...data, updated_at: String(Math.floor(Date.now() / 1000)), rule_count: (data.entries || standards[idx].entries || []).length }
    }
    return mock(null)
  },

  deleteStandard(data) {
    const idx = standards.findIndex(s => s.id === data.id)
    if (idx !== -1) standards.splice(idx, 1)
    return mock(null)
  },

  toggleStandardActive(data) {
    const s = standards.find(s => s.id === data.id)
    if (s) s.is_active = s.is_active ? 0 : 1
    return mock(null)
  },

  getStandardStatistics(data) {
    const stats = { 1: { total: 3, matched: 2, matched_other: 0, drifted: 1 }, 2: { total: 1, matched: 1, matched_other: 0, drifted: 0 }, 3: { total: 0, matched: 0, matched_other: 0, drifted: 0 } }
    return mock(stats[data.standard_id] || { total: 0, matched: 0, matched_other: 0, drifted: 0 })
  },

  getStandardDeviceList(data) {
    const deviceMap = {
      1: [
        { device_ip: '10.1.1.1', device_name: 'dc01-csw01', vendor: 'cisco_nx', fingerprint: FP1, match_status: 'matched', collected_at: '1726380000' },
        { device_ip: '10.1.1.2', device_name: 'dc01-csw02', vendor: 'cisco_nx', fingerprint: FP1, match_status: 'matched', collected_at: '1726380000' },
        { device_ip: '10.2.1.1', device_name: 'dc02-csw01', vendor: 'cisco_nx', fingerprint: 'drifted000000000000000000000000000000000000000000000000000000000000', match_status: 'drifted', collected_at: '1726370000' }
      ],
      2: [
        { device_ip: '10.1.1.1', device_name: 'dc01-csw01', vendor: 'cisco_nx', fingerprint: FP2, match_status: 'matched', collected_at: '1726380000' }
      ]
    }
    return mock(deviceMap[data.standard_id] || [])
  },

  getRecordsList(data) {
    let list = MOCK_RECORDS.slice()
    if (data && data.acl_name) list = list.filter(r => r.acl_name.includes(data.acl_name))
    if (data && data.device) list = list.filter(r => r.device_ip.includes(data.device) || r.device_name.includes(data.device))
    if (data && data.vendor) list = list.filter(r => r.vendor === data.vendor)
    if (data && data.acl_type) list = list.filter(r => r.acl_type === data.acl_type)
    return mock(list)
  },

  getIssueRecordsList(data) {
    let list = issues.slice()
    if (data && data.standard_id) list = list.filter(i => i.standard_id === data.standard_id)
    if (data && data.device) list = list.filter(i => i.device_ip.includes(data.device) || i.device_name.includes(data.device))
    if (data && data.status) list = list.filter(i => i.status === data.status)
    return mock(list)
  },

  batchCreateIssueRecords(data) {
    return mock({ created: (data.issue_ids || []).length })
  },

  createNewIssue(data) {
    const s = standards.find(s => s.id === data.standard_id)
    issues.push({ id: nextIssueId++, object_type: 'acl', standard_id: data.standard_id, standard_name: s ? s.name : '', device_ip: data.device_ip, device_name: data.device_ip, device_vendor: 'unknown', issue_type: 'missing', dangling_refs: null, standard_entries: s ? s.entries : [], device_entries: [], status: 'pending', change_ticket_id: null, created_by: 'manual', created_at: String(Math.floor(Date.now() / 1000)), processed_at: null, remark: data.remark || '' })
    return mock(null)
  },

  deleteIssueRecord(data) {
    const idx = issues.findIndex(i => i.id === data.id)
    if (idx !== -1) issues.splice(idx, 1)
    return mock(null)
  },

  updateIssueStatus(data) {
    const issue = issues.find(i => i.id === data.id)
    if (issue) { issue.status = data.status; if (data.status === 'completed') issue.processed_at = String(Math.floor(Date.now() / 1000)) }
    return mock(null)
  },

  getIssueStatistics(data) {
    const list = data && data.standard_id ? issues.filter(i => i.standard_id === data.standard_id) : issues
    return mock({ total: list.length, pending: list.filter(i => i.status === 'pending').length, processing: list.filter(i => i.status === 'processing').length, completed: list.filter(i => i.status === 'completed').length, ignored: list.filter(i => i.status === 'ignored').length })
  },

  compareTextDiff(data) {
    const html = `<table class="diff" cellspacing="0"><tr><td class="diff_header">标准配置</td><td class="diff_header">设备配置</td></tr><tr><td style="background:#e8ffe8;padding:4px 8px;font-family:monospace;font-size:12px;">+ 20 permit tcp 10.0.0.0/8 any eq 443</td><td style="background:#ffe8e8;padding:4px 8px;font-family:monospace;font-size:12px;">（缺少此条）</td></tr><tr><td style="padding:4px 8px;font-family:monospace;font-size:12px;"> 10 permit tcp 10.0.0.0/8 any eq 80</td><td style="padding:4px 8px;font-family:monospace;font-size:12px;"> 10 permit tcp 10.0.0.0/8 any eq 80</td></tr><tr><td style="padding:4px 8px;font-family:monospace;font-size:12px;"> 100 deny ip any any</td><td style="padding:4px 8px;font-family:monospace;font-size:12px;"> 100 deny ip any any</td></tr></table>`
    return mock({ diff_html: html })
  },

  createChangeOrder(data) {
    return mock({ order_id: 'CHG-' + Date.now(), message: '工单创建成功（模拟）' })
  }
}
