<template>
  <div
    ref="viewport"
    class="wifi-map"
    :class="{'is-editing': mode === 'edit', 'is-panning': panning, 'is-tile': tile}"
    @mousedown="handleStageDown"
    @dblclick="handleDbClick">
    <!-- 缩放后的舞台：底图 + 图标层一起变换，坐标只在比例值上计算，缩放时图标天然跟着图走 -->
    <div
      ref="stage"
      class="wifi-map__stage"
      :style="stageStyle">
      <img
        v-if="map && map.image"
        class="wifi-map__image"
        :src="map.image"
        :width="imageW"
        :height="imageH"
        draggable="false"
        @load="handleImageLoad" />

      <div
        v-for="m in markers"
        :key="m.ap_mac"
        class="wifi-map__marker"
        :style="markerStyle(m)">
        <!-- 反向缩放：抵消舞台的缩放，图标在屏幕上恒定大小，尖端仍钉在锚点 -->
        <div class="wifi-map__marker-inner" :style="{ transform: `scale(${iconScale})` }">
          <ApIcon
            :marker="m"
            :label-level="labelLevel"
            :name-only="mode === 'edit'"
            :selected="selectedMac === m.ap_mac"
            @marker-down="handleMarkerDown" />
        </div>
      </div>
    </div>
    <!-- 空态 -->
    <div v-if="!map" class="wifi-map__empty">
      <i class="el-icon-picture-outline"></i>
      <p>请选择一张地图</p>
    </div>

    <!-- 右下角缩放控件 -->
    <div v-if="map" class="wifi-map__zoom">
      <el-button-group>
        <el-button size="mini" icon="el-icon-zoom-in" @click="zoomBy(1.25)"></el-button>
        <el-button size="mini" icon="el-icon-zoom-out" @click="zoomBy(0.8)"></el-button>
        <el-button size="mini" icon="el-icon-full-screen" title="适应窗口" @click="fit()"></el-button>
      </el-button-group>
      <span class="wifi-map__zoom-value">{{ Math.round(zoom * 100) }}%</span>
    </div>

    <!-- 图例（平铺时汇总栏已给出，不重复） -->
    <div v-if="map && !tile" class="wifi-map__legend">
      <span><i class="dot is-ok"></i>利用率 &lt; 40%</span>
      <span><i class="dot is-warn"></i>40% ~ 70%</span>
      <span><i class="dot is-bad"></i>&gt; 70%</span>
      <span><i class="dot is-off"></i>离线</span>
    </div>
  </div>
</template>

<script>
import ApIcon from './ApIcon.vue'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 5
const LABEL_DETAIL_ZOOM = 1.2
const LABEL_BASIC_ZOOM = 0.6

