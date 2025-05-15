/* eslint-disable */
// 侧边菜单模块的状态
const state = {
  //view为基础目录
  menuList: [
    {
      "id": 1, "name": "图片处理", "group": "分组1", "order": "100", "path": "", "hide":false, "children": [
        {"id":2,"name":"文字提取","group":"","order":"1","path":"pages/test1","hide":false,"children":[]},
        {"id":3,"name":"去除文字","group":"","order":"2","path":"pages/test2","hide":false,"children":[]},
        {"id":11,"name":"图片框选","group":"","order":"3","path":"pages/test6","hide":false,"children":[]},
      ],
    },
    {
      "id":7,"name":"其他","group":"分组1","order":"201","path":"pages/test3","hide":false,"children":[]
    },
    {
      "id":9,"name":"其他","group":"分组1","order":"301","path":"pages/ts/test5","hide":false,"children":[]
    },
    {
      "id":10,"name":"其他1","group":"分组2","order":"301","path":"pages/ts/test5","hide":false,"children":[]
    },
    {
      "id":4,"name":"其他","group":"分组2","order":"200","path":"","hide":false,"children":[
        {"id":5,"name":"测试1","group":"","order":"1","path":"pages/test3","hide":false,"children":[]},
        {"id":6,"name":"测试2","group":"","order":"1","path":"pages/test4","hide":false,"children":[]},
      ],
    }
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
  fetchRoute (context) {
    return new Promise((resolve, reject) => {
      let route_list = []
      console.log("开始构造路由")
      for(let i=0;i<state.menuList.length;i++){

      }
      resolve(route_list)
    })
  },
  fetchData (context) {
    return new Promise((resolve, reject) => {
      // 模拟异步请求，使用 setTimeout 模拟延迟
      setTimeout(() => {
        const mockData = [
          {
            "uri": "",
            "name": "主页",
            "children": [
              {
                "uri": "/index",
                "name": "主页1",
                "children": []
              },
              {
                "uri": "/index",
                "name": "主页2",
                "children": []
              }
            ]
          },
          {
            "uri": "",
            "name": "测试页面",
            "children": [
              {
                "uri": "/index",
                "name": "测试页1",
                "children": []
              },
              {
                "uri": "/index",
                "name": "测试页2",
                "children": []
              }
            ]
          }
        ]
        console.log("设置菜单列表", mockData)
        context.commit("setMenuList", mockData)
        resolve(mockData)
      }, 1000)
    })
  }
}

// 获取状态的方法
const getters = {
  menuList: (state) => state.menuList,
}

export default {
  namespaced: true, // 开启命名空间，使模块更独立
  state,
  mutations,
  actions,
  getters
}
