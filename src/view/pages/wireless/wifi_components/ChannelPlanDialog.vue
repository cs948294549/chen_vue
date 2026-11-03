<template>
  <el-dialog
    :visible="visible"
    title="信道规划参考"
    width="920px"
    top="5vh"
    append-to-body
    @close="close">
    <div class="cp">
      <!-- 管制域 / 频段 / 频宽 / 过滤 -->
      <div class="cp__bar">
        <el-select v-model="region" size="mini" class="cp__region">
          <el-option v-for="r in REGIONS" :key="r.key" :label="r.label" :value="r.key"></el-option>
        </el-select>

        <el-radio-group v-model="band" size="mini" @change="handleBandChange">
          <el-radio-button v-for="b in BANDS" :key="b.key" :label="b.key">{{ b.label }}</el-radio-button>
        </el-radio-group>

        <el-radio-group v-model="width" size="mini">
          <el-radio-button
            v-for="w in WIDTHS"
            :key="w"
            :label="w"
            :disabled="bandDef.widths.indexOf(w) < 0">{{ w }} MHz</el-radio-button>
        </el-radio-group>

        <el-checkbox v-model="onlyUsable" size="mini">只看本地区可用</el-checkbox>

        <div class="cp__spacer"></div>
        <el-input
          v-model="keyword"
          size="mini"
          clearable
          prefix-icon="el-icon-search"
          placeholder="信道号 / 频率"
          class="cp__search" />
      </div>

      <div class="cp__legend">
        <span v-for="l in LEGEND" :key="l.key">
          <i :class="['cp__swatch', 'is-' + l.key]"></i>{{ l.label }}
        </span>
      </div>

      <!-- 频谱示意：上排子频段，中排 20 MHz 基础信道，下排当前频宽捆绑后的信道 -->
      <svg class="cp__chart" :viewBox="`0 0 ${chart.w} ${chart.h}`">
        <g v-for="s in chart.subs" :key="s.key">
          <line :x1="s.x" :y1="s.y" :x2="s.x + s.w" :y2="s.y" class="cp__sub-line" />
          <text :x="s.x + s.w / 2" :y="s.y - 4" text-anchor="middle" class="cp__sub-text">{{ s.label }}</text>
        </g>

        <g v-for="row in chart.rows" :key="row.key">
          <text x="2" :y="row.y - 5" class="cp__row-label">{{ row.label }}</text>
          <g v-for="item in row.items" :key="item.key">
            <rect
              :x="item.x"
              :y="row.y"
              :width="item.w"
              :height="row.h"
              rx="2"
              :class="['cp__block', 'is-' + item.status]">
              <title>{{ item.tip }}</title>
            </rect>
            <text
              v-if="item.w >= 15"
              :x="item.x + item.w / 2"
              :y="row.y + row.h / 2 + 3.5"
              text-anchor="middle"
              class="cp__block-text">{{ item.label }}</text>
          </g>
        </g>

        <line :x1="chart.padL" :y1="chart.axisY" :x2="chart.w - chart.padR" :y2="chart.axisY" class="cp__axis" />
        <g v-for="t in chart.ticks" :key="t.f">
          <line :x1="t.x" :y1="chart.axisY" :x2="t.x" :y2="chart.axisY + 4" class="cp__axis" />
          <text :x="t.x" :y="chart.axisY + 16" text-anchor="middle" class="cp__tick">{{ t.f }}</text>
        </g>
        <text :x="chart.w - chart.padR" :y="chart.axisY + 28" text-anchor="end" class="cp__unit">MHz</text>
      </svg>

      <div class="cp__summary">
        <span>{{ regionDef.label }} · {{ bandDef.label }} · {{ width }} MHz 信道共 <b>{{ blocks.length }}</b> 个</span>
        <span class="is-ok">本地区可用 <b>{{ summary.usable }}</b></span>
        <span class="is-dfs">其中 DFS <b>{{ summary.dfs }}</b></span>
        <span class="is-radar">天气雷达 <b>{{ summary.radar }}</b></span>
        <span class="is-off">不可用 <b>{{ summary.closed }}</b></span>
      </div>

      <el-table :data="rows" size="mini" border height="280">
        <el-table-column label="信道" width="110" align="center">
          <template slot-scope="s">
            <span class="mono">{{ s.row.label }}</span>
            <span v-if="s.row.members.length > 1" class="cp__range">（{{ s.row.range }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="中心频率" width="100" align="center">
          <template slot-scope="s">{{ s.row.center }} MHz</template>
        </el-table-column>
        <el-table-column label="频率范围" width="140" align="center">
          <template slot-scope="s">{{ s.row.lo }} ~ {{ s.row.hi }}</template>
        </el-table-column>
        <el-table-column label="子频段" width="110" align="center">
          <template slot-scope="s">{{ s.row.sub || '—' }}</template>
        </el-table-column>
        <el-table-column label="标识" width="200">
          <template slot-scope="s">
            <el-tag
              v-for="t in s.row.tags"
              :key="t"
              :type="TAGS[t].type"
              size="mini"
              class="cp__tag">{{ TAGS[t].label }}</el-tag>
            <span v-if="!s.row.tags.length" class="cp__muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template slot-scope="s"><span class="cp__note-text">{{ s.row.note || '—' }}</span></template>
        </el-table-column>
      </el-table>

      <p class="cp__note">{{ bandDef.note }}</p>
      <p class="cp__note">{{ regionDef.notes[band] }}</p>
    </div>

    <span slot="footer">
      <el-button size="mini" @click="close">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
/*
信道规划参考（纯静态数据，不请求接口）
- 信道表按 IEEE 802.11 全集列出，可用性按管制域判断；宽频信道按标准对齐边界捆绑
  （40: 36/40、44/48…；80: 36-48、52-64、100-112…；160: 36-64、100-128、149-177）
- 宽频信道只要有一个成员信道在本地区不可用，整块即不可用
- 管制规则会随政策调整，实际以 AC 上的国家码与 AP 型号支持的信道为准
*/

const WIDTHS = [20, 40, 80, 160]

const BANDS = [
  {
    key: '2.4G',
    label: '2.4 GHz',
    domain: [2395, 2500],
    ticks: [2400, 2412, 2437, 2462, 2484],
    widths: [20],
    step: 5,
    note: '2.4 GHz：相邻信道中心频率只差 5 MHz，信道之间大量重叠，只有 1 / 6 / 11 三个互不干扰。高密部署不要开 40 MHz（会占满整段频谱），因此这里只提供 20 MHz。',
    subs: []
  },
  {
    key: '5G',
    label: '5 GHz',
    domain: [5150, 5900],
    ticks: [5150, 5250, 5350, 5470, 5600, 5650, 5725, 5850, 5895],
    widths: [20, 40, 80, 160],
    step: 20,
    note: '5 GHz：DFS 信道检测到雷达后 AP 必须在数秒内切走，并对该信道静默 30 分钟；首次启用前要做 CAC 监听（普通 DFS 60 秒，天气雷达信道 10 分钟），期间不发射信号。80 / 160 MHz 很容易扫进 DFS 区间，高密办公区建议 20 / 40 MHz。',
    subs: [
      { label: 'UNII-1', lo: 5150, hi: 5250 },
      { label: 'UNII-2A', lo: 5250, hi: 5350 },
      { label: 'UNII-2C', lo: 5470, hi: 5730 },
      { label: 'UNII-3', lo: 5735, hi: 5835 },
      { label: 'UNII-4', lo: 5835, hi: 5895 }
    ]
  }
]

// sub: 子频段；dfs: 需动态频率选择；radar: 与天气雷达（TDWR，5600~5650 MHz）重叠
const CHANNELS = {
  '2.4G': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(n => ({
    n,
    f: n === 14 ? 2484 : 2407 + n * 5,
    sub: '',
    dfs: false,
    radar: false
  })),
  '5G': [
    [36, 'UNII-1'], [40, 'UNII-1'], [44, 'UNII-1'], [48, 'UNII-1'],
    [52, 'UNII-2A'], [56, 'UNII-2A'], [60, 'UNII-2A'], [64, 'UNII-2A'],
    [100, 'UNII-2C'], [104, 'UNII-2C'], [108, 'UNII-2C'], [112, 'UNII-2C'],
    [116, 'UNII-2C'], [120, 'UNII-2C'], [124, 'UNII-2C'], [128, 'UNII-2C'],
    [132, 'UNII-2C'], [136, 'UNII-2C'], [140, 'UNII-2C'], [144, 'UNII-2C'],
    [149, 'UNII-3'], [153, 'UNII-3'], [157, 'UNII-3'], [161, 'UNII-3'], [165, 'UNII-3'],
    [169, 'UNII-4'], [173, 'UNII-4'], [177, 'UNII-4']
  ].map(([n, sub]) => ({
    n,
    f: 5000 + n * 5,
    sub,
    dfs: (n >= 52 && n <= 64) || (n >= 100 && n <= 144),
    radar: n >= 120 && n <= 128
  }))
}

function range(a, b, step) {
  const out = []
  for (let i = a; i <= b; i += step) out.push(i)
  return out
}

// allow: 本地区开放的信道；indoor: 仅限室内；limited: 可用但有功率/场景限制
const REGIONS = [
  {
    key: 'CN',
    label: '中国（CN）',
    '2.4G': { allow: range(1, 13, 1), indoor: [], limited: [] },
    '5G': { allow: range(36, 64, 4).concat(range(149, 165, 4)), indoor: range(36, 64, 4), limited: [] },
    notes: {
      '2.4G': '中国：2.4 GHz 开放 1~13 信道，14 信道仅日本可用。',
      '5G': '中国：只开放 5150~5350 MHz（36~64，仅限室内，52~64 需 DFS）和 5725~5850 MHz（149~165）。5470~5725 MHz（100~144）未开放，因此国内没有天气雷达信道；160 MHz 只能用 36-64，且包含 4 个 DFS 信道。'
    }
  },
  {
    key: 'US',
    label: '美国（FCC）',
    '2.4G': { allow: range(1, 11, 1), indoor: [], limited: [] },
    '5G': { allow: range(36, 144, 4).filter(n => n <= 64 || n >= 100).concat(range(149, 177, 4)), indoor: range(169, 177, 4), limited: range(169, 177, 4) },
    notes: {
      '2.4G': 'FCC：2.4 GHz 只开放 1~11 信道。',
      '5G': 'FCC：120~128 与 TDWR 天气雷达重叠，部分设备默认禁用；169~177（UNII-4）为 2020 年新开放，仅室内且需较新的设备支持。'
    }
  },
  {
    key: 'EU',
    label: '欧洲（ETSI）',
    '2.4G': { allow: range(1, 13, 1), indoor: [], limited: [] },
    '5G': { allow: range(36, 140, 4).filter(n => n <= 64 || n >= 100), indoor: range(36, 64, 4), limited: [] },
    notes: {
      '2.4G': 'ETSI：2.4 GHz 开放 1~13 信道。',
      '5G': 'ETSI：36~64 仅室内，100~140 需 DFS，其中 120~128 为天气雷达信道（CAC 10 分钟）；144 与 149 以上不作为常规 WLAN 信道。'
    }
  }
]

const TAGS = {
  recommend: { label: '推荐', type: 'success', note: '与其他推荐信道互不重叠' },
  indoor: { label: '仅室内', type: '', note: '本地区仅允许室内使用' },
  dfs: { label: 'DFS', type: 'warning', note: '需雷达检测，命中雷达后 AP 会被迫切换信道' },
  radar: { label: '天气雷达', type: 'danger', note: '与天气雷达 5600~5650 MHz 重叠，CAC 10 分钟，误触发率高，尽量避开' },
  limited: { label: '受限', type: 'info', note: '新开放或有功率限制，需确认设备支持' },
  closed: { label: '本地区不可用', type: 'info', note: '' }
}

const LEGEND = [
  { key: 'ok', label: '可用' },
  { key: 'indoor', label: '仅室内' },
  { key: 'dfs', label: 'DFS' },
  { key: 'radar', label: '天气雷达' },
  { key: 'limited', label: '受限' },
  { key: 'closed', label: '本地区不可用' }
]

// 2.4G 推荐信道
const RECOMMEND_24 = [1, 6, 11]

function round1(v) {
  return Math.round(v * 10) / 10
}

// 中心频率连续（间隔 = step）的信道切成段，宽频信道不跨段捆绑
function splitRuns(list, step) {
  const runs = []
  let cur = []
  list.forEach(c => {
    if (cur.length && c.f - cur[cur.length - 1].f !== step) {
      runs.push(cur)
      cur = []
    }
    cur.push(c)
  })
  if (cur.length) runs.push(cur)
  return runs
}

export default {
  name: 'ChannelPlanDialog',

  props: {
    visible: { type: Boolean, default: false }
  },

  data() {
    return {
      region: 'CN',
      band: '5G',
      width: 20,
      onlyUsable: false,
      keyword: '',
      REGIONS,
      BANDS,
      WIDTHS,
      TAGS,
      LEGEND
    }
  },

  computed: {
    regionDef() {
      return REGIONS.find(r => r.key === this.region) || REGIONS[0]
    },

    bandDef() {
      return BANDS.find(b => b.key === this.band) || BANDS[0]
    },

    rule() {
      return this.regionDef[this.band]
    },

    channels() {
      return CHANNELS[this.band] || []
    },

    // 20 MHz 基础信道
    baseBlocks() {
      return this.channels.map(c => this.makeBlock([c]))
    },

    // 按当前频宽对齐捆绑：每段从段首开始、每 size 个一组，凑不满的尾巴丢弃
    blocks() {
      const size = this.width / 20
      if (size === 1) return this.baseBlocks
      const out = []
      splitRuns(this.channels, this.bandDef.step).forEach(run => {
        for (let i = 0; i + size <= run.length; i += size) {
          out.push(this.makeBlock(run.slice(i, i + size)))
        }
      })
      return out
    },

    rows() {
      const kw = String(this.keyword || '').trim()
      return this.blocks.filter(r => {
        if (this.onlyUsable && r.status === 'closed') return false
        if (!kw) return true
        // 输入信道号精确匹配成员信道（避免搜 1 命中 10~14），输入频率匹配覆盖该频点的信道
        return r.members.some(n => String(n) === kw) ||
          r.label === kw ||
          (Number(kw) >= r.lo && Number(kw) <= r.hi)
      })
    },

    summary() {
      const s = { usable: 0, dfs: 0, radar: 0, closed: 0 }
      this.blocks.forEach(r => {
        if (r.status === 'closed') { s.closed++; return }
        s.usable++
        if (r.tags.indexOf('dfs') >= 0) s.dfs++
        if (r.tags.indexOf('radar') >= 0) s.radar++
      })
      return s
    },

    chart() {
      const def = this.bandDef
      const d0 = def.domain[0]
      const d1 = def.domain[1]
      const w = 880
      const padL = 10
      const padR = 10
      const toX = f => padL + ((f - d0) / (d1 - d0)) * (w - padL - padR)

      const toItem = (b, tip) => {
        const x1 = toX(b.lo)
        const x2 = toX(b.hi)
        return { key: b.key, label: b.label, status: b.status, tip, x: x1 + 0.5, w: Math.max(1, x2 - x1 - 1) }
      }
      const tipOf = b => [
        b.members.length > 1 ? `CH${b.label}（${b.range}，${this.width} MHz）` : `CH${b.label}`,
        `中心 ${b.center} MHz`,
        `${b.lo} ~ ${b.hi} MHz`
      ].concat(b.tags.map(t => TAGS[t].label)).join(' · ')

      let y = 0
      let subs = []
      if (def.subs.length) {
        y += 16
        subs = def.subs.map(s => ({ key: s.label, label: s.label, x: toX(s.lo) + 1, w: toX(s.hi) - toX(s.lo) - 2, y }))
        y += 6
      }

      // 2.4G 信道重叠，基础信道行按 1/6/11 和其他信道错开两层，否则块全叠在一起看不清
      const rows = []
      if (this.band === '2.4G') {
        y += 18
        const groups = [[1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10]]
        groups.forEach((g, i) => {
          rows.push({
            key: 'base-' + i,
            label: i === 0 ? '20 MHz 信道（按互不重叠分层）' : '',
            y,
            h: 18,
            items: this.baseBlocks.filter(b => g.indexOf(b.members[0]) >= 0).map(b => toItem(b, tipOf(b)))
          })
          y += 20
        })
      } else {
        y += 18
        rows.push({ key: 'base', label: '20 MHz 基础信道', y, h: 26, items: this.baseBlocks.map(b => toItem(b, tipOf(b))) })
        y += 26
        if (this.width > 20) {
          y += 22
          rows.push({ key: 'wide', label: `${this.width} MHz 信道`, y, h: 30, items: this.blocks.map(b => toItem(b, tipOf(b))) })
          y += 30
        }
      }

      const axisY = y + 10
      const ticks = def.ticks.map(f => ({ f, x: toX(f) }))
      return { w, h: axisY + 32, padL, padR, subs, rows, axisY, ticks }
    }
  },

  methods: {
    makeBlock(members) {
      const rule = this.rule
      const first = members[0]
      const last = members[members.length - 1]
      // 2.4G 每个信道占 22 MHz（DSSS）/ 20 MHz（OFDM），这里统一按 20 MHz 画
      const lo = first.f - 10
      const hi = last.f + 10
      const nums = members.map(c => c.n)

      const tags = []
      const allowed = nums.every(n => rule.allow.indexOf(n) >= 0)
      if (!allowed) {
        tags.push('closed')
      } else {
        if (this.band === '2.4G' && RECOMMEND_24.indexOf(first.n) >= 0) tags.push('recommend')
        if (nums.some(n => rule.indoor.indexOf(n) >= 0)) tags.push('indoor')
        if (members.some(c => c.dfs)) tags.push('dfs')
        if (members.some(c => c.radar)) tags.push('radar')
        if (nums.some(n => rule.limited.indexOf(n) >= 0)) tags.push('limited')
      }

      // 着色优先级：不可用 > 天气雷达 > DFS > 受限 > 仅室内 > 可用
      let status = 'ok'
      const order = ['closed', 'radar', 'dfs', 'limited', 'indoor']
      for (let i = 0; i < order.length; i++) {
        if (tags.indexOf(order[i]) >= 0) { status = order[i]; break }
      }

      let note = tags.map(t => TAGS[t].note).filter(Boolean).join('；')
      if (!allowed) {
        const blocked = nums.filter(n => rule.allow.indexOf(n) < 0)
        note = members.length > 1
          ? `包含本地区未开放的信道 ${blocked.join(' / ')}`
          : '本地区未开放该信道'
      } else if (members.length > 1) {
        const dfsNums = members.filter(c => c.dfs).map(c => c.n)
        if (dfsNums.length && dfsNums.length < members.length) {
          note = `其中 ${dfsNums.join(' / ')} 为 DFS 信道，任一子信道检测到雷达整块都要切走；` + note
        }
      }

      const subs = members.map(c => c.sub).filter((s, i, arr) => s && arr.indexOf(s) === i)
      return {
        key: first.n + '-' + last.n,
        // 宽频信道用首尾信道号的平均值表示（即 802.11 的中心信道号，如 36-48 → 42）
        label: String((first.n + last.n) / 2),
        range: first.n + '-' + last.n,
        members: nums,
        center: round1((lo + hi) / 2),
        lo: round1(lo),
        hi: round1(hi),
        sub: subs.join(' + '),
        status,
        tags,
        note
      }
    },

    handleBandChange(key) {
      const def = BANDS.find(b => b.key === key)
      if (def && def.widths.indexOf(this.width) < 0) this.width = def.widths[0]
    },

    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.cp__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cp__region {
  width: 130px;
}

.cp__spacer {
  flex: 1;
  min-width: 10px;
}

.cp__search {
  width: 150px;
}

.cp__legend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 0 4px;
  font-size: 12px;
  color: #606266;
}

.cp__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cp__swatch {
  width: 12px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid transparent;
  display: inline-block;
}

.cp__swatch.is-ok { background: #e1f3d8; border-color: #67c23a; }
.cp__swatch.is-indoor { background: #d9ecff; border-color: #409eff; }
.cp__swatch.is-dfs { background: #faecd8; border-color: #e6a23c; }
.cp__swatch.is-radar { background: #fde2e2; border-color: #f56c6c; }
.cp__swatch.is-limited { background: #ede4fb; border-color: #9b6fe0; }
.cp__swatch.is-closed { background: #f4f4f5; border-color: #c0c4cc; border-style: dashed; }

.cp__chart {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}

.cp__sub-line {
  stroke: #c0c4cc;
  stroke-width: 2;
}

.cp__sub-text {
  font-size: 10px;
  fill: #909399;
}

.cp__row-label {
  font-size: 11px;
  fill: #909399;
}

.cp__block {
  stroke-width: 1;
  cursor: default;
}

.cp__block:hover {
  stroke-width: 2;
}

.cp__block.is-ok { fill: #e1f3d8; stroke: #67c23a; }
.cp__block.is-indoor { fill: #d9ecff; stroke: #409eff; }
.cp__block.is-dfs { fill: #faecd8; stroke: #e6a23c; }
.cp__block.is-radar { fill: #fde2e2; stroke: #f56c6c; }
.cp__block.is-limited { fill: #ede4fb; stroke: #9b6fe0; }
.cp__block.is-closed { fill: #f4f4f5; stroke: #c0c4cc; stroke-dasharray: 3 2; }

.cp__block-text {
  font-size: 9px;
  fill: #303133;
  pointer-events: none;
}

.cp__axis {
  stroke: #dcdfe6;
  stroke-width: 1;
}

.cp__tick {
  font-size: 10px;
  fill: #909399;
}

.cp__unit {
  font-size: 10px;
  fill: #c0c4cc;
}

.cp__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin: 8px 0 10px;
  font-size: 12px;
  color: #606266;
}

.cp__summary b {
  font-size: 13px;
}

.cp__summary .is-ok { color: #67c23a; }
.cp__summary .is-dfs { color: #e6a23c; }
.cp__summary .is-radar { color: #f56c6c; }
.cp__summary .is-off { color: #909399; }

.cp__tag {
  margin-right: 4px;
}

.cp__muted {
  color: #c0c4cc;
}

.cp__range {
  font-size: 11px;
  color: #909399;
}

.cp__note-text {
  color: #606266;
}

.cp__note {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #909399;
}

.mono {
  font-family: Menlo, Consolas, monospace;
}
</style>
