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

async function placeOrder(instId, side, size, price = null) {
  const path = '/api/v5/trade/order';
  const body = JSON.stringify({
    instId,
    tdMode: 'cash',
    side,
    ordType: price ? 'limit' : 'market',
    sz: Math.floor(size * 1000000) / 1000000,
    px: price,
  });
  
  const { signature, timestamp } = sign('POST', path, body);
  
  const options = {
    hostname: 'www.okx.com',
    path: path,
    method: 'POST',
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n🎯 执行BTC买入交易');
  console.log('='.repeat(40));
  
  const price = 66300;  // 限价单
  const size = 5 / price;  // 5 USDT
  const instId = 'BTC-USDT';
  
  console.log(`   买入价格: $${price}`);
  console.log(`   买入金额: 5 USDT`);
  console.log(`   买入数量: ${size.toFixed(8)} BTC`);
  console.log('');
  
  try {
    const order = await placeOrder(instId, 'buy', size, price);
    console.log('   订单响应:');
    console.log(JSON.stringify(order, null, 2));
    
    if (order.code === '0') {
      console.log('\n✅ 下单成功!');
      console.log(`   订单ID: ${order.data?.[0]?.ordId}`);
    } else {
      console.log(`\n⚠️ 下单失败: ${order.msg}`);
    }
  } catch (e) {
    console.error('   ❌ 下单异常:', e.message);
  }
}

main();
