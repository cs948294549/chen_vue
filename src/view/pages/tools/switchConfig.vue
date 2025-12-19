<template>
  <!--前缀融合工具-->
	<div style="display: flex;overflow: auto;">
		<switchBlock style="width: 100%;height: 600px;" v-model="input_src" :readonly="false" :container="'c1'" ></switchBlock>
	</div>
</template>

<script>
  import switchBlock from '@/components/switchCli/switchPage.vue'

	export default {
	  name: 'tool_for_diff1',
	  data () {
		  return{
			  input_src:"",
		  }
	  },
    mounted(){
    },
	  methods:{
      submit_table(){
      }

	  },
    components:{
      switchBlock
    },

	}
</script>

<style>
</style>
