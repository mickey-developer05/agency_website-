const express = require('express');
const aiService = require('../services/ai-service');

function aiApiRouter(app) {
  const router = express.Router();

  // Settings
  router.get('/settings', (req, res) => {
    res.json({ success: true, data: aiService.getAiSettings() });
  });

  router.post('/settings', (req, res) => {
    const updated = aiService.updateAiSettings(req.body);
    res.json({ success: true, data: updated });
  });

  // API Connections
  router.get('/connections', (req, res) => {
    res.json({ success: true, data: aiService.getApiConnections() });
  });

  router.post('/connections', (req, res) => {
    aiService.saveApiConnection(req.body);
    res.json({ success: true });
  });

  router.post('/connections/test', (req, res) => {
    const { provider, apiKey } = req.body;
    const result = aiService.testApiConnection(provider, apiKey);
    res.json(result);
  });

  // Prompts
  router.get('/prompts', (req, res) => {
    res.json({ success: true, data: aiService.getPrompts() });
  });

  router.post('/prompts', (req, res) => {
    const prompt = aiService.savePrompt(req.body);
    res.json({ success: true, data: prompt });
  });

  router.delete('/prompts/:id', (req, res) => {
    aiService.deletePrompt(req.params.id);
    res.json({ success: true });
  });

  // Templates
  router.get('/templates', (req, res) => {
    res.json({ success: true, data: aiService.getTemplates() });
  });

  router.post('/templates', (req, res) => {
    const template = aiService.saveTemplate(req.body);
    res.json({ success: true, data: template });
  });

  router.delete('/templates/:id', (req, res) => {
    aiService.deleteTemplate(req.params.id);
    res.json({ success: true });
  });

  // Knowledge Base
  router.get('/knowledge-base', (req, res) => {
    res.json({ success: true, data: aiService.getKnowledgeBaseItems() });
  });

  router.post('/knowledge-base', (req, res) => {
    const item = aiService.saveKnowledgeBaseItem(req.body);
    res.json({ success: true, data: item });
  });

  router.delete('/knowledge-base/:id', (req, res) => {
    aiService.deleteKnowledgeBaseItem(req.params.id);
    res.json({ success: true });
  });

  // Logs & Dashboard
  router.get('/usage-logs', (req, res) => {
    res.json({ success: true, data: aiService.getUsageLogs() });
  });

  router.get('/dashboard-stats', (req, res) => {
    res.json({ success: true, data: aiService.getDashboardStats() });
  });

  // Placeholder execution endpoint for all generic text generations
  router.post('/generate', (req, res) => {
    const { feature, promptId, templateId, input } = req.body;
    
    // Log the simulated usage
    aiService.logUsage({
      feature: feature || 'General Generation',
      user: req.user ? req.user.username : 'admin',
      provider: 'Simulated Provider',
      model: 'Placeholder-Model-1.0',
      tokens: Math.floor(Math.random() * 500) + 100,
      estimatedCost: 0.001,
      status: 'success'
    });

    setTimeout(() => {
      res.json({
        success: true,
        data: `This is a simulated AI response for the feature "${feature}". Once API keys are connected, this endpoint will return real AI generated content based on your prompt and inputs.`
      });
    }, 1500); // simulate network delay
  });

  app.use('/api/admin/ai', router);
}

module.exports = {
  aiApiRouter
};
