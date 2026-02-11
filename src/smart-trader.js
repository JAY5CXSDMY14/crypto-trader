/**
 * 🤖 OKX智能交易机器人 - 聪明钱策略版
 * 
 * 策略：学习聪明钱包的交易逻辑
 * 1. 逆势买入 - 恐慌抛售时买入
 * 2. 支撑位买入 - 关键支撑位布局
 * 3. 趋势跟随 - 顺势加仓
 * 
 * 初始资金: 11 USDT
 * 风险控制: 止损-10%, 止盈+30%
 */

const https = require('https');
const crypto = require('crypto');

// 配置
const CONFIG = {
  apiKey: '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: 'HAZYC2004chen!',
  
  // 交易参数
  initialCapital: 11,
  tradeAmount: 5,           // 每次交易5 USDT
  stopLoss: 0.10,           // 止损10%
  takeProfit: 0.30,         // 止盈30%
  maxPositions: 2,           // 最多2个仓位
  
  // 交易对（主流币）
  symbols: ['BTC-USDT', 'ETH-USDT'],
  
  // 聪明钱策略参数
  buyThreshold: -0.05,      // 下跌5%时买入
  supportLevels: {
    'BTC-USDT': [66000, 65000, 64000],
    'ETH-USDT': [1950, 1900, 1850],
  },
};

// 状态
let positions = {};
let tradeHistory = [];
let capital = 11;

// OKX API
const OKX = {
  sign(method, path, body = '') {
    const timestamp = Date.now() / 1000;
    const message = `${timestamp}${method}${path}${body}`;
    const signature = crypto
      .createHmac('sha256', CONFIG.apiSecret)
      .update(message)
      .digest('base64');
    return { signature, timestamp };
  },
  
  async request(method, endpoint, body = null) {
    const path = endpoint;
    const { signature, timestamp } = this.sign(method, path, body || '');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.okx.com',
        path,
        method,
        headers: {
          'OK-ACCESS-KEY': CONFIG.apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': CONFIG.passphrase,
          'Content-Type': 'application/json',
        },
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  },
  
  async getBalance() {
    return this.request('GET', '/api/v5/account/balance');
  },
  
  async getTicker(symbol) {
    return this.request('GET', `/api/v5/market/ticker?instId=${symbol}`);
  },
  
  async placeOrder(symbol, side, size, price = null) {
    const endpoint = '/api/v5/trade/order';
    const body = JSON.stringify({
      instId: symbol,
      tdMode: 'cash',
      side,
      ordType: price ? 'limit' : 'market',
      sz: size,
      px: price,
    });
    return this.request('POST', endpoint, body);
  },
};

/**
 * 聪明钱策略分析
 */
class SmartMoneyStrategy {
  constructor() {
    this.signals = [];
  }
  
  /**
   * 分析市场状态
   */
  async analyze(symbol) {
    const ticker = await OKX.getTicker(symbol);
    const data = ticker.data?.[0];
    if (!data) return null;
    
    const currentPrice = parseFloat(data.last);
    const open24h = parseFloat(data.open24h);
    const change24h = (currentPrice - open24h) / open24h;
    
    const supportLevels = CONFIG.supportLevels[symbol] || [];
    
    // 计算距离支撑位的距离
    const nearestSupport = supportLevels.find(s => currentPrice > s);
    const supportDistance = nearestSupport ? (currentPrice - nearestSupport) / currentPrice : 0;
    
    return {
      symbol,
      price: currentPrice,
      change24h: change24h * 100,
      high24h: parseFloat(data.high24h),
      low24h: parseFloat(data.low24h),
      supportLevels,
      nearestSupport,
      supportDistance,
    };
  }
  
  /**
   * 生成交易信号
   */
  generateSignal(analysis) {
    const { symbol, price, change24h, nearestSupport, supportDistance } = analysis;
    
    // 策略1：恐慌买入 - 24h跌幅>5%
    if (change24h < -5) {
      return {
        type: 'BUY',
        reason: '恐慌抛售，聪明钱抄底',
        confidence: 0.8,
        price,
      };
    }
    
    // 策略2：支撑位买入
    if (nearestSupport && supportDistance < 0.03) {
      return {
        type: 'BUY',
        reason: `接近支撑位 ${nearestSupport}`,
        confidence: 0.7,
        price,
      };
    }
    
    // 策略3：反弹确认后买入
    if (change24h > 0 && change24h < 2) {
      return {
        type: 'BUY',
        reason: '短期反弹确认',
        confidence: 0.5,
        price,
      };
    }
    
    return null;
  }
}

/**
 * 交易执行
 */
