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

async function getOrderDetails(ordId) {
  const path = `/api/v5/trade/order?ordId=${ordId}&instId=BTC-USDT`;
  const { signature, timestamp } = sign('GET', path);
  
  const options = {
    hostname: 'www.okx.com',
    path: path,
    method: 'GET',
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
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function getBalance() {
  const path = '/api/v5/account/balance';
  const { signature, timestamp } = sign('GET', path);
  
  const options = {
    hostname: 'www.okx.com',
    path: path,
    method: 'GET',
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
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('\n📊 检查订单状态');
  console.log('='.repeat(40));
  
  const ordId = '3299107818132791296';
  
  // 检查订单
  const order = await getOrderDetails(ordId);
  console.log('订单状态:', JSON.stringify(order, null, 2));
  
  // 检查余额
  const balance = await getBalance();
  const usdt = balance.data?.[0]?.details?.find(d => d.ccy === 'USDT');
  const btc = balance.data?.[0]?.details?.find(d => d.ccy === 'BTC');
  
  console.log('\n💰 更新后账户余额:');
  console.log(`   USDT: ${usdt?.cashBal || 'N/A'}`);
  console.log(`   BTC: ${btc?.cashBal || 'N/A'}`);
}

main();
