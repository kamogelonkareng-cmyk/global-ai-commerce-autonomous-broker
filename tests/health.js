#!/usr/bin/env node

const http = require('http');

const BASE_URL = process.env.BROKER_URL || 'http://localhost:3000';

async function test(name, method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`${ok ? '✓' : '✗'} ${name} (${res.statusCode})`);
        if (!ok) console.log(`  ${data}`);
        resolve(ok);
      });
    });

    req.on('error', (err) => {
      console.log(`✗ ${name} (Connection Error: ${err.message})`);
      resolve(false);
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log(`\n🚀 Testing broker at ${BASE_URL}\n`);

  const results = [];

  // Test 1: Health check
  results.push(await test('Health Check', 'GET', '/health'));

  // Test 2: Create API key
  results.push(
    await test('Create API Key', 'POST', '/v1/create-apikey', {
      owner: 'test@example.com',
      secret: process.env.CREATE_API_KEY_SECRET || 'dev_secret_change_in_prod',
    })
  );

  // Test 3: Admin endpoints (with secret)
  results.push(
    await test('Admin List Keys', 'GET', `/admin/apis?admin_secret=${process.env.ADMIN_SECRET || 'admin_secret_change_in_prod'}`)
  );

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} passed\n`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
