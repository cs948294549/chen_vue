'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_BASE_URL: '"netops.vdian.net/api"',
  // AES_SECRET 和 MD5_SALT 继承自 prod.env.js
})
