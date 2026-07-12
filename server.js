const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./backend/config/config');
const { migrateLegacyClients } = require('./backend/services/auth-service');
const { createAuthGuard } = require('./backend/middleware/auth-guard');
const { authApiRouter } = require('./backend/routes/api-auth');
const { aiApiRouter } = require('./backend/routes/api-ai');
const { coreApiRouter } = require('./backend/routes/api-core');
const { healthRouter } = require('./backend/routes/health');

const requestId = require('./backend/middleware/requestId');
const securityHeaders = require('./backend/middleware/security');
const enforceCsrf = require('./backend/middleware/csrf');
const errorHandler = require('./backend/middleware/errorHandler');

const app = express();
const PORT = config.PORT;

// Run database migrations on boot (legacy plain-text to hashed password conversion)
try {
  migrateLegacyClients();
} catch (e) {
  console.error('[Migration] Failed to run legacy user migrations:', e);
}

// ── Global Middlewares ──
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security Headers Injection
app.use(securityHeaders);

// Request ID tagger
app.use(requestId);

// Rate Limiter for API endpoints
const rateLimitMap = new Map();
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket.remoteAddress || '127.0.0.1');
}

function rateLimit(req, res, next) {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  const key = `${getClientIp(req)}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 200; 
  const entry = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (entry.resetAt < now) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateLimitMap.set(key, entry);
  if (entry.count > maxRequests) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
  }
  next();
}
app.use(rateLimit);

// Expose Health & Readiness routes (unauthenticated, bypasses CSRF/guards)
healthRouter(app);

// Robots.txt & Sitemap.xml
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));

// CSRF Protection Middleware
app.use(enforceCsrf);

// Unified Authentication & Route Protection Guard (HTML Redirects)
const authGuard = createAuthGuard({
  loginPath: '/login',
  adminLoginPath: '/admin/index.html',
  clientLoginPath: '/login'
});
app.use(authGuard);

// ── API Routers ──
authApiRouter(app);
aiApiRouter(app);
coreApiRouter(app);

// ── Secure Static Routing ──
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/portal', express.static(path.join(__dirname, 'portal')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Map and serve root marketing and login/register static HTML files
const rootHtmlFiles = [
  'index.html', 'services.html', 'pricing.html', 'portfolio.html', 'process.html', 
  'team.html', 'faq.html', 'blog.html', 'book-consultation.html', 'careers.html', 
  'case-studies.html', 'contact.html', 'login.html', 'signup.html', 'register.html', 
  'forgot-password.html', 'reset-password.html', 'client-workspace.html'
];

rootHtmlFiles.forEach(file => {
  const route = `/${file.replace('.html', '')}`;
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, file)));
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});

// Redirects
app.get('/client', (req, res) => res.redirect('/client-workspace'));

// Default root redirect
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Lumina Backend running at http://localhost:${PORT}`);
});

// Graceful Shutdown Handler
function handleGracefulShutdown(signal) {
  console.log(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[Shutdown] HTTP server closed.');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if connections refuse to close
  setTimeout(() => {
    console.error('[Shutdown] Forceful shutdown triggered: graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = { app, server };
