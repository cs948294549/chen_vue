<template>
  <div style="display: flex;justify-content: start;">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in $store.getters['tabnav/tabnavBox']" :key="item.path" :to="{ path: '/'+item.path }">{{item.title}}</el-breadcrumb-item>
    </el-breadcrumb>
    <i class="el-icon-refresh" style="margin-left: 6px;" @click="removeTab"></i>
  </div>
</template>

<script>
export default {
  data () {
    return {

    }
  },
  methods: {
    removeTab(){
      this.$store.dispatch("tabnav/clearTab")
    }
  }
}
</script>
