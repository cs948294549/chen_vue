<template>
  <div class="Page403">
    <div :bordered="false">
      <p slot="title">403</p>
      <p>page not privalige</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Page404"
}
</script>

<style lang="less" scoped>
.Page403 {
  background: #eee;
  padding: 20px;
  text-align: center;
}
</style>
