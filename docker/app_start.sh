#!/bin/bash

# chen_vue 前端容器启动脚本
# 用法: ./docker/app_start.sh [tag] [端口]
# 默认: tag=v1  端口=28080

set -e

CONTAINER_NAME="netops-frontend"
IMAGE_NAME="netops-frontend"
IMAGE_TAG="${1:-v1}"
HOST_PORT="${2:-28080}"
CONTAINER_PORT="80"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  netops-frontend 容器启动${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}容器:${NC} ${CONTAINER_NAME}"
echo -e "${YELLOW}镜像:${NC} ${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${YELLOW}端口:${NC} 127.0.0.1:${HOST_PORT} -> ${CONTAINER_PORT}"
echo ""

cd "$(dirname "$0")/.."

# 只绑定回环地址: 外网访问统一走宿主机外层 nginx
if ss -ltn 2>/dev/null | grep -q ":${HOST_PORT} " || netstat -ltn 2>/dev/null | grep -q ":${HOST_PORT} "; then
    echo -e "${RED}错误: 端口 ${HOST_PORT} 已被占用${NC}"
    exit 1
fi

if ! docker image inspect "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null 2>&1; then
    echo -e "${RED}错误: 镜像 ${IMAGE_NAME}:${IMAGE_TAG} 不存在${NC}"
    echo -e "${YELLOW}请先执行:${NC} ./docker/app_build.sh ${IMAGE_TAG}"
    exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
    echo -e "${YELLOW}清理已存在的容器...${NC}"
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1 || true
    echo -e "${GREEN}✓${NC} 已清理"
    echo ""
fi

echo -e "${GREEN}启动容器...${NC}"
docker run -d \
    --name "${CONTAINER_NAME}" \
    -p "127.0.0.1:${HOST_PORT}:${CONTAINER_PORT}" \
    --restart unless-stopped \
    --log-opt max-size=20m \
    --log-opt max-file=3 \
    "${IMAGE_NAME}:${IMAGE_TAG}" > /dev/null

echo -e "${YELLOW}等待服务就绪...${NC}"
ok=0
for i in $(seq 1 20); do
    if curl -f -s "http://127.0.0.1:${HOST_PORT}/healthz" > /dev/null 2>&1; then
        ok=1
        break
    fi
    sleep 1
done

echo ""
if [ "$ok" = "1" ]; then
    echo -e "${GREEN}✓ 容器已启动并通过健康检查${NC}"
else
    echo -e "${RED}✗ 健康检查未通过, 请查看日志${NC}"
    docker logs --tail 30 "${CONTAINER_NAME}"
    exit 1
fi

echo ""
echo -e "${YELLOW}容器状态:${NC}"
docker ps | grep "${CONTAINER_NAME}"
echo ""
echo -e "${YELLOW}自检:${NC}"
echo -e "  首页:   ${GREEN}curl -I http://127.0.0.1:${HOST_PORT}/${NC}"
echo -e "  回落:   ${GREEN}curl -I http://127.0.0.1:${HOST_PORT}/any/router/path${NC}   # 应返回 200 + text/html"
echo -e "  静态:   ${GREEN}curl -I http://127.0.0.1:${HOST_PORT}/static/css/app.app.css${NC}"
echo ""
echo -e "${YELLOW}下一步: 改宿主机外层 nginx 的 location /, 指向 127.0.0.1:${HOST_PORT}${NC}"
echo -e "${YELLOW}        (配置片段见 docker/README.md, 改前先备份)${NC}"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo -e "  查看日志: ${GREEN}./docker/logs.sh${NC}"
echo -e "  重启:     ${GREEN}docker restart ${CONTAINER_NAME}${NC}"
echo -e "  回滚:     ${GREEN}./docker/app_start.sh <旧tag> ${HOST_PORT}${NC}"
echo ""
