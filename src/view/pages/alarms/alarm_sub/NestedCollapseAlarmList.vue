<template>
  <div class="nested-collapse-alarm-list-container">
    <!-- 外层列表（IP、设备名） -->
    <ul class="outer-alarm-list">
      <li
        class="outer-list-item"
        v-for="(outerItem, outerIndex) in formattedOuterList"
        :key="outerItem.ip || outerIndex"
        v-if="outerItem"
      >
        <!-- 外层表层（多选框、IP、设备名、折叠按钮） -->
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
          <!-- 外层表层内容 -->
          <div class="outer-header-content">
            <span class="ip-field" :title="outerItem.ip || '未知IP'">IP：{{ outerItem.ip || '未知IP' }}</span>
            <span class="hostname-field" :title="outerItem.hostname || '未知设备名'">设备名：{{ outerItem.hostname || '未知设备名' }}</span>
          </div>
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
              :key="innerItem.group_label || innerIndex"
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
              <!-- 内层子项内容 -->
              <div class="inner-item-content">
                <!-- <div class="inner-detail-row">
                  <span class="detail-label">分组标签：</span>
                  <span class="detail-value" :title="innerItem.group_label || '未知'">{{ innerItem.group_label || '未知' }}</span>
                </div> -->
                <div class="inner-detail-row">
                  <span class="detail-label">告警类型：</span>
                  <span class="detail-value" :title="innerItem.alarm_type || '未知'">{{ innerItem.alarm_type || '未知' }}</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">分组名称：</span>
                  <span class="detail-value" :title="innerItem.group_name || '未知'">{{ innerItem.group_name || '未知' }}</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">告警对象：</span>
                  <span class="detail-value" :title="innerItem.alarm_object || '未知'">{{ innerItem.alarm_object || '未知' }}</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">关键字：</span>
                  <span class="detail-value" :title="innerItem.keyword || '未知'">{{ innerItem.keyword || '未知' }}</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">告警数量：</span>
                  <span class="detail-value">{{ innerItem.counter || 0 }} 条</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">时间范围：</span>
                  <span class="detail-value">{{ formatTimestamp(innerItem.start_time) }} - {{ formatTimestamp(innerItem.end_time) }}</span>
                </div>
                <div class="inner-detail-row">
                  <span class="detail-label">菜单：</span>
                  <el-button type="primary" icon="el-icon-view" size="mini" @click="show_detail(innerItem)" circle></el-button>
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
          isExpanded: cachedExpandedState // 从缓存还原，而非直接赋值 false
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

      // 遍历格式化列表，更新 isExpanded 为缓存中的最新状态
      this.formattedOuterList = this.formattedOuterList.map(outerItem => ({
        ...outerItem,
        isExpanded: cache[outerItem.ip] || outerItem.isExpanded || false
      }));
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
     * @returns {String} 唯一标识（优先使用 group_label）
     */
    getInnerItemUniqueKey(innerItem) {
      if (!innerItem) return '';
      return innerItem.group_label || `${innerItem.alarm_object || '未知对象'}-${Math.random().toString(36).substr(2, 8)}`;
    },

    /**
     * 时间戳格式化（转换为 Y-m-d H:i:s）
     * @param {Number} timestamp 10 位时间戳
     * @returns {String} 格式化后的时间
     */
    formatTimestamp(timestamp) {
      if (!timestamp || isNaN(timestamp)) return '未知时间';
      const date = new Date(timestamp * 1000); // 10 位时间戳转毫秒
      return date.toLocaleString('zh-CN', {
        // year: 'numeric',
        // month: '2-digit',
        // day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-');
    },

    // 原有汇总数据发射方法（不变）
    emitAllSelectedData() {
      const allSelected = {
        outer: [...this.selectedOuterItems],
        inner: [...this.selectedInnerItems]
      };
      this.$emit('all-select-change', allSelected);
    },

    //查看详情
    show_detail(item){
      this.$emit('show-item', item);
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

/* 外层表层内容 */
.outer-header-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333333;
}

.ip-field {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.hostname-field {
  font-size: 14px;
  color: #606266;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  padding: 12px;
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
  margin-top: 3px;
  cursor: pointer;
  accent-color: #409eff;
}

/* 内层子项内容 */
.inner-item-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 15px 25px;
  font-size: 13px;
}

.inner-detail-row {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.detail-label {
  color: #909399;
  margin-right: 8px;
  white-space: nowrap;
}

.detail-value {
  color: #333333;
  font-weight: 500;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内层无数据提示 */
.inner-empty-tip {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: #909399;
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
