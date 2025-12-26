/* eslint-disable */
// 顶上快捷标签栏目
const state = {
  //默认菜单
  tabnavBox: [{title: "主页",path: ""}],
}

// 修改状态的方法
const mutations = {
  addTab (state, tab){
    if (state.tabnavBox[0] && state.tabnavBox[0].title !== "主页") {
      state.tabnavBox.unshift({
        title: "主页",
        path: "",
        breadcrumbs: []
      })
    }
    for (let i = 0; i < state.tabnavBox.length; i++) {
      if (state.tabnavBox[i].path === tab.path) {
        return false
      }
    }
    state.tabnavBox.push({
      title: tab.title,
      path: tab.path,
      breadcrumbs: tab.breadcrumbs
    })
  },
  clearTab (state, tab){
    state.tabnavBox=[{title: "主页",path: "", breadcrumbs: []}]
  },
  removeTab (state, tab){
    let idx = 0;
    for (let i = 0; i < state.tabnavBox.length; i++) {
      if (state.tabnavBox[i].path === tab.path) {
        idx = i;
        break
      }
    }
    state.tabnavBox.splice(idx,1)

    if (state.tabnavBox[0] && state.tabnavBox[0].title !== "主页") {
      state.tabnavBox.unshift({
        title: "主页",
        path: ""
      })
    }

  }
}

// 异步操作（这里只是示例，没有实际异步逻辑）
const actions = {
  addTab ({commit}, arg) {
    commit("addTab", arg)
  },
  clearTab ({commit}, arg) {
    commit("clearTab", arg)
  },
  removeTab ({commit}, arg) {
    commit("removeTab", arg)
  },
}

// 获取状态的方法
const getters = {
  tabnavBox: (state) => state.tabnavBox,
}

export default {
  namespaced: true, // 开启命名空间，使模块更独立
  state,
  mutations,
  actions,
  getters
}
