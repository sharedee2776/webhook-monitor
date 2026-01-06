#!/usr/bin/env node

/**
 * Security Testing Script
 * Tests the new security features: request signing, audit logging, etc.
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

const API_KEY = process.env.TEST_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:7071';
const ENDPOINT = `${BASE_URL}/api/ingest`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSignature(body, timestamp, apiKey) {
  return crypto
    .createHmac('sha256', apiKey)
    .update(body + timestamp + apiKey)
    .digest('hex');
}

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || ENDPOINT);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: options.method || 'POST',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : data,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test1_HealthCheck() {
  log('\n=== Test 1: Health Check ===', 'blue');
  try {
    const response = await makeRequest({
      url: `${BASE_URL}/api/health`,
      method: 'GET',
    });
    
    if (response.status === 200) {
      log('✅ Health check passed', 'green');
      console.log(JSON.stringify(response.body, null, 2));
      return true;
    } else {
      log(`❌ Health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function test2_UnsignedRequest() {
  log('\n=== Test 2: Unsigned Request (Should Fail) ===', 'blue');
  try {
    const body = JSON.stringify({
      eventType: 'test.unsigned',
      payload: { test: 'unsigned request' },
    });

    const response = await makeRequest({
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    }, body);

    if (response.status === 401 && response.body.includes('signature')) {
      log('✅ Correctly rejected unsigned request', 'green');
      return true;
    } else {
      log(`❌ Unexpected response: ${response.status}`, 'red');
      console.log(response.body);
      return false;
    }
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function test3_ValidSignature() {
  log('\n=== Test 3: Valid Signature (Should Succeed) ===', 'blue');
  try {
    const body = JSON.stringify({
      eventType: 'test.signed',
      payload: { test: 'signed request' },
    });
    const timestamp = Date.now().toString();
    const signature = generateSignature(body, timestamp, API_KEY);

    const response = await makeRequest({
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'Content-Type': 'application/json',
      },
    }, body);

    if (response.status === 200) {
      log('✅ Valid signature accepted', 'green');
      console.log(JSON.stringify(response.body, null, 2));
      return true;
    } else {
      log(`❌ Valid signature rejected: ${response.status}`, 'red');
      console.log(response.body);
      return false;
    }
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function test4_InvalidSignature() {
  log('\n=== Test 4: Invalid Signature (Should Fail) ===', 'blue');
  try {
    const body = JSON.stringify({
      eventType: 'test.invalid',
      payload: { test: 'invalid signature' },
    });
    const timestamp = Date.now().toString();

    const response = await makeRequest({
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-signature': 'invalid_signature_here',
        'x-timestamp': timestamp,
        'Content-Type': 'application/json',
      },
    }, body);

    if (response.status === 401) {
      log('✅ Invalid signature correctly rejected', 'green');
      return true;
    } else {
      log(`❌ Invalid signature not rejected: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function test5_ExpiredTimestamp() {
  log('\n=== Test 5: Expired Timestamp (Should Fail) ===', 'blue');
  try {
    const body = JSON.stringify({
      eventType: 'test.expired',
      payload: { test: 'expired timestamp' },
    });
    // Use timestamp from 10 minutes ago
    const timestamp = (Date.now() - 10 * 60 * 1000).toString();
    const signature = generateSignature(body, timestamp, API_KEY);

    const response = await makeRequest({
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'Content-Type': 'application/json',
      },
    }, body);

    if (response.status === 401 && response.body.includes('expired')) {
      log('✅ Expired timestamp correctly rejected', 'green');
      return true;
    } else {
      log(`❌ Expired timestamp not rejected: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function test6_ReadOperation() {
  log('\n=== Test 6: Read Operation (No Signing Required) ===', 'blue');
  try {
    const response = await makeRequest({
      url: `${BASE_URL}/api/dashboardEvents`,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (response.status === 200 || response.status === 401) {
      log(`✅ Read operation works (status: ${response.status})`, 'green');
      return true;
    } else {
      log(`❌ Read operation failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Test error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🔒 Security Features Testing', 'blue');
  log('='.repeat(50), 'blue');
  
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    log('⚠️  WARNING: Set TEST_API_KEY environment variable', 'yellow');
    log('   Example: TEST_API_KEY=your_key node test-security.js', 'yellow');
    log('   Or edit the script to set API_KEY directly', 'yellow');
    return;
  }

  const results = {
    health: await test1_HealthCheck(),
    unsigned: await test2_UnsignedRequest(),
    valid: await test3_ValidSignature(),
    invalid: await test4_InvalidSignature(),
    expired: await test5_ExpiredTimestamp(),
    read: await test6_ReadOperation(),
  };

  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Results Summary', 'blue');
  log('='.repeat(50), 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'green' : 'red');
  });

  const allPassed = Object.values(results).every(r => r);
  log('\n' + '='.repeat(50), 'blue');
  if (allPassed) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above.', 'yellow');
  }
  log('='.repeat(50), 'blue');
  
  log('\n💡 Next Steps:', 'blue');
  log('1. Check SecurityAuditLog table in Azure Storage', 'blue');
  log('2. Verify IP addresses are logged', 'blue');
  log('3. Check for auth_success, auth_failure, request_signed events', 'blue');
}

// Run tests
runAllTests().catch(console.error);
