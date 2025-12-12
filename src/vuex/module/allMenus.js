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
    },


    //demo列表
    {
      "id":100,"name":"测试页面","group":"demo","order":"300","path":"","hide":false,"children":[
        {"id":101,"name":"拖动","group":"","order":"5","path":"pages/demo/drag/dragParent","hide":false,"children":[]},
        {"id":102,"name":"G6流程图","group":"","order":"6","path":"pages/demo/workflow/g6_flow","hide":false,"children":[]},
        {"id":103,"name":"图片框选", "group":"","order":"3","path":"pages/demo/images/test6","hide":false,"children":[]},
        {"id":104,"name":"WebSocket测试", "group":"","order":"1","path":"pages/demo/websocket/test1","hide":false,"children":[]},
        {"id":105,"name":"词云测试", "group":"","order":"1","path":"pages/demo/wordcloud/word_main","hide":false,"children":[]},
        {"id":106,"name":"旭日图测试", "group":"","order":"1","path":"pages/demo/antvg2/test2","hide":false,"children":[]},
      ]
    },
    {
      "id": 1, "name": "图片处理", "group": "分组1", "order": "100", "path": "", "hide":false, "children": [
        {"id":3,"name":"去除文字", "group":"","order":"2","path":"pages/test2","hide":false,"children":[]}
      ],
    },

  ],

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
