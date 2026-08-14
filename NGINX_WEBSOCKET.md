# Nginx WebSocket 配置参考

本项目使用 Socket.IO 进行 WebSocket 通信，需要 Nginx 正确配置 WebSocket 反向代理。

## 问题现象

如果 WebSocket 连接失败，浏览器控制台会显示类似错误：

```
WebSocket connection to 'ws://netops.vdian.net/sock/socket.io/?EIO=4&transport=websocket' failed: 
Error during WebSocket handshake: Unexpected response code: 400
```

## Nginx 配置示例

### 完整配置

```nginx
server {
    listen 80;
    server_name netops.vdian.net;
    
    # 前端静态文件
    root /var/www/netops;
    index index.html;
    
    # Vue Router history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 接口代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO WebSocket 代理（重要）
    location /sock/ {
        proxy_pass http://127.0.0.1:5000/sock/;
        
        # WebSocket 必需配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 基础代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置（防止连接过早断开）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 禁用缓冲
        proxy_buffering off;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### HTTPS 配置（推荐生产环境）

```nginx
server {
    listen 443 ssl http2;
    server_name netops.vdian.net;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 前端静态文件
    root /var/www/netops;
    index index.html;
    
    # Vue Router history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 接口代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO WebSocket 代理
    location /sock/ {
        proxy_pass http://127.0.0.1:5000/sock/;
        
        # WebSocket 必需配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 基础代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 禁用缓冲
        proxy_buffering off;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name netops.vdian.net;
    return 301 https://$server_name$request_uri;
}
```

## 关键配置说明

### WebSocket 必需的三个配置

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

- `proxy_http_version 1.1` - WebSocket 需要 HTTP/1.1
- `Upgrade` 头 - 告诉后端升级到 WebSocket 协议
- `Connection "upgrade"` - 保持连接升级

### 超时配置

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

WebSocket 是长连接，需要设置较长的超时时间，防止连接被提前断开。

### 禁用缓冲

```nginx
proxy_buffering off;
```

WebSocket 需要实时通信，禁用缓冲可以减少延迟。

## 后端 Socket.IO 配置

确保后端 Socket.IO 服务器配置了正确的路径：

```python
# Python Flask-SocketIO 示例
from flask_socketio import SocketIO

socketio = SocketIO(app, 
                   cors_allowed_origins="*",
                   path='/sock/socket.io')  # 路径必须与前端和 Nginx 配置一致
```

```javascript
// Node.js Socket.IO 示例
const io = require('socket.io')(server, {
  path: '/sock/socket.io',  // 路径必须与前端和 Nginx 配置一致
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

## 验证配置

### 1. 重载 Nginx 配置

```bash
# 测试配置文件语法
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

### 2. 检查浏览器控制台

打开浏览器控制台，查看 WebSocket 连接日志：

```
WebSocket连接地址=== http://netops.vdian.net 路径=== /sock/socket.io
```

### 3. 查看网络请求

在浏览器开发者工具 → Network → WS 标签，查看 WebSocket 连接状态：

- **101 Switching Protocols** - 连接成功
- **400 Bad Request** - 配置错误
- **502 Bad Gateway** - 后端服务未运行
- **504 Gateway Timeout** - 后端响应超时

## 常见问题

### 1. 400 Bad Request

**原因：**
- Nginx 缺少 WebSocket 必需的 `Upgrade` 和 `Connection` 头配置
- 后端 Socket.IO 的 `path` 配置与前端不一致

**解决方案：**
- 检查 Nginx 配置中是否包含 WebSocket 三个必需配置
- 确认前端 `SOCKET_PATH` 与后端 Socket.IO `path` 参数一致

### 2. 502 Bad Gateway

**原因：**
- 后端 Socket.IO 服务未启动
- Nginx `proxy_pass` 地址错误

**解决方案：**
```bash
# 检查后端服务是否运行
sudo netstat -tlnp | grep 5000

# 检查后端日志
tail -f /path/to/backend.log
```

### 3. 连接立即断开

**原因：**
- Nginx 超时时间太短
- 后端没有正确响应 WebSocket 握手

**解决方案：**
- 增加 Nginx 超时时间（建议 60s 以上）
- 检查后端 Socket.IO 服务配置

### 4. CORS 错误

**原因：**
- 后端未配置 CORS
- 跨域请求被阻止

**解决方案：**
- 后端 Socket.IO 配置 `cors_allowed_origins` 或 `cors.origin`
- 通过 Nginx 添加 CORS 头（不推荐，建议后端处理）

## 调试技巧

### 启用前端调试日志

编辑 `src/main.js`，取消注释：

```javascript
console.log("WebSocket连接地址===", `${protocol}//${socketUrl}`, "路径===", socketPath)
```

### 查看 Nginx 访问日志

```bash
tail -f /var/log/nginx/access.log
```

### 查看 Nginx 错误日志

```bash
tail -f /var/log/nginx/error.log
```

### 使用 wscat 测试 WebSocket

```bash
# 安装 wscat
npm install -g wscat

# 测试 WebSocket 连接
wscat -c ws://netops.vdian.net/sock/socket.io/?EIO=4&transport=websocket
```

## 配置文件位置

- **前端配置**: `config/prod.env.js`
  ```javascript
  SOCKET_URL: '"netops.vdian.net"',
  SOCKET_PATH: '"/sock/socket.io"',
  ```

- **Nginx 配置**: `/etc/nginx/sites-available/netops` 或 `/etc/nginx/conf.d/netops.conf`

- **后端配置**: 根据后端框架不同而不同

## 配置检查清单

- [ ] Nginx 配置包含 WebSocket 必需的三个头
- [ ] Nginx `location /sock/` 路径配置正确
- [ ] Nginx `proxy_pass` 指向正确的后端地址和端口
- [ ] 后端 Socket.IO `path` 参数设置为 `/sock/socket.io`
- [ ] 前端 `SOCKET_PATH` 设置为 `"/sock/socket.io"`
- [ ] Nginx 配置已重载 (`nginx -s reload`)
- [ ] 后端服务正在运行
- [ ] 防火墙允许相应端口访问

---

**维护者**: NetOps 团队  
**最后更新**: 2026-08-14
