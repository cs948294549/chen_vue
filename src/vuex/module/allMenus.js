/* eslint-disable */
// 侧边菜单模块的状态
const state = {
  //默认菜单
  default_menu: [
    //系统管理功能
    {
      "id": "id-900", "name": "用户管理", "group": "系统管理", "order": "400", "path":"pages/systemManage/userManage", "hide":false, "children": [],
    },
    {
      "id": "id-901", "name": "页面管理", "group": "系统管理", "order": "401", "path":"pages/systemManage/pageManage", "hide":false, "children": [],
    }
  ],
  padding_route: {
    name: "uuuuu",
    item: {"id":"x-101","name":"历史告警","group":"","order":"99","path":"pages/alarms/history_alarm","hide":false,"children":[]}
  },

  //view为基础目录
  menuList: [

  ]
}

// 修改状态的方法
const mutations = {
  setMenuList (state, menus) {
    state.menuList = menus
  }
}

// 异步操作（这里只是示例，没有实际异步逻辑）
const actions = {
  fetchRoute (context, routes) {
    // console.log("获取路由信息=开始解析==", routes)
    let padding_route = context.state.padding_route
    // console.log("===", padding_route)
    const route_list = []
    for(let i=0;i<routes.length;i++){
      let _r = {
        "id": routes[i]["page_id"],
        "name": routes[i]["name"],
        "group": routes[i]["classify"],
        "order": routes[i]["sort_num"],
        "path": routes[i]["path"],
        "hide": routes[i]["hide"]=="1"?true:false,
        "icon": routes[i]["icon"],
        "children":[],
      }
      for(let j=0;j<routes[i]["children"].length;j++){
        let _r_c = {
          "id": routes[i]["children"][j]["page_id"],
          "name": routes[i]["children"][j]["name"],
          "group": routes[i]["children"][j]["classify"],
          "order": routes[i]["children"][j]["sort_num"],
          "path": routes[i]["children"][j]["path"],
          "hide": routes[i]["children"][j]["hide"]=="1"?true:false,
          "icon": routes[i]["children"][j]["icon"],
          "children":[],
        }
        _r["children"].push(_r_c)
      }
      if(_r["name"]===padding_route["name"]){
        _r["children"].push(padding_route["item"])
      }
      route_list.push(_r)
    }
    context.commit("setMenuList", route_list)
  }
}

// 获取状态的方法
const getters = {
  menuList: (state) => state.menuList,
  default_menu: (state) => state.default_menu,
}

export default {
  namespaced: true, // 开启命名空间，使模块更独立
  state,
  mutations,
  actions,
  getters
}
