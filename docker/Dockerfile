# ==========================================================
# chen_vue 前端容器镜像(方案 A:仅托管静态文件)
# 构建阶段: Node 16 编译 webpack 产物
# 运行阶段: nginx 托管 dist
# /api/ 与 /sock/ 由宿主机上的外层 nginx 反代, 本容器不参与
# ==========================================================

# ---------- 构建阶段 ----------
# 必须用 node 16:
#   1) build/check-versions.js 会校验 engines.node, node 18+ 直接 exit 1
#   2) webpack 4 的 md4 哈希在 OpenSSL 3 上会报 digital envelope routines::unsupported
# 版本钉死到 16.20.2, 与本地开发环境保持一致
FROM node:16.20.2-alpine3.18 AS builder

ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

ENV TZ=Asia/Shanghai \
    NODE_OPTIONS=--max_old_space_size=4096

# 先只拷依赖清单, 利用层缓存
COPY package.json package-lock.json ./
# --legacy-peer-deps: 项目声明了 css-minimizer-webpack-plugin@3(peer 要求 webpack 5),
# 但 webpack 实际是 4, 且该插件在 build/ 下从未被 import, 属无害的多余声明.
# npm 7+ 默认严格检查 peer 依赖会 ERESOLVE, 故关闭检查.
RUN npm config set registry ${NPM_REGISTRY} \
    && npm config set legacy-peer-deps true \
    && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)

# 编译所需源码(只拷必要文件, copy-webpack-plugin 会读 static/)
COPY build ./build
COPY config ./config
COPY src ./src
COPY static ./static
COPY index.html .babelrc .eslintignore .postcssrc.js ./

RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:stable-alpine

ENV TZ=Asia/Shanghai

RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
