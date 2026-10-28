<template>
  <div class="wifi-edit">
    <!-- ============ 左：地图列表 ============ -->
    <div class="wifi-edit__side wifi-edit__maps">
      <div class="panel-head">
        <span>地图列表</span>
        <el-button type="primary" size="mini" icon="el-icon-plus" @click="openInfoDialog(null)">新增</el-button>
      </div>
      <div class="panel-body">
        <div v-for="g in mapList" :key="g.building" class="map-group">
          <div class="map-group__title"><i class="el-icon-office-building"></i>{{ g.building }}</div>
          <div
            v-for="m in g.maps"
            :key="m.map_id"
            class="map-item"
            :class="{ 'is-active': m.map_id === mapId }"
            @click="selectMap(m.map_id)">
            <span class="map-item__name">{{ m.map_name }}</span>
            <span class="map-item__count">{{ m.ap_count }} AP</span>
            <span class="map-item__ops">
              <i class="el-icon-edit" title="编辑属性" @click.stop="openInfoDialog(m)"></i>
              <i class="el-icon-delete" title="删除地图" @click.stop="handleDeleteMap(m)"></i>
            </span>
          </div>
        </div>
        <el-empty v-if="!mapList.length" description="暂无地图，请先新增" :image-size="60"></el-empty>
      </div>
    </div>

    <!-- ============ 中：地图画布 ============ -->
    <div class="wifi-edit__main">
      <div class="wifi-edit__bar">
        <span class="wifi-edit__title">{{ map ? map.map_name : '未选择地图' }}</span>
        <el-tag v-if="map" size="mini" type="info">{{ map.building }}</el-tag>
        <el-tag v-if="dirty" size="mini" type="warning">未保存</el-tag>
        <span class="wifi-edit__tip">从右侧拖入或点击添加 AP · 拖动图标调整位置 · 点击图标选中</span>
        <div class="wifi-edit__spacer"></div>
        <!-- 尺寸：实际尺寸即库里的 image_width/height；缩放到合适大小后可设为新的实际尺寸，随保存布局落库 -->
        <span v-if="map && baseW" class="wifi-edit__size">
          实际 {{ baseW }}×{{ baseH }} · 当前显示 {{ viewSize.w }}×{{ viewSize.h }}
        </span>
        <el-tag v-if="pendingSize" size="mini" type="warning" closable @close="cancelPendingSize">
          新尺寸 {{ pendingSize.w }}×{{ pendingSize.h }}
        </el-tag>
        <el-button size="mini" icon="el-icon-crop" :disabled="!canApplySize" :title="sizeTip"
                   @click="applyViewSize">设为实际尺寸</el-button>
        <el-button size="mini" icon="el-icon-refresh-left" :disabled="!dirty" @click="handleReset">放弃修改</el-button>
        <el-button size="mini" type="primary" icon="el-icon-check" :disabled="!map || !dirty"
                   :loading="saving" @click="handleSave">保存布局</el-button>
      </div>
      <div
        class="wifi-edit__canvas"
        :class="{ 'is-drop-over': dropOver }"
        v-loading="loading"
        @dragover.prevent="dropOver = !!map"
        @dragleave="dropOver = false"
        @drop.prevent="handleDrop">
        <WifiMap
          ref="map"
          mode="edit"
          :map="map"
          :markers="markers"
          :selected-mac="selectedMac"
          @marker-move="handleMarkerMove"
          @marker-select="mac => selectedMac = mac"
          @zoom-change="handleZoomChange" />
      </div>
    </div>

    <!-- ============ 右：选中 AP + AP 池 ============ -->
    <div class="wifi-edit__side wifi-edit__pool">
      <div v-if="selectedMarker" class="sel-card">
        <div class="panel-head">
          <span>选中 AP</span>
          <i class="el-icon-close sel-card__close" @click="selectedMac = ''"></i>
        </div>
        <div class="sel-card__body">
          <div class="sel-card__name">{{ selectedMarker.ap_name || selectedMarker.display_name || selectedMarker.ap_mac }}</div>
          <div class="sel-card__mac mono">{{ selectedMarker.ap_mac }}{{ selectedMarker.ap_name ? '' : ' · AC 未上报名称' }}</div>
          <el-input
            v-model="selectedMarker.display_name"
            size="mini"
            clearable
            maxlength="64"
            placeholder="地图显示名（留空用 AP 名称）"
            @input="dirty = true" />
          <div class="sel-card__pos mono">
            X {{ (selectedMarker.x_ratio * 100).toFixed(1) }}% · Y {{ (selectedMarker.y_ratio * 100).toFixed(1) }}%
          </div>
          <div class="sel-card__ops">
            <el-button size="mini" icon="el-icon-aim" @click="$refs.map.focusMarker(selectedMarker.ap_mac)">定位</el-button>
            <el-button size="mini" type="danger" plain icon="el-icon-remove-outline"
                       @click="removeMarker(selectedMarker.ap_mac)">移出地图</el-button>
          </div>
        </div>
      </div>

      <div class="panel-head">
        <span>AP 列表</span>
        <el-checkbox v-model="onlyUnplaced" size="mini">仅未放置</el-checkbox>
      </div>
      <div class="pool-search">
        <el-input v-model="poolKeyword" size="mini" clearable prefix-icon="el-icon-search"
                  placeholder="搜索名称 / MAC / 分组" />
      </div>
      <div class="panel-body" v-loading="poolLoading">
        <div v-for="g in filteredPool" :key="g.ac_name" class="pool-group">
          <div class="pool-group__title"><i class="el-icon-cpu"></i>{{ g.ac_name }}<em>{{ g.aps.length }}</em></div>
          <div
            v-for="ap in g.aps"
            :key="ap.ap_mac"
            class="pool-item"
            :class="{ 'is-disabled': !map || onCurrent(ap.ap_mac) }"
            :draggable="!!map && !onCurrent(ap.ap_mac)"
            @dragstart="handleDragStart($event, ap)"
            @dragend="dropOver = false"
            @click="handlePoolClick(ap)">
            <i class="pool-item__dot" :class="'is-' + ap.online_status"></i>
            <div class="pool-item__main">
              <div class="pool-item__name">{{ ap.ap_name || ap.ap_mac }}</div>
              <div class="pool-item__sub mono">{{ ap.ap_group ? ap.ap_mac + ' · ' + ap.ap_group : ap.ap_mac }}</div>
              <div v-if="onCurrent(ap.ap_mac)" class="pool-item__placed is-here">已在本图</div>
              <div v-else-if="otherMaps(ap).length" class="pool-item__placed">
                已放置于 {{ otherMaps(ap).map(x => x.map_name).join('、') }}
              </div>
            </div>
            <i v-if="map && !onCurrent(ap.ap_mac)" class="el-icon-circle-plus-outline pool-item__add"></i>
          </div>
        </div>
        <el-empty v-if="!filteredPool.length && !poolLoading" description="没有匹配的 AP" :image-size="60"></el-empty>
      </div>
    </div>

    <!-- ============ 地图属性弹窗 ============ -->
    <el-dialog
      :title="infoForm.map_id ? '编辑地图' : '新增地图'"
      :visible.sync="infoVisible"
      width="480px"
      :close-on-click-modal="false"
      append-to-body>
      <el-form ref="infoForm" :model="infoForm" :rules="infoRules" label-width="90px" size="mini">
        <el-form-item label="地图名称" prop="map_name">
          <el-input v-model.trim="infoForm.map_name" maxlength="64" placeholder="如：C座 3F" />
        </el-form-item>
        <el-form-item label="所属建筑" prop="building">
          <el-autocomplete
            v-model.trim="infoForm.building"
            style="width: 100%;"
            :fetch-suggestions="queryBuildings"
            :trigger-on-focus="true"
            placeholder="选择已有建筑，或直接输入新建筑名"
            maxlength="32" />
          <div class="form-hint is-block">建筑没有单独的维护入口，这里输入一个新名称并保存，该建筑即被创建</div>
        </el-form-item>
        <el-form-item label="楼层排序" prop="sort_num">
          <el-input-number v-model="infoForm.sort_num" :min="-10" :max="200" controls-position="right" />
          <span class="form-hint">同建筑内从小到大排列</span>
        </el-form-item>
        <el-form-item label="底图" :required="!infoForm.map_id">
          <el-upload action="" :auto-upload="false" :show-file-list="false" accept="image/png,image/jpeg"
                     :on-change="handleImagePick">
            <el-button size="mini" icon="el-icon-upload2">选择图片</el-button>
          </el-upload>
          <div class="form-hint">PNG / JPG，不超过 {{ IMAGE_MAX_MB }}MB<span v-if="infoForm.map_id">；不选择则保留原底图</span></div>
          <img v-if="infoForm.image" :src="infoForm.image" class="info-preview" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="mini" @click="infoVisible = false">取消</el-button>
        <el-button size="mini" type="primary" :loading="infoSaving" @click="submitInfo">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import wifiApi from '@/api/mapis/wifi_interface'
