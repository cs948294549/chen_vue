# API 配置说明

## 概述

后端 API 地址和前端加密密钥已从代码中提取到配置文件，支持开发环境和生产环境使用不同的配置。

## 配置文件位置

- **开发环境**: `config/dev.env.js`
- **生产环境**: `config/prod.env.js`

## 配置项说明

### 1. API_BASE_URL
后端 API 服务器地址

### 2. AES_SECRET
AES 对称加密密钥，**仅在前端使用**，用于客户端本地数据加密

### 3. MD5_SALT
MD5 加盐值，**仅在前端使用**，用于客户端数据签名

## 修改配置

### 开发环境

编辑 `config/dev.env.js`:

```javascript
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_BASE_URL: '"netops.vdian.net/api"',
  // AES_SECRET 和 MD5_SALT 继承自 prod.env.js
})
```

> 注意：开发环境默认继承生产环境的加密配置，确保加密一致性

### 生产环境

编辑 `config/prod.env.js`:

```javascript
module.exports = {
  NODE_ENV: '"production"',
  API_BASE_URL: '"netops.vdian.net/api"',
  AES_SECRET: '"your-aes-secret-key"',
  MD5_SALT: '"your-md5-salt"'
}
```

## 重要提示

### 🚨 生产环境密钥警告

**上线前必读：**
- `AES_SECRET` 和 `MD5_SALT` 一旦在生产环境使用，**禁止修改**
- 这些密钥不是用于定期轮换的，而是**永久固定**的
- 修改密钥会导致所有历史加密数据永久失效

**首次部署检查清单：**
1. ✅ 确认密钥配置正确无误
2. ✅ 备份密钥到安全的多个位置
3. ✅ 团队成员知晓密钥位置
4. ✅ 测试环境验证加密解密功能正常
5. ✅ 记录密钥到团队密钥管理系统

### ⚠️ 加密配置特性
- `AES_SECRET` 和 `MD5_SALT` **仅在前端生效**
- 后端不使用这些密钥，**后端数据库直接存储密文**
- **密钥丢失或修改后，已加密的数据无法恢复**
- 影响范围：
  - 用户已保存的加密数据将无法解密
  - 用户需要重新输入或设置所有加密内容
  - 可能影响用户登录状态和本地缓存

### 🔒 安全建议
1. **妥善备份密钥配置** - 在多个安全位置保存副本（至少3处）
2. **不要提交真实密钥到公开仓库** - 使用环境变量或私有配置文件
3. **严禁修改生产环境密钥** - 除非接受所有历史数据失效的后果
4. **生产环境使用强密钥** - 至少32位随机字符
5. **定期验证密钥备份** - 确保备份的密钥可用且正确

### 📋 密钥管理建议
```bash
# 建议将密钥配置单独管理
# 1. 创建私有配置文件
config/secret.env.js

# 2. 加入 .gitignore
echo "config/secret.env.js" >> .gitignore

# 3. 提供配置模板
config/secret.env.example.js
```

## 配置注意事项

1. **字符串需要双引号包裹** - 由于 webpack DefinePlugin 的工作方式，配置值必须是 `'"value"'` 格式（外层单引号，内层双引号）
2. **修改后需要重启服务** - 配置文件修改后需要重新运行 `npm run dev` 或 `npm run build`
3. **协议自动适配** - API_BASE_URL 不要包含协议前缀，系统会自动根据当前页面协议选择 http 或 https

## 完整配置示例

### 本地开发环境
```javascript
// config/dev.env.js
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_BASE_URL: '"localhost:5000"',
  // 继承 prod.env.js 的加密配置
})
```

### 测试环境
```javascript
// config/prod.env.js
module.exports = {
  NODE_ENV: '"production"',
  API_BASE_URL: '"chen.test.com/api"',
  AES_SECRET: '"test-secret-key-32chars-long"',
  MD5_SALT: '"test-salt-value"'
}
```

### 生产环境
```javascript
// config/prod.env.js
module.exports = {
  NODE_ENV: '"production"',
  API_BASE_URL: '"netops.vdian.net/api"',
  AES_SECRET: '"prod-secret-key-32chars-long"',
  MD5_SALT: '"prod-salt-value"'
}
```

## 使用的加密库

- **AES 加密**: 使用 `crypto-js` 库，位于 `src/utils/AES.js`
  - 用途：前端本地数据加密（如浏览器存储的敏感信息）
  - 算法：AES 对称加密
  - 作用域：仅前端，后端直接存储密文
  
- **MD5 签名**: 位于 `src/utils/MD5.js`
  - 用途：前端数据签名和完整性校验
  - 算法：MD5 + Salt
  - 作用域：仅前端

## 默认值

如果环境变量未配置，将使用以下默认值（仅用于开发调试）：
- `API_BASE_URL`: `"localhost:5000"`
- `AES_SECRET`: `"3a4b3ca0247e0500da70d637f6c5ded8"`
- `MD5_SALT`: `"eyJhbGciOiJIUzI1NiIsIn"`

⚠️ **生产环境请务必修改为实际配置值，并做好密钥备份**

## 数据恢复注意事项

由于后端只存储密文，没有使用这些密钥：
- ✅ 前端可以用正确的密钥解密本地数据
- ❌ 后端无法帮助恢复丢失密钥的数据
- ❌ 密钥错误会导致解密失败，数据不可用
- ❌ 更换密钥后，历史加密数据将永久无法解密

**建议：** 
1. 将密钥配置纳入团队密钥管理系统（如 Vault、1Password）
2. 定期备份配置文件到安全位置
3. 新环境部署时，使用与生产环境相同的密钥
