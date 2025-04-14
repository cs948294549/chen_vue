import Vue from "vue"
import VueRouter from "vue-router"
import store from "@/vuex"
import Layout from "@/view/layout/index"
import bussiness_route, {whiteRoutes} from "./routes"

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push (location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routesList = whiteRoutes.concat(bussiness_route)

const createRouter = () => new VueRouter({
  mode: "history",
  routes: routesList
})

const router = createRouter()

// 定义一个resetRouter 方法，在退出登录后或token过期后 需要重新登录时，调用即可
export function resetRouter() {
  const newRouter = createRouter();
  router.matcher = newRouter.matcher;
}

export default router
