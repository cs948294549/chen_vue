'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_BASE_URL: '"netops.vdian.net/api"',
  // SOCKET_URL 和 SOCKET_PATH 继承自 prod.env.js
  // AES_SECRET 和 MD5_SALT 继承自 prod.env.js
})
