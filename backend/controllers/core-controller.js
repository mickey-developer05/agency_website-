const coreServices = require('../services/core-services');
const db = require('../database/db');

class CoreController {
  // ── Files ──
  async getFiles(req, res, next) {
    try {
      const files = await coreServices.getFiles(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Files retrieved successfully',
        data: files,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadFile(req, res, next) {
    try {
      const { name, size, folder, type } = req.body;
      const file = await coreServices.uploadFile(name, size, folder, type, req.user);
      res.json({
        success: true,
        status: 200,
        message: 'File uploaded successfully',
        data: file,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Invoices ──
  async getInvoices(req, res, next) {
    try {
      const invoices = await coreServices.getInvoices(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Invoices retrieved successfully',
        data: invoices,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const invoice = await coreServices.createInvoice(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Invoice created successfully',
        data: invoice,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async payInvoice(req, res, next) {
    try {
      const { amount, method } = req.body;
      const invoice = await coreServices.payInvoice(req.params.id, amount, method);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Invoice not found',
          data: null,
          errors: 'Invoice not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Invoice paid successfully',
        data: invoice,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      const deleted = await coreServices.deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Invoice not found',
          data: null,
          errors: 'Invoice not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Invoice deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Projects ──
  async getProjects(req, res, next) {
    try {
      const projects = await coreServices.getProjects(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Projects retrieved successfully',
        data: projects,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const project = await coreServices.createProject(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Project created successfully',
        data: project,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await coreServices.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Project not found',
          data: null,
          errors: 'Project not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Project updated successfully',
        data: project,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req, res, next) {
    try {
      await coreServices.deleteProject(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Project deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── CRM Leads ──
  async getLeads(req, res, next) {
    try {
      const leads = await coreServices.getLeads();
      res.json({
        success: true,
        status: 200,
        message: 'Leads retrieved successfully',
        data: leads,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createLead(req, res, next) {
    try {
      const lead = await coreServices.createLead(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Lead created successfully',
        data: lead,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLead(req, res, next) {
    try {
      const lead = await coreServices.updateLead(req.params.id, req.body);
      if (!lead) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Lead not found',
          data: null,
          errors: 'Lead not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Lead updated successfully',
        data: lead,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async scoreLead(req, res, next) {
    try {
      const lead = await coreServices.scoreLead(req.params.id, req.body.score);
      if (!lead) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Lead not found',
          data: null,
          errors: 'Lead not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Lead scored successfully',
        data: lead,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteLead(req, res, next) {
    try {
      await coreServices.deleteLead(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Lead deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Chat Messages ──
  async getChatMessages(req, res, next) {
    try {
      const msgs = await coreServices.getChatMessages(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Chat messages retrieved successfully',
        data: msgs,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createChatMessage(req, res, next) {
    try {
      const msg = await coreServices.createChatMessage(req.body, req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Chat message created successfully',
        data: msg,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async clearChatMessages(req, res, next) {
    try {
      await coreServices.clearChatMessages();
      res.json({
        success: true,
        status: 200,
        message: 'Chat messages cleared successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Support Tickets & Contact Inquiry Messages ──
  async getMessages(req, res, next) {
    try {
      const msgs = await coreServices.getMessages(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Messages retrieved successfully',
        data: msgs,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createMessage(req, res, next) {
    try {
      const msg = await coreServices.createMessage(req.body, req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Message created successfully',
        data: msg,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async replyMessage(req, res, next) {
    try {
      const msg = await coreServices.replyMessage(req.params.id);
      if (!msg) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Message not found',
          data: null,
          errors: 'Message not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Message replied successfully',
        data: msg,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      await coreServices.deleteMessage(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Message deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Newsletter ──
  async getNewsletter(req, res, next) {
    try {
      const subs = await coreServices.getNewsletter();
      res.json({
        success: true,
        status: 200,
        message: 'Newsletter list retrieved successfully',
        data: subs,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async subscribeNewsletter(req, res, next) {
    try {
      await coreServices.subscribeNewsletter(req.body.email);
      res.json({
        success: true,
        status: 200,
        message: 'Newsletter subscription successful',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribeNewsletter(req, res, next) {
    try {
      await coreServices.unsubscribeNewsletter(req.params.email);
      res.json({
        success: true,
        status: 200,
        message: 'Newsletter unsubscribed successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Team ──
  async getTeam(req, res, next) {
    try {
      const team = await coreServices.getTeam();
      res.json({
        success: true,
        status: 200,
        message: 'Team list retrieved successfully',
        data: team,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createTeamMember(req, res, next) {
    try {
      const member = await coreServices.createTeamMember(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Team member created successfully',
        data: member,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTeamMember(req, res, next) {
    try {
      const member = await coreServices.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: 'Team member not found',
          data: null,
          errors: 'Team member not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
      res.json({
        success: true,
        status: 200,
        message: 'Team member updated successfully',
        data: member,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTeamMember(req, res, next) {
    try {
      await coreServices.deleteTeamMember(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Team member deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Settings ──
  async getSettings(req, res, next) {
    try {
      const settings = await coreServices.getSettings();
      res.json({
        success: true,
        status: 200,
        message: 'Settings retrieved successfully',
        data: settings,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async saveSettings(req, res, next) {
    try {
      const settings = await coreServices.saveSettings(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Settings saved successfully',
        data: settings,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async getWebsiteContent(req, res, next) {
    try {
      const content = await coreServices.getWebsiteContent();
      res.json({
        success: true,
        status: 200,
        message: 'Website content retrieved successfully',
        data: content,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async saveWebsiteContent(req, res, next) {
    try {
      const content = await coreServices.saveWebsiteContent(req.body);
      res.json({
        success: true,
        status: 200,
        message: 'Website content saved successfully',
        data: content,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Backups ──
  async getBackups(req, res, next) {
    try {
      const backups = await coreServices.getBackups();
      res.json({
        success: true,
        status: 200,
        message: 'Backups list retrieved successfully',
        data: backups,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createBackup(req, res, next) {
    try {
      const backup = await coreServices.createBackup();
      res.json({
        success: true,
        status: 200,
        message: 'Backup created successfully',
        data: backup,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteBackup(req, res, next) {
    try {
      await coreServices.deleteBackup(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Backup deleted successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Cache ──
  clearCache(req, res, next) {
    try {
      const size = coreServices.clearCache();
      res.json({
        success: true,
        status: 200,
        message: 'System cache cleared successfully',
        data: { cacheSize: size },
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── System Logs ──
  async getSystemLogs(req, res, next) {
    try {
      const logs = await coreServices.getSystemLogs();
      res.json({
        success: true,
        status: 200,
        message: 'System logs retrieved successfully',
        data: logs,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async clearSystemLogs(req, res, next) {
    try {
      await coreServices.clearSystemLogs();
      res.json({
        success: true,
        status: 200,
        message: 'System logs cleared successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Presence Ping ──
  pingPresence(req, res, next) {
    try {
      coreServices.pingPresence(req.body.username);
      res.json({
        success: true,
        status: 200,
        message: 'Presence ping registered',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async getPresenceList(req, res, next) {
    try {
      const presence = await coreServices.getPresenceList();
      res.json({
        success: true,
        status: 200,
        message: 'Presence list retrieved successfully',
        data: presence,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Active Sessions ──
  async getActiveSessions(req, res, next) {
    try {
      const sessions = await coreServices.getActiveSessions();
      res.json({
        success: true,
        status: 200,
        message: 'Active sessions retrieved successfully',
        data: sessions,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteActiveSession(req, res, next) {
    try {
      await coreServices.deleteActiveSession(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'Active session revoked successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── API Keys ──
  async getApiKeys(req, res, next) {
    try {
      const apiKeys = await coreServices.getApiKeys();
      res.json({
        success: true,
        status: 200,
        message: 'API keys retrieved successfully',
        data: apiKeys,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async createApiKey(req, res, next) {
    try {
      const { name, type } = req.body;
      const apiKey = await coreServices.createApiKey(name, type);
      res.json({
        success: true,
        status: 200,
        message: 'API key created successfully',
        data: apiKey,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteApiKey(req, res, next) {
    try {
      await coreServices.deleteApiKey(req.params.id);
      res.json({
        success: true,
        status: 200,
        message: 'API key revoked successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Notifications ──
  async getNotifications(req, res, next) {
    try {
      const notifs = await coreServices.getNotifications(req.user, req.query.username);
      res.json({
        success: true,
        status: 200,
        message: 'Notifications retrieved successfully',
        data: notifs,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  async markNotificationsRead(req, res, next) {
    try {
      await coreServices.markNotificationsRead(req.user);
      res.json({
        success: true,
        status: 200,
        message: 'Notifications marked as read successfully',
        data: true,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── Clients list (Admin only) ──
  async getClients(req, res, next) {
    try {
      const clients = await coreServices.getClients();
      res.json({
        success: true,
        status: 200,
        message: 'Clients list retrieved successfully',
        data: clients,
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }

  // ── PDF Download helper ──
  downloadHelper(req, res, next) {
    try {
      const { pdfBase64, filename } = req.body;
      if (!pdfBase64) {
        return res.status(400).send('Missing PDF data');
      }
      const buffer = Buffer.from(pdfBase64, 'base64');
      const cleanFilename = (filename || 'Invoice.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }

  // ── Activity Log ──
  async getActivityLog(req, res, next) {
    try {
      const dbData = db.readDb();
      res.json({
        success: true,
        status: 200,
        message: 'Activity logs retrieved successfully',
        data: dbData.activityLog || [],
        errors: null,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CoreController();
