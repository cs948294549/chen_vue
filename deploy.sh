#!/bin/bash

##############################################
# NetOps 前端项目部署脚本
# 用途：将本地编译的 dist 目录部署到线上服务器
# 目标路径：/var/www/netops
##############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置区域
REMOTE_USER="${DEPLOY_USER:-root}"                    # 远程服务器用户名（可通过环境变量覆盖）
REMOTE_HOST="${DEPLOY_HOST}"                          # 远程服务器地址（必须设置）
REMOTE_PATH="/var/www/netops"                         # 远程部署路径
LOCAL_DIST="dist"                                     # 本地编译目录
BACKUP_DIR="/var/www/netops_backup"                   # 远程备份目录
TIMESTAMP=$(date +%Y%m%d_%H%M%S)                      # 时间戳

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_config() {
    if [ -z "$REMOTE_HOST" ]; then
        log_error "请设置 DEPLOY_HOST 环境变量"
        log_info "例如: export DEPLOY_HOST=netops.vdian.net"
        exit 1
    fi
}

# 检查本地 dist 目录是否存在
check_dist() {
    if [ ! -d "$LOCAL_DIST" ]; then
        log_error "本地 dist 目录不存在"
        log_info "请先运行: npm run build"
        exit 1
    fi

    log_info "检查 dist 目录内容..."
    file_count=$(find "$LOCAL_DIST" -type f | wc -l | tr -d ' ')

    if [ "$file_count" -lt 1 ]; then
        log_error "dist 目录为空，请先编译项目"
        exit 1
    fi

    log_info "dist 目录包含 $file_count 个文件"
}

# 检查远程服务器连接
check_remote_connection() {
    log_info "检查远程服务器连接..."

    if ! ssh -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'connection ok'" > /dev/null 2>&1; then
        log_error "无法连接到远程服务器 $REMOTE_USER@$REMOTE_HOST"
        log_info "请检查："
        log_info "  1. 服务器地址是否正确"
        log_info "  2. SSH密钥是否配置"
        log_info "  3. 网络是否正常"
        exit 1
    fi

    log_info "远程服务器连接正常"
}

# 备份远程现有文件
backup_remote() {
    log_info "备份远程现有文件..."

    ssh "$REMOTE_USER@$REMOTE_HOST" bash <<EOF
        set -e

        # 如果目标目录存在且不为空，则备份
        if [ -d "$REMOTE_PATH" ] && [ "\$(ls -A $REMOTE_PATH 2>/dev/null)" ]; then
            # 创建备份目录
            mkdir -p "$BACKUP_DIR"

            # 备份当前版本
            backup_path="$BACKUP_DIR/netops_$TIMESTAMP"
            cp -r "$REMOTE_PATH" "\$backup_path"
            echo "备份已保存到: \$backup_path"

            # 只保留最近5个备份
            cd "$BACKUP_DIR"
            ls -t | tail -n +6 | xargs -r rm -rf
            echo "已清理旧备份，保留最近5个"
        else
            echo "无需备份：目标目录不存在或为空"
        fi
EOF

    log_info "备份完成"
}

# 部署到远程服务器
deploy_to_remote() {
    log_info "开始部署到 $REMOTE_HOST:$REMOTE_PATH ..."

    # 创建远程目录
    ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

    # 使用 rsync 同步文件
    log_info "同步文件..."
    rsync -avz --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        "$LOCAL_DIST/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

    log_info "文件同步完成"
}

# 验证部署结果
verify_deployment() {
    log_info "验证部署结果..."

    remote_file_count=$(ssh "$REMOTE_USER@$REMOTE_HOST" "find $REMOTE_PATH -type f | wc -l" | tr -d ' ')

    log_info "远程服务器文件数量: $remote_file_count"

    if [ "$remote_file_count" -lt 1 ]; then
        log_error "部署验证失败：远程目录为空"
        exit 1
    fi

    log_info "部署验证通过"
}

# 设置远程文件权限
set_permissions() {
    log_info "设置文件权限..."

    ssh "$REMOTE_USER@$REMOTE_HOST" bash <<EOF
        set -e
        cd "$REMOTE_PATH"

        # 设置目录权限为 755
        find . -type d -exec chmod 755 {} \;

        # 设置文件权限为 644
        find . -type f -exec chmod 644 {} \;

        echo "文件权限设置完成"
EOF

    log_info "权限设置完成"
}

# 显示部署信息
show_deployment_info() {
    log_info "====================================="
    log_info "部署完成！"
    log_info "====================================="
    log_info "远程服务器: $REMOTE_HOST"
    log_info "部署路径: $REMOTE_PATH"
    log_info "部署时间: $TIMESTAMP"
    log_info "备份位置: $BACKUP_DIR/netops_$TIMESTAMP"
    log_info "====================================="
}

# 回滚功能
rollback() {
    log_warn "执行回滚操作..."

    ssh "$REMOTE_USER@$REMOTE_HOST" bash <<EOF
        set -e

        # 查找最新的备份
        latest_backup=\$(ls -t "$BACKUP_DIR" 2>/dev/null | head -n 1)

        if [ -z "\$latest_backup" ]; then
            echo "错误：没有找到备份文件"
            exit 1
        fi

        echo "找到备份: \$latest_backup"
        echo "正在回滚..."

        # 删除当前版本
        rm -rf "$REMOTE_PATH"

        # 恢复备份
        cp -r "$BACKUP_DIR/\$latest_backup" "$REMOTE_PATH"

        echo "回滚完成"
EOF

    log_info "回滚成功"
}

# 主函数
main() {
    log_info "开始部署 NetOps 前端项目..."

    # 检查配置
    check_config

    # 检查本地编译产物
    check_dist

    # 检查远程连接
    check_remote_connection

    # 备份远程文件
    backup_remote

    # 部署到远程
    deploy_to_remote

    # 设置权限
    set_permissions

    # 验证部署
    verify_deployment

    # 显示部署信息
    show_deployment_info
}

# 脚本入口
case "${1:-}" in
    "rollback")
        log_warn "开始回滚到上一个版本..."
        check_config
        check_remote_connection
        rollback
        ;;
    "")
        main
        ;;
    *)
        echo "用法: $0 [rollback]"
        echo ""
        echo "命令："
        echo "  (无参数)    - 执行部署"
        echo "  rollback    - 回滚到上一个版本"
        echo ""
        echo "环境变量："
        echo "  DEPLOY_HOST - 远程服务器地址（必需）"
        echo "  DEPLOY_USER - 远程服务器用户名（默认: root）"
        echo ""
        echo "示例："
        echo "  export DEPLOY_HOST=netops.vdian.net"
        echo "  export DEPLOY_USER=www-data"
        echo "  $0"
        exit 1
        ;;
esac
