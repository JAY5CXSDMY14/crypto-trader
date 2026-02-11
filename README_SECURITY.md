# 🔒 安全使用指南

## ⚠️ 重要警告

**GitHub历史中可能已包含API密钥！**

如果之前已将密钥硬编码到代码中：
1. ⚠️ 请立即前往 https://www.okx.com/app/settings/api-keys 删除旧的API Key
2. ⚠️ 重新生成新的API Key
3. ⚠️ 切勿再将密钥硬编码到代码中

---

## ✅ 安全运行方式

### 方式1：环境变量（推荐）

```bash
# 设置环境变量
export OKX_API_KEY="your_api_key"
export OKX_API_SECRET="your_api_secret"
export OKX_PASSPHRASE="your_passphrase"

# 运行交易机器人
node src/smart-trader.js
```

### 方式2：.env文件

```bash
# 复制模板
cp .env.example .env

# 编辑填入密钥
nano .env

# 运行（需要安装dotenv）
npm install dotenv
node src/smart-trader.js
```

### 方式3：命令行参数

```bash
OKX_API_KEY=xxx OKX_API_SECRET=yyy OKX_PASSPHRASE=zzz node src/smart-trader.js
```

---

## 🔒 安全原则

1. **永不硬编码**
   - ❌ 不在代码中写密钥
   - ❌ 不在注释中写密钥
   - ❌ 不在日志中输出密钥

2. **使用环境变量**
   - ✅ 安全存储敏感信息
   - ✅ 便于管理多环境

3. **定期更换**
   - ⚠️ 密钥泄露后立即更换
   - ⚠️ 定期检查访问记录

4. **最小权限**
   - ✅ 只开交易权限
   - ❌ 不开提币权限
   - ❌ 限制IP访问

---

## 📝 .gitignore已配置

以下文件不会被提交到GitHub：
- `config/` - 配置文件目录
- `data/` - 数据文件
- `*.log` - 日志文件
- `.env` - 环境变量文件

---

*创建时间: 2026-02-11*
