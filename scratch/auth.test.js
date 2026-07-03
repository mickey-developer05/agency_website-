const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

let server;
let baseUrl;

function getCookieHeader(res) {
  return res.headers.get('set-cookie') || '';
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
});

test('register, login, session, and logout flow works through the new auth API', async () => {
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Ava Example',
      companyName: 'Northstar Labs',
      email: 'ava@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!'
    })
  });

  assert.equal(registerRes.status, 201);
  const registerData = await registerRes.json();
  assert.equal(registerData.user.email, 'ava@example.com');
  assert.match(getCookieHeader(registerRes), /lumina_client_access=/);

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ava@example.com',
      password: 'StrongPass123!',
      rememberMe: true
    })
  });

  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.email, 'ava@example.com');
  assert.match(getCookieHeader(loginRes), /lumina_client_access=/);

  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      cookie: getCookieHeader(loginRes)
    }
  });

  assert.equal(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.equal(sessionData.authenticated, true);
  assert.equal(sessionData.user.email, 'ava@example.com');

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: getCookieHeader(loginRes)
    }
  });

  assert.equal(logoutRes.status, 200);
  assert.match(getCookieHeader(logoutRes), /lumina_client_access=;/);
});