class TradeExecutor {
  async execute(signal) {
    if (!signal) return null;
    
    const { symbol, type, price, reason } = signal;
    
    try {
      // 计算买入数量
      const size = CONFIG.tradeAmount / price;
      
      // 下单
      const order = await OKX.placeOrder(symbol, type.toLowerCase(), size.toFixed(6));
      
      if (order.code === '0') {
        const trade = {
          id: Date.now(),
          symbol,
          type,
          price,
          size,
          reason,
          time: new Date().toISOString(),
          status: 'filled',
        };
        
        tradeHistory.push(trade);
        positions[symbol] = {
          ...trade,
          stopLoss: price * (1 - CONFIG.stopLoss),
          takeProfit: price * (1 + CONFIG.takeProfit),
        };
        
        return trade;
      }
    } catch (error) {
      console.error('❌ 下单失败:', error.message);
      return null;
    }
  }
  
  async checkExit(symbol) {
    const pos = positions[symbol];
    if (!pos) return null;
    
    const ticker = await OKX.getTicker(symbol);
    const currentPrice = parseFloat(ticker.data?.[0]?.last);
    
    // 检查止损
    if (currentPrice <= pos.stopLoss) {
      return { action: 'STOP_LOSS', price: currentPrice, pnl: (currentPrice - pos.price) / pos.price };
    }
    
    // 检查止盈
    if (currentPrice >= pos.takeProfit) {
      return { action: 'TAKE_PROFIT', price: currentPrice, pnl: (currentPrice - pos.price) / pos.price };
    }
    
    return null;
  }
}

/**
 * 主程序
 */
async function main() {
  const strategy = new SmartMoneyStrategy();
  const executor = new TradeExecutor();
  
  console.log('='.repeat(60));
  console.log('    🤖 OKX智能交易机器人 - 聪明钱策略');
  console.log('='.repeat(60));
  console.log(`    🕐 ${new Date().toLocaleString('zh-CN')}`);
  console.log('='.repeat(60));
  
  // 1. 获取账户信息
  console.log('\n💰 账户状态:');
  const balance = await OKX.getBalance();
  const usdt = balance.data[0].details.find(d => d.ccy === 'USDT');
  const availableUSDT = parseFloat(usdt?.availBal || 0);
  console.log(`    可用USDT: ${availableUSDT.toFixed(2)}`);
  console.log(`    持仓: ${Object.keys(positions).length}`);
  
  // 2. 分析市场
  console.log('\n📊 市场分析:');
  for (const symbol of CONFIG.symbols) {
    const analysis = await strategy.analyze(symbol);
    if (analysis) {
      const signal = strategy.generateSignal(analysis);
      console.log(`\n  ${symbol}:`);
      console.log(`    价格: $${analysis.price.toFixed(2)} (${analysis.change24h.toFixed(2)}%)`);
      console.log(`    支撑位: ${analysis.supportLevels.join(' / ')}`);
      
      if (signal) {
        console.log(`    🟢 信号: ${signal.type} - ${signal.reason}`);
        console.log(`    置信度: ${(signal.confidence * 100).toFixed(0)}%`);
      } else {
        console.log(`    ⚪ 观望 - 无明确信号`);
      }
    }
  }
  
  // 3. 检查持仓
  console.log('\n📋 持仓状态:');
  if (Object.keys(positions).length === 0) {
    console.log('    无持仓');
  } else {
    for (const [symbol, pos] of Object.entries(positions)) {
      const currentTicker = await OKX.getTicker(symbol);
      const currentPrice = parseFloat(currentTicker.data?.[0]?.last);
      const pnl = ((currentPrice - pos.price) / pos.price * 100).toFixed(2);
      
      console.log(`\n  ${symbol}:`);
      console.log(`    买入价: $${pos.price.toFixed(2)}`);
      console.log(`    当前价: $${currentPrice.toFixed(2)}`);
      console.log(`    盈亏: ${pnl > 0 ? '+' : ''}${pnl}%`);
      console.log(`    止损: $${pos.stopLoss.toFixed(2)}`);
      console.log(`    止盈: $${pos.takeProfit.toFixed(2)}`);
      
      // 检查是否需要平仓
      const exitSignal = await executor.checkExit(symbol);
      if (exitSignal) {
        console.log(`    🚨 ${exitSignal.action}: $${exitSignal.price.toFixed(2)}`);
      }
    }
  }
  
  // 4. 执行交易
  console.log('\n🎯 交易执行:');
  for (const symbol of CONFIG.symbols) {
    if (positions[symbol]) continue; // 有持仓不重复买
    
    const analysis = await strategy.analyze(symbol);
    const signal = strategy.generateSignal(analysis);
    
    if (signal && availableUSDT >= CONFIG.tradeAmount) {
      const trade = await executor.execute(signal);
      if (trade) {
        console.log(`    ✅ 买入 ${symbol}: $${trade.price.toFixed(2)} (${trade.size.toFixed(6)})`);
        console.log(`    原因: ${trade.reason}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('    ✅ 交易检查完成');
  console.log('='.repeat(60));
}

// 导出
module.exports = { CONFIG, OKX, SmartMoneyStrategy, TradeExecutor };

if (require.main === module) {
  main();
}
