<template>
  <div class="nested-collapse-alarm-list-container">
    <!-- 外层列表（IP、设备名） -->
    <ul class="outer-alarm-list">
      <li
        class="outer-list-item"
        v-for="(outerItem, outerIndex) in formattedOuterList"
        :key="outerItem.ip+outerItem.hostname || outerIndex"
        v-if="outerItem"
      >
        <!-- 外层表层（多选框、设备名、IP、告警汇总、折叠按钮） -->
        <div class="outer-item-header" @click="toggleOuterExpand(outerIndex)">
          <!-- 外层多选框 -->
          <input
            type="checkbox"
            class="outer-checkbox"
            v-model="selectedOuterItems"
            :value="getOuterItemUniqueKey(outerItem)"
            @click.stop
            @change="handleOuterCheckChange(outerItem, outerIndex)"
          >
          <!-- 外层表层内容：设备名为主，IP 次之。vendor/hardware 是 L4
               富化结果，排查时不用再现查 devices 表 -->
          <div class="outer-header-content">
            <span class="hostname-field" :title="outerItem.hostname || '未知设备名'">
              {{ outerItem.hostname || '未知设备名' }}
            </span>
            <span class="ip-field" :title="outerItem.ip || '未知IP'">{{ outerItem.ip || '未知IP' }}</span>
            <span class="hardware-field" v-if="outerItem.vendor || outerItem.hardware">
              {{ [outerItem.vendor, outerItem.hardware].filter(Boolean).join(' ') }}
            </span>
          </div>
          <!-- 不展开也能看到这台设备下有什么。summary 在 initFormattedList
               里算好挂上来，不在模板里反复调方法 -->
          <div class="outer-summary" v-if="outerItem.summary">
            <span class="sum-badge sum-p1" v-if="outerItem.summary.p1">P1×{{ outerItem.summary.p1 }}</span>
            <span class="sum-badge sum-p2" v-if="outerItem.summary.p2">P2×{{ outerItem.summary.p2 }}</span>
            <span class="sum-badge sum-p3" v-if="outerItem.summary.p3">P3×{{ outerItem.summary.p3 }}</span>
            <span class="sum-badge sum-muted" v-if="outerItem.summary.muted">静默×{{ outerItem.summary.muted }}</span>
            <span class="sum-total">共 {{ outerItem.summary.total }} 条</span>
          </div>
          <!-- 按设备看这段时间的全部日志。和子项那个"查看详情"不一样：
               那个只给某条告警自己的日志（按指纹），这个把窗口内这台设备
               所有进了管线的日志都拉出来，包括没产生告警的 -->
          <el-button
            class="outer-log-btn"
            type="info"
            icon="el-icon-document"
            size="mini"
            plain
            @click.stop="viewDeviceLogs(outerItem)"
          >全部日志</el-button>
          <!-- 外层折叠/展开按钮 -->
          <div class="outer-toggle-btn" :class="{ active: outerItem.isExpanded || false }">
            ▶
          </div>
        </div>

        <!-- 内层列表（展开后，子项多选） -->
        <div class="inner-list-container" :class="{ show: outerItem.isExpanded || false }">
          <ul class="inner-alarm-list" v-if="outerItem.children && outerItem.children.length > 0">
            <li
              class="inner-list-item"
              v-for="(innerItem, innerIndex) in outerItem.children"
              :key="innerItem.alarm_id || innerIndex"
              v-if="innerItem"
            >
              <!-- 内层子项多选框 -->
              <input
                type="checkbox"
                class="inner-checkbox"
                v-model="selectedInnerItems"
                :value="getInnerItemUniqueKey(innerItem)"
                @click.stop
              >
              <!-- 内层子项内容：第一行徽标+告警对象+操作，第二行弱化的明细 -->
              <div class="inner-item-content">
                <div class="inner-main-row">
                  <span class="severity-tag" :class="'severity-' + innerItem.severity">
                    {{ severityText(innerItem.severity) }}
                  </span>
                  <!-- status=5（系统判定忽略）的 state 是 idle，不是 open/clear 的
                       二元状态——它从来没"告警"过，不能套用 clear 的文案 -->
                  <span v-if="String(innerItem.status) === '5'" class="state-tag state-ignored">
                    已忽略
                  </span>
                  <span v-else class="state-tag" :class="innerItem.state === 'open' ? 'state-open' : 'state-clear'">
                    {{ innerItem.state === 'open' ? '告警' : '恢复' }}
                  </span>
                  <span class="muted-tag" v-if="Number(innerItem.muted) === 1">静默中</span>
                  <span class="alarm-object" :title="innerItem.alarm_object || '-'">
                    {{ innerItem.alarm_object || '-' }}
                  </span>
                  <!-- object_alias 是 L4 查到的对象描述，目前只有接口对象会有值
                       （端口描述），其它对象类型是空串，不展示 -->
                  <span class="object-alias" v-if="innerItem.object_alias" :title="innerItem.object_alias">
                    {{ innerItem.object_alias }}
                  </span>
                  <span class="inner-main-spacer"></span>
                  <el-button
                    v-for="(menu_item, menu_idx) in menuList"
                    :type="menu_item['type']?menu_item['type']:'primary'"
                    :icon="menu_item['icon']" size="mini"
                    :key="menu_item['name']"
                    @click="submit_action(menu_item['name'],innerItem)" circle></el-button>
                </div>
                <div class="inner-meta-row">
                  <span class="meta-code" :title="innerItem.keyword || '-'">{{ innerItem.keyword || '-' }}</span>
                  <span class="meta-sep">·</span>
                  <span>{{ innerItem.counter || 0 }} 条</span>
                  <span class="meta-sep">·</span>
                  <span>{{ formatRange(innerItem.first_seen, innerItem.last_seen) }}</span>
                  <span class="meta-sep">·</span>
                  <span :class="{ 'meta-pending': String(innerItem.status) === '0' }">
                    {{ statusText(innerItem.status) }}
                  </span>
                </div>
              </div>
            </li>
          </ul>
          <!-- 内层无数据提示 -->
          <div class="inner-empty-tip" v-else>暂无子告警数据</div>
        </div>
      </li>
    </ul>

    <!-- 已选状态汇总 -->
    <div class="selected-summary" v-if="showSelectedSummary">
      <span class="outer-selected-text">已选设备：{{ selectedOuterItems.length }} 个</span>
      <span class="inner-selected-text">已选告警子项：{{ selectedInnerItems.length }} 个</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NestedCollapseAlarmList',
  props: {
    // 父组件传入的嵌套列表数据源（必传）
    listData: {
      type: Array,
      required: true,
      validator: (value) => {
        // 兼容空数组，非空时校验外层核心字段
        if (value.length === 0) return true;
        return value.every(item => item.hasOwnProperty('ip') && item.hasOwnProperty('hostname'));
      }
    },
    // 是否展示已选状态汇总（可选，默认展示）
    showSelectedSummary: {
      type: Boolean,
      default: true
    },
    // 父组件传递的折叠状态缓存（{ ip: isExpanded, ... }）
    collapsedStateCache: {
      type: Object,
      default: () => ({})
    },
    //自定义菜单
    menuList:{
      type: Array,
      default: () => ([]),
      validator: (value) => {
        // 兼容空数组，非空时校验外层核心字段
        if (value.length === 0) return true;
        return value.every(item => item.hasOwnProperty('icon') && item.hasOwnProperty('name'));
      }
    }
  },
  data() {
    return {
      // 已选中的外层设备（IP 唯一标识）
      selectedOuterItems: [],
      // 已选中的内层子告警（group_label 唯一标识）
      selectedInnerItems: [],
      // 格式化后的外层列表（添加折叠状态，响应式）
      formattedOuterList: []
    };
  },
  created() {
    // 初始化格式化嵌套列表数据
    this.initFormattedList(this.listData);
  },
  watch: {
    // 监听折叠状态缓存变化，同步更新子组件内部状态
    collapsedStateCache: {
      handler(newCache) {
        this.syncCollapsedState(newCache);
      },
      deep: true,
      immediate: true
    },
    selectedOuterItems: {
      handler(newVal) {
        this.$emit('outer-select-change', newVal);
        this.emitAllSelectedData();
      },
      deep: true
    },
    selectedInnerItems: {
      handler(newVal) {
        this.$emit('inner-select-change', newVal);
        this.emitAllSelectedData();
      },
      deep: true
    },
    // 深度监听父组件传入的 listData 变化，同步更新格式化数据
    listData: {
      handler(newVal) {
        // 1. 先保存当前有效数据的 ip 列表（用于后续过滤有效选中状态）
        const validIps = newVal.map(item => item.ip) || [];

        // 2. 初始化格式化列表（此时已从缓存还原 isExpanded）
        this.initFormattedList(newVal);

        // 3. 优化：仅清空无效数据的选中状态（保留有效数据的选中状态，可选）
        // 过滤外层已选状态，仅保留仍存在的 ip
        this.selectedOuterItems = this.selectedOuterItems.filter(ip => validIps.includes(ip));

        // 过滤内层已选状态（先汇总所有有效内层数据的 group_label）
        const validInnerLabels = newVal.flatMap(item =>
          (item.children || []).map(inner => inner.group_label)
        );
        this.selectedInnerItems = this.selectedInnerItems.filter(label => validInnerLabels.includes(label));

        // 若业务需求是数据更新后直接清空所有已选，保留下面两行即可（注释上面的过滤逻辑）
        // this.selectedOuterItems = [];
        // this.selectedInnerItems = [];
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    /**
     * 初始化/更新格式化嵌套列表数据（为外层添加 isExpanded 折叠状态）
     * @param {Array} rawList 原始嵌套列表数据
     */
    initFormattedList(rawList) {
      if (!Array.isArray(rawList)) {
        this.formattedOuterList = [];
        return;
      }
      // 映射原始数据，从 collapsedStateCache 中读取对应 ip 的 isExpanded 状态
      const formatted = rawList.map(outerItem => {
        // 关键：优先使用父组件缓存的折叠状态，无缓存则默认 false（不再硬编码覆盖）
        const cachedExpandedState = this.collapsedStateCache[outerItem.ip] || false;
        return {
          ...outerItem,
          isExpanded: cachedExpandedState, // 从缓存还原，而非直接赋值 false
          summary: this.deviceSummary(outerItem)
        };
      });

      this.formattedOuterList = formatted;
    },
    /**
     * 同步父组件传递的折叠状态缓存
     * @param {Object} cache 折叠状态缓存对象
     */
    syncCollapsedState(cache) {
      if (!cache || !Array.isArray(this.formattedOuterList) || this.formattedOuterList.length === 0) {
        return;
      }

      // 遍历格式化列表，更新 isExpanded 为缓存中的最新状态。
      // 缓存里有这个 ip 就按缓存的值来（包括 false）——原来写
      // cache[ip] || isExpanded || false，已展开的项再被置成 false 时
      // 会被自己的旧值顶掉，父组件的"全部折叠"按钮按不动
      this.formattedOuterList = this.formattedOuterList.map(outerItem => ({
        ...outerItem,
        isExpanded: Object.prototype.hasOwnProperty.call(cache, outerItem.ip)
          ? !!cache[outerItem.ip]
          : (outerItem.isExpanded || false)
      }));
    },

    /**
     * 单台设备下的告警汇总，不展开也能看到里面有什么
     * @param {Object} outerItem 外层列表项
     * @returns {Object} { p1, p2, p3, muted, pending, total }
     */
    deviceSummary(outerItem) {
      const children = (outerItem && outerItem.children) || [];
      const summary = { p1: 0, p2: 0, p3: 0, muted: 0, pending: 0, total: children.length };
      children.forEach(item => {
        const key = 'p' + (Number(item.severity) || 3);
        if (summary[key] !== undefined) summary[key] += 1;
        if (Number(item.muted) === 1) summary.muted += 1;
        if (String(item.status) === '0') summary.pending += 1;
      });
      return summary;
    },

    /**
     * 按设备看全部日志：算出这组告警的时间窗口，交给父组件去查
     *
     * 窗口取这台设备所有子告警的最早 first_seen ~ 最晚 last_seen/clear_time，
     * 两头各放宽 30 秒 —— 要看的恰恰是告警前后那几条伴生日志（速率协商、
     * 双工变化），卡死在告警时间上就把它们切掉了。
     *
     * 后端限了跨度 1 天，所以这里不用再截，但窗口超过 1 天时后端会拒绝，
     * 这种情况只会出现在历史告警页按大范围筛选之后 —— 那时让用户把筛选
     * 条件收窄比在这里偷偷截断更清楚
     */
    viewDeviceLogs(outerItem) {
      const children = (outerItem && outerItem.children) || [];
      if (children.length === 0) return;

      const pad = 30;
      let start = null;
      let end = null;
      children.forEach(item => {
        const first = Number(item.first_seen) || 0;
        // 已恢复的取 clear_time，还在告警的取 last_seen
        const last = Number(item.clear_time) || Number(item.last_seen) || first;
        if (first > 0 && (start === null || first < start)) start = first;
        if (last > 0 && (end === null || last > end)) end = last;
      });
      if (start === null || end === null) return;

      this.$emit('view-device-logs', {
        ip: outerItem.ip,
        hostname: outerItem.hostname,
        start_ts: start - pad,
        end_ts: end + pad
      });
    },

    /**
     * 时间范围：同一天只在末端显示时分秒，跨天两头都带日期
     */
    formatRange(first, last) {
      const start = this.formatTimestamp(first, true);
      if (!last || String(last) === String(first)) return start;
      const sameDay = new Date(Number(first) * 1000).toDateString()
        === new Date(Number(last) * 1000).toDateString();
      return start + ' ~ ' + this.formatTimestamp(last, !sameDay);
    },

    /**
     * 切换外层列表项的折叠/展开状态
     * @param {Number} outerIndex 外层列表项索引
     */
    toggleOuterExpand(outerIndex) {
      if (outerIndex < 0 || outerIndex >= this.formattedOuterList.length) return;

      const currentOuterItem = this.formattedOuterList[outerIndex];
      const newIsExpanded = !currentOuterItem.isExpanded;

      // 更新子组件内部状态（保证响应式）
      this.$set(this.formattedOuterList, outerIndex, {
        ...currentOuterItem,
        isExpanded: newIsExpanded
      });

      // 向父组件上报折叠状态变化
      this.$emit('collapsed-state-change', {
        ip: currentOuterItem.ip,
        isExpanded: newIsExpanded
      });
    },

    /**
     * 处理外层多选框变化（可选：联动内层全选/取消全选）
     * @param {Object} outerItem 外层列表项数据
     * @param {Number} outerIndex 外层列表项索引
     */
    handleOuterCheckChange(outerItem, outerIndex) {
      // 可选功能：勾选外层时，自动勾选该外层下所有内层子项
      const innerItems = outerItem.children || [];
      const innerKeys = innerItems.map(item => this.getInnerItemUniqueKey(item));

      // 判断外层是否被选中，同步处理内层子项
      const outerKey = this.getOuterItemUniqueKey(outerItem);
      const isOuterSelected = this.selectedOuterItems.includes(outerKey);

      if (isOuterSelected) {
        // 勾选外层：添加所有内层子项到已选列表（去重）
        innerKeys.forEach(key => {
          if (!this.selectedInnerItems.includes(key)) {
            this.selectedInnerItems.push(key);
          }
        });
      } else {
        // 取消外层：移除所有内层子项从已选列表
        this.selectedInnerItems = this.selectedInnerItems.filter(key => !innerKeys.includes(key));
      }
    },

    /**
     * 获取外层列表项的唯一标识
     * @param {Object} outerItem 外层列表项数据
     * @returns {String} 唯一标识（优先使用 IP）
     */
    getOuterItemUniqueKey(outerItem) {
      if (!outerItem) return '';
      return outerItem.ip || `${outerItem.hostname || '未知设备'}-${Math.random().toString(36).substr(2, 8)}`;
    },

    /**
     * 获取内层子项的唯一标识
     * @param {Object} innerItem 内层子项数据
     * @returns {String} 唯一标识（优先使用 alarm_id）
     */
    getInnerItemUniqueKey(innerItem) {
      if (!innerItem) return '';
      return innerItem.alarm_id || `${innerItem.alarm_object || '未知对象'}-${Math.random().toString(36).substr(2, 8)}`;
    },

    severityText(severity) {
      const map = { 1: 'P1', 2: 'P2', 3: 'P3' };
      return map[Number(severity)] || 'P3';
    },

    statusText(status) {
      const map = { '0': '待处理', '1': '已确认', '2': '已处理', '3': '忽略', '4': '屏蔽', '5': '系统判定忽略' };
      return map[String(status)] || '待处理';
    },

    /**
     * 时间戳格式化
     * @param {Number} timestamp 10 位时间戳
     * @param {Boolean} withDate 是否带月-日前缀
     * @returns {String} 格式化后的时间
     */
    formatTimestamp(timestamp, withDate) {
      if (!timestamp || isNaN(timestamp)) return '未知时间';
      const date = new Date(Number(timestamp) * 1000); // 10 位时间戳转毫秒
      const pad = (n) => n.toString().padStart(2, '0');
      const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      if (!withDate) return clock;
      return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${clock}`;
    },

    // 原有汇总数据发射方法（不变）
    emitAllSelectedData() {
      const allSelected = {
        outer: [...this.selectedOuterItems],
        inner: [...this.selectedInnerItems]
      };
      this.$emit('all-select-change', allSelected);
    },

    submit_action(key, data){
      this.$emit('bnt_event', key, data);
    },
  }
};
</script>

<style scoped>
/* 外层容器样式 */
.nested-collapse-alarm-list-container {
  width: 100%;
  max-width: 1400px;
  padding: 5px;
  box-sizing: border-box;
}

/* 外层列表容器 */
.outer-alarm-list {
  list-style: none;
  padding: 0;
  margin: 0 0 10px 0;
}

/* 外层列表项样式 */
.outer-list-item {
  margin-bottom: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease-in-out;
}

.outer-list-item:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 外层列表项头部 */
.outer-item-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  position: relative;
}

/* 外层多选框样式 */
.outer-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 15px;
  cursor: pointer;
  accent-color: #409eff;
}

/* 外层表层内容：设备名为主，IP 次之 */
.outer-header-content {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  color: #333333;
}

.hostname-field {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-field {
  font-size: 12px;
  color: #909399;
  font-family: "Consolas", "Monaco", "Menlo", monospace;
}

.hardware-field {
  font-size: 12px;
  color: #909399;
  padding: 1px 6px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  white-space: nowrap;
}

/* 设备头部的告警汇总 */
.outer-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

.sum-badge {
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
}

.sum-p1 { background-color: #f56c6c; }
.sum-p2 { background-color: #e6a23c; }
.sum-p3 { background-color: #909399; }
.sum-muted { background-color: #c0c4cc; }

.sum-total {
  font-size: 12px;
  color: #909399;
  margin-left: 2px;
  white-space: nowrap;
}

/* 设备级"全部日志"按钮，和折叠箭头之间留点距离 */
.outer-log-btn {
  margin-right: 10px;
  flex-shrink: 0;
}

/* 外层折叠/展开按钮 */
.outer-toggle-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.outer-toggle-btn.active {
  transform: rotate(90deg);
  color: #409eff;
}

/* 内层列表容器 */
.inner-list-container {
  padding: 0 20px 15px;
  border-top: 1px dashed #e4e7ed;
  background-color: #fafbfc;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  display: none;
  animation: fadeIn 0.3s ease-in-out;
}

.inner-list-container.show {
  display: block;
}

/* 内层列表 */
.inner-alarm-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 内层列表项 */
.inner-list-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 12px;
  background-color: #ffffff;
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.inner-list-item:hover {
  border-color: #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

/* 内层多选框 */
.inner-checkbox {
  width: 16px;
  height: 16px;
  margin-right: 12px;
  margin-top: 4px;
  cursor: pointer;
  accent-color: #409eff;
  flex-shrink: 0;
}

/* 内层子项内容：两行卡片 */
.inner-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

/* 第一行：徽标 + 告警对象 + 操作按钮 */
.inner-main-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.inner-main-spacer {
  flex: 1;
}

.alarm-object {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-left: 2px;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Consolas", "Monaco", "Menlo", monospace;
}

.object-alias {
  font-size: 12px;
  color: #909399;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 第二行：弱化的明细 */
.inner-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.meta-code {
  color: #606266;
  font-weight: 500;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-sep {
  color: #dcdfe6;
}

/* 待处理高亮一下，扫视时能分出哪些还没人看 */
.meta-pending {
  color: #e6a23c;
  font-weight: 500;
}

/* 内层无数据提示 */
.inner-empty-tip {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: #909399;
}

/* 级别/状态徽标 */
.severity-tag, .state-tag, .muted-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 级别用实心，最刺眼的留给 P1 */
.severity-tag {
  color: #ffffff;
  font-weight: 600;
}

.severity-1 { background-color: #f56c6c; }
.severity-2 { background-color: #e6a23c; }
.severity-3 { background-color: #909399; }

/* 状态用描边，和级别区分开，不然一行里两块实心色块分不清谁是谁 */
.state-tag {
  background-color: transparent;
  border: 1px solid;
}

.state-open { color: #f56c6c; border-color: #fbc4c4; background-color: #fef0f0; }
.state-clear { color: #67c23a; border-color: #c2e7b0; background-color: #f0f9eb; }
.state-ignored { color: #909399; border-color: #e4e7ed; background-color: #f4f4f5; }

.muted-tag {
  color: #909399;
  border: 1px solid #e4e7ed;
  background-color: #f4f4f5;
}

/* 已选状态汇总 */
.selected-summary {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
}

.outer-selected-text, .inner-selected-text {
  color: #409eff;
  font-weight: 500;
}

/* 展开动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
