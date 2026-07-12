const { parseCookies } = require('../utils/auth');

function enforceCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  // Skip CSRF for login, register, reset, refresh, and public contact requests
  if ([
    '/api/auth/login', 
    '/api/auth/register', 
    '/api/auth/forgot-password', 
    '/api/auth/reset-password', 
    '/api/auth/refresh', 
    '/api/auth/csrf', 
    '/api/admin/login',
    '/api/login',
    '/api/client/login',
    '/api/client/register'
  ].includes(req.path)) {
    return next();
  }

  const cookies = parseCookies(req);
  const token = req.headers['x-csrf-token'] || req.headers['x-csrftoken'] || req.headers['csrf-token'];
  
  if (!token || token !== cookies.lumina_csrf) {
    return res.status(403).json({
      success: false,
      status: 403,
      message: 'CSRF token missing or invalid.',
      error: 'CSRF token missing or invalid.',
      errors: 'CSRF token missing or invalid.',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
  next();
}

module.exports = enforceCsrf;
