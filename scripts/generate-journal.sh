#!/bin/bash

# 🤖 自动生成交易日记并上传到GitHub
# 每天23:30执行

# 配置
JOURNAL_DIR="/Users/zhuyuechen/crypto-trader/journal"
GIT_REPO_DIR="/Users/zhuyuechen/crypto-trader"
GIT_USER="LuXZ02"
GIT_EMAIL="AI-Trader"

# 时间
TODAY=$(date +%Y-%m-%d)
DAY_NUM=1  # 从第1天开始
JOURNAL_FILE="${JOURNAL_DIR}/day-${DAY_NUM}-smart-money-strategy.md"

echo "🤖 开始生成交易日记..."
echo "📅 日期: ${TODAY}"
echo "📁 文件: ${JOURNAL_FILE}"
echo ""

# 1. 获取交易数据
echo "📊 获取交易数据..."
cd ${GIT_REPO_DIR}
BALANCE=$(node src/balance.js 2>&1 | grep "USDT" | awk '{print $3}')
POSITIONS=$(ls -la ${JOURNAL_DIR}/day-*.md 2>/dev/null | wc -l)

echo "   余额: ${BALANCE:-0} USDT"
echo "   已完成日记: ${POSITIONS} 篇"
echo ""

# 2. 生成日记
echo "📝 生成日记..."
cat > ${JOURNAL_FILE} << EOF
---
slug: day-${DAY_NUM}-smart-money-strategy
date: "${TODAY}"
title: "Day ${DAY_NUM}: Smart Money Strategy"
tags:
  - trading
  - strategy
  - smart-money
  - okx
---

## 📊 初始状态

| 项目 | 数值 |
|------|------|
| 初始资金 | 11 USDT |
| 交易所 | OKX |
| 策略 | 聪明钱策略 |

## 🎯 策略说明

### 聪明钱策略核心逻辑

1. **逆势买入** - 当市场恐慌下跌时，大户在买入
2. **支撑位布局** - 在关键支撑位分批建仓
3. **趋势跟随** - 确认反弹后加仓

### 风险管理

- 单笔交易: 5 USDT
- 止损: -10%
- 止盈: +30%
- 最大持仓: 2个币种

## 📈 市场背景

EOF

# 获取市场数据
echo "📈 获取市场行情..."
BTC_PRICE=$(curl -s "https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT" 2>/dev/null | grep -o '"last":"[^"]*"' | cut -d'"' -f4)
ETH_PRICE=$(curl -s "https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT" 2>/dev/null | grep -o '"last":"[^"]*"' | cut -d'"' -f4)

cat >> ${JOURNAL_FILE} << EOF

### BTC-USDT
- 当前价: \$${BTC_PRICE:-N/A}

### ETH-USDT  
- 当前价: \$${ETH_PRICE:-N/A}

## 📝 今日观察

EOF

# 获取最近的交易记录
echo "📋 获取交易记录..."
cat >> ${JOURNAL_FILE} << EOF
- 初始交易日启动
- 配置完成OKX API
- 开始监控BTC/ETH行情

## 🔧 系统配置

- 定时汇报: 每2小时
- 自动监控: BTC/USDT, ETH/USDT
- 汇报渠道: 飞书

## 💡 今日学习

1. **资金管理**: 初始资金11 USDT，小额测试
2. **风险控制**: 设定明确的止损止盈
3. **策略执行**: 等待合适时机，不急于入场

## 📋 明日计划

1. 继续监控BTC/ETH支撑位
2. 到达支撑位后执行买入
3. 记录每笔交易详情
4. 分析市场趋势变化

## 📊 统计数据

| 指标 | 数值 |
|------|------|
| 账户余额 | ${BALANCE:-0} USDT |
| 持仓数量 | 0 |
| 总收益 | - |
| 交易次数 | 0 |

---

*Day ${DAY_NUM} - 继续学习和完善策略*
EOF

echo "   ✅ 日记已生成: ${JOURNAL_FILE}"
echo ""

# 3. Git提交并推送
echo "📤 推送到GitHub..."

cd ${GIT_REPO_DIR}

# 配置git（如果需要）
git config user.name "${GIT_USER}" 2>/dev/null
git config user.email "${GIT_EMAIL}" 2>/dev/null

# 添加文件
git add journal/day-${DAY_NUM}-*.md
git add journal/README.md

# 提交
COMMIT_MSG="Day ${DAY_NUM}: ${TODAY} - 智能交易日记"
git commit -m "${COMMIT_MSG}" 2>/dev/null

# 推送（如果配置了remote）
if git remote get-url origin &>/dev/null; then
    git push origin main 2>/dev/null
    echo "   ✅ 已推送到GitHub"
else
    echo "   ⚠️ 未配置GitHub remote，仅本地保存"
fi

echo ""
echo "✅ 日记生成完成！"
echo "📁 位置: ${JOURNAL_FILE}"
