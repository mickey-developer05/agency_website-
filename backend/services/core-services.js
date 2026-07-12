const projectRepository = require('../repositories/project-repository');
const invoiceRepository = require('../repositories/invoice-repository');
const fileRepository = require('../repositories/file-repository');
const crmRepository = require('../repositories/crm-repository');
const settingRepository = require('../repositories/setting-repository');
const teamRepository = require('../repositories/team-repository');
const messageRepository = require('../repositories/message-repository');
const newsletterRepository = require('../repositories/newsletter-repository');
const backupRepository = require('../repositories/backup-repository');
const logRepository = require('../repositories/log-repository');
const apikeyRepository = require('../repositories/apikey-repository');
const userRepository = require('../repositories/user-repository');
const db = require('../database/db');

// Presence mapping
const clientPresence = {};

class CoreServices {
  async getAuthClient(user) {
    if (!user || user.role === 'admin') return null;
    const dbData = db.readDb();
    return (dbData.clients || []).find(c => c.id === user.id || c.email === user.email) || null;
  }

  // ── Files ──
  async getFiles(user) {
    const files = await fileRepository.getAll();
    if (user.role === 'admin') return files;
    const client = await this.getAuthClient(user);
    if (!client) return [];
    return files.filter(f => f.client === client.company || f.client === 'All' || !f.client);
  }

  async uploadFile(name, size, folder, type, user) {
    let clientCompany = 'Internal';
    if (user.role !== 'admin') {
      const client = await this.getAuthClient(user);
      if (!client) throw new Error('Unauthorized');
      clientCompany = client.company;
    }
    const newFile = {
      id: 'file-' + Date.now(),
      name: name || 'Untitled File',
      size: size || '1.0 MB',
      folder: folder || 'Brand Assets',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: type || 'PNG',
      client: clientCompany
    };
    return fileRepository.create(newFile);
  }

  // ── Invoices ──
  async getInvoices(user) {
    const invoices = await invoiceRepository.getAll();
    if (user.role === 'admin') return invoices;
    const client = await this.getAuthClient(user);
    if (!client) return [];
    return invoices.filter(inv => inv.client === client.company);
  }

