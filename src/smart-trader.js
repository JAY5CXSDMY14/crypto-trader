/**
 * OKX智能交易机器人 - 完善版
 * 
 * 策略：聪明钱策略
 * 1. 逆势买入 - 恐慌抛售时买入
 * 2. 支撑位买入 - 关键支撑位布局
 * 3. 趋势跟随 - 顺势加仓
 * 
 * 初始资金: 11 USDT
 * 风险控制: 止损-10%, 止盈+30%
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

// 配置
const CONFIG = {
  apiKey: '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: 'HAZYC2004chen!',
  
  // 交易参数
  initialCapital: 11.00,
  tradeAmount: 5,           // 每次交易5 USDT
  stopLoss: 0.10,           // 止损10%
  takeProfit: 0.30,         // 止盈30%
  maxPositions: 2,           // 最多2个仓位
  
  // 交易对
  symbols: ['BTC-USDT', 'ETH-USDT'],
  
  // 支撑位
  supportLevels: {
    'BTC-USDT': [66000, 65000, 64000],
    'ETH-USDT': [1950, 1900, 1850],
  },
};

// 状态
let positions = {};
let tradeHistory = [];
let capital = 11.08;

// OKX API - 完善版
const OKX = {
  apiEndpoints: [
    { host: 'www.okx.com', port: 443 },
    { host: 'okx.com', port: 443 },
  ],
  
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
   * 带重试的请求
   */
  async request(method, endpoint, body = null, retries = 3) {
    const path = endpoint;
    const { signature, timestamp } = this.sign(method, path, body || '');
    
    const headers = {
      'OK-ACCESS-KEY': CONFIG.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': CONFIG.passphrase,
      'Content-Type': 'application/json',
    };
    
    for (let attempt = 0; attempt < retries; attempt++) {
      for (const endpoint of this.apiEndpoints) {
        try {
          console.log(`   🔄 尝试API请求 (${attempt + 1}/${retries}): ${endpoint.host}${path}`);
          
          const result = await this.httpsRequest(endpoint.host, endpoint.port, path, method, headers, body);
          return result;
        } catch (error) {
          console.log(`   ⚠️  ${endpoint.host} 失败: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw new Error('所有API端点均失败');
  },
  
  /**
   * HTTP请求封装
   */
  httpsRequest(host, port, path, method, headers, body) {
    return new Promise((resolve, reject) => {
      const options = { host, port, path, method, headers, timeout: 15000 };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (data.startsWith('<!DOCTYPE')) {
              reject(new Error('返回HTML页面，非API响应'));
              return;
            }
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`解析失败: ${data.substring(0, 100)}`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      if (body) req.write(body);
      req.end();
    });
  },
  
  /**
   * 获取账户余额
   */
  async getBalance() {
    return this.request('GET', '/api/v5/account/balance');
  },
  
  /**
   * 获取行情
   */
  async getTicker(symbol) {
    return this.request('GET', `/api/v5/market/ticker?instId=${symbol}`);
  },
  
  /**
   * 下单
   */
  async placeOrder(symbol, side, size, price = null) {
    const endpoint = '/api/v5/trade/order';
    const body = JSON.stringify({
      instId: symbol,
      tdMode: 'cash',
      side,
      ordType: price ? 'limit' : 'market',
      sz: Math.floor(size * 1000000) / 1000000,
      px: price,
    });
    return this.request('POST', endpoint, body);
  },
  
  /**
   * 获取订单详情
   */
  async getOrder(ordId, symbol) {
    return this.request('GET', `/api/v5/trade/order?ordId=${ordId}&instId=${symbol}`);
  },
};

/**
 * 保存状态到文件
 */
function saveState() {
  const state = {
    positions,
    tradeHistory,
    capital,
    lastUpdated: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `${__dirname}/data/portfolio.json`,
    JSON.stringify({
      initialCapital: CONFIG.initialCapital,
      currentCapital: capital,
      btcHoldings: positions['BTC-USDT']?.size || 0,
      btcAvgPrice: positions['BTC-USDT']?.price || 0,
      totalTrades: tradeHistory.length,
      positions,
      lastUpdated: state.lastUpdated,
    }, null, 2)
  );
  
  fs.writeFileSync(
    `${__dirname}/data/trades.json`,
    JSON.stringify(tradeHistory, null, 2)
  );
}

/**
 * 分析市场状态
 */
async function analyze(symbol) {
  try {
    const ticker = await OKX.getTicker(symbol);
    const data = ticker.data?.[0];
    if (!data) return null;
    
    const currentPrice = parseFloat(data.last);
    const open24h = parseFloat(data.open24h);
    const change24h = (currentPrice - open24h) / open24h;
    
    const supportLevels = CONFIG.supportLevels[symbol] || [];
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
  } catch (error) {
    console.error(`   ❌ ${symbol} 行情获取失败: ${error.message}`);
    return null;
  }
}

/**
 * 执行买入
 */
async function buy(symbol) {
  const analysis = await analyze(symbol);
  if (!analysis) {
    console.log(`   ❌ 无法获取${symbol}行情`);
    return false;
  }
  
  const { symbol: s, price, nearestSupport, supportDistance, change24h } = analysis;
  
  console.log(`\n   📊 ${s} 分析:`);
  console.log(`      当前价格: $${price}`);
  console.log(`      24h涨跌: ${change24h.toFixed(2)}%`);
  console.log(`      支撑位: ${nearestSupport}`);
  console.log(`      距离支撑: ${(supportDistance * 100).toFixed(2)}%`);
  
  // 检查是否跌破支撑位
  if (nearestSupport && price <= nearestSupport * 1.01) {
    console.log(`\n   🎯 触发买入条件!`);
    
    const size = CONFIG.tradeAmount / price;
    console.log(`   💰 买入数量: ${size.toFixed(6)} ${s.replace('-USDT', '')}`);
    
    try {
      const order = await OKX.placeOrder(s, 'buy', size);
      
      if (order.code === '0') {
        console.log(`   ✅ 下单成功! 订单ID: ${order.data?.[0]?.ordId}`);
        
        // 等待订单成交
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const orderDetails = await OKX.getOrder(order.data[0].ordId, s);
        const filled = orderDetails.data?.[0];
        
        if (filled && filled.state === 'filled') {
          const trade = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            symbol: s,
            side: 'BUY',
            price: parseFloat(filled.avgPx),
            size: parseFloat(filled.fillSz),
            value: parseFloat(filled.fillSz) * parseFloat(filled.avgPx),
            fee: parseFloat(filled.fee),
            status: 'filled',
            reason: `跌破支撑位${nearestSupport}，聪明钱策略买入`,
            stopLoss: parseFloat(filled.avgPx) * (1 - CONFIG.stopLoss),
            takeProfit: parseFloat(filled.avgPx) * (1 + CONFIG.takeProfit),
          };
          
          tradeHistory.push(trade);
          positions[s] = {
            size: trade.size,
            price: trade.price,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit,
            time: trade.time,
          };
          
          // 更新USDT余额
          capital -= trade.value;
          
          // 保存状态
          saveState();
          
          console.log(`   📝 实际成交价: $${trade.price}`);
          console.log(`   📝 实际成交数量: ${trade.size}`);
          
          return true;
        }
      } else {
        console.log(`   ⚠️ 下单失败: ${order.msg}`);
      }
    } catch (error) {
      console.log(`   ❌ 下单异常: ${error.message}`);
    }
  } else {
    console.log(`   ⏸️ 价格未跌破支撑，暂不买入`);
  }
  
  return false;
}

/**
 * 检查止损/止盈
 */
async function checkExit(symbol) {
  const pos = positions[symbol];
  if (!pos) return null;
  
  const ticker = await OKX.getTicker(symbol);
  const currentPrice = parseFloat(ticker.data?.[0]?.last);
  
  if (!currentPrice) return null;
  
  // 止损
  if (currentPrice <= pos.stopLoss) {
    console.log(`\n   🔴 ${symbol} 触发止损! 当前价: $${currentPrice}`);
    return 'STOP_LOSS';
  }
  
  // 止盈
  if (currentPrice >= pos.takeProfit) {
    console.log(`\n   🟢 ${symbol} 触发止盈! 当前价: $${currentPrice}`);
    return 'TAKE_PROFIT';
  }
  
  return null;
}

/**
 * 显示账户状态
 */
async function showStatus() {
  try {
    const balance = await OKX.getBalance();
    const usdt = balance.data?.[0]?.details?.find(d => d.ccy === 'USDT');
    
    console.log(`\n💰 账户状态 (${new Date().toLocaleTimeString('zh-CN')}):`);
    console.log(`   可用USDT: ${usdt?.cashBal || capital}`);
    console.log(`   持仓:`);
    
    for (const [symbol, pos] of Object.entries(positions)) {
      console.log(`      ${symbol}: ${pos.size} @ $${pos.price}`);
      console.log(`         止损: $${pos.stopLoss.toFixed(2)} | 止盈: $${pos.takeProfit.toFixed(2)}`);
    }
    
    console.log(`   总交易次数: ${tradeHistory.length}`);
  } catch (error) {
    console.error(`   ❌ 状态获取失败: ${error.message}`);
  }
}

/**
 * 主程序
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  console.log(`\n🤖 OKX智能交易机器人 - 完善版`);
  console.log(`==========================================`);
  console.log(`   🕐 ${new Date().toLocaleString('zh-CN')}`);
  console.log(`   📌 模式: ${command === 'buy' ? '执行买入' : '状态检查'}`);
  console.log(`==========================================\n`);
  
  // 加载历史数据
  try {
    if (fs.existsSync(`${__dirname}/data/trades.json`)) {
      const data = JSON.parse(fs.readFileSync(`${__dirname}/data/trades.json`, 'utf8'));
      tradeHistory = data;
    }
    if (fs.existsSync(`${__dirname}/data/portfolio.json`)) {
      const data = JSON.parse(fs.readFileSync(`${__dirname}/data/portfolio.json`, 'utf8'));
      positions = data.positions || {};
      capital = data.currentCapital || 11.08;
    }
  } catch (error) {
    console.log(`   ⚠️ 历史数据加载失败: ${error.message}`);
  }
  
  if (command === 'buy') {
    // 检查是否有持仓
    for (const symbol of CONFIG.symbols) {
      if (positions[symbol]) {
        console.log(`   ⏸️ ${symbol} 已有持仓，跳过`);
        continue;
      }
      
      // 检查止损/止盈
      const exitSignal = await checkExit(symbol);
      if (exitSignal) {
        console.log(`   ⚠️ ${symbol} 触发${exitSignal}，跳过新买入`);
        continue;
      }
      
      // 分析并买入
      await buy(symbol);
    }
  } else if (command === 'check') {
    // 只检查状态
  } else {
    // 默认显示状态
    console.log(`   📊 ${CONFIG.symbols[0]} 市场分析:`);
    const btc = await analyze('BTC-USDT');
    if (btc) {
      console.log(`      价格: $${btc.price}`);
      console.log(`      24h: ${btc.change24h.toFixed(2)}%`);
      console.log(`      支撑: ${btc.nearestSupport}`);
    }
  }
  
  await showStatus();
  
  console.log(`\n==========================================`);
}

main().catch(console.error);
