const express = require('express');
const authController = require('../controllers/auth-controller');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validation');

function authApiRouter(app) {
  const router = express.Router();

  // CSRF Initialization
  router.get('/csrf', authController.getCsrfToken);

  // Unified Registration for Clients
  router.post('/register', validateRequest('registration'), authController.register);
  router.post('/client/register', validateRequest('registration'), authController.register);

  // Unified Client Login
  router.post('/login', validateRequest('login'), authController.clientLogin);
  router.post('/client/login', validateRequest('login'), authController.clientLogin);

  // Unified Admin Login
  router.post('/admin/login', validateRequest('adminLogin'), authController.adminLogin);

  // Unified Client Logout
  router.post('/logout', authenticate, authController.logout);
  router.post('/client/logout', authenticate, authController.logout);

  // Unified Admin Logout
  router.post('/admin/logout', authenticate, authController.logout);

  // Unified Session Checks
  router.get('/session', authenticate, authController.getSession);
  router.get('/client/session', authenticate, authController.getSession);
  router.get('/admin/session', authenticate, authController.getSession);

  // Forgot / Reset Password
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', authController.resetPassword);

  // Refresh Token Exchange
  router.post('/refresh', authController.refresh);

  // Bind routes
  app.use('/api/auth', router);

  // Duplicate path mapping aliases for backward compatibility with frontend direct routes
  app.post('/api/client/register', validateRequest('registration'), authController.register);
  app.post('/api/client/login', validateRequest('login'), authController.clientLogin);
  app.post('/api/client/logout', authenticate, authController.logout);
  app.get('/api/client/session', authenticate, authController.getSession);
  
  app.post('/api/admin/login', validateRequest('adminLogin'), authController.adminLogin);
  app.post('/api/admin/logout', authenticate, authController.logout);
  app.get('/api/admin/session', authenticate, authController.getSession);
  app.post('/api/login', validateRequest('adminLogin'), authController.adminLogin);
  app.post('/api/logout', authenticate, authController.logout);
}

module.exports = { authApiRouter };
