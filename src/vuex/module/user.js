import routes from '@/router';
import Layout from "@/view/layout/index"
import Cookies from "js-cookie"

const u_info = () => {
  try{
    const userInfoStr = Cookies.get("user_info")
    // 如果Cookie不存在，直接返回null
    if (!userInfoStr) {
      return {}
    }
    // 第二步：尝试解析JSON（这是最容易报错的步骤）
    const userInfo = JSON.parse(userInfoStr)
    return userInfo
  }catch (error) {
    // 捕获所有异常：JSON解析失败、Cookie读取失败、浏览器禁用Cookie等
    console.warn('读取user_info Cookie失败:', error.message)
    // 异常时返回默认值（如null），避免state初始化出错
    return {}
  }
}

const route_info = () => {
  try{
    const routeInfoStr = localStorage.getItem("RouteList")
    // 如果Cookie不存在，直接返回null
    if (!routeInfoStr) {
      return []
    }
    // 第二步：尝试解析JSON（这是最容易报错的步骤）
    const routeInfo = JSON.parse(routeInfoStr)
    return routeInfo
  }catch (error) {
    // 捕获所有异常：JSON解析失败、Cookie读取失败、浏览器禁用Cookie等
    console.warn('读取route_info localStorage失败:', error.message)
    // 异常时返回默认值（如null），避免state初始化出错
    return {}
  }
}

const user = {
  namespaced: true,
  state: {
    token: Cookies.get("access_token"),
    routes: [],
    user_info: u_info(),
    token_sign: Cookies.get("token_sign"),
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
      Cookies.set("access_token", token)
    },
    SET_SIGN: (state, sign) => {
      state.token_sign = sign;
      Cookies.set("token_sign", sign)
    },
    SET_ROUTES: (state, routes) => {
      state.routes = routes;
    },
    SET_USER: (state, user_info) => {
      state.user_info = user_info;
      Cookies.set("user_info", JSON.stringify(user_info))
    },
  },
  actions: {
    login(context, user_infos) {
      return new Promise((resolve, reject) => {
        // console.log("设置token及user_info", user_infos)
        context.commit("SET_TOKEN",user_infos["token"])
        context.commit("SET_USER",user_infos["user_info"])
        context.commit("SET_SIGN",user_infos["token_sign"])
        // context.commit("SET_TOKEN", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicmlkIjoic3lzdGVtIiwiZXhwIjoxNzY1NDMzODgwfQ.0Z-ZteJ8bNmRdStogrmoj5yo0QDJ15NV1Y-oCG_kxa4")
        if(user.state.token!=""){
          resolve();
        }else{
          let error = "登录失败"
          reject(error);
        }
      });
    },
    logout(context) {
      return new Promise((resolve, reject) => {
        console.log("退出登陆，清理cookie")
        Cookies.remove("access_token")
        Cookies.remove("user_info")
        Cookies.remove("token_sign")
        localStorage.removeItem("RouteList")
        location.reload()
      });
    },

    getRoutes(context){
      return new Promise(async (resolve, reject) => {
        // dispatch("allMenu/fetchRoute")
        const route_list = route_info()

        await context.dispatch('allMenu/fetchRoute', route_list, { root: true });

        let add_routes = context.rootGetters['allMenu/menuList']
        // console.log("构建路由===", add_routes)
        if(add_routes.length<=0){
          context.dispatch('logout')
        }

        let route_base = {
          path: "/",
          redirect: "",
          name: "main_page",
          component: Layout,
          children: [],
        }
        let route_dict = {}

        //默认进来第一个路由
        let first_path = ""
        for(let i=0;i<add_routes.length;i++){
          if(add_routes[i]["children"].length>0){
            for(let j=0;j<add_routes[i]["children"].length;j++){
              let path_str = add_routes[i]["children"][j]["path"]
              if(first_path==""){
                first_path=path_str
              }
              if(route_dict[path_str]){

              }else{
                route_dict[path_str] = {
                  path: path_str,
                  name: path_str,
                  component: () => import(/* webpackChunkName: "alarmCenter-current" */ "@/view/"+path_str),
                }
              }
            }
          }else{
            let path_str = add_routes[i]["path"]
            if(first_path==""){
              first_path=path_str
            }
            if(route_dict[path_str]){

            }else{
              route_dict[path_str] = {
                path: path_str,
                name: path_str,
                component: () => import(/* webpackChunkName: "alarmCenter-current" */ "@/view/"+path_str),
              }
            }
          }
        }

        route_base["redirect"] = "/"+first_path
        for (const pa in route_dict){
          route_base["children"].push(route_dict[pa])
        }
        let routes = [route_base]
        context.commit("SET_ROUTES", routes)
        if(user.state.routes.length>0){
          resolve();
        }else{
          let error = "路由注册失败"
          reject(error);
        }
      });
    }
  },
  getters: {
    token: (state) => state.token,
    routes: (state) => state.routes,
    user_info: (state) => state.user_info,
  }
};

export default user;
