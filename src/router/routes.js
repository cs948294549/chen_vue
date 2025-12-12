import Layout from "@/view/layout/index"

export const whiteRoutes = [
  {
    path: '/404',
    name: '404',
    component: () => import(/* webpackChunkName: "404" */ '@/components/common_page/p_404'),
    meta: {
      title: '404'
    }
  },
  {
    path: '/Login',
    name: 'login',
    component: () => import(/* webpackChunkName: "404" */ '@/view/Login'),
    meta: {
      title: '登陆'
    }
  },
  {
    path: '/unauthorized-index',
    redirect: '/unauthorized',
    component: Layout,
    children: [
      {
        path: '/unauthorized',
        name: 'unauthorized',
        component: () => import('@/components/common_page/p_403'),
        meta: {
          title: '无权限'
        }
      }
    ]
  },
  // 添加上后各种报404
  // { path: '*', redirect: '/404' },
]

export const unauthorizedPage = {
  path: '/unauthorized'
}

export const u404Page = {
  path: '/404'
}


const bussiness_route = [
  {
    path: "/",
    component: Layout,
    // redirect: "/index",
    name: "main",
    meta: {
      rightCode: 1000
    },
    children: [
      {
        path: "main",
        name: "mainPage1",
        component: () => import(/* webpackChunkName: "alarmCenter-current" */ "@/components/HelloWorld"),
        meta: {
          title: "首页",
        }
      }
    ]
  },
]

export default bussiness_route;
