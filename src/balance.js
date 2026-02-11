/**
 * 快速查看账户余额
 */

const https = require('https');
const crypto = require('crypto');

const CONFIG = {
  apiKey: '1167ec55-14e4-4b43-96d6-a8ed5351db3e',
  apiSecret: '642F8278C2E5EB3F2AD57B6C7641DE61',
  passphrase: 'HAZYC2004chen!',
};

function sign(method, path, body = '') {
  const timestamp = Date.now() / 1000;
  const message = `${timestamp}${method}${path}${body}`;
  const signature = crypto
    .createHmac('sha256', CONFIG.apiSecret)
    .update(message)
    .digest('base64');
  return { signature, timestamp };
}

async function getBalance() {
  const path = '/api/v5/account/balance';
  const method = 'GET';
  const body = '';
  const { signature, timestamp } = sign(method, path, body);

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
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`解析失败: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('📊 OKX账户余额\n');

  try {
    const result = await getBalance();
    console.log('API返回:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

main();
