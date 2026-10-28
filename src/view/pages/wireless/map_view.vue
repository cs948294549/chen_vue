<template>
  <div class="wifi-view">
    <WifiMapToolbar
      :map-list="mapList"
      :selected-ids="mapIds"
      :markers="searchMarkers"
      :data-time="dataTime"
      :loading="loading"
      :last-refresh-at="lastRefreshAt"
      @ids-change="handleIdsChange"
      @filter-change="val => filter = val"
      @locate="handleLocate"
      @refresh="loadMaps" />

    <!-- 概览：当前展示的所有楼层汇总 -->
    <div class="wifi-view__summary" v-if="maps.length">
      <span>楼层 <b>{{ maps.length }}</b></span>
      <span>AP 总数 <b>{{ summary.total }}</b></span>
      <span class="is-online">在线 <b>{{ summary.online }}</b></span>
      <span class="is-offline">离线 <b>{{ summary.offline }}</b></span>
      <span class="is-bad">高负载 <b>{{ summary.alarm }}</b></span>
      <span>终端 <b>{{ summary.clients }}</b></span>
      <i class="dot is-ok"></i><span class="wifi-view__legend">利用率 &lt; 40%</span>
      <i class="dot is-warn"></i><span class="wifi-view__legend">40% ~ 70%</span>
      <i class="dot is-bad"></i><span class="wifi-view__legend">&gt; 70%</span>
      <i class="dot is-off"></i><span class="wifi-view__legend">离线</span>
    </div>

    <!-- 多图平铺：每张图独占一行，各自可缩放/拖动 -->
    <div ref="grid" class="wifi-view__grid" v-loading="loading">
      <div
        v-for="m in maps"
        :key="m.map_id"
        class="wifi-view__cell"
        :class="{'is-focus': focusId === m.map_id}"
        :ref="'cell-' + m.map_id">
        <div class="wifi-view__cell-head">
          <span class="wifi-view__cell-name">{{ m.map_name }}</span>
          <span class="wifi-view__cell-stat">
            AP {{ m.markers.length }}
            <template v-if="statOf(m).offline">· <span class="is-offline">离线 {{ statOf(m).offline }}</span></template>
            <template v-if="statOf(m).alarm">· <span class="is-bad">高负载 {{ statOf(m).alarm }}</span></template>
          </span>
          <span class="wifi-view__cell-tip">拖动平移 · Ctrl+滚轮缩放 · 双击适应</span>
        </div>
        <div class="wifi-view__cell-body" :style="bodyStyle(m)">
          <WifiMap
            tile
            :fit-max-zoom="1"
            mode="view"
            :map="m"
            :markers="visibleMarkers(m)"
            :selected-mac="drawerVisible ? selectedMac : ''"
            @marker-click="handleMarkerClick" />
        </div>
      </div>

      <div v-if="!loading && !maps.length" class="wifi-view__empty">
        <i class="el-icon-picture-outline"></i>
        <p>请选择要查看的楼层</p>
      </div>
    </div>

    <ApDetailDrawer :visible.sync="drawerVisible" :ap-mac="selectedMac" />
  </div>
</template>

<script>
import wifiApi from '@/api/mapis/wifi_interface'
import WifiMap from './wifi_components/WifiMap.vue'
import WifiMapToolbar from './wifi_components/WifiMapToolbar.vue'
import ApDetailDrawer from './wifi_components/ApDetailDrawer.vue'

const UTIL_ALARM = 70
const BODY_MIN_H = 160   // 小图 / 横向扁图的保底高度，留出右下角缩放控件的位置
const CELL_CHROME_H = 34 // 格子标题栏 + 边框，算可用高度时扣掉
const TILE_PAD = 10      // 与 WifiMap 平铺模式 fit 的留白一致

