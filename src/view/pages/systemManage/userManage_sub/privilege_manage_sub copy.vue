<template>
  <el-transfer
    v-model="value"
    :data="treeData"
    :render-content="renderTreeContent"
    @left-check-change="handleLeftChange"
    @change="handleTransferChange"
    title-texts="['树形源列表', '树形目标列表']"
    filterable
  ></el-transfer>
</template>

<script>
export default {
  data() {
    return {
      value: [], // 已选中的key集合
      treeData: [
        { key: '1', label: '一级分类1', level: 0, parentKey: ''},
        { key: '1-1', label: '二级分类1-1', level: 1, parentKey: '1' },
        { key: '1-2', label: '二级分类1-2', level: 1, parentKey: '1' },
        { key: '2', label: '一级分类2', level: 0, parentKey: '' },
        { key: '2-1', label: '二级分类2-1', level: 1, parentKey: '2' },
      ],
    };
  },
  methods: {
    // 自定义渲染树形选项
    renderTreeContent(h, option) {
      // 根据层级计算缩进（level * 20px）
      const indentStyle = {
        paddingLeft: `${option.level * 20}px`,
        display: 'inline-block',
      };
      // 层级图标（可选）
      const icon = option.level > 0
        ? h('i', { class: 'el-icon-menu', style: { marginRight: '4px' } })
        : h('i', { class: 'el-icon-folder', style: { marginRight: '4px' } });

      return h('span', [
        icon,
        h('span', { style: indentStyle }, option.label),
      ]);
    },
    getAllChildKeys(parentKey) {
      let childKeys = this.getChildKeys(parentKey);
      childKeys.forEach(key => {
        childKeys = [...childKeys, ...this.getAllChildKeys(key)];
      });
      return childKeys;
    },

    handleLeftChange(newVal, oldVal, direction, movedKeys){
      console.log("left change==", newVal, oldVal, direction, movedKeys)
    },

    handleTransferChange(newVal, oldVal, direction, movedKeys){
      console.log("change===",newVal, oldVal, direction, movedKeys)
      this.treeData.forEach((item)=>{
        console.log(item)
      })
    },
  },
};
</script>

<style scoped>
/* 调整穿梭框选项行高，适配树形样式 */
.el-transfer-panel__list .el-transfer-panel__item {
  height: auto;
  line-height: 24px;
  padding: 4px 10px;
}
</style>
