/**
 * OKX智能交易机器人 - 修复版
 * 包含备用API端点和更好的重试机制
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// 配置
const CONFIG = {
  apiKey: '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: 'HAZYC2004chen!',
  
  // 交易参数
  initialCapital: 11,
  tradeAmount: 5,
  stopLoss: 0.10,
  takeProfit: 0.30,
  
  // 交易对
  symbols: ['BTC-USDT', 'ETH-USDT'],
  
  // 支撑位
  supportLevels: {
    'BTC-USDT': [66000, 65000, 64000],
    'ETH-USDT': [1950, 1900, 1850],
  },
};

// OKX API - 包含备用端点
const OKX = {
  apiKey: '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: 'HAZYC2004chen!',
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
      .createHmac('sha256', this.apiSecret)
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
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
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
   * 获取余额
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
};

// 状态
let positions = {};
let tradeHistory = [];
let capital = 11.08;

/**
 * 智能策略分析
 */
async function analyze(symbol) {
  const ticker = await OKX.getTicker(symbol);
  const data = ticker.data?.[0];
  if (!data) return null;
  
  const currentPrice = parseFloat(data.last);
  const open24h = parseFloat(data.open24h);
  const change24h = (currentPrice - open24h) / open24h;
  
  const supportLevels = CONFIG.supportLevels[symbol] || [];
  const nearestSupport = supportLevels.find(s => currentPrice > s);
  const supportDistance = nearestSupport ? (currentPrice - nearestSupport) / currentPrice : 0;
  
  return { symbol, price: currentPrice, change24h: change24h * 100, nearestSupport, supportDistance };
}

/**
 * 买入执行
 */
async function buy(symbol) {
  const analysis = await analyze(symbol);
  if (!analysis) {
    console.log('   ❌ 无法获取行情');
    return false;
  }
  
  const { symbol: s, price, nearestSupport, supportDistance } = analysis;
  
  // 检查是否跌破支撑位
  if (nearestSupport && price <= nearestSupport * 1.01) {
    console.log(`   ✅ ${s} 价格 $${price} 接近/跌破支撑位 ${nearestSupport}`);
    console.log(`   📊 24h涨跌: ${analysis.change24h.toFixed(2)}%`);
    
    // 执行买入
    const size = CONFIG.tradeAmount / price;
    console.log(`   💰 买入数量: ${size.toFixed(6)} ${s.replace('-USDT', '')}`);
    
    try {
      const order = await OKX.placeOrder(s, 'buy', size);
      
      if (order.code === '0') {
        console.log(`   ✅ 下单成功!`);
        console.log(`   📝 订单ID: ${order.data?.[0]?.ordId}`);
        
        const trade = {
          id: Date.now(),
          symbol: s,
          type: 'BUY',
          price,
          size,
          time: new Date().toISOString(),
          status: 'filled',
          stopLoss: price * 0.90,
          takeProfit: price * 1.30,
        };
        
        tradeHistory.push(trade);
        positions[s] = trade;
        return true;
      } else {
        console.log(`   ⚠️ 下单失败: ${order.msg}`);
      }
    } catch (error) {
      console.log(`   ❌ 下单异常: ${error.message}`);
    }
  } else {
    console.log(`   ⏸️ ${s} 价格 $${price} 未跌破支撑 ${nearestSupport}，暂不买入`);
  }
  
  return false;
}

/**
 * 显示状态
 */
function showStatus() {
  console.log(`\n💰 账户状态:`);
  console.log(`   可用USDT: ${capital}`);
  console.log(`   持仓: ${Object.keys(positions).join(', ') || '无'}`);
}

/**
 * 主程序
 */
async function main() {
  console.log(`\n🤖 OKX智能交易机器人 - 修复版`);
  console.log(`==========================================`);
  console.log(`   🕐 ${new Date().toLocaleString('zh-CN')}`);
  console.log(`==========================================\n`);
  
  showStatus();
  
  // 获取BTC行情
  console.log(`📊 市场分析:`);
  const btcAnalysis = await analyze('BTC-USDT');
  
  if (btcAnalysis) {
    console.log(`   BTC: $${btcAnalysis.price} (${btcAnalysis.change24h.toFixed(2)}%)`);
    console.log(`   支撑位: ${btcAnalysis.nearestSupport}`);
    console.log(`   距离支撑: ${(btcAnalysis.supportDistance * 100).toFixed(2)}%`);
  }
  
  // 尝试买入
  if (btcAnalysis && btcAnalysis.price < 67000) {
    console.log(`\n🎯 执行买入检查...`);
    await buy('BTC-USDT');
  }
  
  showStatus();
}

main().catch(console.error);
