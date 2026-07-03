const { parseCookies, createCsrfToken } = require('../utils/auth');
const { createCookieHeaders, clearCookieHeaders, validateSessionFromRequest } = require('../utils/session-manager');
const { registerClient, authenticateClient, authenticateAdmin, createResetToken, resetPassword, finishAuth, logoutSession, refreshSession, findUserById } = require('../services/auth-service');

function authApiRouter(app) {
  // CSRF Initialization
  app.get('/api/auth/csrf', (req, res) => {
    const csrfToken = createCsrfToken(`session_${Date.now()}`);
    res.json({ csrfToken });
  });

  // Unified Registration for Clients
  const handleRegister = (req, res) => {
    const { username, email, fullName, name, companyName, company, password, confirmPassword } = req.body;
    // Map alternate names used by different forms
    const finalEmail = email || username;
    const finalName = fullName || name;
    const finalCompany = companyName || company;
    
    const result = registerClient({ 
      fullName: finalName, 
      companyName: finalCompany, 
      email: finalEmail, 
      password, 
      confirmPassword: confirmPassword || password 
    });

    if (result.error) return res.status(result.status).json({ success: false, error: result.error });
    const authResult = finishAuth(result.user, 'client', req, createCsrfToken(result.user.id));
    res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'client'));
    return res.status(201).json({ 
      success: true, 
      user: { id: result.user.id, fullName: result.user.fullName, companyName: result.user.companyName, email: result.user.email, role: 'client' } 
    });
  };

  app.post('/api/auth/register', handleRegister);
  app.post('/api/client/register', handleRegister);

  // Unified Client Login
  const handleClientLogin = (req, res) => {
    const { username, email, password } = req.body;
    const finalEmail = email || username;
    const result = authenticateClient({ email: finalEmail, password });
    if (result.error) return res.status(result.status).json({ success: false, error: result.error });
    const authResult = finishAuth(result.user, 'client', req, createCsrfToken(result.user.id));
    res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'client'));
    return res.json({ 
      success: true, 
      user: { id: result.user.id, fullName: result.user.fullName, companyName: result.user.companyName, email: result.user.email, role: 'client' },
      clientInfo: { id: result.user.id, username: result.user.email, name: result.user.fullName, company: result.user.companyName, email: result.user.email, role: 'client' }
    });
  };

  app.post('/api/auth/login', handleClientLogin);
  app.post('/api/client/login', handleClientLogin);

  // Unified Admin Login
  const handleAdminLogin = (req, res) => {
    const { username, password } = req.body;
    const result = authenticateAdmin({ username, password });
    if (result.error) return res.status(result.status).json({ success: false, error: result.error });
    const authResult = finishAuth(result.user, 'admin', req, createCsrfToken(result.user.id));
    res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'admin'));
    return res.json({ success: true, user: { ...result.user, role: 'admin' } });
  };

  app.post('/api/admin/login', handleAdminLogin);
  app.post('/api/login', handleAdminLogin);

  // Unified Client Logout
  const handleClientLogout = (req, res) => {
    const session = validateSessionFromRequest(req);
    if (session) {
      logoutSession(session.session.id);
    }
    res.setHeader('Set-Cookie', clearCookieHeaders('client'));
    return res.json({ success: true });
  };

  app.post('/api/auth/logout', handleClientLogout);
  app.post('/api/client/logout', handleClientLogout);

  // Unified Admin Logout
  const handleAdminLogout = (req, res) => {
    const session = validateSessionFromRequest(req);
    if (session) {
      logoutSession(session.session.id);
    }
    res.setHeader('Set-Cookie', clearCookieHeaders('admin'));
    return res.json({ success: true });
  };

  app.post('/api/admin/logout', handleAdminLogout);
  app.post('/api/logout', handleAdminLogout);

  // Unified Session Checks
  const handleClientSession = (req, res) => {
    const session = validateSessionFromRequest(req);
    if (!session || session.payload.role !== 'client') return res.status(401).json({ authenticated: false });
    const user = findUserById(session.payload.sub);
    if (!user) return res.status(401).json({ authenticated: false });
    return res.json({ 
      authenticated: true, 
      user: user.email, 
      clientInfo: { id: user.id, username: user.email, name: user.fullName, company: user.companyName, email: user.email, role: 'client' } 
    });
  };

  app.get('/api/auth/session', handleClientSession);
  app.get('/api/client/session', handleClientSession);

  // Admin Session Check
  app.get('/api/admin/session', (req, res) => {
    const session = validateSessionFromRequest(req);
    if (!session || session.payload.role !== 'admin') return res.status(401).json({ authenticated: false });
    return res.json({ authenticated: true, user: { id: session.payload.sub, role: 'admin' } });
  });

  // Forgot / Reset Password
  app.post('/api/auth/forgot-password', (req, res) => {
    const result = createResetToken(req.body.email);
    if (!result) return res.status(404).json({ success: false, error: 'No account found.' });
    return res.json({ success: true, message: 'If the account exists, a reset link has been sent.' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const result = resetPassword(req.body.token, req.body.password);
    if (result.error) return res.status(result.status).json({ success: false, error: result.error });
    return res.json({ success: true, message: 'Password updated successfully.' });
  });

  // Refresh Token Exchange
  app.post('/api/auth/refresh', (req, res) => {
    const cookies = parseCookies(req);
    const token = cookies.lumina_client_refresh || cookies.lumina_admin_refresh;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const result = refreshSession(token, req);
    if (result.error) return res.status(result.status).json({ error: result.error });
    const csrfToken = createCsrfToken(result.session.id);
    const role = result.session.role;
    res.setHeader('Set-Cookie', createCookieHeaders(result.accessToken, result.refreshToken, csrfToken, role));
    return res.json({ success: true, accessToken: result.accessToken, refreshToken: result.refreshToken });
  });
}

module.exports = { authApiRouter };
