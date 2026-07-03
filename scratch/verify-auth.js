const { server } = require('../server');

async function main() {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const registerRes = await fetch(`${base}/api/auth/register`, {
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
  console.log('register', registerRes.status, registerRes.headers.get('set-cookie'));

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ava@example.com', password: 'StrongPass123!' })
  });
  console.log('login', loginRes.status, loginRes.headers.get('set-cookie'));

  const cookie = loginRes.headers.get('set-cookie') || '';
  const sessionRes = await fetch(`${base}/api/auth/session`, { headers: { cookie } });
  const sessionData = await sessionRes.json();
  console.log('session', sessionRes.status, sessionData.authenticated, sessionData.user && sessionData.user.email);

  const logoutRes = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { cookie } });
  console.log('logout', logoutRes.status, logoutRes.headers.get('set-cookie'));
  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
