'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  // dev 不走 nginx 反代(config/index.js 的 proxyTable 是注释掉的),
  // 所以这里固定回线上地址, 保持与改动前一致
  API_BASE_URL: '"/api"',
  SOCKET_PATH: '"/sock/socket.io"',
  // SOCKET_PATH 继承自 prod.env.js
  // AES_SECRET 和 MD5_SALT 继承自 prod.env.js
})