import WifiMap from './wifi_components/WifiMap.vue'

const IMAGE_MAX_MB = 2
const SIZE_MIN = 100     // 设为实际尺寸时短边下限，太小图标会挤成一团
const SIZE_MAX = 10000   // 长边上限
const IMAGE_TYPES = ['image/png', 'image/jpeg']

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

export default {
  name: 'WifiMapEdit',

  components: { WifiMap },

  data() {
    return {
      IMAGE_MAX_MB,
      mapList: [],
      mapId: '',
      map: null,
      markers: [],
      snapshot: [],
      dirty: false,
      loading: false,
      saving: false,
      selectedMac: '',
      dropOver: false,

      zoom: 1,
      baseW: 0,          // 画布当前使用的实际尺寸（库里的宽高，缺失时为图片原始像素）
      baseH: 0,
      pendingSize: null, // 待保存的新实际尺寸 { w, h }

      pool: [],
      poolLoading: false,
      poolKeyword: '',
      onlyUnplaced: false,

      infoVisible: false,
      infoSaving: false,
      infoForm: { map_id: null, map_name: '', building: '', sort_num: 1, image: '', image_width: 0, image_height: 0 },
      infoRules: {
        map_name: [{ required: true, message: '请输入地图名称', trigger: 'blur' }],
        building: [{ required: true, message: '请选择或输入所属建筑', trigger: 'change' }]
      }
    }
  },

  computed: {
    selectedMarker() {
      return this.markers.find(m => m.ap_mac === this.selectedMac) || null
    },

    currentMacs() {
      const set = {}
      this.markers.forEach(m => { set[m.ap_mac] = true })
      return set
    },

    buildingOptions() {
      return this.mapList.map(g => g.building)
    },

    filteredPool() {
      const kw = this.poolKeyword.trim().toLowerCase()
      return this.pool.map(g => {
        const aps = g.aps.filter(ap => {
          if (this.onlyUnplaced && (this.onCurrent(ap.ap_mac) || this.otherMaps(ap).length)) return false
          if (!kw) return true
          return (ap.ap_name || '').toLowerCase().includes(kw) ||
            (ap.ap_mac || '').toLowerCase().includes(kw) ||
            (ap.ap_group || '').toLowerCase().includes(kw)
        })
        return { ac_name: g.ac_name, aps }
      }).filter(g => g.aps.length)
    },

    // 当前缩放下底图在屏幕上的像素尺寸，即"设为实际尺寸"会写入的值（等比）
    viewSize() {
      return { w: Math.round(this.baseW * this.zoom), h: Math.round(this.baseH * this.zoom) }
    },

    canApplySize() {
      if (!this.map || !this.baseW || !this.baseH) return false
      if (Math.abs(this.zoom - 1) < 0.01) return false
      const s = this.clampSize(this.viewSize.w, this.viewSize.h)
      const p = this.pendingSize
      return !(p && p.w === s.w && p.h === s.h)
    },

    sizeTip() {
      if (!this.map) return ''
      if (Math.abs(this.zoom - 1) < 0.01) return '当前就是实际尺寸，缩放后再设置'
      return '把当前显示大小设为底图实际尺寸（等比，AP 位置不变），点"保存布局"后生效'
    }
  },

  created() {
    this.loadMapList(true)
    this.loadPool()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  beforeRouteLeave(to, from, next) {
    if (!this.dirty) return next()
    this.$confirm('当前地图布局未保存，确定离开？', '提示', { type: 'warning' })
      .then(() => next())
      .catch(() => next(false))
  },

  methods: {
    /* ---------- 工具 ---------- */

    errMsg(err, fallback) {
      return (err && err.message) || fallback
    },

    onCurrent(apMac) {
      return !!this.currentMacs[apMac]
    },

    otherMaps(ap) {
      return (ap.placed_maps || []).filter(x => x.map_id !== this.mapId)
    },

    allMaps() {
      return this.mapList.reduce((arr, g) => arr.concat(g.maps), [])
    },

    // 有未保存修改时先确认，确认后才执行 fn
    confirmDiscard(fn) {
      if (!this.dirty) return fn()
      this.$confirm('当前地图布局未保存，确定放弃修改？', '提示', { type: 'warning' })
        .then(() => fn())
        .catch(() => {})
    },

    handleBeforeUnload(e) {
      if (!this.dirty) return
      e.preventDefault()
      e.returnValue = ''
    },

    /* ---------- 加载 ---------- */

    // autoPick：当前没有选中地图（或已被删除）时自动选第一张
    loadMapList(autoPick) {
      return wifiApi.getMapList().then(res => {
        this.mapList = (res.list || []).filter(g => g.maps && g.maps.length)
        const exists = this.allMaps().some(m => m.map_id === this.mapId)
        if (autoPick && !exists) {
          const first = this.allMaps()[0]
          if (first) this.loadDetail(first.map_id)
          else this.clearMap()
        }
      }).catch(err => {
        this.$message.error(this.errMsg(err, '加载地图列表失败'))
      })
    },

    loadPool() {
      this.poolLoading = true
      return wifiApi.getApPool().then(res => {
        this.pool = res.list || []
        this.poolLoading = false
      }).catch(err => {
        this.poolLoading = false
        this.$message.error(this.errMsg(err, '加载 AP 列表失败'))
      })
    },

    clearMap() {
      this.mapId = ''
      this.map = null
      this.markers = []
      this.snapshot = []
      this.dirty = false
      this.selectedMac = ''
      this.pendingSize = null
      this.baseW = 0
      this.baseH = 0
    },

    selectMap(mapId) {
      if (mapId === this.mapId) return
      this.confirmDiscard(() => this.loadDetail(mapId))
    },

    loadDetail(mapId) {
      this.mapId = mapId
      this.loading = true
      return wifiApi.getMapDetail(mapId).then(res => {
        // 切图期间旧请求晚到时丢弃
        if (mapId !== this.mapId) return
        this.markers = clone(res.markers || [])
        this.snapshot = clone(res.markers || [])
        this.map = res
        this.dirty = false
        this.selectedMac = ''
        this.pendingSize = null
        this.loading = false
      }).catch(err => {
        if (mapId !== this.mapId) return
        this.loading = false
        this.$message.error(this.errMsg(err, '加载地图失败'))
      })
    },

    /* ---------- 摆放 ---------- */

    handleMarkerMove({ ap_mac, x_ratio, y_ratio }) {
      const m = this.markers.find(x => x.ap_mac === ap_mac)
      if (!m) return
      m.x_ratio = x_ratio
      m.y_ratio = y_ratio
      this.selectedMac = ap_mac
      this.dirty = true
    },

    handleDragStart(e, ap) {
      if (!this.map || this.onCurrent(ap.ap_mac)) {
        e.preventDefault()
        return
      }
      e.dataTransfer.setData('text/plain', ap.ap_mac)
      e.dataTransfer.effectAllowed = 'copy'
    },

    handleDrop(e) {
      this.dropOver = false
      if (!this.map) return
      const mac = e.dataTransfer.getData('text/plain')
      const ap = this.findPoolAp(mac)
      if (!ap || this.onCurrent(mac)) return
      const pos = this.$refs.map.ratioAt(e.clientX, e.clientY)
      if (!pos) {
        this.$message.warning('请拖放到底图范围内')
        return
      }
      this.addMarker(ap, pos)
    },

    // 点击添加：放在当前视口中心，再由用户拖到准确位置
    handlePoolClick(ap) {
      if (!this.map || this.onCurrent(ap.ap_mac)) return
      this.addMarker(ap, this.$refs.map.centerRatio())
    },

    findPoolAp(apMac) {
      for (const g of this.pool) {
        const ap = g.aps.find(x => x.ap_mac === apMac)
        if (ap) return ap
      }
      return null
    },

    // 新拖入的 AP 没有射频快照，标签先只显示名称，保存后刷新详情补齐
    addMarker(ap, pos) {
      this.markers.push({
        ap_mac: ap.ap_mac,
        ap_name: ap.ap_name,
        display_name: '',
        x_ratio: pos.x_ratio,
        y_ratio: pos.y_ratio,
        online_status: ap.online_status,
        radio_count: 0,
        channels: [],
        bands: [],
        radios: [],       // 射频明细，保存后刷新详情才补齐
        utilization: null,
        tx_power: null,
        client_count: ap.client_count,
        last_seen_at: ''
      })
      this.selectedMac = ap.ap_mac
      this.dirty = true
    },

    removeMarker(apMac) {
      this.markers = this.markers.filter(m => m.ap_mac !== apMac)
      if (this.selectedMac === apMac) this.selectedMac = ''
      this.dirty = true
    },

    handleReset() {
      this.markers = clone(this.snapshot)
      this.selectedMac = ''
      this.pendingSize = null
      this.dirty = false
    },

    /* ---------- 实际尺寸 ---------- */

    // 画布用的尺寸以 WifiMap 为准：库里有宽高就用库里的，没有就是图片原始像素
    handleZoomChange(z) {
      this.zoom = z
      const comp = this.$refs.map
      if (comp) {
        this.baseW = comp.imageW
        this.baseH = comp.imageH
      }
    },

    // 等比夹紧：短边不低于 SIZE_MIN，长边不超过 SIZE_MAX
    clampSize(w, h) {
      if (!w || !h) return { w: 0, h: 0 }
      let k = 1
      if (Math.min(w, h) < SIZE_MIN) k = SIZE_MIN / Math.min(w, h)
      if (Math.max(w, h) * k > SIZE_MAX) k = SIZE_MAX / Math.max(w, h)
      return { w: Math.round(w * k), h: Math.round(h * k) }
    },

    // 只记下待保存的尺寸，随"保存布局"一起提交；坐标是比例值，等比改尺寸不影响 AP 位置
    applyViewSize() {
      if (!this.canApplySize) return
      const s = this.clampSize(this.viewSize.w, this.viewSize.h)
      if (s.w === this.baseW && s.h === this.baseH) {
        this.pendingSize = null
        return
      }
      this.pendingSize = s
      this.dirty = true
      this.$message.info(`实际尺寸将改为 ${s.w}×${s.h}，点"保存布局"后生效`)
    },

    // 撤销待保存尺寸；布局本身没改过时一并清掉未保存标记
    cancelPendingSize() {
      this.pendingSize = null
      if (JSON.stringify(this.markers) === JSON.stringify(this.snapshot)) this.dirty = false
    },

    handleSave() {
      if (!this.map || !this.dirty) return
      this.saving = true
      const payload = {
        map_id: this.mapId,
        version: this.map.version,
        markers: this.markers.map(m => ({
          ap_mac: m.ap_mac,
          x_ratio: m.x_ratio,
          y_ratio: m.y_ratio,
          display_name: (m.display_name || '').trim()
        }))
      }
      const resized = !!this.pendingSize
      if (resized) {
        payload.image_width = this.pendingSize.w
        payload.image_height = this.pendingSize.h
      }
      wifiApi.saveMap(payload).then(() => {
        this.saving = false
        this.dirty = false
        this.$message.success(resized ? '布局与实际尺寸已保存' : '布局已保存')
        const mapId = this.mapId
        this.loadDetail(mapId).then(() => {
          // 同一张图刷新不会自动适配，改了尺寸要手动 fit 一次，新尺寸下回到合适的显示比例
          if (!resized || mapId !== this.mapId) return
          this.$nextTick(() => this.$refs.map && this.$refs.map.fit())
        })
        this.loadMapList()
        this.loadPool()
      }).catch(err => {
        this.saving = false
        if (err && err.code === 409) {
          // 乐观锁冲突：只能放弃本地修改，重新加载服务端版本
          const reload = () => {
            this.dirty = false
            this.loadDetail(this.mapId)
          }
          this.$alert(err.message, '保存冲突', { type: 'warning' }).then(reload, reload)
          return
        }
        this.$message.error(this.errMsg(err, '保存失败'))
      })
    },

    /* ---------- 地图属性 ---------- */

    // 建筑下拉建议：只给提示，不限制输入；手打的新名字直接作为新建筑保存
    queryBuildings(query, cb) {
      const kw = (query || '').trim()
      cb(this.buildingOptions
        .filter(b => !kw || b === kw || b.includes(kw))
        .map(b => ({ value: b })))
    },

    openInfoDialog(m) {
      if (m) {
        this.infoForm = {
          map_id: m.map_id,
          map_name: m.map_name,
          building: m.building,
          sort_num: m.sort_num,
          image: '',
          image_width: 0,
          image_height: 0
        }
      } else {
        const building = (this.map && this.map.building) || this.buildingOptions[0] || ''
        const group = this.mapList.find(g => g.building === building)
        const maxSort = group ? Math.max(0, ...group.maps.map(x => x.sort_num || 0)) : 0
        this.infoForm = { map_id: null, map_name: '', building, sort_num: maxSort + 1, image: '', image_width: 0, image_height: 0 }
      }
      this.infoVisible = true
      this.$nextTick(() => this.$refs.infoForm && this.$refs.infoForm.clearValidate())
    },

    handleImagePick(file) {
      const raw = file.raw
      if (!raw) return
      if (!IMAGE_TYPES.includes(raw.type)) {
        this.$message.warning('仅支持 PNG / JPG 图片')
        return
      }
      if (raw.size > IMAGE_MAX_MB * 1024 * 1024) {
        this.$message.warning(`图片不能超过 ${IMAGE_MAX_MB}MB`)
        return
      }
      // 底图以 base64 存库，这里直接转 data URI 提交；顺带读出原始宽高，展示页按宽高比定行高
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        const img = new Image()
        const apply = (w, h) => {
          this.infoForm.image = dataUrl
          this.infoForm.image_width = w
          this.infoForm.image_height = h
        }
        img.onload = () => apply(img.naturalWidth || 0, img.naturalHeight || 0)
        // 读不出尺寸也照样提交，展示页按 0 走兜底比例
        img.onerror = () => apply(0, 0)
        img.src = dataUrl
      }
      reader.onerror = () => { this.$message.error('读取图片失败') }
      reader.readAsDataURL(raw)
    },

    submitInfo() {
      this.$refs.infoForm.validate(valid => {
        if (!valid) return
        const form = Object.assign({}, this.infoForm)
        if (!form.map_id && !form.image) {
          this.$message.warning('新增地图必须上传底图')
          return
        }
        this.infoSaving = true
        wifiApi.saveMapInfo(form).then(res => {
          this.infoSaving = false
          this.infoVisible = false
          this.$message.success('地图已保存')
          this.loadMapList().then(() => {
            if (!form.map_id) this.selectMap(res.map_id)
            else if (form.map_id === this.mapId) this.syncCurrentInfo()
          })
        }).catch(err => {
          this.infoSaving = false
          this.$message.error(this.errMsg(err, '保存失败'))
        })
      })
    },

    // 改了当前地图的属性后版本号会变，同步过来避免保存布局时误报冲突；
    // 未保存的布局修改保留，不覆盖
    syncCurrentInfo() {
      const mapId = this.mapId
      wifiApi.getMapDetail(mapId).then(res => {
        if (mapId !== this.mapId) return
        if (!this.dirty) {
          this.markers = clone(res.markers || [])
          this.snapshot = clone(res.markers || [])
          this.map = res
          return
        }
        this.map = Object.assign({}, this.map, {
          map_name: res.map_name,
          building: res.building,
          sort_num: res.sort_num,
          version: res.version,
          image_width: res.image_width,
          image_height: res.image_height,
          image: res.image
        })
      }).catch(() => {})
    },

    handleDeleteMap(m) {
      const tip = m.ap_count
        ? `删除地图「${m.map_name}」？图上已摆放的 ${m.ap_count} 个 AP 会被移除（AP 数据不受影响）`
        : `删除地图「${m.map_name}」？`
      this.$confirm(tip, '删除确认', { type: 'warning', confirmButtonText: '删除' })
        .then(() => wifiApi.deleteMap(m.map_id))
        .then(() => {
          this.$message.success('地图已删除')
          if (m.map_id === this.mapId) this.clearMap()
          // 删的是当前图时自动切到第一张
          this.loadMapList(true)
          this.loadPool()
        })
        .catch(err => {
          if (err === 'cancel' || err === 'close') return
          this.$message.error(this.errMsg(err, '删除失败'))
        })
    }
  }
}
</script>

