# 🤖 OKX加密货币交易机器人 - 聪明钱策略版

**初始资金**: 11 USDT  
**交易所**: OKX  
**策略**: 聪明钱策略（支撑位买入 + 趋势跟踪）  
**状态**: ✅ 已完成第一笔BTC交易

---

## 🎯 策略规则

### 核心原则
1. **逆势买入** - 在支撑位分批建仓
2. **趋势确认** - 反弹确认后再加仓
3. **严格止损** - 亏损达10%立即止损

### 交易参数
| 参数 | 值 | 说明 |
|------|-----|------|
| 初始资金 | 11 USDT | 小额测试 |
| 单笔仓位 | ≤5 USDT | 每次交易5 USDT |
| 止损 | -10% | 亏损10%自动止损 |
| 止盈 | +30% | 盈利30%自动止盈 |
| 交易对 | BTC-USDT, ETH-USDT | 主流币 |

### 支撑位
| 币种 | 支撑位1 | 支撑位2 | 支撑位3 |
|------|---------|---------|---------|
| BTC | $66,000 | $65,000 | $64,000 |
| ETH | $1,950 | $1,900 | $1,850 |

---

## 🚀 快速开始

### 使用方式

```bash
# 方式1: 使用快捷脚本
trade status    # 查看账户状态
trade buy       # 执行买入检查
trade check     # 检查市场行情

# 方式2: 直接运行
node ~/crypto-trader/src/smart-trader.js          # 查看状态
node ~/crypto-trader/src/smart-trader.js buy       # 执行买入
```

---

## 📁 项目结构

```
crypto-trader/
├── src/
│   ├── smart-trader.js    # ✅ 主交易机器人（完善版）
│   ├── trader.js          # 核心交易逻辑
│   ├── fix-trader.js      # API测试脚本
│   ├── test-api.js        # API诊断脚本
│   ├── exec-buy.js        # 执行买入脚本
│   └── check-order.js     # 订单检查脚本
├── bin/
│   └── trade              # 快捷命令脚本
├── data/
│   ├── trades.json        # ✅ 交易记录
│   └── portfolio.json     # ✅ 投资组合状态
├── scripts/
│   └── generate-journal.sh # 日记生成脚本
└── README.md              # 本文档
```

---

## 💰 交易状态

### 当前持仓
| 币种 | 数量 | 平均价格 | 止损 | 止盈 |
|------|------|---------|------|------|
| BTC | 0.000075 | $66,149.1 | $59,534 | $85,994 |

### 交易历史
| # | 日期 | 币种 | 方向 | 价格 | 数量 |
|---|------|------|------|------|------|
| 1 | 2026-02-11 | BTC | 买入 | $66,149.1 | 0.000075 |

---

## 🔧 故障排除

### API连接失败

**问题**: "socket hang up" 或 "ECONNRESET"

**解决方案**:

1. **检查网络**
   ```bash
   curl https://www.okx.com/api/v5/public/time
   ```

2. **测试API**
   ```bash
   node ~/crypto-trader/test-api.js
   ```

3. **重试交易**
   ```bash
   node ~/crypto-trader/src/smart-trader.js buy
   ```

### 下单失败

**问题**: "All operations failed"

**可能原因**:
- API权限不足（只开了交易权限）
- 余额不足
- 网络超时

**检查方法**:
```bash
# 查看账户余额
node ~/crypto-trader/test-api.js
```

---

## 📊 监控系统

### 自动汇报
- **交易汇报**: 每2小时自动汇报
- **交易日记**: 每日23:30自动生成
- **状态监控**: 整点Twitter监控

### 查看状态
```bash
# 实时状态
trade status

# 市场行情
trade check

# 买入信号
trade buy
```

---

## ⚠️ 风险提示

1. **加密货币是高风险投资**
   - 可能亏损全部资金
   - 只用你能承受亏损的金额

2. **API交易风险**
   - 网络波动可能导致交易失败
   - 建议设置合理的止损止盈

3. **监控提醒**
   - 建议定期检查交易状态
   - 重要消息通过飞书通知

---

## 📝 使用指南

### 日常使用

```bash
# 1. 早上检查持仓状态
trade status

# 2. 如果有买入信号，会自动买入
#    （需要在交易机器人运行时）

# 3. 定期查看交易日记
cat ~/crypto-trader/journal/day-*.md
```

### 手动交易

```bash
# 手动执行买入检查
trade buy

# 查看当前市场
trade check
```

---

## 🔗 相关链接

- **GitHub仓库**: https://github.com/JAY5CXSDMY14/crypto-trader
- **OKX交易所**: https://www.okx.com/
- **SYSTEM.md**: 完整交易规则

---

## 📅 更新日志

### 2026-02-11
- ✅ 完成第一笔BTC交易（0.000075 BTC @ $66,149.1）
- ✅ 修复API连接问题
- ✅ 完善交易机器人
- ✅ 配置自动监控

---

**记住**: 安全第一，严格执行止损纪律！

*创建时间: 2026-02-11*  
*作者: LuXZ02*
