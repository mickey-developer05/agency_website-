const authService = require('../services/auth-service');
const { createCsrfToken } = require('../utils/auth');
const { createCookieHeaders, clearCookieHeaders } = require('../utils/session-manager');

class AuthController {
  async getCsrfToken(req, res, next) {
    try {
      const csrfToken = createCsrfToken(`session_${Date.now()}`);
      const baseOptions = {
        httpOnly: false, // client JS must read this cookie
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      };
      res.cookie('lumina_csrf', csrfToken, baseOptions);
      
      res.json({
        success: true,
        status: 200,
        message: 'CSRF token initialized',
        data: { csrfToken },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const { username, email, fullName, name, companyName, company, password, confirmPassword } = req.body;
      const finalEmail = email || username;
      const finalName = fullName || name;
      const finalCompany = companyName || company;
      
      const result = await authService.registerClient({
        fullName: finalName,
        companyName: finalCompany,
        email: finalEmail,
        password,
        confirmPassword: confirmPassword || password
      });

      if (result.error) {
        return res.status(result.status || 400).json({
          success: false,
          status: result.status || 400,
          message: result.error,
          data: null,
          errors: result.error,
          error: result.error,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      const authResult = authService.finishAuth(result.user, 'client', req, createCsrfToken(result.user.id));
      res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'client'));
      
      res.status(201).json({
        success: true,
        status: 201,
        message: 'Registration successful',
        data: {
          user: { id: result.user.id, fullName: result.user.fullName, companyName: result.user.companyName, email: result.user.email, role: 'client' }
        },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async clientLogin(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const finalEmail = email || username;
      const result = await authService.authenticateClient({ email: finalEmail, password });

      if (result.error) {
        return res.status(result.status || 401).json({
          success: false,
          status: result.status || 401,
          message: result.error,
          data: null,
          errors: result.error,
          error: result.error,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      const authResult = authService.finishAuth(result.user, 'client', req, createCsrfToken(result.user.id));
      res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'client'));
      
      res.json({
        success: true,
        status: 200,
        message: 'Login successful',
        data: {
          user: { id: result.user.id, fullName: result.user.fullName, companyName: result.user.companyName, email: result.user.email, role: 'client' },
          clientInfo: { id: result.user.id, username: result.user.email, name: result.user.fullName, company: result.user.companyName, email: result.user.email, role: 'client' }
        },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.authenticateAdmin({ username, password });

      if (result.error) {
        return res.status(result.status || 401).json({
          success: false,
          status: result.status || 401,
          message: result.error,
          data: null,
          errors: result.error,
          error: result.error,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      const authResult = authService.finishAuth(result.user, 'admin', req, createCsrfToken(result.user.id));
      res.setHeader('Set-Cookie', createCookieHeaders(authResult.accessToken, authResult.refreshToken, authResult.csrfToken, 'admin'));
      
      res.json({
        success: true,
        status: 200,
        message: 'Admin login successful',
        data: {
          user: { ...result.user, role: 'admin' }
        },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const role = req.user ? req.user.role : 'client';
      if (req.auth && req.auth.session) {
        await authService.logoutSession(req.auth.session.id);
      }
      res.setHeader('Set-Cookie', clearCookieHeaders(role));
      
      res.json({
        success: true,
        status: 200,
        message: 'Logout successful',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Not authenticated',
          data: { authenticated: false },
          errors: 'Not authenticated',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      const user = await authService.findUserById(req.user.id);
      if (req.user.role === 'admin') {
        return res.json({
          success: true,
          status: 200,
          message: 'Active admin session',
          data: {
            authenticated: true,
            user: { id: req.user.id, role: 'admin' }
          },
          errors: null,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Not authenticated',
          data: { authenticated: false },
          errors: 'Not authenticated',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      res.json({
        success: true,
        status: 200,
        message: 'Active client session',
        data: {
          authenticated: true,
          user: { id: user.id, email: user.email, fullName: user.fullName, companyName: user.companyName, role: 'client' },
          clientInfo: { id: user.id, username: user.email, name: user.fullName, company: user.companyName, email: user.email, role: 'client' }
        },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.createResetToken(req.body.email);
      if (!result) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'No account found.',
          data: null,
          errors: 'No account found.',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'If the account exists, a reset link has been sent.',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      if (result.error) {
        return res.status(result.status || 400).json({
          success: false,
          status: result.status || 400,
          message: result.error,
          data: null,
          errors: result.error,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Password updated successfully.',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const cookies = require('../utils/auth').parseCookies(req);
      const token = cookies.lumina_client_refresh || cookies.lumina_admin_refresh;
      if (!token) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: 'Unauthorized',
          data: null,
          errors: 'Unauthorized',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      const result = await authService.refreshSession(token, req);
      if (result.error) {
        return res.status(result.status || 401).json({
          success: false,
          status: result.status || 401,
          message: result.error,
          data: null,
          errors: result.error,
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      const csrfToken = createCsrfToken(result.session.id);
      const role = result.session.role;
      res.setHeader('Set-Cookie', createCookieHeaders(result.accessToken, result.refreshToken, csrfToken, role));
      
      res.json({
        success: true,
        status: 200,
        message: 'Session refreshed',
        data: { accessToken: result.accessToken, refreshToken: result.refreshToken },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
