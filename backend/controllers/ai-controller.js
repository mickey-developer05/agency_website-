const aiService = require('../services/ai-service');

class AiController {
  getSettings(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI settings retrieved',
        data: aiService.getAiSettings(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  saveSettings(req, res, next) {
    try {
      const updated = aiService.updateAiSettings(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'AI settings updated',
        data: updated,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getConnections(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI API connections retrieved',
        data: aiService.getApiConnections(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  saveConnection(req, res, next) {
    try {
      aiService.saveApiConnection(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'AI API connection saved',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  testConnection(req, res, next) {
    try {
      const { provider, apiKey } = req.body;
      const result = aiService.testApiConnection(provider, apiKey);
      res.json({
        success: result.success,
        status: result.success ? 200 : 400,
        message: result.message,
        data: result,
        errors: result.success ? null : result.message,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getPrompts(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI prompts retrieved',
        data: aiService.getPrompts(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  savePrompt(req, res, next) {
    try {
      const prompt = aiService.savePrompt(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'AI prompt saved',
        data: prompt,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  deletePrompt(req, res, next) {
    try {
      aiService.deletePrompt(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'AI prompt deleted',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getTemplates(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI templates retrieved',
        data: aiService.getTemplates(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  saveTemplate(req, res, next) {
    try {
      const template = aiService.saveTemplate(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'AI template saved',
        data: template,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  deleteTemplate(req, res, next) {
    try {
      aiService.deleteTemplate(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'AI template deleted',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getKnowledgeBase(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI knowledge base retrieved',
        data: aiService.getKnowledgeBaseItems(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  saveKnowledgeBase(req, res, next) {
    try {
      const item = aiService.saveKnowledgeBaseItem(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'AI knowledge base item saved',
        data: item,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  deleteKnowledgeBase(req, res, next) {
    try {
      aiService.deleteKnowledgeBaseItem(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'AI knowledge base item deleted',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getUsageLogs(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI usage logs retrieved',
        data: aiService.getUsageLogs(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  getDashboardStats(req, res, next) {
    try {
      res.json({
        success: true,
        status: 200,
        message: 'AI dashboard stats retrieved',
        data: aiService.getDashboardStats(),
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async generate(req, res, next) {
    try {
      const { feature, promptId, templateId, input } = req.body;
      const user = req.user ? req.user.username : 'admin';
      const response = await aiService.generateContent(feature, promptId, templateId, input, user);
      
      res.json({
        success: true,
        status: 200,
        message: 'AI generation complete',
        data: response,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AiController();
