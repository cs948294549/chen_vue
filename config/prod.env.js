'use strict'
module.exports = {
  NODE_ENV: '"production"',
  // 走同源相对路径, 由外层 nginx 的 ^~ /api/ 反代; 换域名无需重新构建
  API_BASE_URL: '"/api"',
  SOCKET_PATH: '"/sock/socket.io"',
  AES_SECRET: '"3a4b3ca0247e0500da70d637f6c5ded8"',
  MD5_SALT: '"eyJhbGciOiJIUzI1NiIsIn"'
}