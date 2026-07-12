const express = require('express');
const db = require('../database/db');

function healthRouter(app) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 200,
      message: 'Server is healthy',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      errors: null,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  });

  router.get('/ready', (req, res) => {
    try {
      // Check database connection readiness
      db.readDb();
      res.status(200).json({
        success: true,
        status: 200,
        message: 'Server is ready',
        data: {
          database: 'connected',
          timestamp: new Date().toISOString()
        },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      res.status(503).json({
        success: false,
        status: 503,
        message: 'Server is not ready',
        data: null,
        errors: err.message || 'Database connection error',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }
  });

  app.use(router);
}

module.exports = { healthRouter };
