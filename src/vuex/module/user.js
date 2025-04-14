import routes from '@/router';
import { unauthorizedPage } from '@/router/routes';
import Layout from "@/view/layout/index"
import Cookies from "js-cookie"

const user = {
  namespaced: true,
  state: {
    token: Cookies.get("access_token"),
    routes: []
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
      Cookies.set("access_token", token)
    },
    SET_ROUTES: (state, routes) => {
      state.routes = routes;
    },
  },
  actions: {
    login(context) {
      return new Promise((resolve, reject) => {
        console.log("设置token")
        context.commit("SET_TOKEN", "3a4b3ca0247e0500da70d637f6c5ded9")
        if(user.state.token!=""){
          resolve();
        }else{
          let error = "登录失败"
          reject(error);
        }
      });
    },
    getRoutes(context){
      return new Promise((resolve, reject) => {
        let add_routes = context.rootGetters['allMenu/menuList']
        console.log("构建路由===", add_routes)

        let route_base = {
          path: "/",
          redirect: "",
          name: "main_page",
          component: Layout,
          children: [],
        }
        let route_dict = {}
        let first_path = ""
        for(let i=0;i<add_routes.length;i++){
          if(add_routes[i]["children"].length>0){
            for(let j=0;j<add_routes[i]["children"].length;j++){
              let path_str = add_routes[i]["children"][j]["path"]
              if(first_path==""){
                first_path=path_str
              }
              route_dict[path_str] = {
                path: path_str,
                name: path_str,
                component: () => import(/* webpackChunkName: "alarmCenter-current" */ "@/view/"+path_str),
              }
            }
          }else{
            let path_str = add_routes[i]["path"]
            if(first_path==""){
              first_path=path_str
            }
            route_dict[path_str] = {
              path: path_str,
              name: path_str,
              component: () => import(/* webpackChunkName: "alarmCenter-current" */ "@/view/"+path_str),
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
  }
};

export default user;
