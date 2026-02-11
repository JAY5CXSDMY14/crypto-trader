/**
 * OKX智能交易机器人
 * 
 * ⚠️ 重要：API密钥必须从环境变量读取，禁止硬编码！
 * 
 * 环境变量：
 * - OKX_API_KEY
 * - OKX_API_SECRET  
 * - OKX_PASSPHRASE
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// 配置 - 从环境变量读取
const CONFIG = {
  apiKey: process.env.OKX_API_KEY || '',
  apiSecret: process.env.OKX_API_SECRET || '',
  passphrase: process.env.OKX_PASSPHRASE || '',
  
  // 交易参数
  initialCapital: 11.00,
  tradeAmount: 5,
  stopLoss: 0.10,
  takeProfit: 0.30,
  maxPositions: 2,
  
  // 交易对
  symbols: ['BTC-USDT', 'ETH-USDT'],
  
  // 支撑位
  supportLevels: {
    'BTC-USDT': [66000, 65000, 64000],
    'ETH-USDT': [1950, 1900, 1850],
  },
};

// 检查环境变量
if (!CONFIG.apiKey || !CONFIG.apiSecret || !CONFIG.passphrase) {
  console.error('❌ 错误: 请设置环境变量');
  console.error('export OKX_API_KEY="your-api-key"');
  console.error('export OKX_API_SECRET="your-api-secret"');
  console.error('export OKX_PASSPHRASE="your-passphrase"');
  process.exit(1);
}

console.log('✅ API配置加载成功');
