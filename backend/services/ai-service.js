const db = require('../database/db');
const proposalService = require('./ai/proposal-service');
const contentService = require('./ai/content-service');
const meetingService = require('./ai/meeting-service');
const futureService = require('./ai/future-service');
const emailService = require('./ai/email-service');
const calendarService = require('./ai/calendar-service');

function ensureAiDb(dbData) {
  dbData.ai_settings = dbData.ai_settings || {};
  dbData.ai_api_connections = dbData.ai_api_connections || [];
  dbData.ai_prompts = dbData.ai_prompts || [];
  dbData.ai_templates = dbData.ai_templates || [];
  dbData.ai_knowledge_base = dbData.ai_knowledge_base || [];
  dbData.ai_usage_logs = dbData.ai_usage_logs || [];
  dbData.ai_generated_documents = dbData.ai_generated_documents || [];
  return dbData;
}

// Global Settings
function getAiSettings() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_settings;
}

function updateAiSettings(settings) {
  const dbData = ensureAiDb(db.readDb());
  dbData.ai_settings = { ...dbData.ai_settings, ...settings, updatedAt: new Date().toISOString() };
  db.writeDb(dbData);
  return dbData.ai_settings;
}

// API Connections
function getApiConnections() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_api_connections;
}

function saveApiConnection(connection) {
  const dbData = ensureAiDb(db.readDb());
  const index = dbData.ai_api_connections.findIndex(c => c.provider === connection.provider);
  if (index >= 0) {
    dbData.ai_api_connections[index] = { ...dbData.ai_api_connections[index], ...connection, updatedAt: new Date().toISOString() };
  } else {
    dbData.ai_api_connections.push({ ...connection, id: `conn_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  db.writeDb(dbData);
  return true;
}

function testApiConnection(provider, apiKey) {
  return { success: true, message: `Successfully connected to ${provider} (Simulated)` };
}

// Prompts
function getPrompts() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_prompts;
}

// Save Prompt
function savePrompt(prompt) {
  const dbData = ensureAiDb(db.readDb());
  if (prompt.id) {
    const index = dbData.ai_prompts.findIndex(p => p.id === prompt.id);
    if (index >= 0) {
      dbData.ai_prompts[index] = { ...dbData.ai_prompts[index], ...prompt, updatedAt: new Date().toISOString() };
    }
  } else {
    prompt.id = `prompt_${Date.now()}`;
    prompt.createdAt = new Date().toISOString();
    prompt.updatedAt = prompt.createdAt;
    dbData.ai_prompts.push(prompt);
  }
  db.writeDb(dbData);
  return prompt;
}

function deletePrompt(id) {
  const dbData = ensureAiDb(db.readDb());
  dbData.ai_prompts = dbData.ai_prompts.filter(p => p.id !== id);
  db.writeDb(dbData);
  return true;
}

// Templates
function getTemplates() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_templates;
}

function saveTemplate(template) {
  const dbData = ensureAiDb(db.readDb());
  if (template.id) {
    const index = dbData.ai_templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      dbData.ai_templates[index] = { ...dbData.ai_templates[index], ...template, updatedAt: new Date().toISOString() };
    }
  } else {
    template.id = `tpl_${Date.now()}`;
    template.createdAt = new Date().toISOString();
    template.updatedAt = template.createdAt;
    dbData.ai_templates.push(template);
  }
  db.writeDb(dbData);
  return template;
}

function deleteTemplate(id) {
  const dbData = ensureAiDb(db.readDb());
  dbData.ai_templates = dbData.ai_templates.filter(t => t.id !== id);
  db.writeDb(dbData);
  return true;
}

// Knowledge Base
function getKnowledgeBaseItems() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_knowledge_base;
}

function saveKnowledgeBaseItem(item) {
  const dbData = ensureAiDb(db.readDb());
  if (item.id) {
    const index = dbData.ai_knowledge_base.findIndex(k => k.id === item.id);
    if (index >= 0) {
      dbData.ai_knowledge_base[index] = { ...dbData.ai_knowledge_base[index], ...item, updatedAt: new Date().toISOString() };
    }
  } else {
    item.id = `kb_${Date.now()}`;
    item.createdAt = new Date().toISOString();
    item.updatedAt = item.createdAt;
    dbData.ai_knowledge_base.push(item);
  }
  db.writeDb(dbData);
  return item;
}

function deleteKnowledgeBaseItem(id) {
  const dbData = ensureAiDb(db.readDb());
  dbData.ai_knowledge_base = dbData.ai_knowledge_base.filter(k => k.id !== id);
  db.writeDb(dbData);
  return true;
}

// Logging
function getUsageLogs() {
  const dbData = ensureAiDb(db.readDb());
  return dbData.ai_usage_logs;
}

function logUsage(logEntry) {
  const dbData = ensureAiDb(db.readDb());
  dbData.ai_usage_logs.push({
    ...logEntry,
    id: `log_${Date.now()}`,
    createdAt: new Date().toISOString()
  });
  db.writeDb(dbData);
  return true;
}

// Dashboard Stats
function getDashboardStats() {
  const dbData = ensureAiDb(db.readDb());
  return {
    totalRequests: dbData.ai_usage_logs.length,
    activeProviders: dbData.ai_api_connections.filter(c => c.status === 'active').length,
    connectedApis: dbData.ai_api_connections.length,
    generatedContent: (dbData.ai_content_history || []).length,
    generatedProposals: (dbData.ai_proposal_history || []).length,
    meetingSummaries: (dbData.ai_meeting_history || []).length,
    emailsGenerated: (dbData.ai_email_history || []).length,
  };
}

// Generation Delegate
async function generateContent(feature, promptId, templateId, input, user = 'admin') {
  let content = '';
  if (feature === 'Proposal Generator') {
    content = await proposalService.generate(input);
  } else if (feature === 'Content Writer') {
    content = await contentService.generate(input);
  } else if (feature === 'Meeting Summary') {
    content = await meetingService.generate(input);
  } else if (feature === 'Email Assistant') {
    content = await emailService.generateEmail(input);
  } else {
    content = await futureService.generate(feature || 'General Generation', input);
  }

  // Log simulated usage
  logUsage({
    feature: feature || 'General Generation',
    user,
    provider: 'Simulated Provider',
    model: 'Placeholder-Model-1.0',
    tokens: Math.floor(Math.random() * 500) + 100,
    estimatedCost: 0.001,
    status: 'success'
  });

  return content;
}

// Calendar integrations
async function getCalendarEvents() {
  return calendarService.getEvents();
}

async function bookCalendarEvent(data) {
  return calendarService.bookEvent(data);
}

async function deleteCalendarEvent(id) {
  return calendarService.deleteEvent(id);
}

module.exports = {
  getAiSettings,
  updateAiSettings,
  getApiConnections,
  saveApiConnection,
  testApiConnection,
  getPrompts,
  savePrompt,
  deletePrompt,
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getKnowledgeBaseItems,
  saveKnowledgeBaseItem,
  deleteKnowledgeBaseItem,
  getUsageLogs,
  logUsage,
  getDashboardStats,
  generateContent,
  getCalendarEvents,
  bookCalendarEvent,
  deleteCalendarEvent
};