<style scoped>
.wifi-edit {
  display: flex;
  gap: 8px;
  height: calc(100vh - 100px);
  padding: 10px;
  box-sizing: border-box;
  background: #f0f2f5;
}

.wifi-edit__side {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.wifi-edit__maps { width: 220px; }
.wifi-edit__pool { width: 260px; }

.wifi-edit__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wifi-edit__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #fff;
  border-radius: 4px;
}

.wifi-edit__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.wifi-edit__tip {
  margin-left: 8px;
  font-size: 12px;
  color: #b1b6bd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wifi-edit__spacer { flex: 1; }

.wifi-edit__size {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  margin-right: 4px;
}

.wifi-edit__canvas {
  flex: 1;
  min-height: 0;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.wifi-edit__canvas.is-drop-over {
  outline: 2px dashed #409eff;
  outline-offset: -2px;
}

/* 面板通用 */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 地图列表 */
.map-group__title {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 4px;
  font-size: 12px;
  color: #909399;
}

.map-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 22px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}

.map-item:hover { background: #f5f7fa; }

.map-item.is-active {
  background: #ecf5ff;
  color: #409eff;
}

.map-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.map-item__count {
  font-size: 12px;
  color: #909399;
}

.map-item__ops {
  display: none;
  gap: 6px;
  color: #909399;
}

.map-item:hover .map-item__ops { display: inline-flex; }
.map-item:hover .map-item__count { display: none; }
.map-item__ops i:hover { color: #409eff; }
.map-item__ops .el-icon-delete:hover { color: #f56c6c; }

/* 选中 AP 卡片 */
.sel-card { border-bottom: 1px solid #ebeef5; }

.sel-card__close {
  cursor: pointer;
  color: #909399;
}

.sel-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
}

.sel-card__name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.sel-card__mac,
.sel-card__pos { color: #909399; }

.sel-card__ops {
  display: flex;
  gap: 6px;
}

/* AP 池 */
.pool-search {
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
}

.pool-group__title {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px 4px;
  font-size: 12px;
  color: #909399;
}

.pool-group__title em {
  font-style: normal;
  margin-left: auto;
}

.pool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: grab;
}

.pool-item:hover { background: #f5f7fa; }

.pool-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pool-item__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pool-item__dot.is-online { background: #67c23a; }
.pool-item__dot.is-offline { background: #909399; }
.pool-item__dot.is-unknown { background: #dcdfe6; }

.pool-item__main {
  flex: 1;
  min-width: 0;
}

.pool-item__name {
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pool-item__sub {
  font-size: 12px;
  color: #909399;
}

.pool-item__placed {
  font-size: 12px;
  color: #e6a23c;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pool-item__placed.is-here { color: #409eff; }

.pool-item__add {
  color: #409eff;
  font-size: 16px;
}

/* 杂项 */
.mono {
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.form-hint.is-block {
  display: block;
  margin-left: 0;
  line-height: 1.5;
}

.info-preview {
  display: block;
  max-width: 100%;
  max-height: 160px;
  margin-top: 6px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