export default {
  name: 'WifiMap',

  components: { ApIcon },

  props: {
    map: { type: Object, default: null },
    markers: { type: Array, default: () => [] },
    mode: { type: String, default: 'view' },   // view | edit
    tile: { type: Boolean, default: false },   // 平铺模式：多图同屏，每图一行，Ctrl+滚轮缩放
    fitMaxZoom: { type: Number, default: MAX_ZOOM }, // 适应窗口时最多放大到的倍数，传 1 即只缩小不放大（按实际尺寸展示）
    selectedMac: { type: String, default: '' }
  },

  data() {
    return {
      zoom: 1,
      tx: 0,
      ty: 0,
      imageW: 1200,
      imageH: 800,
      panning: false,
      dragState: null,
      ro: null,
      touched: false,   // 用户在平铺模式下手动缩放过
      fitZoom: 0,       // 平铺模式下 fit 得到的缩放值，作为缩放下限
      fitted: false
    }
  },

  computed: {
    stageStyle() {
      return {
        width: this.imageW + 'px',
        height: this.imageH + 'px',
        transform: `translate(${this.tx}px, ${this.ty}px) scale(${this.zoom})`
      }
    },

    // 标签分级：缩放越小，信息越少；平铺时一行空间充裕，始终展示全量
    // 编辑态只认名称：只看位置和归属，指标信息反而碍事
    labelLevel() {
      if (this.tile) return 2
      if (this.mode === 'edit') return 1
      if (this.zoom >= LABEL_DETAIL_ZOOM) return 2
      if (this.zoom >= LABEL_BASIC_ZOOM) return 1
      return 0
    },

    // 舞台放大了 zoom 倍，内层反向缩小，图标在屏幕上保持原大小
    iconScale() {
      return 1 / this.zoom
    }
  },

  watch: {
    // 同一张图的定时刷新不重置缩放；切图才重新适配
    map(val, old) {
      if (!val) return
      const sameMap = old && old.map_id === val.map_id
      this.applySize(val)
      if (!sameMap) this.$nextTick(() => this.fit())
    }
  },

  mounted() {
    const el = this.$refs.viewport
    // 需要 passive:false 才能阻止页面跟着滚动
    el.addEventListener('wheel', this.handleWheel, { passive: false })
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('mousemove', this.handleWindowMove)
    window.addEventListener('mouseup', this.handleWindowUp)
    // 平铺时格子尺寸随窗口/layout 变，用 RO 精确跟随；用户手动缩放过就不再自动改
    if (this.tile && window.ResizeObserver) {
      this.ro = new ResizeObserver(() => { if (!this.touched) this.fit() })
      this.ro.observe(el)
    }
    if (this.map) {
      this.applySize(this.map)
      this.$nextTick(() => this.fit())
    }
  },

  beforeDestroy() {
    const el = this.$refs.viewport
    if (el) el.removeEventListener('wheel', this.handleWheel)
    if (this.ro) this.ro.disconnect()
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('mousemove', this.handleWindowMove)
    window.removeEventListener('mouseup', this.handleWindowUp)
  },

  methods: {
    /* ---------- 尺寸与适配 ---------- */

    viewportRect() {
      return this.$refs.viewport ? this.$refs.viewport.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 }
    },

    // 库里存的宽高即底图实际显示尺寸（默认原始像素，编辑页可按缩放改），图片按它拉伸
    applySize(map) {
      if (map && map.image_width && map.image_height) {
        this.imageW = map.image_width
        this.imageH = map.image_height
      }
    },

    handleImageLoad(e) {
      // 有存储尺寸时以存储为准，不用原始像素覆盖
      if (this.map && this.map.image_width && this.map.image_height) return
      const w = e.target.naturalWidth
      const h = e.target.naturalHeight
      if (!w || !h) return
      const changed = w !== this.imageW || h !== this.imageH
      this.imageW = w
      this.imageH = h
      // 尺寸缺失（存量数据为 0）或与实际不符时，按真实尺寸再适配一次
      if (changed) this.$nextTick(() => this.fit())
    },

    handleResize() {
      if (this.tile) {
        if (!this.touched) this.fit()
        return
      }
      if (!this.fitted) this.fit()
    },

    // 适应窗口：等比缩放到容器内并居中
    fit() {
      const rect = this.viewportRect()
      if (!rect.width || !rect.height || !this.imageW || !this.imageH) return
      const pad = this.tile ? 10 : 24
      const z = Math.min(
        (rect.width - pad * 2) / this.imageW,
        (rect.height - pad * 2) / this.imageH
      )
      // 平铺时行高可能很矮，不设缩放下限，否则图会撑破行；上限由 fitMaxZoom 控制
      this.zoom = this.tile ? Math.min(this.fitMaxZoom, MAX_ZOOM, z) : this.clampZoom(z)
      if (this.tile) this.fitZoom = this.zoom
      this.tx = (rect.width - this.imageW * this.zoom) / 2
      this.ty = (rect.height - this.imageH * this.zoom) / 2
      this.fitted = true
      this.touched = false
      this.emitZoom()
    },

    clampZoom(z) {
      // 平铺时 fit 出来的值可能低于 MIN_ZOOM，下限放到 fit 值，免得第一次缩放就跳变
      const min = Math.min(MIN_ZOOM, this.fitZoom || MIN_ZOOM)
      return Math.min(MAX_ZOOM, Math.max(min, z))
    },

    /* ---------- 缩放 ---------- */

    emitZoom() {
      this.$emit('zoom-change', this.zoom)
    },

    // 平铺时页面要能滚动，滚轮只在按住 Ctrl/⌘ 时才缩放（与地图类应用一致）
    handleWheel(e) {
      if (!this.map) return
      if (this.tile && !e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      this.zoomAt(factor, e.clientX, e.clientY)
    },

    zoomBy(factor) {
      const rect = this.viewportRect()
      this.zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },

    // 以屏幕上的某点为锚点缩放：锚点下的图面位置保持不动
    zoomAt(factor, clientX, clientY) {
      const rect = this.viewportRect()
      const px = clientX - rect.left
      const py = clientY - rect.top
      const next = this.clampZoom(this.zoom * factor)
      if (next === this.zoom) return
      const ratio = next / this.zoom
      this.tx = px - (px - this.tx) * ratio
      this.ty = py - (py - this.ty) * ratio
      this.zoom = next
      this.touched = true
      this.emitZoom()
    },

    /* ---------- 平移 ---------- */

    handleStageDown(e) {
      if (e.button !== 0) return
      // 点在图钉上时由图钉自己处理
      if (e.target.closest && e.target.closest('.wifi-map__marker')) return
      this.panning = true
      this.touched = true
      this.dragState = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        originTx: this.tx,
        originTy: this.ty
      }
      this.$emit('map-click')
    },

    handleMarkerDown(marker, e) {
      if (e.button !== 0) return
      if (this.mode !== 'edit') {
        this.$emit('marker-click', marker)
        return
      }
      // 编辑态：按下先记录起点，松开时若没移动则视为点击选中
      const rect = this.viewportRect()
      this.dragState = {
        type: 'marker',
        mac: marker.ap_mac,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        rect,
        offsetX: e.clientX - rect.left - this.tx - marker.x_ratio * this.imageW * this.zoom,
        offsetY: e.clientY - rect.top - this.ty - marker.y_ratio * this.imageH * this.zoom
      }
    },

    handleWindowMove(e) {
      const d = this.dragState
      if (!d) return

      if (d.type === 'pan') {
        this.tx = d.originTx + (e.clientX - d.startX)
        this.ty = d.originTy + (e.clientY - d.startY)
        return
      }

      if (d.type === 'marker') {
        if (!d.moved && Math.abs(e.clientX - d.startX) < 3 && Math.abs(e.clientY - d.startY) < 3) return
        d.moved = true
        const rect = d.rect
        const xPx = e.clientX - rect.left - this.tx - d.offsetX
        const yPx = e.clientY - rect.top - this.ty - d.offsetY
        const xRatio = this.clampRatio(xPx / (this.imageW * this.zoom))
        const yRatio = this.clampRatio(yPx / (this.imageH * this.zoom))
        this.$emit('marker-move', { ap_mac: d.mac, x_ratio: xRatio, y_ratio: yRatio })
      }
    },

    handleWindowUp() {
      const d = this.dragState
      this.panning = false
      this.dragState = null
      if (d && d.type === 'marker' && !d.moved) {
        this.$emit('marker-select', d.mac)
      }
    },

    clampRatio(v) {
      return Math.min(1, Math.max(0, Number(v.toFixed(6))))
    },

    // 屏幕坐标 → 底图比例坐标（编辑页拖入 AP 用）；落在底图外返回 null
    ratioAt(clientX, clientY) {
      const rect = this.viewportRect()
      const x = (clientX - rect.left - this.tx) / (this.imageW * this.zoom)
      const y = (clientY - rect.top - this.ty) / (this.imageH * this.zoom)
      if (x < 0 || x > 1 || y < 0 || y > 1) return null
      return { x_ratio: this.clampRatio(x), y_ratio: this.clampRatio(y) }
    },

    // 当前视口中心对应的比例坐标（点击添加 AP 用）
    centerRatio() {
      const rect = this.viewportRect()
      return this.ratioAt(rect.left + rect.width / 2, rect.top + rect.height / 2) ||
        { x_ratio: 0.5, y_ratio: 0.5 }
    },

    /* ---------- 定位 ---------- */

    // 把某个 AP 移到视口中心（搜索用）
    focusMarker(apMac) {
      const m = this.markers.find(x => x.ap_mac === apMac)
      if (!m) return
      const rect = this.viewportRect()
      const z = Math.max(this.zoom, 1)
      this.zoom = this.clampZoom(z)
      this.tx = rect.width / 2 - m.x_ratio * this.imageW * this.zoom
      this.ty = rect.height / 2 - m.y_ratio * this.imageH * this.zoom
      this.emitZoom()
      this.$emit('marker-click', m)
    },

    /* ---------- 渲染 ---------- */

    // 图标在底图上的位置：比例 × 底图尺寸，落在舞台坐标系里，由舞台统一缩放平移
    markerStyle(m) {
      return {
        left: (m.x_ratio * this.imageW) + 'px',
        top: (m.y_ratio * this.imageH) + 'px'
      }
    },

    handleDbClick(e) {
      if (e.target.closest && e.target.closest('.wifi-map__marker')) return
      this.fit()
    }
  }
}
</script>

