#!/bin/bash

# chen_vue 前端容器日志
# 用法: ./docker/logs.sh [行数] [-f]

CONTAINER_NAME="netops-frontend"
TAIL="${1:-100}"
case "$TAIL" in -*) TAIL=100 ;; esac

FOLLOW=""
if [ "$2" = "-f" ] || [ "$1" = "-f" ]; then
    FOLLOW="-f"
fi

if ! docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
    echo "容器 ${CONTAINER_NAME} 不存在"
    exit 1
fi

# 容器内 nginx 的 access.log / error.log 已软链到 stdout/stderr
docker logs ${FOLLOW} --tail "${TAIL}" "${CONTAINER_NAME}"
