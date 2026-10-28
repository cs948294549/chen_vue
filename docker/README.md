# chen_vue 容器化部署

前端以 nginx 镜像形式部署,容器**只负责托管 `dist` 静态文件**。
`/api/` 与 `/sock/` 的反代仍由宿主机上的外层 nginx 承担,指向 central-server。

## 目录结构

```
chen_vue/
├── .dockerignore          # 必须放项目根(docker 只认构建上下文根目录的 .dockerignore)
└── docker/
    ├── Dockerfile         # 多阶段: node:16-alpine 编译 → nginx:stable-alpine 托管
    ├── nginx.conf         # 容器内 nginx: SPA 回落、静态缓存、gzip
    ├── app_build.sh       # 构建镜像
    ├── app_start.sh       # 启动容器
    └── logs.sh            # 查看日志
```

## 快速开始

在服务器上(chen_vue 项目根目录):

```bash
# 1. 构建(首次约 3-8 分钟, 需要能访问 npm 源)
./docker/app_build.sh v1

# 2. 启动, 只监听回环地址的 28080
./docker/app_start.sh v1 28080

# 3. 自检
curl -I http://127.0.0.1:28080/                    # 200 text/html
curl -I http://127.0.0.1:28080/netops/some/page    # 200 text/html(history 回落)
curl -I http://127.0.0.1:28080/static/css/app.app.css
```

## 外层 nginx 改动

只改 `location /`,**`^~ /api/` 和 `^~ /sock/` 保持原样**。

```nginx
upstream netops_frontend {
    server 127.0.0.1:28080;
    keepalive 16;
}

server {
    # ... ssl / server_name 等保持不变 ...

    location ^~ /sock/ {
        # 原样保留, 不要动
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_pass http://websock/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ^~ /api/ {
        # 原样保留, 不要动
        proxy_pass http://api/;
        # ... 其余不变 ...
    }

    # 唯一需要改的地方: 由 root /var/www/netops 改为反代容器
    location / {
        proxy_pass http://netops_frontend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

要点:

- `^~ /api/`、`^~ /sock/` 是非正则前缀匹配且 `/` 匹配长度更长,因此优先于 `location /`,不需要任何 `if` 判断。
- **不要**在 `location /` 里靠近 `proxy_set_header Connection "upgrade"`,WebSocket 只走 `^~ /sock/`。
- 外层 nginx 与容器之间是 keepalive 长连接,所以 `Connection ""` + upstream 里 `keepalive 16`。

应用改动:

```bash
sudo cp /etc/nginx/conf.d/netops.conf /etc/nginx/conf.d/netops.conf.bak.$(date +%Y%m%d%H%M)
sudo nginx -t && sudo nginx -s reload
```

## 验证

浏览器打开站点,确认三件事:

1. 页面正常,刷新任意子路由不 404
2. DevTools → Network → WS,`/sock/socket.io/?EIO=4&transport=websocket` 为 **101 Switching Protocols**
3. 任意 `/api/...` 请求返回正常,且响应头里没有容器特征(说明走的是外层 `^~ /api/`)

服务端可以用 `curl` 直接验证容器不掺和接口:

```bash
curl -I http://127.0.0.1:28080/api/system/health   # 应为 404(容器不认识 /api, 符合预期)
```

## 回滚

```bash
# 方式一: 切回旧镜像
./docker/app_start.sh v0 28080

# 方式二: 完全退回静态目录
sudo cp /etc/nginx/conf.d/netops.conf.bak.<时间戳> /etc/nginx/conf.d/netops.conf
sudo nginx -t && sudo nginx -s reload
docker stop netops-frontend
```

## 关键约束

| 项 | 约束 | 原因 |
|---|---|---|
| Node 版本 | 构建阶段固定 **16.20.2** | `build/check-versions.js` 校验 `engines.node`;webpack 4 的 md4 在 OpenSSL 3(Node 18+)上报 `digital envelope routines::unsupported`。镜像与本机开发版本对齐 |
| 构建架构 | 服务器是 amd64,Mac 是 arm64 | 本地构建需加 `--platform=linux/amd64`,否则服务器上 `exec format error` |
| 接口地址 | 与域名无关 | `config/prod.env.js` 中 `API_BASE_URL` 为 `/api`（同源相对路径）、`SOCKET_URL` 留空走 `window.location.origin`，DNS/域名/端口/IP 全部跟随当前页面，同一镜像可部署到任意环境。前提是外层 nginx 有 `^~ /api/` 与 `^~ /sock/` 反代 |
| 入口 CSS | 不可长缓存 | `/static/css/app.app.css` 文件名不含 hash,故 `/static/` 用 30 天而非 `immutable` |
| 网络 | 需能访问 npm 源 | 构建阶段拉依赖;内网环境可改 `--build-arg NPM_REGISTRY=<内网源>` |
| 端口 | 只绑 `127.0.0.1` | 外网统一走外层 nginx,容器端口不对外暴露 |

## 本地构建后传到服务器

```bash
# Mac 上
./docker/app_build.sh v1 --platform=linux/amd64
docker save netops-frontend:v1 | gzip > netops-frontend-v1.tar.gz

# 服务器上
gunzip -c netops-frontend-v1.tar.gz | docker load
./docker/app_start.sh v1 28080
```
