const { validateSessionFromRequest } = require('../utils/session-manager');

function createAuthGuard(options = {}) {
  const loginPath = options.loginPath || '/login';
  const adminLoginPath = options.adminLoginPath || '/admin/index.html';
  const clientLoginPath = options.clientLoginPath || '/login';

  return function authGuard(req, res, next) {
    const path = req.path;
    
    // Explicit bypasses for API paths that should be unauthenticated
    if (path === '/api/auth/csrf' || 
        path === '/api/auth/login' || 
        path === '/api/auth/register' || 
        path === '/api/auth/forgot-password' || 
        path === '/api/auth/reset-password' || 
        path === '/api/auth/refresh' ||
        path === '/api/client/login' || 
        path === '/api/client/register' ||
        path === '/api/login') {
      return next();
    }

    if (path.startsWith('/admin')) {
      const isHtml = path.endsWith('.html') || !path.includes('.');
      const isLogin = path.includes('index.html') || path === '/admin' || path === '/admin/';
      if (isHtml && !isLogin) {
        const session = validateSessionFromRequest(req);
        if (!session || session.payload.role !== 'admin') return res.redirect(adminLoginPath);
        req.auth = { user: { role: 'admin' }, session };
        req.user = req.auth.user;
      }
      return next();
    }

    if (path.startsWith('/portal') || path.startsWith('/client-workspace') || path === '/client' || path.startsWith('/client/')) {
      const isHtml = path.endsWith('.html') || !path.includes('.');
      const isLogin = path.includes('index.html') || path === '/portal' || path === '/portal/' || path === '/client-workspace' || path === '/client';
      if (isHtml && !isLogin) {
        const session = validateSessionFromRequest(req);
        if (!session) return res.redirect(clientLoginPath);
        req.auth = { user: { role: 'client' }, session };
        req.user = req.auth.user;
      }
      return next();
    }

    next();
  };
}

module.exports = { createAuthGuard };
