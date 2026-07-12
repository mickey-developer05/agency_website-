const test = require('node:test');
const assert = require('node:assert/strict');
const { app, server: defaultServer } = require('../server');

let testServer;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    defaultServer.close(() => {
      testServer = app.listen(0, '127.0.0.1', () => {
        const address = testServer.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    if (testServer) {
      testServer.close(resolve);
    } else {
      resolve();
    }
  });
});

test('Security headers are present', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('strict-transport-security'));
});

test('Health and Readiness endpoints work', async () => {
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  assert.equal(healthRes.status, 200);
  assert.equal(healthData.success, true);
  assert.ok(healthData.data.uptime);

  const readyRes = await fetch(`${baseUrl}/ready`);
  const readyData = await readyRes.json();
  assert.equal(readyRes.status, 200);
  assert.equal(readyData.success, true);
  assert.equal(readyData.data.database, 'connected');
});

test('Account lockout logic locks after 5 attempts', async () => {
  const uniqueEmail = `lock_${Date.now()}@example.com`;
  
  // 1. Register user
  await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Lock Test',
      companyName: 'Lock Corp',
      email: uniqueEmail,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    })
  });

  // 2. Fail login 5 times
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword' })
    });
    // Check status is either 401 (for first 4 attempts) or 423 (for 5th attempt)
    if (i === 4) {
      assert.equal(res.status, 423);
      const data = await res.json();
      assert.match(data.errors, /locked out/i);
    } else {
      assert.equal(res.status, 401);
    }
  }

  // 3. 6th attempt should be locked out immediately
  const lockedRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'WrongPassword' })
  });
  assert.equal(lockedRes.status, 423);
});
