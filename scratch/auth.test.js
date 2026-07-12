const test = require('node:test');
const assert = require('node:assert/strict');
const { app, server: defaultServer } = require('../server');

let server;
let baseUrl;

// Helper to get cookies
function getCookieHeader(res) {
  const cookies = res.headers.getSetCookie();
  return cookies.join('; ');
}

// Helper to parse specific cookie value
function getCookieValue(res, name) {
  const header = getCookieHeader(res);
  const match = header.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : '';
}

test.before(async () => {
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve(listener);
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (defaultServer) {
    await new Promise((resolve) => defaultServer.close(resolve));
  }
});

test('register, login, session, and logout flow works through the new auth API', async () => {
  const uniqueEmail = `ava_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
  
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Ava Example',
      companyName: 'Northstar Labs',
      email: uniqueEmail,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    })
  });

  assert.equal(registerRes.status, 201);
  const registerData = await registerRes.json();
  assert.equal(registerData.success, true);
  assert.equal(registerData.data.user.email, uniqueEmail);
  assert.match(getCookieHeader(registerRes), /lumina_client_access=/);

  const csrfToken = getCookieValue(registerRes, 'lumina_csrf');

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'StrongPass123!',
      rememberMe: true
    })
  });

  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.equal(loginData.data.user.email, uniqueEmail);
  assert.match(getCookieHeader(loginRes), /lumina_client_access=/);

  const loginCsrf = getCookieValue(loginRes, 'lumina_csrf');

  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie: getCookieHeader(loginRes)
    }
  });

  assert.equal(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.equal(sessionData.success, true);
  assert.equal(sessionData.data.authenticated, true);
  assert.equal(sessionData.data.user.email, uniqueEmail);

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: getCookieHeader(loginRes),
      'X-CSRF-Token': loginCsrf
    }
  });

  assert.equal(logoutRes.status, 200);
  assert.match(getCookieHeader(logoutRes), /lumina_client_access=;/);
});
