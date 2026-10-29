'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  // dev 不走 nginx 反代(config/index.js 的 proxyTable 是注释掉的),
  // 所以这里固定回线上地址直连
  // 必须带协议: axios 0.19 的 isAbsoluteURL 只认 "scheme://",
  // 写成 "netops.vdian.net/api" 会被当成相对路径, 实际请求发到
  // http://localhost:8080/netops.vdian.net/api/...
  API_BASE_URL: '"https://netops.vdian.net/api"',
  SOCKET_URL: '"https://netops.vdian.net"',
  // SOCKET_PATH 继承自 prod.env.js
  // AES_SECRET 和 MD5_SALT 继承自 prod.env.js
})
