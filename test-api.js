const https = require('https');
const crypto = require('crypto');

const apiKey = '1167ec55-14e4-4b43-96d6-a8ed5351db3e';
const apiSecret = '642F8278C2E5EB3F2AD57B6C7641DE61';
const passphrase = 'HAZYC2004chen!';

function sign(method, path, body = '') {
  const timestamp = Date.now() / 1000;
  const message = `${timestamp}${method}${path}${body}`;
  return {
    signature: crypto.createHmac('sha256', apiSecret).update(message).digest('base64'),
    timestamp
  };
}

async function request(method, path, body = null, retries = 2) {
  const { signature, timestamp } = sign(method, path, body || '');
  
  const options = {
    hostname: 'www.okx.com',
    path: path,
    method: method,
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 100)));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🧪 API测试...\n');
  
  // 测试1: 获取时间
  console.log('1. 测试公共API...');
  try {
    const time = await request('GET', '/api/v5/public/time');
    console.log('   ✅ 公共API正常:', time.data?.[0]?.ts);
  } catch (e) {
    console.log('   ❌ 公共API失败:', e.message);
  }
  
  // 测试2: 获取账户余额
  console.log('\n2. 测试账户API...');
  try {
    const balance = await request('GET', '/api/v5/account/balance');
    console.log('   响应:', JSON.stringify(balance, null, 2));
  } catch (e) {
    console.log('   ❌ 账户API失败:', e.message);
  }
  
  // 测试3: 获取BTC行情
  console.log('\n3. 测试行情API...');
  try {
    const ticker = await request('GET', '/api/v5/market/ticker?instId=BTC-USDT');
    const price = ticker.data?.[0]?.last;
    console.log('   ✅ BTC价格: $' + price);
  } catch (e) {
    console.log('   ❌ 行情API失败:', e.message);
  }
}

main();