export default {
  name: 'WifiMapView',

  components: { WifiMap, WifiMapToolbar, ApDetailDrawer },

  data() {
    return {
      mapList: [],
      mapIds: [],       // 当前选中的楼层（按 id 顺序即楼层顺序）
      maps: [],         // 已加载的楼层详情
      cache: {},        // map_id -> 详情，切换楼层不重复请求
      filter: 'all',
      loading: false,
      lastRefreshAt: 0,
      selectedMac: '',
      drawerVisible: false,
      focusId: null,
      loadSeq: 0,
      gridW: 0,         // 平铺区实际可视宽高，行高据此计算
      gridH: 0,
      ro: null
    }
  },

  computed: {
    allMarkers() {
      const rows = []
      this.maps.forEach(m => {
        m.markers.forEach(x => rows.push(x))
      })
      return rows
    },

    dataTime() {
      return this.maps.length ? this.maps[0].data_time : ''
    },

    // 搜索范围覆盖所有已加载楼层（含未展示的），按 MAC 去重
    searchMarkers() {
      const seen = {}
      const rows = []
      const pools = this.maps.concat(Object.keys(this.cache).map(id => this.cache[id]))
      pools.forEach(map => {
        map.markers.forEach(m => {
          if (seen[m.ap_mac]) return
          seen[m.ap_mac] = true
          rows.push(m)
        })
      })
      return rows
    },

    summary() {
      const s = { total: 0, online: 0, offline: 0, alarm: 0, clients: 0 }
      this.allMarkers.forEach(m => {
        s.total++
        if (m.online_status === 'online') {
          s.online++
          s.clients += m.client_count || 0
        } else {
          s.offline++
        }
        if (this.isAlarm(m)) s.alarm++
      })
      return s
    }
  },

  created() {
    this.loadMapList()
  },

  mounted() {
    this.measureGrid()
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.measureGrid())
      this.ro.observe(this.$refs.grid)
    } else {
      window.addEventListener('resize', this.measureGrid)
    }
  },

  beforeDestroy() {
    if (this.ro) this.ro.disconnect()
    window.removeEventListener('resize', this.measureGrid)
  },

  methods: {
    isAlarm(m) {
      return m.online_status === 'online' && typeof m.utilization === 'number' && m.utilization > UTIL_ALARM
    },

    matchFilter(m) {
      if (this.filter === 'online') return m.online_status === 'online'
      if (this.filter === 'offline') return m.online_status !== 'online'
      if (this.filter === 'alarm') return this.isAlarm(m)
      return true
    },

    visibleMarkers(map) {
      return map.markers.filter(m => this.matchFilter(m))
    },

    statOf(map) {
      const s = { offline: 0, alarm: 0 }
      map.markers.forEach(m => {
        if (m.online_status !== 'online') s.offline++
        if (this.isAlarm(m)) s.alarm++
      })
      return s
    },

    measureGrid() {
      const el = this.$refs.grid
      if (!el) return
      // clientWidth 不含滚动条，正好是格子能占的宽度
      this.gridW = el.clientWidth
      this.gridH = el.clientHeight
    },

    // 行高按底图实际尺寸（image_width × image_height）算：放得下就按实际高度，
    // 比行宽还宽时按行宽等比缩小，比一屏还高时封顶到可视高度（图在格子里等比缩小居中）。
    // 尺寸缺失（0）时按整行宽度 3:2 兜底
    bodyStyle(map) {
      const rowW = Math.max(0, this.gridW - 2 - TILE_PAD * 2)
      const w = map.image_width || rowW || 3
      const h = map.image_height || (map.image_width ? 0 : w * 2 / 3)
      const scale = rowW ? Math.min(1, rowW / w) : 1
      const maxH = Math.max(BODY_MIN_H, this.gridH - CELL_CHROME_H)
      const height = Math.max(BODY_MIN_H, Math.min(maxH, h * scale + TILE_PAD * 2))
      return { height: Math.floor(height) + 'px' }
    },

    loadMapList() {
      wifiApi.getMapList().then(res => {
        this.mapList = (res.list || []).filter(g => g.maps && g.maps.length)
        // 工具栏 syncBuilding 会选出默认楼层并发 ids-change，预取放在那之后
      }).catch(err => {
        this.$message.error((err && err.message) || '加载地图列表失败')
      })
    },

    /* ---------- 多楼层加载 ---------- */

    handleIdsChange(ids) {
      const next = ids.slice().sort((a, b) => this.orderOf(a) - this.orderOf(b))
      const same = next.join(',') === this.mapIds.join(',')
      this.mapIds = next
      if (!same) this.syncMaps()
    },

    orderOf(mapId) {
      for (let i = 0; i < this.mapList.length; i++) {
        const maps = this.mapList[i].maps
        for (let j = 0; j < maps.length; j++) {
          if (maps[j].map_id === mapId) return i * 100 + (maps[j].sort_num || j)
        }
      }
      return 9999
    },

    // 选中集合变化：已在缓存里的直接展示，缺的并发拉取
    syncMaps() {
      this.maps = this.mapIds.map(id => this.cache[id]).filter(Boolean)
      if (this.maps.length !== this.mapIds.length) this.fetchMissing()
      else this.lastRefreshAt = Date.now()
    },

    fetchMissing() {
      const ids = this.mapIds.filter(id => !this.cache[id])
      if (!ids.length) return
      const seq = ++this.loadSeq
      this.loading = true
      Promise.all(ids.map(id => wifiApi.getMapDetail(id).then(
        res => ({ id, res }),
        err => ({ id, err })
      ))).then(results => {
        // 期间又切过楼层，这批结果只入缓存不展示
        this.loading = false
        let failed = 0
        results.forEach(r => {
          if (r.err) { failed++; return }
          this.cache[r.id] = r.res
        })
        if (failed) this.$message.error(`${failed} 张地图加载失败`)
        if (seq !== this.loadSeq) return
        this.maps = this.mapIds.map(id => this.cache[id]).filter(Boolean)
        this.lastRefreshAt = Date.now()
      })
    },

    // 刷新：丢弃缓存整批重取
    loadMaps() {
      this.cache = {}
      this.fetchMissing()
    },

    /* ---------- 交互 ---------- */

    handleMarkerClick(marker) {
      this.selectedMac = marker.ap_mac
      this.drawerVisible = true
    },

    // 搜索定位：所在楼层未展示时先加进来，再滚动到对应格子
    handleLocate(apMac) {
      let mapId = null
      let marker = null
      const pools = this.maps.concat(Object.keys(this.cache).map(id => this.cache[id]))
      for (let i = 0; i < pools.length && !marker; i++) {
        const hit = pools[i].markers.find(m => m.ap_mac === apMac)
        if (hit) { mapId = pools[i].map_id; marker = hit }
      }
      if (!marker) return
      if (this.mapIds.indexOf(mapId) < 0) {
        this.handleIdsChange(this.mapIds.concat(mapId))
      }
      this.selectedMac = marker.ap_mac
      this.drawerVisible = true
      this.focusId = mapId
      this.scrollToCell(mapId)
    },

    // 目标格子可能还在加载（刚被加进选中集合），等它渲染出来再滚
    scrollToCell(mapId, retry = 0) {
      this.$nextTick(() => {
        const el = this.$refs['cell-' + mapId]
        const node = Array.isArray(el) ? el[0] : el
        if (node) {
          node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        } else if (retry < 20) {
          setTimeout(() => this.scrollToCell(mapId, retry + 1), 100)
        }
      })
    }
  }
}
</script>

