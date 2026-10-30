<template>
  <div class="footer">
    <span>Copyright © {{ year }} OPS 运维平台</span>
  </div>
</template>

<script>
export default {
  name: "Footer",
  data () {
    return {
      year: new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 32px;
  font-size: 12px;
  color: #909399;
  background-color: #f0f2f5;
  border-top: 1px solid #e4e7ed;
}
</style>
