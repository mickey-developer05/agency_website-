/* Lumina Digital Agency — Unified API Client with LocalStorage Fallback */

const API_ROOT = 'http://localhost:3000/api';

// Helper to make fetch requests, with fallback logic
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_ROOT}${endpoint}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('API server returned non-ok status');
  } catch (err) {
    console.warn(`API connection to ${endpoint} failed. Using localStorage fallback.`);
    return fallbackRequest(endpoint, options);
  }
}

// Fallback implementation using LocalStorage
function fallbackRequest(endpoint, options) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  
  if (endpoint.startsWith('/messages')) {
    let list = JSON.parse(localStorage.getItem('lumina_messages') || '[]');
    if (method === 'POST') {
      const isSupport = body.type === 'support';
      const newMsg = isSupport ? {
        id: 'tkt-' + Date.now(),
        idNum: 'TKT-' + (1000 + list.length),
        client: body.client || 'Client',
        subject: body.subject || 'Support Ticket',
        details: body.details || '',
        type: 'support',
        priority: body.priority || 'Medium',
        status: 'Open',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } : {
        id: 'msg-' + Date.now(),
        name: body.name || 'Anonymous',
        email: body.email || '',
        subject: body.subject || 'Inquiry',
        budget: body.budget || 'startup',
        details: body.details || '',
        type: 'contact',
        status: 'New',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      list.push(newMsg);
      localStorage.setItem('lumina_messages', JSON.stringify(list));
      return { success: true, message: newMsg };
    }
    return list;
  }

  if (endpoint.startsWith('/crm')) {
    let list = JSON.parse(localStorage.getItem('lumina_crm') || '[]');
    if (method === 'POST') {
      const newLead = {
        id: 'lead-' + Date.now(),
        name: body.name || 'Anonymous Prospect',
        company: body.company || '',
        service: body.service || 'Consultation',
        stage: 'New',
        value: parseFloat(body.value) || 12000,
        email: body.email || '',
        phone: body.phone || '',
        source: body.source || 'Website Lead',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        notes: body.notes || ''
      };
      list.push(newLead);
      localStorage.setItem('lumina_crm', JSON.stringify(list));
      return { success: true, lead: newLead };
    }
    return list;
  }

  if (endpoint.startsWith('/newsletter')) {
    let list = JSON.parse(localStorage.getItem('lumina_newsletter') || '[]');
    if (method === 'POST') {
      if (!list.some(n => n.email === body.email)) {
        list.push({
          email: body.email,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'active'
        });
        localStorage.setItem('lumina_newsletter', JSON.stringify(list));
      }
      return { success: true };
    }
    return list;
  }

  if (endpoint.startsWith('/team')) {
    let list = JSON.parse(localStorage.getItem('lumina_team') || '[]');
    if (list.length === 0) {
      list = [
        {
          "id": "elena",
          "name": "Elena Rostova",
          "role": "CEO & Creative Director",
          "status": "Active",
          "email": "elena@lumina.digital",
          "bio": "Elena has spent over 15 years guiding visual narratives for world-class luxury brands. She believes that visual design is not just a coat of paint, but a fundamental pillar of user experience and brand integrity.",
          "specialty": "Creative Direction, Design System Strategy, Luxury Branding",
          "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuBP9HdPA83IJQULUKeQowPp8wCeDu-_ttUoMJPEujp8Cn_a6LY2l1NogLXg9-ZIT1M_xf0KSY3NGMozRasyShvYJ9cPj9qkkD0NfGF5J5NBOia-cB1-C0h0CZ7_rw0OB_uY0X1nHH5gy5mbuuficKSOsfQHOibDlaTK7eODvnl-6YisrwiyQeavXmrqs1Qqmc4EPY5NkFcnKfxzE28YRlhcf7COQwQb2IoVQOMhw_risB5JShVXO4n-nomg7KD57uUOR4n-3rqU"
        },
        {
          "id": "marcus",
          "name": "Marcus Chen",
          "role": "Head of Engineering",
          "status": "Active",
          "email": "marcus@lumina.digital",
          "bio": "Marcus is a full-stack engineer specializing in sub-millisecond data pipelines and headless architecture. Prior to Lumina, he scaled web platforms for key financial corporations in Silicon Valley.",
          "specialty": "Next.js Engine Optimization, Canvas Pipelines, GraphQL Specs",
          "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuDnY8qAyXynYJkJwx6bELLoLFZO7YcYuwc1sFq3yvQMCO9D71FDJ0I7QKSHTXpNpWjhUmLIBwkYoV5-DuUzRM0MNXhVXT1gfD99Uol744l_AEz1_YRSKaKvHUt9UM1hLz_agBB1TbZbEdeHFLg4vmXc17qIhTh3nYfmtvNtKsmkwAgkAYFfB3YWZpRIjxEQ0KQA6N9206do0Sy1mIzXVMUjnOjJNyDiBbx6K__OGIPecZbPmK3kCInuFrYvSzlLCpBWkxWO-GwA"
        },
        {
          "id": "jordan",
          "name": "Jordan Vance",
          "role": "Lead UX/UI Designer",
          "status": "Active",
          "email": "jordan@lumina.digital",
          "bio": "Jordan focuses on the micro-interactions that make interfaces feel responsive and alive. With background in cognitive sciences and visual arts, they design layouts that reduce cognitive load and delight users.",
          "specialty": "Interactive Prototyping, Glassmorphism Aesthetics, Micro-animations",
          "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuBbWGs7K4nauyFFNvpgycXZaaLG6yc4CLVaqgCi-SSLj5fjtvzZ_-p13xKwn6XQfNl2yH44Yp49kpl7X55kf-xghjovJ5mV9LUpWrvN2e8574lcX35f81x6mTPIkYlR-y83F-PKSG39HdxbBoagUh7bPc--HUgV8UufXCg_d0mGiq18M-sw9Ko07kw-krGHA3PRpqNxPKisqjOBQGL4AeihWkGLIAI-3_FUBnKXWsju6c_NMb0vmTWRd4BO9XBd_a9cy0BwdJF8"
        }
      ];
      localStorage.setItem('lumina_team', JSON.stringify(list));
    }
    return list;
  }
  
  if (endpoint.startsWith('/settings')) {
    let settings = JSON.parse(localStorage.getItem('lumina_settings') || '{}');
    if (Object.keys(settings).length === 0) {
      settings = {
        "agencyName": "Lumina Digital Agency",
        "websiteUrl": "https://lumina.digital",
        "supportEmail": "hello@lumina.digital",
        "phone": "+1 (555) 000-1234",
        "currency": "USD ($)",
        "timezone": "UTC+6 (Dhaka)",
        "maintenanceMode": false,
        "tagline": "Advanced Digital Infrastructure",
        "address": "100 Frost Avenue, Suite 400, Seattle, WA 98101",
        "language": "en",
        "googleAnalyticsId": "G-LUM774AB95",
        "facebookPixelId": "FB-9928172635",
        "googleTagManagerId": "GTM-KB8827S",
        "hubspotPortalId": "HS-28192837",
        "smtpHost": "smtp.lumina.digital",
        "smtpPort": "587",
        "smtpUser": "noreply@lumina.digital",
        "smtpPass": "••••••••",
        "smtpEncryption": "TLS",
        "socialLinkedin": "https://linkedin.com/company/lumina-digital",
        "socialTwitter": "https://twitter.com/lumina_digital",
        "socialDribbble": "https://dribbble.com/lumina_digital",
        "socialFacebook": "https://facebook.com/lumina_digital",
        "socialInstagram": "https://instagram.com/lumina_digital"
      };
      localStorage.setItem('lumina_settings', JSON.stringify(settings));
    }
    if (method === 'POST') {
      settings = { ...settings, ...body };
      localStorage.setItem('lumina_settings', JSON.stringify(settings));
      return { success: true, settings };
    }
    return settings;
  }

  if (endpoint.startsWith('/backups')) {
    let list = JSON.parse(localStorage.getItem('lumina_backups') || '[]');
    if (list.length === 0) {
      list = [
        { "id": "bk-1", "name": "Backup_2026-06-20_0400.zip", "size": "4.2 MB", "date": "Jun 20, 2026 04:00 AM" },
        { "id": "bk-2", "name": "Backup_2026-06-21_0400.zip", "size": "4.3 MB", "date": "Jun 21, 2026 04:00 AM" }
      ];
      localStorage.setItem('lumina_backups', JSON.stringify(list));
    }
    if (method === 'POST') {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const newB = {
        id: 'bk-' + Date.now(),
        name: `Backup_${new Date().toISOString().split('T')[0]}_${Math.floor(1000 + Math.random() * 9000)}.zip`,
        size: '4.4 MB',
        date: dateStr
      };
      list.push(newB);
      localStorage.setItem('lumina_backups', JSON.stringify(list));
      
      let logs = JSON.parse(localStorage.getItem('lumina_logs') || '[]');
      logs.push({
        id: 'log-' + Date.now(),
        level: 'INFO',
        message: `Manual backup triggered: Created file ${newB.name}`,
        timestamp: dateStr
      });
      localStorage.setItem('lumina_logs', JSON.stringify(logs));
      
      return { success: true, backup: newB };
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      list = list.filter(b => b.id !== id);
      localStorage.setItem('lumina_backups', JSON.stringify(list));
      return { success: true };
    }
    return list;
  }

  if (endpoint.startsWith('/cache/clear')) {
    if (method === 'POST') {
      let logs = JSON.parse(localStorage.getItem('lumina_logs') || '[]');
      logs.push({
        id: 'log-' + Date.now(),
        level: 'INFO',
        message: 'System cache cleared manually by admin',
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      localStorage.setItem('lumina_logs', JSON.stringify(logs));
      return { success: true, cacheSize: '0 KB' };
    }
  }

  if (endpoint.startsWith('/logs')) {
    let list = JSON.parse(localStorage.getItem('lumina_logs') || '[]');
    if (list.length === 0) {
      list = [
        { "id": "log-1", "level": "INFO", "message": "System started successfully. Environment: PRODUCTION (Local Mode)", "timestamp": "Jun 22, 2026 12:00:00 PM" },
        { "id": "log-2", "level": "INFO", "message": "Cron job completed successfully: Backup schedule run", "timestamp": "Jun 22, 2026 12:15:32 PM" }
      ];
      localStorage.setItem('lumina_logs', JSON.stringify(list));
    }
    if (method === 'DELETE') {
      localStorage.setItem('lumina_logs', '[]');
      return { success: true };
    }
    return list;
  }

  if (endpoint.startsWith('/sessions')) {
    let list = JSON.parse(localStorage.getItem('lumina_sessions') || '[]');
    if (list.length === 0) {
      list = [
        { "id": "sess-1", "device": "MacBook Pro - Chrome (Seattle, US)", "ip": "192.168.1.15", "current": true, "lastActive": "Just now" },
        { "id": "sess-2", "device": "iPhone 15 - Safari (Seattle, US)", "ip": "172.56.21.84", "current": false, "lastActive": "2 hours ago" }
      ];
      localStorage.setItem('lumina_sessions', JSON.stringify(list));
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      list = list.filter(s => s.id !== id);
      localStorage.setItem('lumina_sessions', JSON.stringify(list));
      return { success: true };
    }
    return list;
  }

  if (endpoint.startsWith('/apikeys')) {
    let list = JSON.parse(localStorage.getItem('lumina_apikeys') || '[]');
    if (list.length === 0) {
      list = [
        { "id": "key-1", "name": "Production Frontend", "prefix": "lum_live_92f3...", "created": "Jun 10, 2026", "status": "Active" },
        { "id": "key-2", "name": "Zapier Webhooks integration", "prefix": "lum_zap_2a8c...", "created": "Jun 12, 2026", "status": "Active" }
      ];
      localStorage.setItem('lumina_apikeys', JSON.stringify(list));
    }
    if (method === 'POST') {
      const randHex = Math.random().toString(16).substring(2, 6);
      const newK = {
        id: 'key-' + Date.now(),
        name: body.name || 'Unnamed API Key',
        prefix: `lum_${body.type || 'live'}_${randHex}...`,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Active'
      };
      list.push(newK);
      localStorage.setItem('lumina_apikeys', JSON.stringify(list));
      return { success: true, apiKey: newK };
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      list = list.filter(k => k.id !== id);
      localStorage.setItem('lumina_apikeys', JSON.stringify(list));
      return { success: true };
    }
    return list;
  }
  
  return null;
}

// Public API Operations
const LuminaAPI = {
  submitContactInquiry: async (data) => {
    return await apiRequest('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: 'contact' })
    });
  },

  submitConsultationRequest: async (data) => {
    return await apiRequest('/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company || '',
        phone: data.phone || '',
        service: data.service || 'Consultation',
        value: data.budget === 'enterprise' ? 45000 : data.budget === 'growth' ? 22000 : 8000,
        source: 'Consultation Form',
        notes: data.details || ''
      })
    });
  },

  subscribeNewsletter: async (email) => {
    return await apiRequest('/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  getTeam: async () => {
    return await apiRequest('/team');
  },

  getSettings: async () => {
    return await apiRequest('/settings');
  },

  saveSettings: async (data) => {
    return await apiRequest('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getContent: async () => {
    return await apiRequest('/content');
  },

  saveContent: async (data) => {
    return await apiRequest('/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  getBackups: async () => {
    return await apiRequest('/backups');
  },

  createBackup: async () => {
    return await apiRequest('/backups', {
      method: 'POST'
    });
  },

  deleteBackup: async (id) => {
    return await apiRequest(`/backups/${id}`, {
      method: 'DELETE'
    });
  },

  clearCache: async () => {
    return await apiRequest('/cache/clear', {
      method: 'POST'
    });
  },

  getLogs: async () => {
    return await apiRequest('/logs');
  },

  clearLogs: async () => {
    return await apiRequest('/logs', {
      method: 'DELETE'
    });
  },

  getSessions: async () => {
    return await apiRequest('/sessions');
  },

  deleteSession: async (id) => {
    return await apiRequest(`/sessions/${id}`, {
      method: 'DELETE'
    });
  },

  getApiKeys: async () => {
    return await apiRequest('/apikeys');
  },

  createApiKey: async (name, type) => {
    return await apiRequest('/apikeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
  },

  deleteApiKey: async (id) => {
    return await apiRequest(`/apikeys/${id}`, {
      method: 'DELETE'
    });
  }
};

// Export to window
window.LuminaAPI = LuminaAPI;
