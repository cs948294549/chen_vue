#!/bin/bash

##############################################
# NetOps 前端项目部署脚本
# 用途：在服务器上拉取最新代码并部署到 /var/www/netops
# 使用：在项目目录下直接运行 ./deploy.sh
##############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===== 配置区域 =====
DEPLOY_PATH="/var/www/netops"                         # 部署目标路径
LOCAL_DIST="dist"                                     # 编译产物目录
BACKUP_DIR="/var/www/netops_backup"                   # 备份目录
# ===================

TIMESTAMP=$(date +%Y%m%d_%H%M%S)                      # 时间戳
PROJECT_DIR=$(pwd)                                    # 当前项目目录

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

# 检查是否在 git 仓库中
check_git_repo() {
    if [ ! -d ".git" ]; then
        log_error "当前目录不是 git 仓库"
        log_info "请在项目根目录下运行此脚本"
        exit 1
    fi
    log_info "Git 仓库检查通过"
}

# 拉取最新代码
git_pull() {
    log_info "拉取最新代码..."

    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warn "检测到未提交的更改"
        log_info "暂存当前更改..."
        git stash save "auto-stash-before-deploy-$TIMESTAMP"
    fi

    # 拉取最新代码
    if git pull; then
        log_info "代码更新成功"
    else
        log_error "代码拉取失败"
        exit 1
    fi

    # 显示当前版本信息
    current_commit=$(git rev-parse --short HEAD)
    current_branch=$(git branch --show-current)
    log_info "当前分支: $current_branch"
    log_info "当前提交: $current_commit"
}

# 检查 dist 目录
check_dist() {
    if [ ! -d "$LOCAL_DIST" ]; then
        log_error "dist 目录不存在"
        log_info "请确认 git 仓库中包含编译产物"
        exit 1
    fi

    file_count=$(find "$LOCAL_DIST" -type f | wc -l | tr -d ' ')

    if [ "$file_count" -lt 1 ]; then
        log_error "dist 目录为空"
        exit 1
    fi

    log_info "dist 目录包含 $file_count 个文件"
}

# 备份当前版本
backup_current() {
    log_info "备份当前版本..."

    # 如果部署目录存在且不为空，则备份
    if [ -d "$DEPLOY_PATH" ] && [ "$(ls -A $DEPLOY_PATH 2>/dev/null)" ]; then
        # 创建备份目录
        mkdir -p "$BACKUP_DIR"

        # 备份当前版本
        backup_path="$BACKUP_DIR/netops_$TIMESTAMP"
        cp -r "$DEPLOY_PATH" "$backup_path"
        log_info "备份已保存到: $backup_path"

        # 只保留最近5个备份
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        log_info "已清理旧备份，保留最近5个"
        cd "$PROJECT_DIR"
    else
        log_info "无需备份：部署目录不存在或为空"
    fi
}

# 部署到目标目录
deploy() {
    log_info "开始部署..."

    # 创建部署目录
    mkdir -p "$DEPLOY_PATH"

    # 清空部署目录
    log_info "清空部署目录..."
    rm -rf "$DEPLOY_PATH"/*

    # 复制编译产物到部署目录
    log_info "复制文件到 $DEPLOY_PATH ..."
    cp -r "$LOCAL_DIST"/* "$DEPLOY_PATH/"

    # 设置文件权限
    log_info "设置文件权限..."
    find "$DEPLOY_PATH" -type d -exec chmod 755 {} \;
    find "$DEPLOY_PATH" -type f -exec chmod 644 {} \;

    log_info "部署完成"
}

# 验证部署结果
verify_deployment() {
    log_info "验证部署结果..."

    deployed_file_count=$(find "$DEPLOY_PATH" -type f | wc -l | tr -d ' ')

    log_info "部署目录文件数量: $deployed_file_count"

    if [ "$deployed_file_count" -lt 1 ]; then
        log_error "部署验证失败：部署目录为空"
        exit 1
    fi

    log_info "部署验证通过"
}

# 显示部署信息
show_deployment_info() {
    current_commit=$(git rev-parse --short HEAD)
    current_branch=$(git branch --show-current)

    log_info "====================================="
    log_info "部署完成！"
    log_info "====================================="
    log_info "项目目录: $PROJECT_DIR"
    log_info "部署路径: $DEPLOY_PATH"
    log_info "Git 分支: $current_branch"
    log_info "Git 提交: $current_commit"
    log_info "部署时间: $TIMESTAMP"
    log_info "备份位置: $BACKUP_DIR/netops_$TIMESTAMP"
    log_info "====================================="
}

# 回滚功能
rollback() {
    log_warn "执行回滚操作..."

    # 查找最新的备份
    latest_backup=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -n 1)

    if [ -z "$latest_backup" ]; then
        log_error "没有找到备份文件"
        exit 1
    fi

    log_info "找到备份: $latest_backup"
    log_info "正在回滚..."

    # 删除当前版本
    rm -rf "$DEPLOY_PATH"/*

    # 恢复备份
    cp -r "$BACKUP_DIR/$latest_backup"/* "$DEPLOY_PATH/"

    log_info "回滚成功"
    log_info "已恢复到备份: $latest_backup"
}

# 主函数
main() {
    log_info "开始部署 NetOps 前端项目..."
    log_info "====================================="

    # 检查 git 仓库
    check_git_repo

    # 拉取最新代码
    git_pull

    # 检查 dist 目录
    check_dist

    # 备份当前版本
    backup_current

    # 部署
    deploy

    # 验证部署
    verify_deployment

    # 显示部署信息
    show_deployment_info
}

# 脚本入口
case "${1:-}" in
    "rollback")
        log_warn "开始回滚到上一个版本..."
        rollback
        ;;
    "")
        main
        ;;
    *)
        echo "用法: $0 [rollback]"
        echo ""
        echo "命令："
        echo "  (无参数)    - 拉取代码并部署"
        echo "  rollback    - 回滚到上一个版本"
        echo ""
        echo "配置："
        echo "  编辑脚本文件中的配置区域"
        echo "  DEPLOY_PATH - 部署目标路径"
        echo "  LOCAL_DIST  - 编译产物目录"
        echo "  BACKUP_DIR  - 备份目录"
        echo ""
        echo "示例："
        echo "  # 在服务器项目目录下执行部署"
        echo "  cd /path/to/chen_vue"
        echo "  ./deploy.sh"
        echo ""
        echo "  # 回滚"
        echo "  ./deploy.sh rollback"
        exit 1
        ;;
esac
