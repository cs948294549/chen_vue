# NetOps 网络运维管理平台 (chen_vue)

基于 Vue.js 2.x 的网络运维综合管理平台前端项目，提供网络拓扑可视化、告警管理、工具集和系统管理等功能。

## 项目简介

本项目是网络运维管理系统的前端应用，集成了多种网络运维工具和管理功能，旨在提升网络运维效率。

### 主要功能模块

- **告警管理** - 实时告警监控、历史告警查询、告警规则配置
- **网络拓扑** - 基于 vis-network 和 AntV G6 的网络拓扑可视化
- **运维工具集**
  - IP/掩码转换工具
  - IP前缀合并
  - 文本差异对比
  - JSON格式化
  - 正则提取工具
  - Markdown表格工具
  - 词云生成
  - 地图工具
- **系统管理** - 用户管理、页面权限管理
- **交换机CLI** - 交换机命令行操作界面

### 技术栈

- **框架**: Vue 2.7.16 + Vue Router 3.0.1 + Vuex 3.6.2
- **UI组件**: Element UI 2.15.14
- **图表可视化**: ECharts 4.9.0, AntV G2, AntV G6
- **网络拓扑**: vis-network 9.1.9
- **实时通信**: Socket.io Client 4.8.1
- **代码编辑器**: Monaco Editor 0.30.1
- **数据处理**: Axios 0.19.2, XLSX 0.17.5
- **构建工具**: Webpack 4 + Babel

## 环境要求

```
Node.js: >= v16.20.2
npm: >= 3.0.0
```

## 安装和运行

```bash
# 安装依赖
npm install

# 本地开发服务器 (localhost:8080 热重载)
npm run dev
# 或
npm start

# 生产环境构建
npm run build

# 代码检查
npm run lint

# 构建并查看打包分析报告
npm run build --report
```

## 重要依赖说明

### Vuex 版本兼容性
```
⚠️ 在 Vue 2.x 中必须使用 Vuex ^3.6.2
使用 Vuex 4.x 会导致全局引用失效
```

### 核心依赖版本
```json
{
  "vue": "^2.7.16",
  "vue-router": "^3.0.1",
  "vuex": "^3.6.2",
  "element-ui": "^2.15.14",
  "axios": "^0.19.2",
  "echarts": "^4.9.0",
  "@antv/g6": "^4.3.7",
  "vis-network": "^9.1.9",
  "socket.io-client": "^4.8.1",
  "monaco-editor": "^0.30.1"
}
```

## 项目结构

```
chen_vue/
├── src/
│   ├── api/           # API 接口定义
│   ├── assets/        # 静态资源
│   ├── components/    # 公共组件
│   │   ├── topology/      # 网络拓扑组件
│   │   ├── echarts/       # ECharts 图表组件
│   │   ├── flowChart/     # 流程图组件
│   │   ├── switchCli/     # 交换机CLI组件
│   │   ├── word_cloud/    # 词云组件
│   │   └── common_page/   # 通用页面(404/403等)
│   ├── router/        # 路由配置
│   ├── view/          # 页面视图
│   │   ├── layout/        # 布局组件
│   │   └── pages/         # 业务页面
│   │       ├── alarms/        # 告警管理
│   │       ├── tools/         # 工具集
│   │       └── systemManage/  # 系统管理
│   ├── vuex/          # Vuex 状态管理
│   └── utils/         # 工具函数
├── build/             # Webpack 构建配置
├── config/            # 项目配置
└── dist/              # 构建输出目录
```

## 浏览器兼容性

```
> 1%
last 2 versions
not ie <= 8
```

## 开发信息

- **作者**: chensong1 <chensong1@corp.netease.com>
- **创建方式**: `vue init webpack chen_vue` (Vue CLI 2.x)
- **模板版本**: 2.6.9
- **最后更新**: 2026-08-14

## 相关文档

更多网络运维相关文档请参考项目根目录的 [CLAUDE.md](../CLAUDE.md)

## License

Private