<style scoped>
.wifi-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100vh - 100px);
  padding: 10px;
  box-sizing: border-box;
  background: #f0f2f5;
}

.wifi-view__summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.wifi-view__summary b {
  font-size: 14px;
  margin-left: 3px;
}

.wifi-view__summary .is-online { color: #67c23a; }
.wifi-view__summary .is-offline { color: #909399; }
.wifi-view__summary .is-bad { color: #f56c6c; }

.wifi-view__legend {
  margin-left: -6px;
  color: #909399;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 4px;
}

.dot.is-ok { background: #67c23a; }
.dot.is-warn { background: #e6a23c; }
.dot.is-bad { background: #f56c6c; }
.dot.is-off { background: #b1b6bd; }

/* 一张图一行：行高由底图宽高比决定，最高为平铺区可视高度，滚动看其余楼层 */
.wifi-view__grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* 预留滚动条位置：滚动条出现/消失不改宽度，避免行高来回跳 */
  scrollbar-gutter: stable;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  /* 必须 max-content：容器定高时 auto 行会被压缩去均分容器高度（格子 overflow:hidden 使最小高度为 0），
     结果 5 张图挤在一屏、每张只剩一条；max-content 让每行按 bodyStyle 算出的高度撑开，超出部分滚动 */
  grid-auto-rows: max-content;
  align-content: start;
  gap: 8px;
}

.wifi-view__cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid transparent;
  overflow: hidden;
}

.wifi-view__cell.is-focus {
  border-color: #409eff;
}

.wifi-view__cell-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  font-size: 12px;
  color: #606266;
  border-bottom: 1px solid #f0f2f5;
}

.wifi-view__cell-tip {
  margin-left: auto;
  font-size: 11px;
  color: #b1b6bd;
  white-space: nowrap;
}

.wifi-view__cell-name {
  font-size: 13px;
  font-weight: bold;
  color: #303133;
}

.wifi-view__cell-stat .is-offline { color: #909399; }
.wifi-view__cell-stat .is-bad { color: #f56c6c; }

/* 高度由 bodyStyle 按实际可视区算出的像素值给定，WifiMap 的 height:100% 才有确定值 */
.wifi-view__cell-body {
  flex: none;
  width: 100%;
}

.wifi-view__empty {
  grid-column: 1 / -1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b1b6bd;
}

.wifi-view__empty i {
  font-size: 48px;
}

.wifi-view__empty p {
  margin: 8px 0 0;
  font-size: 14px;
}
</style>
