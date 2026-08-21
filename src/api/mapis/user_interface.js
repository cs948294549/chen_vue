import axios from "../axios"
// 用户管理相关接口

export default {
  login (data, params) {
    return axios.post("/system/login", data, params)
  },
  changePasswd (data, params) {
    return axios.post("/system/change_passwd", data, params)
  },

  //获取用户基本信息
  getUserInfo(data, params) {
    return axios.post("/system/getuser", data, params)
  },

  //用户角色相关
  addRole(data, params) {
    return axios.post("/system/add_role", data, params)
  },
  updateRole(data, params) {
    return axios.post("/system/update_role", data, params)
  },
  delRole(data, params) {
    return axios.post("/system/delete_role", data, params)
  },
  getRoleList(data, params) {
    return axios.post("/system/get_role_list", data, params)
  },

  //用户相关
  addUser(data, params) {
    return axios.post("/system/add_user", data, params)
  },
  updateUser(data, params) {
    return axios.post("/system/update_user", data, params)
  },
  delUser(data, params) {
    return axios.post("/system/delete_user", data, params)
  },
  getUserList(data, params) {
    return axios.post("/system/get_user_list", data, params)
  },
  resetUserIdentify(data, params) {
    return axios.post("/system/reset_user_identify", data, params)
  },

  //页面相关
  addPage(data, params) {
    return axios.post("/system/add_page", data, params)
  },
  updatePage(data, params) {
    return axios.post("/system/update_page", data, params)
  },
  delPage(data, params) {
    return axios.post("/system/delete_page", data, params)
  },
  getPageList(data, params) {
    return axios.post("/system/get_page_list", data, params)
  },

  //页面接口相关
  addUri(data, params) {
    return axios.post("/system/add_uri", data, params)
  },
  updateUri(data, params) {
    return axios.post("/system/update_uri", data, params)
  },
  delUri(data, params) {
    return axios.post("/system/delete_uri", data, params)
  },
  getUriList(data, params) {
    return axios.post("/system/get_uri_list", data, params)
  },

  //角色可以访问页面权限
  addRolePage(data, params) {
    return axios.post("/system/add_role_page", data, params)
  },
  addRolePageList(data, params) {
    return axios.post("/system/add_role_page_list", data, params)
  },
  updateRolePage(data, params) {
    return axios.post("/system/update_role_page", data, params)
  },
  delRolePage(data, params) {
    return axios.post("/system/delete_role_page", data, params)
  },
  getRolePageList(data, params) {
    return axios.post("/system/get_role_page_list", data, params)
  },
  
  getRoleRouteList(data, params) {
    return axios.post("/system/get_route_list", data, params)
  },

}
