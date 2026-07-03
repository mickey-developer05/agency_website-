const { readDb, writeDb } = require('../database/db');

function ensureAiDb(db) {
  db.ai_settings = db.ai_settings || {};
  db.ai_api_connections = db.ai_api_connections || [];
  db.ai_prompts = db.ai_prompts || [];
  db.ai_templates = db.ai_templates || [];
  db.ai_knowledge_base = db.ai_knowledge_base || [];
  db.ai_usage_logs = db.ai_usage_logs || [];
  db.ai_generated_documents = db.ai_generated_documents || [];
  db.ai_email_history = db.ai_email_history || [];
  db.ai_meeting_history = db.ai_meeting_history || [];
  db.ai_content_history = db.ai_content_history || [];
  db.ai_proposal_history = db.ai_proposal_history || [];
  return db;
}

// Global Settings
function getAiSettings() {
  const db = ensureAiDb(readDb());
  return db.ai_settings;
}

function updateAiSettings(settings) {
  const db = ensureAiDb(readDb());
  db.ai_settings = { ...db.ai_settings, ...settings, updatedAt: new Date().toISOString() };
  writeDb(db);
  return db.ai_settings;
}

// API Connections
function getApiConnections() {
  const db = ensureAiDb(readDb());
  return db.ai_api_connections;
}

function saveApiConnection(connection) {
  const db = ensureAiDb(readDb());
  const index = db.ai_api_connections.findIndex(c => c.provider === connection.provider);
  if (index >= 0) {
    db.ai_api_connections[index] = { ...db.ai_api_connections[index], ...connection, updatedAt: new Date().toISOString() };
  } else {
    db.ai_api_connections.push({ ...connection, id: `conn_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  writeDb(db);
  return true;
}

function testApiConnection(provider, apiKey) {
  // Placeholder for real API testing
  return { success: true, message: `Successfully connected to ${provider} (Simulated)` };
}

// Prompts
function getPrompts() {
  const db = ensureAiDb(readDb());
  return db.ai_prompts;
}

function savePrompt(prompt) {
  const db = ensureAiDb(readDb());
  if (prompt.id) {
    const index = db.ai_prompts.findIndex(p => p.id === prompt.id);
    if (index >= 0) {
      db.ai_prompts[index] = { ...db.ai_prompts[index], ...prompt, updatedAt: new Date().toISOString() };
    }
  } else {
    prompt.id = `prompt_${Date.now()}`;
    prompt.createdAt = new Date().toISOString();
    prompt.updatedAt = prompt.createdAt;
    db.ai_prompts.push(prompt);
  }
  writeDb(db);
  return prompt;
}

function deletePrompt(id) {
  const db = ensureAiDb(readDb());
  db.ai_prompts = db.ai_prompts.filter(p => p.id !== id);
  writeDb(db);
  return true;
}

// Templates
function getTemplates() {
  const db = ensureAiDb(readDb());
  return db.ai_templates;
}

function saveTemplate(template) {
  const db = ensureAiDb(readDb());
  if (template.id) {
    const index = db.ai_templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      db.ai_templates[index] = { ...db.ai_templates[index], ...template, updatedAt: new Date().toISOString() };
    }
  } else {
    template.id = `tpl_${Date.now()}`;
    template.createdAt = new Date().toISOString();
    template.updatedAt = template.createdAt;
    db.ai_templates.push(template);
  }
  writeDb(db);
  return template;
}

// Delete Template
function deleteTemplate(id) {
  const db = ensureAiDb(readDb());
  db.ai_templates = db.ai_templates.filter(t => t.id !== id);
  writeDb(db);
  return true;
}

// Knowledge Base
function getKnowledgeBaseItems() {
  const db = ensureAiDb(readDb());
  return db.ai_knowledge_base;
}

function saveKnowledgeBaseItem(item) {
  const db = ensureAiDb(readDb());
  if (item.id) {
    const index = db.ai_knowledge_base.findIndex(k => k.id === item.id);
    if (index >= 0) {
      db.ai_knowledge_base[index] = { ...db.ai_knowledge_base[index], ...item, updatedAt: new Date().toISOString() };
    }
  } else {
    item.id = `kb_${Date.now()}`;
    item.createdAt = new Date().toISOString();
    item.updatedAt = item.createdAt;
    db.ai_knowledge_base.push(item);
  }
  writeDb(db);
  return item;
}

function deleteKnowledgeBaseItem(id) {
  const db = ensureAiDb(readDb());
  db.ai_knowledge_base = db.ai_knowledge_base.filter(k => k.id !== id);
  writeDb(db);
  return true;
}

// Logging
function getUsageLogs() {
  const db = ensureAiDb(readDb());
  return db.ai_usage_logs;
}

function logUsage(logEntry) {
  const db = ensureAiDb(readDb());
  db.ai_usage_logs.push({
    ...logEntry,
    id: `log_${Date.now()}`,
    createdAt: new Date().toISOString()
  });
  writeDb(db);
  return true;
}

// Dashboards Stats
function getDashboardStats() {
  const db = ensureAiDb(readDb());
  return {
    totalRequests: db.ai_usage_logs.length,
    activeProviders: db.ai_api_connections.filter(c => c.status === 'active').length,
    connectedApis: db.ai_api_connections.length,
    generatedContent: (db.ai_content_history || []).length,
    generatedProposals: (db.ai_proposal_history || []).length,
    meetingSummaries: (db.ai_meeting_history || []).length,
    emailsGenerated: (db.ai_email_history || []).length,
  };
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
  getDashboardStats
};
