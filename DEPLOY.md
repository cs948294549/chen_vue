# 部署文档

## 快速部署

### 1. 配置部署脚本

编辑 `deploy.sh` 文件，修改配置区域：

```bash
# ===== 配置区域 =====
REMOTE_USER="root"                    # 远程服务器用户名
REMOTE_HOST="netops.vdian.net"        # 远程服务器地址
REMOTE_PATH="/var/www/netops"         # 远程部署路径
LOCAL_DIST="dist"                     # 本地编译目录
BACKUP_DIR="/var/www/netops_backup"   # 远程备份目录
# ===================
```

### 2. 本地编译
```bash
npm run build
```

### 3. 执行部署
```bash
./deploy.sh
```

## 详细说明

### 前置要求

1. **SSH 密钥认证**
   ```bash
   # 生成密钥（如果没有）
   ssh-keygen -t rsa -b 4096
   
   # 复制公钥到服务器
   ssh-copy-id root@netops.vdian.net
   ```

2. **必需工具**
   - `ssh` - SSH 客户端
   - `rsync` - 文件同步工具（通常系统自带）
   - `bash` - Bash 4.0+

3. **服务器权限**
   - 对 `/var/www/netops` 目录的写权限
   - 对 `/var/www/netops_backup` 目录的写权限

### 部署流程

脚本会自动执行以下步骤：

1. ✅ 检查本地 `dist` 目录是否存在
2. ✅ 检查远程服务器连接
3. ✅ 备份远程现有文件到 `/var/www/netops_backup/netops_YYYYMMDD_HHMMSS`
4. ✅ 同步本地 `dist` 目录到远程 `/var/www/netops`
5. ✅ 设置正确的文件权限（目录 755，文件 644）
6. ✅ 验证部署结果
7. ✅ 显示部署信息

### 备份管理

- 每次部署前自动备份当前版本
- 备份目录：`/var/www/netops_backup/`
- 自动保留最近 5 个备份
- 超过 5 个的旧备份会被自动清理

### 回滚操作

如果部署后发现问题，可以快速回滚到上一个版本：

```bash
./deploy.sh rollback
```

回滚会：
- 删除当前版本
- 恢复最新的备份

## 使用示例

### 标准部署流程
```bash
# 1. 编译项目
npm run build

# 2. 设置服务器地址
export DEPLOY_HOST=netops.vdian.net

# 3. 部署
./deploy.sh

# 输出示例：
# [INFO] 开始部署 NetOps 前端项目...
# [INFO] 检查 dist 目录内容...
# [INFO] dist 目录包含 42 个文件
# [INFO] 检查远程服务器连接...
# [INFO] 远程服务器连接正常
# [INFO] 备份远程现有文件...
# [INFO] 备份完成
# [INFO] 开始部署到 netops.vdian.net:/var/www/netops ...
# [INFO] 同步文件...
# [INFO] 文件同步完成
# [INFO] 设置文件权限...
# [INFO] 权限设置完成
# [INFO] 验证部署结果...
# [INFO] 远程服务器文件数量: 42
# [INFO] 部署验证通过
# [INFO] =====================================
# [INFO] 部署完成！
# [INFO] =====================================
```

### 使用非 root 用户部署

编辑 `deploy.sh`，修改 `REMOTE_USER`：

```bash
REMOTE_USER="www-data"
```

### 回滚到上一版本
```bash
./deploy.sh rollback
```

## 脚本配置

可以直接编辑 `deploy.sh` 修改以下配置：

```bash
REMOTE_PATH="/var/www/netops"           # 远程部署路径
LOCAL_DIST="dist"                       # 本地编译目录
BACKUP_DIR="/var/www/netops_backup"     # 远程备份目录
```

## 常见问题

### 1. SSH 连接失败
```
[ERROR] 无法连接到远程服务器
```

**解决方法：**
- 检查服务器地址是否正确
- 确认 SSH 密钥是否配置：`ssh root@netops.vdian.net`
- 检查网络连接

### 2. dist 目录不存在
```
[ERROR] 本地 dist 目录不存在
```

**解决方法：**
```bash
npm run build
```

### 3. 权限不足
```
rsync: failed to set permissions on "/var/www/netops": Permission denied
```

**解决方法：**
- 确认用户对目标目录有写权限
- 或使用 sudo：`DEPLOY_USER=root ./deploy.sh`

### 4. rsync 命令未找到
```
bash: rsync: command not found
```

**解决方法：**
```bash
# macOS
brew install rsync

# Ubuntu/Debian
sudo apt-get install rsync

# CentOS/RHEL
sudo yum install rsync
```

## 安全建议

1. **使用 SSH 密钥认证**
   - 不要使用密码登录
   - 配置 `~/.ssh/config` 简化连接

2. **限制部署权限**
   - 创建专门的部署用户
   - 只授予必要的目录权限

3. **使用堡垒机**
   - 生产环境通过跳板机部署
   - 记录部署操作日志

4. **配置文件管理**
   - 不要在脚本中硬编码敏感信息
   - 使用环境变量传递配置

## 配置 SSH 快捷方式

编辑 `~/.ssh/config`：

```
Host netops
    HostName netops.vdian.net
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

然后可以在 `deploy.sh` 中使用简化的主机名：

```bash
REMOTE_HOST="netops"
```

## Nginx 配置参考

部署完成后，确保 Nginx 配置正确：

```nginx
server {
    listen 80;
    server_name netops.vdian.net;
    
    root /var/www/netops;
    index index.html;
    
    # Vue Router history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
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

## CI/CD 集成

可以将部署脚本集成到 CI/CD 流程中：

```yaml
# .gitlab-ci.yml 示例
deploy:
  stage: deploy
  only:
    - main
  script:
    - npm install
    - npm run build
    - ./deploy.sh
  environment:
    name: production
    url: https://netops.vdian.net
```

## 监控部署

可以添加部署通知（钉钉、企业微信等）：

```bash
# 在 deploy.sh 的 show_deployment_info 函数后添加
send_notification() {
    curl -X POST "https://your-webhook-url" \
        -H "Content-Type: application/json" \
        -d "{
            \"msg_type\": \"text\",
            \"content\": {
                \"text\": \"NetOps 部署完成\\n服务器: $REMOTE_HOST\\n时间: $TIMESTAMP\"
            }
        }"
}
```

## 版本管理

建议在每次部署前打 Git 标签：

```bash
# 创建版本标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 编译和部署
npm run build
./deploy.sh
```

---

**维护者**: NetOps 团队  
**最后更新**: 2026-08-14