  async createInvoice(invoiceData) {
    const amount = parseFloat(invoiceData.amount) || 0;
    const status = (invoiceData.status || 'pending').toLowerCase();
    
    const newInvoice = {
      id: invoiceData.id || 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
      client: invoiceData.client || 'Client',
      project: invoiceData.project || 'Project',
      issueDate: invoiceData.issueDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: invoiceData.dueDate || '',
      amount: amount,
      status: status,
      clientEmail: invoiceData.clientEmail || 'billing@client.com',
      clientAddress: invoiceData.clientAddress || 'Metropolis, NY 10001',
      items: invoiceData.items || [
        { description: invoiceData.project || 'Project Services', quantity: 1, unitPrice: amount, amount: amount }
      ],
      tax: parseFloat(invoiceData.tax) || 0,
      discount: parseFloat(invoiceData.discount) || 0,
      amountPaid: parseFloat(invoiceData.amountPaid) !== undefined ? parseFloat(invoiceData.amountPaid) : (status === 'paid' ? amount : 0),
      remainingDue: parseFloat(invoiceData.remainingDue) !== undefined ? parseFloat(invoiceData.remainingDue) : (status === 'paid' ? 0 : amount),
      paymentHistory: invoiceData.paymentHistory || (status === 'paid' ? [
        { amount: amount, date: invoiceData.issueDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), method: 'Card', transactionId: 'TXN-SEED-' + Date.now() }
      ] : [])
    };
    return invoiceRepository.create(newInvoice);
  }

  async payInvoice(id, amount, method) {
    const inv = await invoiceRepository.getById(id);
    if (!inv) return null;

    const totalAmount = parseFloat(inv.amount) || 0;
    let currentPaid = parseFloat(inv.amountPaid);
    if (isNaN(currentPaid)) {
      currentPaid = inv.status === 'paid' ? totalAmount : 0;
    }
    
    let currentDue = parseFloat(inv.remainingDue);
    if (isNaN(currentDue)) {
      currentDue = inv.status === 'paid' ? 0 : totalAmount;
    }
    
    const amountToPay = amount !== undefined ? parseFloat(amount) : currentDue;
    if (isNaN(amountToPay) || amountToPay <= 0) {
      throw new Error('Invalid payment amount. Amount must be greater than zero.');
    }
    if (amountToPay > currentDue + 0.01) {
      throw new Error('Payment amount exceeds the remaining balance due.');
    }
    
    const newPaid = currentPaid + amountToPay;
    let newDue = currentDue - amountToPay;
    if (newDue < 0.01) newDue = 0;
    
    inv.amountPaid = parseFloat(newPaid.toFixed(2));
    inv.remainingDue = parseFloat(newDue.toFixed(2));
    inv.status = inv.remainingDue === 0 ? 'paid' : 'partially paid';
    
    inv.paymentHistory = inv.paymentHistory || [];
    inv.paymentHistory.push({
      amount: amountToPay,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      method: method || 'Card',
      transactionId: 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    });
    
    return invoiceRepository.update(id, inv);
  }

  async deleteInvoice(id) {
    return invoiceRepository.delete(id);
  }

  // ── Projects ──
  async getProjects(user) {
    const projects = await projectRepository.getAll();
    if (user.role === 'admin') return projects;
    const client = await this.getAuthClient(user);
    if (!client) return [];
    return projects.filter(p => p.client === client.company);
  }

  async createProject(projectData) {
    const newProject = {
      id: 'proj-' + Date.now(),
      name: projectData.name || 'Untitled Project',
      client: projectData.client || 'Internal',
      stage: projectData.stage || 'Design',
      progress: parseInt(projectData.progress) || 0,
      team: projectData.team || [],
      value: parseFloat(projectData.value) || 0,
      date: projectData.date || new Date().toISOString().split('T')[0]
    };
    return projectRepository.create(newProject);
  }

  async updateProject(id, projectData) {
    return projectRepository.update(id, projectData);
  }

  async deleteProject(id) {
    return projectRepository.delete(id);
  }

  // ── CRM ──
  async getLeads() {
    return crmRepository.getAll();
  }

  async createLead(leadData) {
    const newLead = {
      id: 'lead-' + Date.now(),
      name: leadData.name || 'Anonymous Prospect',
      company: leadData.company || '',
      service: leadData.service || 'Consultation',
      stage: leadData.stage || 'New',
      value: parseFloat(leadData.value) || 0,
      email: leadData.email || '',
      phone: leadData.phone || '',
      source: leadData.source || 'Direct API',
      date: leadData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: leadData.notes || ''
    };
    return crmRepository.create(newLead);
  }

  async updateLead(id, leadData) {
    return crmRepository.update(id, leadData);
  }

  async scoreLead(id, scoreInput) {
    const lead = await crmRepository.getById(id);
    if (!lead) return null;
    const score = parseInt(scoreInput) || Math.floor(Math.random() * 30) + 70;
    const priority = score >= 90 ? 'Extreme' : score >= 80 ? 'High' : 'Medium';
    lead.score = score;
    lead.priority = priority;
    lead.notes = (lead.notes || '') + `\n[AI Lead Score: ${score}% - Priority: ${priority}]`;
    return crmRepository.update(id, lead);
  }

  async deleteLead(id) {
    return crmRepository.delete(id);
  }

  // ── Chat Messages ──
  async getChatMessages(user) {
    const msgs = await messageRepository.getChatMessages();
    if (user.role === 'admin') return msgs;
    const client = await this.getAuthClient(user);
    if (!client) return [];
    return msgs.filter(m => m.senderRole === client.company);
  }

  async createChatMessage(chatData, user) {
    let sender = chatData.sender || 'Client User';
    let senderRole = chatData.senderRole || 'Acme Corp';
    let isClient = chatData.isClient !== undefined ? chatData.isClient : true;
    
    if (user.role !== 'admin') {
      const client = await this.getAuthClient(user);
      if (!client) throw new Error('Unauthorized');
      sender = client.name;
      senderRole = client.company;
      isClient = true;
    }
    
    const newMsg = {
      id: 'chat-' + Date.now(),
      sender: sender,
      senderRole: senderRole,
      avatar: chatData.avatar || '',
      text: chatData.text || '',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isClient: isClient
    };
    await messageRepository.createChatMessage(newMsg);

    // Create notifications
    if (isClient) {
      await messageRepository.createNotification({
        id: 'notif-' + Date.now(),
        username: 'admin',
        text: `New chat message from ${sender} (${senderRole})`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    } else {
      const dbData = db.readDb();
      const targetClients = (dbData.clients || []).filter(c => c.company === senderRole);
      for (const c of targetClients) {
        await messageRepository.createNotification({
          id: 'notif-' + Date.now() + '-' + c.username,
          username: c.username,
          text: `New message from Lumina Team`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          read: false
        });
      }
    }
    
    return newMsg;
  }

  async clearChatMessages() {
    return messageRepository.clearChatMessages();
  }

  // ── Support Tickets & Contact Inquiry Messages ──
  async getMessages(user) {
    const msgs = await messageRepository.getAll();
    if (user.role === 'admin') return msgs;
    const client = await this.getAuthClient(user);
    if (!client) return [];
    return msgs.filter(m => m.client === client.company);
  }

  async createMessage(msgData, user) {
    let clientCompany = msgData.client || 'Client';
    
    if (user && user.role !== 'admin') {
      const client = await this.getAuthClient(user);
      if (!client) throw new Error('Unauthorized');
      clientCompany = client.company;
    }
    
    const isSupport = msgData.type === 'support';
    const newMsg = isSupport ? {
      id: 'tkt-' + Date.now(),
      idNum: 'TKT-' + (1000 + (await messageRepository.getAll()).length),
      client: clientCompany,
      subject: msgData.subject || 'Support Ticket',
      details: msgData.details || '',
      type: 'support',
      priority: msgData.priority || 'Medium',
      status: 'Open',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } : {
      id: 'msg-' + Date.now(),
      name: msgData.name || 'Anonymous',
      email: msgData.email || '',
      subject: msgData.subject || 'Inquiry',
      budget: msgData.budget || 'startup',
      details: msgData.details || '',
      type: 'contact',
      status: 'New',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    await messageRepository.create(newMsg);
    
    if (isSupport) {
      await messageRepository.createNotification({
        id: 'notif-' + Date.now(),
        username: 'admin',
        text: `New support ticket from ${clientCompany}: "${msgData.subject}"`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    }
    
    return newMsg;
  }

  async replyMessage(id) {
    const msg = await messageRepository.getById(id);
    if (!msg) return null;
    msg.status = 'Replied';
    return messageRepository.update(id, msg);
  }

  async deleteMessage(id) {
    return messageRepository.delete(id);
  }

  // ── Newsletter ──
  async getNewsletter() {
    return newsletterRepository.getAll();
  }

  async subscribeNewsletter(email) {
    if (!email) throw new Error('Email required');
    const subs = await newsletterRepository.getAll();
    if (!subs.some(n => n.email === email)) {
      const newSub = {
        email: email,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'active'
      };
      await newsletterRepository.create(newSub);
    }
    return true;
  }

  async unsubscribeNewsletter(email) {
    const list = await newsletterRepository.getAll();
    const idx = list.findIndex(n => n.email === email);
    if (idx !== -1) {
      list.splice(idx, 1);
      db.saveCollection('newsletter', list);
      return true;
    }
    return false;
  }

  // ── Team ──
  async getTeam() {
    return teamRepository.getAll();
  }

  async createTeamMember(memberData) {
    const newMember = {
      id: memberData.id || 'mem-' + Date.now(),
      name: memberData.name || 'New Member',
      role: memberData.role || 'Contributor',
      status: memberData.status || 'Active',
      email: memberData.email || '',
      bio: memberData.bio || '',
      specialty: memberData.specialty || '',
      github: memberData.github || '',
      linkedin: memberData.linkedin || '',
      twitter: memberData.twitter || '',
      avatar: memberData.avatar || ''
    };
    return teamRepository.create(newMember);
  }

  async updateTeamMember(id, memberData) {
    return teamRepository.update(id, memberData);
  }

  async deleteTeamMember(id) {
    return teamRepository.delete(id);
  }

  // ── Settings & Website Content ──
  async getSettings() {
    return settingRepository.getSettings();
  }

  async saveSettings(settings) {
    return settingRepository.saveSettings(settings);
  }

  async getWebsiteContent() {
    return settingRepository.getWebsiteContent();
  }

  async saveWebsiteContent(content) {
    return settingRepository.saveWebsiteContent(content);
  }

  // ── Presence Ping ──
  pingPresence(username) {
    if (username) {
      clientPresence[username.toLowerCase()] = Date.now();
      return true;
    }
    return false;
  }

  async getPresenceList() {
    const dbData = db.readDb();
    const clients = dbData.clients || [];
    return clients.map(c => {
      const lastSeen = clientPresence[c.username.toLowerCase()] || 0;
      const isOnline = (Date.now() - lastSeen) < 25000;
      return {
        username: c.username,
        company: c.company,
        name: c.name,
        isOnline: isOnline,
        lastSeen: lastSeen ? new Date(lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Never'
      };
    });
  }

  // ── Backups ──
  async getBackups() {
    return backupRepository.getAll();
  }

  async createBackup() {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fileDate = new Date().toISOString().split('T')[0];
    const newBackup = {
      id: 'bk-' + Date.now(),
      name: `Backup_${fileDate}_${Math.floor(1000 + Math.random() * 9000)}.zip`,
      size: (Math.random() * 2 + 3).toFixed(1) + ' MB',
      date: dateStr
    };
    await backupRepository.create(newBackup);
    
    const dbData = db.readDb();
    dbData.systemLogs = dbData.systemLogs || [];
    dbData.systemLogs.push({
      id: 'log-' + Date.now(),
      level: 'INFO',
      message: `Manual backup triggered: Created file ${newBackup.name}`,
      timestamp: dateStr
    });
    db.writeDb(dbData);
    
    return newBackup;
  }

  async deleteBackup(id) {
    return backupRepository.delete(id);
  }

  // ── Cache ──
  clearCache() {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dbData = db.readDb();
    dbData.systemLogs = dbData.systemLogs || [];
    dbData.systemLogs.push({
      id: 'log-' + Date.now(),
      level: 'INFO',
      message: 'System cache cleared manually by admin',
      timestamp: dateStr
    });
    db.writeDb(dbData);
    return '0 KB';
  }

  // ── System Logs ──
  async getSystemLogs() {
    return logRepository.getAll();
  }

  async clearSystemLogs() {
    const dbData = db.readDb();
    dbData.systemLogs = [];
    db.writeDb(dbData);
    return true;
  }

  // ── Active Sessions ──
  async getActiveSessions() {
    const dbData = db.readDb();
    return dbData.activeSessions || [];
  }

  async deleteActiveSession(id) {
    const dbData = db.readDb();
    dbData.activeSessions = dbData.activeSessions || [];
    dbData.activeSessions = dbData.activeSessions.filter(s => s.id !== id);
    db.writeDb(dbData);
    return true;
  }

  // ── API Keys ──
  async getApiKeys() {
    return apikeyRepository.getAll();
  }

  async createApiKey(name, type) {
    const randHex = Math.random().toString(16).substring(2, 6);
    const newKey = {
      id: 'key-' + Date.now(),
      name: name || 'Unnamed API Key',
      prefix: `lum_${type || 'live'}_${randHex}...`,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active'
    };
    return apikeyRepository.create(newKey);
  }

  async deleteApiKey(id) {
    return apikeyRepository.delete(id);
  }

  // ── Notifications ──
  async getNotifications(user, queryUsername) {
    let username = 'admin';
    if (user.role !== 'admin') {
      const client = await this.getAuthClient(user);
      if (!client) return [];
      username = client.username;
    } else {
      username = queryUsername || 'admin';
    }
    const notifs = await messageRepository.getNotifications();
    return notifs.filter(n => n.username.toLowerCase() === username.toLowerCase());
  }

  async markNotificationsRead(user) {
    let username = 'admin';
    if (user.role !== 'admin') {
      const client = await this.getAuthClient(user);
      if (!client) throw new Error('Unauthorized');
      username = client.username;
    }
    return messageRepository.markNotificationsRead(username);
  }

  // ── Client List ──
  async getClients() {
    const dbData = db.readDb();
    return dbData.clients || [];
  }
}

module.exports = new CoreServices();
