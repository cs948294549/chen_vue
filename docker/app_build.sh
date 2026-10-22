#!/bin/bash

# chen_vue 前端 Docker 镜像构建脚本
# 用法: ./docker/app_build.sh [tag] [--no-cache] [--platform linux/amd64]

set -e

IMAGE_NAME="netops-frontend"
IMAGE_TAG="v1"
DOCKERFILE_PATH="docker/Dockerfile"
BUILD_ARGS=()
PLATFORM_ARGS=()

# 解析参数
for arg in "$@"; do
    case "$arg" in
        --no-cache) BUILD_ARGS+=("--no-cache") ;;
        --platform=*) PLATFORM_ARGS+=("--platform" "${arg#*=}") ;;
        -*) echo "未知参数: $arg"; exit 1 ;;
        *) IMAGE_TAG="$arg" ;;
    esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  netops-frontend Docker 镜像构建${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}镜像:${NC} ${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${YELLOW}Dockerfile:${NC} ${DOCKERFILE_PATH}"
[ ${#PLATFORM_ARGS[@]} -gt 0 ] && echo -e "${YELLOW}目标架构:${NC} ${PLATFORM_ARGS[1]}"
echo ""

# 切换到项目根目录(构建上下文)
cd "$(dirname "$0")/.."

if [ ! -f "${DOCKERFILE_PATH}" ]; then
    echo -e "${RED}错误: Dockerfile 不存在: ${DOCKERFILE_PATH}${NC}"
    exit 1
fi

echo -e "${YELLOW}检查必要文件...${NC}"
required_files=(
    "package.json"
    "package-lock.json"
    "index.html"
    "config/prod.env.js"
    "src/main.js"
    "build/webpack.prod.conf.js"
)
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}错误: $file 不存在${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} $file"
done
echo ""

echo -e "${GREEN}开始构建(首次需下载 node 依赖, 约 3-8 分钟)...${NC}"
echo ""

docker build \
    "${BUILD_ARGS[@]}" \
    "${PLATFORM_ARGS[@]}" \
    -f "${DOCKERFILE_PATH}" \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    -t "${IMAGE_NAME}:latest" \
    .

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  构建成功${NC}"
echo -e "${GREEN}========================================${NC}"
docker images | grep "${IMAGE_NAME}" | head -2
echo ""
echo -e "${YELLOW}下一步:${NC} ./docker/app_start.sh ${IMAGE_TAG} 28080"
echo ""
