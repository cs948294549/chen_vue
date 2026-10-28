<template>
  <div class="wifi-toolbar">
    <!-- 建筑 → 楼层 两级切换 -->
    <div class="wifi-toolbar__group">
      <el-select
        v-model="building"
        size="mini"
        placeholder="建筑"
        class="wifi-toolbar__building"
        @change="syncSelection">
        <el-option v-for="b in buildingOptions" :key="b.value" :label="b.label" :value="b.value"></el-option>
      </el-select>

      <!-- 多选：可同时平铺查看多张楼层图 -->
      <el-checkbox-group v-model="ids" size="mini" @change="handleIdsChange">
        <el-checkbox-button v-for="m in currentMaps" :key="m.map_id" :label="m.map_id">
          {{ m.map_name }}
        </el-checkbox-button>
      </el-checkbox-group>

      <el-button type="text" size="mini" @click="toggleAll">{{ allSelected ? '取消全选' : '全选' }}</el-button>
    </div>

    <div class="wifi-toolbar__spacer"></div>

    <!-- 状态筛选 -->
    <el-select v-model="filter" size="mini" class="wifi-toolbar__filter" @change="$emit('filter-change', filter)">
      <el-option label="全部 AP" value="all"></el-option>
      <el-option label="仅在线" value="online"></el-option>
      <el-option label="仅离线" value="offline"></el-option>
      <el-option label="仅高负载（利用率 > 70%）" value="alarm"></el-option>
    </el-select>

    <!-- 搜索定位 -->
    <el-select
      v-model="searchValue"
      size="mini"
      filterable
      clearable
      placeholder="搜索 AP 名称 / MAC"
      class="wifi-toolbar__search"
      @change="handleSearch">
      <el-option
        v-for="m in markers"
        :key="m.ap_mac"
        :label="(m.display_name || m.ap_name) + ' · ' + m.ap_mac"
        :value="m.ap_mac">
      </el-option>
    </el-select>

    <!-- 数据时间 + 刷新 -->
    <div class="wifi-toolbar__time" v-if="dataTime">
      <i class="el-icon-time"></i>
      <span>数据时间 {{ dataTime }}</span>
      <span class="wifi-toolbar__ago">（{{ agoText }}刷新）</span>
    </div>

    <el-select v-model="autoRefresh" size="mini" class="wifi-toolbar__auto" @change="handleAutoChange">
      <el-option label="自动刷新：关闭" :value="0"></el-option>
      <el-option label="自动刷新：30 秒" :value="30"></el-option>
      <el-option label="自动刷新：1 分钟" :value="60"></el-option>
    </el-select>

    <el-button size="mini" icon="el-icon-refresh" :loading="loading" @click="$emit('refresh')">刷新</el-button>
  </div>
</template>

<script>
const ALL = '__all__'

export default {
  name: 'WifiMapToolbar',

  props: {
    mapList: { type: Array, default: () => [] },   // [{building, maps:[{map_id, map_name, ...}]}]
    selectedIds: { type: Array, default: () => [] },
    markers: { type: Array, default: () => [] },
    dataTime: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    lastRefreshAt: { type: Number, default: 0 }
  },

  data() {
    return {
      building: '',
      ids: [],
      filter: 'all',
      searchValue: '',
      autoRefresh: 0,   // 默认关闭：不再定时拉取，只在手动点「刷新」时重取
      now: Date.now()
    }
  },

  computed: {
    buildings() {
      return this.mapList.map(g => g.building)
    },

    buildingOptions() {
      return [{ value: ALL, label: `全部建筑（${this.mapList.length}）` }]
        .concat(this.buildings.map(b => ({ value: b, label: b })))
    },

    // "全部建筑"时把每栋楼的楼层按建筑顺序摊平
    currentMaps() {
      if (this.building === ALL) {
        const rows = []
        this.mapList.forEach(g => g.maps.forEach(m => rows.push(m)))
        return rows
      }
      const group = this.mapList.find(g => g.building === this.building)
      return group ? group.maps : []
    },

    agoText() {
      if (!this.lastRefreshAt) return '--'
      const sec = Math.max(0, Math.floor((this.now - this.lastRefreshAt) / 1000))
      if (sec < 60) return sec + ' 秒前'
      return Math.floor(sec / 60) + ' 分钟前'
    },

    allSelected() {
      return this.currentMaps.length > 0 && this.currentMaps.every(m => this.ids.indexOf(m.map_id) >= 0)
    }
  },

  watch: {
    mapList: {
      immediate: true,
      handler() {
        this.syncBuilding()
      }
    },

    selectedIds: {
      immediate: true,
      handler(val) {
        this.ids = (val || []).slice()
      }
    }
  },

  mounted() {
    this.timer = setInterval(() => { this.now = Date.now() }, 1000)
    this.autoTimer = setInterval(() => this.tickAuto(), 1000)
    this.$emit('auto-change', this.autoRefresh)
  },

  beforeDestroy() {
    clearInterval(this.timer)
    clearInterval(this.autoTimer)
  },

  methods: {
    syncBuilding() {
      if (!this.mapList.length) return
      const current = this.mapList.find(g => g.maps.some(m => this.ids.indexOf(m.map_id) >= 0))
      if (current) {
        // 选中的楼层跨了多个建筑，就退到"全部建筑"
        const multi = this.mapList.filter(g => g.maps.some(m => this.ids.indexOf(m.map_id) >= 0))
        this.building = multi.length > 1 ? ALL : current.building
        return
      }
      // 首次进入不预选任何楼层，先落在第一个建筑上让楼层可选，由用户勾选后再加载
      if (!this.building) this.building = this.mapList[0].building
    },

    // 切换建筑只保留该建筑内已选中的楼层，不自动全选，避免一次拉取整栋楼的地图
    syncSelection() {
      const keep = this.ids.filter(id => this.currentMaps.some(m => m.map_id === id))
      if (keep.length === this.ids.length) return
      this.ids = keep
      this.$emit('ids-change', keep.slice())
    },

    handleIdsChange(val) {
      this.$emit('ids-change', val.slice())
    },

    toggleAll() {
      this.ids = this.allSelected ? [] : this.currentMaps.map(m => m.map_id)
      this.$emit('ids-change', this.ids.slice())
    },

    handleSearch(apMac) {
      if (apMac) this.$emit('locate', apMac)
    },

    handleAutoChange(val) {
      this.lastAutoAt = Date.now()
      this.$emit('auto-change', val)
    },

    tickAuto() {
      if (!this.autoRefresh) return
      const now = Date.now()
      if (!this.lastAutoAt) this.lastAutoAt = now
      if (now - this.lastAutoAt >= this.autoRefresh * 1000) {
        this.lastAutoAt = now
        this.$emit('refresh')
      }
    }
  }
}
</script>

<style scoped>
.wifi-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.wifi-toolbar__group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wifi-toolbar__building {
  width: 110px;
}

.wifi-toolbar__spacer {
  flex: 1;
  min-width: 20px;
}

.wifi-toolbar__filter {
  width: 190px;
}

.wifi-toolbar__search {
  width: 220px;
}

.wifi-toolbar__auto {
  width: 150px;
}

.wifi-toolbar__time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.wifi-toolbar__ago {
  color: #a8abb2;
}
</style>
