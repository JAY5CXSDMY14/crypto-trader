# 🤖 OKX加密货币交易机器人

**初始资金**: 10 USDT
**交易所**: OKX
**策略**: 趋势跟踪 + 风险管理

---

## 🚀 快速开始

### 1. 安装依赖
```bash
cd ~/crypto-trader
npm install
```

### 2. 查看余额
```bash
npm run balance
```

### 3. 启动机器人
```bash
npm start
```

---

## 📁 项目结构

```
crypto-trader/
├── src/
│   ├── trader.js    # 核心交易逻辑
│   └── balance.js   # 余额查询
├── config/         # 配置文件
├── scripts/        # 自动化脚本
└── package.json
```

---

## 🎯 交易策略

| 参数 | 值 | 说明 |
|------|-----|------|
| 初始资金 | 10 USDT | 小额测试 |
| 止损 | -10% | 亏损10%自动止损 |
| 止盈 | +30% | 盈利30%自动止盈 |
| 交易对 | BTC-USDT, ETH-USDT, SOL-USDT | 主流币 |

---

## ⚠️ 风险提示

- 加密货币是高风险投资
- 可能亏损全部资金
- 只用你能承受亏损的金额
- 随时监控机器人运行状态

---

## 📝 使用方法

### 查看当前余额
```bash
npm run balance
```

### 手动买入
```bash
node src/buy.js BTC-USDT 0.001
```

### 手动卖出
```bash
node src/sell.js BTC-USDT 0.001
```

---

**记住**: 安全第一，只开交易权限，不开提币权限！

---

*创建时间: 2026-02-11*
*作者: LuXZ02*
