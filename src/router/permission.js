// 权限
import router, { resetRouter } from '@/router';
import store from '@/vuex';
import Vue from 'vue';
const vueObj = new Vue();

router.beforeEach(async (to, from, next) => {
  if (store.getters["user/token"]&&store.getters["user/token"]!==undefined) {
    // console.log("token存在，判断路由是否加载", store.getters["user/token"])
    if (store.getters["user/routes"].length<=0) {
      // console.log("路由缺失，重新构建")
      try {
        await store.dispatch("user/getRoutes")
        resetRouter();
        const accessRoutes = store.getters["user/routes"]
        // console.log("重新加载路由==", accessRoutes)
        await router.addRoutes(accessRoutes);
        if(to.path === "/"){
          next({path: store.getters["user/routes"][0]["redirect"], query:to.query})
        }else{
          next({path: to.path, query:to.query})
        }
      } catch (error) {
        if(to.path === "/"){
          next({path: store.getters["user/routes"][0]["redirect"], query:to.query})
        }else{
          next(`/`);
        }
      }
    } else {
      // console.log("路由存在，判断去程路由是否存在", to.path )
      if(to.path === "/404"|to.path === "/Login"){
        next()
      }else if(to.path === "/"){
        next({path: store.getters["user/routes"][0]["redirect"], query:to.query})
      }else{
        let alive_route = store.getters["user/routes"][0]["children"]
        let is404 = true
        for(let i=0;i<alive_route.length;i++){
          if(to.path=="/"+alive_route[i].path){
            is404=false
            break
          }
        }
        if(is404){
          next({path: "/404"})
          return false
        }else{
          next()
        }
      }
    }
  } else {
    console.log("token不存在,进行用户认证添加token")
    if(to.path === "/404"|to.path === "/Login"){
      next()
    }else{
      next(`/Login`);
    }
  }
});
