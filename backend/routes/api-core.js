const express = require('express');
const coreController = require('../controllers/core-controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validation');

function coreApiRouter(app) {
  // Public Routes (Unauthenticated)
  app.get('/api/content', coreController.getWebsiteContent);
  app.get('/api/team', coreController.getTeam);
  app.post('/api/crm', validateRequest('client'), coreController.createLead);
  app.post('/api/newsletter', coreController.subscribeNewsletter);
  app.post('/api/messages', coreController.createMessage);
  app.post('/api/invoices/download-helper', coreController.downloadHelper);
  app.post('/api/presence/ping', coreController.pingPresence);

  // Authenticated Routes (Admin or Client)
  app.get('/api/files', authenticate, authorize(), coreController.getFiles);
  app.post('/api/files/upload', authenticate, authorize(), coreController.uploadFile);
  app.get('/api/invoices', authenticate, authorize(), coreController.getInvoices);
  app.put('/api/invoices/:id/pay', authenticate, authorize(), coreController.payInvoice);
  app.get('/api/projects', authenticate, authorize(), coreController.getProjects);
  app.get('/api/chat/messages', authenticate, authorize(), coreController.getChatMessages);
  app.post('/api/chat/messages', authenticate, authorize(), coreController.createChatMessage);
  app.get('/api/messages', authenticate, authorize(), coreController.getMessages);
  app.get('/api/settings', authenticate, authorize(), coreController.getSettings);
  app.get('/api/notifications', authenticate, authorize(), coreController.getNotifications);
  app.put('/api/notifications/read', authenticate, authorize(), coreController.markNotificationsRead);

  // Admin Only Routes
  app.delete('/api/chat/messages', authenticate, authorize(['admin']), coreController.clearChatMessages);
  app.put('/api/crm/:id/score', authenticate, authorize(['admin']), coreController.scoreLead);
  app.post('/api/settings', authenticate, authorize(['admin']), validateRequest('settings'), coreController.saveSettings);
  app.post('/api/content', authenticate, authorize(['admin']), coreController.saveWebsiteContent);
  
  app.post('/api/team', authenticate, authorize(['admin']), coreController.createTeamMember);
  app.put('/api/team/:id', authenticate, authorize(['admin']), coreController.updateTeamMember);
  app.delete('/api/team/:id', authenticate, authorize(['admin']), coreController.deleteTeamMember);
  
  app.post('/api/projects', authenticate, authorize(['admin']), validateRequest('project'), coreController.createProject);
  app.put('/api/projects/:id', authenticate, authorize(['admin']), validateRequest('project'), coreController.updateProject);
  app.delete('/api/projects/:id', authenticate, authorize(['admin']), coreController.deleteProject);
  
  app.get('/api/crm', authenticate, authorize(['admin']), coreController.getLeads);
  app.put('/api/crm/:id', authenticate, authorize(['admin']), coreController.updateLead);
  app.delete('/api/crm/:id', authenticate, authorize(['admin']), coreController.deleteLead);
  
  app.post('/api/invoices', authenticate, authorize(['admin']), validateRequest('invoice'), coreController.createInvoice);
  app.delete('/api/invoices/:id', authenticate, authorize(['admin']), coreController.deleteInvoice);
  
  app.post('/api/messages/:id/reply', authenticate, authorize(['admin']), coreController.replyMessage);
  app.delete('/api/messages/:id', authenticate, authorize(['admin']), coreController.deleteMessage);
  
  app.get('/api/newsletter', authenticate, authorize(['admin']), coreController.getNewsletter);
  app.delete('/api/newsletter/:email', authenticate, authorize(['admin']), coreController.unsubscribeNewsletter);
  
  app.get('/api/backups', authenticate, authorize(['admin']), coreController.getBackups);
  app.post('/api/backups', authenticate, authorize(['admin']), coreController.createBackup);
  app.delete('/api/backups/:id', authenticate, authorize(['admin']), coreController.deleteBackup);
  
  app.post('/api/cache/clear', authenticate, authorize(['admin']), coreController.clearCache);
  
  app.get('/api/logs', authenticate, authorize(['admin']), coreController.getSystemLogs);
  app.delete('/api/logs', authenticate, authorize(['admin']), coreController.clearSystemLogs);
  
  app.get('/api/sessions', authenticate, authorize(['admin']), coreController.getActiveSessions);
  app.delete('/api/sessions/:id', authenticate, authorize(['admin']), coreController.deleteActiveSession);
  
  app.get('/api/apikeys', authenticate, authorize(['admin']), coreController.getApiKeys);
  app.post('/api/apikeys', authenticate, authorize(['admin']), coreController.createApiKey);
  app.delete('/api/apikeys/:id', authenticate, authorize(['admin']), coreController.deleteApiKey);
  
  app.get('/api/presence', authenticate, authorize(['admin']), coreController.getPresenceList);
  app.get('/api/activity-log', authenticate, authorize(['admin']), coreController.getActivityLog);
  app.get('/api/clients', authenticate, authorize(['admin']), coreController.getClients);
}

module.exports = { coreApiRouter };
