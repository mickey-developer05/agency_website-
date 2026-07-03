const { readDb, writeDb } = require('../database/db');
const { validateSessionFromRequest } = require('../utils/session-manager');
const { findUserById } = require('../services/auth-service');

// Helper: Check if admin is authenticated
function isAdminAuth(req) {
  const session = validateSessionFromRequest(req);
  return !!session && session.payload.role === 'admin';
}

// Helper: Retrieve authenticated client details from the current session
function getAuthClient(req) {
  const session = validateSessionFromRequest(req);
  if (!session || session.payload.role === 'admin') {
    return null;
  }
  const db = readDb();
  const user = findUserById(session.payload.sub);
  if (!user) return null;
  return (db.clients || []).find(c => c.id === user.id || c.email === user.email) || null;
}

// Presence Map for in-memory tracking
const clientPresence = {};

function coreApiRouter(app) {
  // Shared Files API
  app.get('/api/files', (req, res) => {
    const db = readDb();
    let files = db.files || [];
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        files = files.filter(f => f.client === client.company || f.client === 'All' || !f.client);
      } else {
        return res.json([]);
      }
    }
    res.json(files);
  });

  app.post('/api/files/upload', (req, res) => {
    const db = readDb();
    let clientCompany = 'Internal';
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        clientCompany = client.company;
      } else {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }
    
    const newFile = {
      id: 'file-' + Date.now(),
      name: req.body.name || 'Untitled File',
      size: req.body.size || '1.0 MB',
      folder: req.body.folder || 'Brand Assets',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: req.body.type || 'PNG',
      client: clientCompany
    };
    db.files = db.files || [];
    db.files.push(newFile);
    writeDb(db);
    res.json({ success: true, file: newFile });
  });

  // Pay Invoice API
  app.put('/api/invoices/:id/pay', (req, res) => {
    const db = readDb();
    db.invoices = db.invoices || [];
    const idx = db.invoices.findIndex(inv => inv.id === req.params.id);
    if (idx !== -1) {
      const inv = db.invoices[idx];
      const totalAmount = parseFloat(inv.amount) || 0;
      
      let currentPaid = parseFloat(inv.amountPaid);
      if (isNaN(currentPaid)) {
        currentPaid = inv.status === 'paid' ? totalAmount : 0;
      }
      
      let currentDue = parseFloat(inv.remainingDue);
      if (isNaN(currentDue)) {
        currentDue = inv.status === 'paid' ? 0 : totalAmount;
      }
      
      const amountToPay = parseFloat(req.body.amount) !== undefined ? parseFloat(req.body.amount) : currentDue;
      if (isNaN(amountToPay) || amountToPay <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid payment amount. Amount must be greater than zero.' });
      }
      if (amountToPay > currentDue + 0.01) {
        return res.status(400).json({ success: false, error: 'Payment amount exceeds the remaining balance due.' });
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
        method: req.body.method || 'Card',
        transactionId: 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
      });
      
      writeDb(db);
      return res.json({ success: true, invoice: inv });
    }
    res.status(404).json({ success: false, error: 'Invoice not found' });
  });

  // Chat Messages API
  app.get('/api/chat/messages', (req, res) => {
    const db = readDb();
    let chatMessages = db.chatMessages || [];
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        chatMessages = chatMessages.filter(m => m.senderRole === client.company);
      } else {
        return res.json([]);
      }
    }
    res.json(chatMessages);
  });

  app.post('/api/chat/messages', (req, res) => {
    const db = readDb();
    let sender = req.body.sender || 'Client User';
    let senderRole = req.body.senderRole || 'Acme Corp';
    let isClient = req.body.isClient !== undefined ? req.body.isClient : true;
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        sender = client.name;
        senderRole = client.company;
        isClient = true;
      } else {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }
    
    const newMsg = {
      id: 'chat-' + Date.now(),
      sender: sender,
      senderRole: senderRole,
      avatar: req.body.avatar || '',
      text: req.body.text || '',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isClient: isClient
    };
    db.chatMessages = db.chatMessages || [];
    db.chatMessages.push(newMsg);
    
    // Create notifications
    if (isClient) {
      db.notifications = db.notifications || [];
      db.notifications.push({
        id: 'notif-' + Date.now(),
        username: 'admin',
        text: `New chat message from ${sender} (${senderRole})`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    } else {
      const targetClients = (db.clients || []).filter(c => c.company === senderRole);
      targetClients.forEach(c => {
        db.notifications = db.notifications || [];
        db.notifications.push({
          id: 'notif-' + Date.now() + '-' + c.username,
          username: c.username,
          text: `New message from Lumina Team`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          read: false
        });
      });
    }
    
    writeDb(db);
    res.json({ success: true, message: newMsg });
  });

  app.delete('/api/chat/messages', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.chatMessages = [];
    writeDb(db);
    res.json({ success: true });
  });

  // Lead Scoring API
  app.put('/api/crm/:id/score', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.crm = db.crm || [];
    const idx = db.crm.findIndex(l => l.id === req.params.id);
    if (idx !== -1) {
      const score = parseInt(req.body.score) || Math.floor(Math.random() * 30) + 70;
      const priority = score >= 90 ? 'Extreme' : score >= 80 ? 'High' : 'Medium';
      db.crm[idx].score = score;
      db.crm[idx].priority = priority;
      db.crm[idx].notes = (db.crm[idx].notes || '') + `\n[AI Lead Score: ${score}% - Priority: ${priority}]`;
      writeDb(db);
      return res.json({ success: true, lead: db.crm[idx] });
    }
    res.status(404).json({ success: false, error: 'Lead not found' });
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    res.json(db.settings || {});
  });

  app.post('/api/settings', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    writeDb(db);
    res.json({ success: true, settings: db.settings });
  });

  // Website Content API
  app.get('/api/content', (req, res) => {
    const db = readDb();
    res.json(db.websiteContent || {});
  });

  app.post('/api/content', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.websiteContent = { ...db.websiteContent, ...req.body };
    writeDb(db);
    res.json({ success: true, content: db.websiteContent });
  });

  // Team API
  app.get('/api/team', (req, res) => {
    const db = readDb();
    res.json(db.team || []);
  });

  app.post('/api/team', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const newMember = {
      id: req.body.id || 'mem-' + Date.now(),
      name: req.body.name || 'New Member',
      role: req.body.role || 'Contributor',
      status: req.body.status || 'Active',
      email: req.body.email || '',
      bio: req.body.bio || '',
      specialty: req.body.specialty || '',
      github: req.body.github || '',
      linkedin: req.body.linkedin || '',
      twitter: req.body.twitter || '',
      avatar: req.body.avatar || ''
    };
    db.team = db.team || [];
    db.team.push(newMember);
    writeDb(db);
    res.json({ success: true, member: newMember });
  });

  app.put('/api/team/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.team = db.team || [];
    const idx = db.team.findIndex(m => m.id === req.params.id);
    if (idx !== -1) {
      db.team[idx] = { ...db.team[idx], ...req.body };
      writeDb(db);
      return res.json({ success: true, member: db.team[idx] });
    }
    res.status(404).json({ success: false, error: 'Member not found' });
  });

  app.delete('/api/team/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.team = db.team || [];
    const initialLen = db.team.length;
    db.team = db.team.filter(m => m.id !== req.params.id);
    if (db.team.length < initialLen) {
      writeDb(db);
      return res.json({ success: true });
    }
    res.status(404).json({ success: false, error: 'Member not found' });
  });

  // Projects API
  app.get('/api/projects', (req, res) => {
    const db = readDb();
    let projects = db.projects || [];
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        projects = projects.filter(p => p.client === client.company);
      } else {
        return res.json([]);
      }
    }
    res.json(projects);
  });

  app.post('/api/projects', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const newProject = {
      id: 'proj-' + Date.now(),
      name: req.body.name || 'Untitled Project',
      client: req.body.client || 'Internal',
      stage: req.body.stage || 'Design',
      progress: parseInt(req.body.progress) || 0,
      team: req.body.team || [],
      value: parseFloat(req.body.value) || 0,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };
    db.projects = db.projects || [];
    db.projects.push(newProject);
    writeDb(db);
    res.json({ success: true, project: newProject });
  });

  app.put('/api/projects/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.projects = db.projects || [];
    const idx = db.projects.findIndex(p => p.id === req.params.id);
    if (idx !== -1) {
      db.projects[idx] = { ...db.projects[idx], ...req.body };
      writeDb(db);
      return res.json({ success: true, project: db.projects[idx] });
    }
    res.status(404).json({ success: false, error: 'Project not found' });
  });

  app.delete('/api/projects/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.projects = db.projects || [];
    db.projects = db.projects.filter(p => p.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // CRM Leads API
  app.get('/api/crm', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.crm || []);
  });

  app.post('/api/crm', (req, res) => {
    const db = readDb();
    const newLead = {
      id: 'lead-' + Date.now(),
      name: req.body.name || 'Anonymous Prospect',
      company: req.body.company || '',
      service: req.body.service || 'Consultation',
      stage: req.body.stage || 'New',
      value: parseFloat(req.body.value) || 0,
      email: req.body.email || '',
      phone: req.body.phone || '',
      source: req.body.source || 'Direct API',
      date: req.body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: req.body.notes || ''
    };
    db.crm = db.crm || [];
    db.crm.push(newLead);
    writeDb(db);
    res.json({ success: true, lead: newLead });
  });

  app.put('/api/crm/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.crm = db.crm || [];
    const idx = db.crm.findIndex(l => l.id === req.params.id);
    if (idx !== -1) {
      db.crm[idx] = { ...db.crm[idx], ...req.body };
      writeDb(db);
      return res.json({ success: true, lead: db.crm[idx] });
    }
    res.status(404).json({ success: false, error: 'Lead not found' });
  });

  app.delete('/api/crm/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.crm = db.crm || [];
    db.crm = db.crm.filter(l => l.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Invoices API
  app.get('/api/invoices', (req, res) => {
    const db = readDb();
    let invoices = db.invoices || [];
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        invoices = invoices.filter(inv => inv.client === client.company);
      } else {
        return res.json([]);
      }
    }
    res.json(invoices);
  });

  app.post('/api/invoices', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const amount = parseFloat(req.body.amount) || 0;
    const status = (req.body.status || 'pending').toLowerCase();
    
    const newInvoice = {
      id: req.body.id || 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
      client: req.body.client || 'Client',
      project: req.body.project || 'Project',
      issueDate: req.body.issueDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: req.body.dueDate || '',
      amount: amount,
      status: status,
      clientEmail: req.body.clientEmail || 'billing@client.com',
      clientAddress: req.body.clientAddress || 'Metropolis, NY 10001',
      items: req.body.items || [
        { description: req.body.project || 'Project Services', quantity: 1, unitPrice: amount, amount: amount }
      ],
      tax: parseFloat(req.body.tax) || 0,
      discount: parseFloat(req.body.discount) || 0,
      amountPaid: parseFloat(req.body.amountPaid) !== undefined ? parseFloat(req.body.amountPaid) : (status === 'paid' ? amount : 0),
      remainingDue: parseFloat(req.body.remainingDue) !== undefined ? parseFloat(req.body.remainingDue) : (status === 'paid' ? 0 : amount),
      paymentHistory: req.body.paymentHistory || (status === 'paid' ? [
        { amount: amount, date: req.body.issueDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), method: 'Card', transactionId: 'TXN-SEED-' + Date.now() }
      ] : [])
    };
    db.invoices = db.invoices || [];
    db.invoices.push(newInvoice);
    writeDb(db);
    res.json({ success: true, invoice: newInvoice });
  });

  // PDF Download Echo Endpoint
  app.post('/api/invoices/download-helper', (req, res) => {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64) {
      return res.status(400).send('Missing PDF data');
    }
    
    try {
      const buffer = Buffer.from(pdfBase64, 'base64');
      const cleanFilename = (filename || 'Invoice.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      console.error('Error generating download buffer:', err);
      res.status(500).send('Error compiling PDF file download.');
    }
  });

  app.delete('/api/invoices/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.invoices = db.invoices || [];
    db.invoices = db.invoices.filter(i => i.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Messages & Tickets API
  app.get('/api/messages', (req, res) => {
    const db = readDb();
    let messages = db.messages || [];
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        messages = messages.filter(m => m.client === client.company);
      } else {
        return res.json([]);
      }
    }
    res.json(messages);
  });

  app.post('/api/messages', (req, res) => {
    const db = readDb();
    let clientCompany = req.body.client || 'Client';
    
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        clientCompany = client.company;
      } else {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }
    
    const isSupport = req.body.type === 'support';
    const newMsg = isSupport ? {
      id: 'tkt-' + Date.now(),
      idNum: 'TKT-' + (1000 + (db.messages ? db.messages.length : 0)),
      client: clientCompany,
      subject: req.body.subject || 'Support Ticket',
      details: req.body.details || '',
      type: 'support',
      priority: req.body.priority || 'Medium',
      status: 'Open',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } : {
      id: 'msg-' + Date.now(),
      name: req.body.name || 'Anonymous',
      email: req.body.email || '',
      subject: req.body.subject || 'Inquiry',
      budget: req.body.budget || 'startup',
      details: req.body.details || '',
      type: 'contact',
      status: 'New',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    db.messages = db.messages || [];
    db.messages.push(newMsg);
    
    if (isSupport) {
      db.notifications = db.notifications || [];
      db.notifications.push({
        id: 'notif-' + Date.now(),
        username: 'admin',
        text: `New support ticket from ${clientCompany}: "${req.body.subject}"`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });
    }
    
    writeDb(db);
    res.json({ success: true, message: newMsg });
  });

  app.post('/api/messages/:id/reply', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.messages = db.messages || [];
    const idx = db.messages.findIndex(m => m.id === req.params.id);
    if (idx !== -1) {
      db.messages[idx].status = 'Replied';
      writeDb(db);
      return res.json({ success: true, message: db.messages[idx] });
    }
    res.status(404).json({ success: false, error: 'Message not found' });
  });

  app.delete('/api/messages/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.messages = db.messages || [];
    db.messages = db.messages.filter(m => m.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Newsletter API
  app.get('/api/newsletter', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.newsletter || []);
  });

  app.post('/api/newsletter', (req, res) => {
    const db = readDb();
    db.newsletter = db.newsletter || [];
    const email = req.body.email;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    
    if (!db.newsletter.some(n => n.email === email)) {
      db.newsletter.push({
        email: email,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'active'
      });
      writeDb(db);
    }
    res.json({ success: true });
  });

  app.delete('/api/newsletter/:email', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.newsletter = db.newsletter || [];
    db.newsletter = db.newsletter.filter(n => n.email !== req.params.email);
    writeDb(db);
    res.json({ success: true });
  });

  // Backups API
  app.get('/api/backups', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.backups || []);
  });

  app.post('/api/backups', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fileDate = new Date().toISOString().split('T')[0];
    const newBackup = {
      id: 'bk-' + Date.now(),
      name: `Backup_${fileDate}_${Math.floor(1000 + Math.random() * 9000)}.zip`,
      size: (Math.random() * 2 + 3).toFixed(1) + ' MB',
      date: dateStr
    };
    db.backups = db.backups || [];
    db.backups.push(newBackup);
    
    db.systemLogs = db.systemLogs || [];
    db.systemLogs.push({
      id: 'log-' + Date.now(),
      level: 'INFO',
      message: `Manual backup triggered: Created file ${newBackup.name}`,
      timestamp: dateStr
    });
    
    writeDb(db);
    res.json({ success: true, backup: newBackup });
  });

  app.delete('/api/backups/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.backups = db.backups || [];
    db.backups = db.backups.filter(b => b.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Cache API
  app.post('/api/cache/clear', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    db.systemLogs = db.systemLogs || [];
    db.systemLogs.push({
      id: 'log-' + Date.now(),
      level: 'INFO',
      message: 'System cache cleared manually by admin',
      timestamp: dateStr
    });
    
    writeDb(db);
    res.json({ success: true, cacheSize: '0 KB' });
  });

  // System Logs API
  app.get('/api/logs', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.systemLogs || []);
  });

  app.delete('/api/logs', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.systemLogs = [];
    writeDb(db);
    res.json({ success: true });
  });

  // Active Sessions API
  app.get('/api/sessions', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.activeSessions || []);
  });

  app.delete('/api/sessions/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.activeSessions = db.activeSessions || [];
    db.activeSessions = db.activeSessions.filter(s => s.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // API Keys API
  app.get('/api/apikeys', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.apiKeys || []);
  });

  app.post('/api/apikeys', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const randHex = Math.random().toString(16).substring(2, 6);
    const newKey = {
      id: 'key-' + Date.now(),
      name: req.body.name || 'Unnamed API Key',
      prefix: `lum_${req.body.type || 'live'}_${randHex}...`,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Active'
    };
    db.apiKeys = db.apiKeys || [];
    db.apiKeys.push(newKey);
    writeDb(db);
    res.json({ success: true, apiKey: newKey });
  });

  app.delete('/api/apikeys/:id', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    db.apiKeys = db.apiKeys || [];
    db.apiKeys = db.apiKeys.filter(k => k.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // Presence Ping
  app.post('/api/presence/ping', (req, res) => {
    const { username } = req.body;
    if (username) {
      clientPresence[username.toLowerCase()] = Date.now();
    }
    res.json({ success: true });
  });

  // Get Client List and Presence
  app.get('/api/presence', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    const clients = db.clients || [];
    const list = clients.map(c => {
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
    res.json(list);
  });

  // Get Portal Security Events Activity Logs
  app.get('/api/activity-log', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.activityLog || []);
  });

  // Notifications API
  app.get('/api/notifications', (req, res) => {
    const db = readDb();
    let username = 'admin';
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        username = client.username;
      } else {
        return res.json([]);
      }
    } else {
      username = req.query.username || 'admin';
    }
    const notifications = db.notifications || [];
    const filtered = notifications.filter(n => n.username.toLowerCase() === username.toLowerCase());
    res.json(filtered);
  });

  // Mark all Notifications as read
  app.put('/api/notifications/read', (req, res) => {
    const db = readDb();
    let username = 'admin';
    if (!isAdminAuth(req)) {
      const client = getAuthClient(req);
      if (client) {
        username = client.username;
      } else {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }
    db.notifications = db.notifications || [];
    db.notifications.forEach(n => {
      if (n.username.toLowerCase() === username.toLowerCase()) {
        n.read = true;
      }
    });
    writeDb(db);
    res.json({ success: true });
  });

  // Get all Clients list (Admin only)
  app.get('/api/clients', (req, res) => {
    if (!isAdminAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const db = readDb();
    res.json(db.clients || []);
  });
}

module.exports = { coreApiRouter };
