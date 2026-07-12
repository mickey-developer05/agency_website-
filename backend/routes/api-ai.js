const express = require('express');
const aiController = require('../controllers/ai-controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validation');

function aiApiRouter(app) {
  const router = express.Router();

  // All AI routes require admin privilege
  router.use(authenticate);
  router.use(authorize(['admin']));

  // Settings
  router.get('/settings', aiController.getSettings);
  router.post('/settings', aiController.saveSettings);

  // API Connections
  router.get('/connections', aiController.getConnections);
  router.post('/connections', aiController.saveConnection);
  router.post('/connections/test', aiController.testConnection);

  // Prompts
  router.get('/prompts', aiController.getPrompts);
  router.post('/prompts', aiController.savePrompt);
  router.delete('/prompts/:id', aiController.deletePrompt);

  // Templates
  router.get('/templates', aiController.getTemplates);
  router.post('/templates', aiController.saveTemplate);
  router.delete('/templates/:id', aiController.deleteTemplate);

  // Knowledge Base
  router.get('/knowledge-base', aiController.getKnowledgeBase);
  router.post('/knowledge-base', aiController.saveKnowledgeBase);
  router.delete('/knowledge-base/:id', aiController.deleteKnowledgeBase);

  // Logs & Dashboard
  router.get('/usage-logs', aiController.getUsageLogs);
  router.get('/dashboard-stats', aiController.getDashboardStats);

  // Execution endpoint
  router.post('/generate', validateRequest('aiGenerate'), aiController.generate);

  app.use('/api/admin/ai', router);
}

module.exports = {
  aiApiRouter
};