<style scoped>
.wifi-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #eef1f6;
  background-image:
    linear-gradient(45deg, #e6eaf1 25%, transparent 25%),
    linear-gradient(-45deg, #e6eaf1 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e6eaf1 75%),
    linear-gradient(-45deg, transparent 75%, #e6eaf1 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  cursor: grab;
  user-select: none;
}

.wifi-map.is-panning {
  cursor: grabbing;
}

.wifi-map.is-tile {
  background-color: #fbfcfe;
  background-image: none;
}

.wifi-map__stage {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.wifi-map__image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

/* 舞台缩放时图标层的子元素一并变换；图标在 marker-inner 里反向缩放抵消 */
.wifi-map__marker {
  position: absolute;
  width: 0;
  height: 0;
}

.wifi-map__marker-inner {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.wifi-map.is-editing .wifi-map__marker-inner >>> .ap-icon__pin-wrap {
  cursor: move;
}

.wifi-map__empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #b1b6bd;
}

.wifi-map__empty i {
  font-size: 54px;
}

.wifi-map__empty p {
  margin: 10px 0 0;
  font-size: 14px;
}

.wifi-map__zoom {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
}

.wifi-map__zoom-value {
  font-size: 12px;
  color: #606266;
  min-width: 38px;
  text-align: right;
}

.wifi-map__legend {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  gap: 14px;
  background: rgba(255, 255, 255, 0.92);
  padding: 5px 10px;
  border-radius: 4px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  color: #606266;
}

.wifi-map__legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.wifi-map__legend .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.is-ok { background: #67c23a; }
.dot.is-warn { background: #e6a23c; }
.dot.is-bad { background: #f56c6c; }
.dot.is-off { background: #b1b6bd; }
</style>
