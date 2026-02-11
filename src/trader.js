/**
 * OKX 加密货币交易机器人
 * 
 * 初始资金: 10 USDT
 * 策略: 趋势跟踪 + 风险管理
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // API密钥（从环境变量或文件读取）
  apiKey: process.env.OKX_API_KEY || '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: process.env.OKX_API_SECRET || '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: process.env.OKX_PASSPHRASE || 'HAZYC2004chen!',
  
  // 交易参数
  initialCapital: 10,        // 初始资金 (USDT)
  maxPosition: 0.1,          // 最大仓位 (BTC)
  stopLoss: 0.10,            // 止损 10%
  takeProfit: 0.30,          // 止盈 30%
  
  // 交易对
  symbols: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
};

// API基础URL
const BASE_URL = 'https://www.okx.com';

// OKX API工具
const OKX = {
  /**
   * 生成签名
   */
  sign(method, path, body = '') {
    const timestamp = Date.now() / 1000;
    const message = `${timestamp}${method}${path}${body}`;
    const signature = crypto
      .createHmac('sha256', CONFIG.apiSecret)
      .update(message)
      .digest('base64');
    
    return { signature, timestamp };
  },
  
  /**
   * 发起API请求
   */
  async request(method, endpoint, body = null) {
    const path = endpoint;
    const { signature, timestamp } = this.sign(method, path, body || '');
    
    const headers = {
      'OK-ACCESS-KEY': CONFIG.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': CONFIG.passphrase,
      'Content-Type': 'application/json',
    };
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.okx.com',
        path: endpoint,
        method,
        headers,
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`解析失败: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  },
  
  /**
   * 获取账户余额
   */
  async getBalance() {
    const endpoint = '/api/v5/account/balance';
    const result = await this.request('GET', endpoint);
    return result.data?.[0]?.balances || [];
  },
  
  /**
   * 获取行情
   */
  async getTicker(symbol) {
    const endpoint = `/api/v5/market/ticker?instId=${symbol}`;
    return this.request('GET', endpoint);
  },
  
  /**
   * 下单
   */
  async placeOrder(symbol, side, size, price = null) {
    const endpoint = '/api/v5/trade/order';
    const body = JSON.stringify({
      instId: symbol,
      tdMode: 'cash',
      side,  // buy/sell
      ordType: price ? 'limit' : 'market',
      sz: size,
      px: price,
    });
    
    return this.request('POST', endpoint, body);
  },
};

/**
 * 交易策略
 */
class TradingStrategy {
  constructor() {
    this.positions = {};
    this.orders = [];
  }
  
  /**
   * 买入信号检测
   */
  async checkBuySignal(symbol) {
    const ticker = await OKX.getTicker(symbol);
    const price = parseFloat(ticker.data?.[0]?.lastPrice || 0);
    const change24h = parseFloat(ticker.data?.[0]?.sodUtc8 || 0);
    
    // 简单策略：24小时跌幅>5%时买入
    if (change24h < -5) {
      return {
        symbol,
        price,
        reason: `24h跌幅: ${change24h}%`,
      };
    }
    
    return null;
  }
  
  /**
   * 卖出信号检测
   */
  async checkSellSignal(symbol, buyPrice) {
    const ticker = await OKX.getTicker(symbol);
    const currentPrice = parseFloat(ticker.data?.[0]?.lastPrice || 0);
    const changePercent = (currentPrice - buyPrice) / buyPrice;
    
    // 止损或止盈
    if (changePercent <= -CONFIG.stopLoss) {
      return { action: 'stop_loss', price: currentPrice, change: changePercent };
    }
    if (changePercent >= CONFIG.takeProfit) {
      return { action: 'take_profit', price: currentPrice, change: changePercent };
    }
    
    return null;
  }
}

/**
 * 主程序
 */
async function main() {
  console.log('🤖 OKX加密货币交易机器人启动');
  console.log('='.repeat(50));
  
  try {
    // 1. 获取账户余额
    console.log('\n📊 账户余额:');
    const balances = await OKX.getBalance();
    const usdtBalance = balances.find(b => b.ccy === 'USDT');
    console.log(`   USDT: ${usdtBalance?.availBal || 0}`);
    
    // 2. 检查市场行情
    console.log('\n📈 市场行情:');
    for (const symbol of CONFIG.symbols) {
      const ticker = await OKX.getTicker(symbol);
      const data = ticker.data?.[0];
      if (data) {
        console.log(`   ${symbol}: $${data.lastPrice} (24h: ${data.sodUtc8}%)`);
      }
    }
    
    // 3. 显示策略
    console.log('\n🎯 交易策略:');
    console.log(`   初始资金: ${CONFIG.initialCapital} USDT`);
    console.log(`   止损线: -${CONFIG.stopLoss * 100}%`);
    console.log(`   止盈线: +${CONFIG.takeProfit * 100}%`);
    
    console.log('\n✅ 机器人运行正常！');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

// 导出模块
module.exports = { OKX, CONFIG, TradingStrategy };

// CLI入口
if (require.main === module) {
  main();
}
