/* Lumina Admin — Shared JS */

// ── Automated CSRF, Credentials Injector & Response Unwrapper ──
(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    options.credentials = options.credentials || 'include';
    const method = (options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      options.headers = options.headers || {};
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [name, val] = c.trim().split('=');
        if (name) acc[name] = decodeURIComponent(val || '');
        return acc;
      }, {});
      const csrfToken = cookies['lumina_csrf'];
      if (csrfToken) {
        options.headers['X-CSRF-Token'] = csrfToken;
        options.headers['x-csrf-token'] = csrfToken;
      }
    }
    
    // Automatically retrieve CSRF token if we don't have one and this is not a csrf query itself
    if (!document.cookie.includes('lumina_csrf=') && !url.includes('/api/auth/csrf')) {
      try {
        await originalFetch('/api/auth/csrf');
      } catch (e) {
        console.warn('Auto-CSRF retrieval failed:', e);
      }
    }
    
    const response = await originalFetch(url, options);
    
    const originalJson = response.json;
    response.json = async function() {
      const json = await originalJson.call(response);
      if (json && typeof json === 'object' && 'success' in json && 'status' in json && 'data' in json) {
        const unwrapped = json.data;
        if (unwrapped !== null && unwrapped !== undefined && typeof unwrapped === 'object') {
          Object.defineProperties(unwrapped, {
            success: { value: json.success, enumerable: true },
            status: { value: json.status, enumerable: true },
            message: { value: json.message, enumerable: true },
            errors: { value: json.errors, enumerable: true },
            timestamp: { value: json.timestamp, enumerable: true },
            requestId: { value: json.requestId, enumerable: true }
          });
          if (!Array.isArray(unwrapped)) {
            Object.assign(unwrapped, {
              success: json.success,
              status: json.status,
              message: json.message,
              errors: json.errors,
              timestamp: json.timestamp,
              requestId: json.requestId
            });
          }
          return unwrapped;
        }
      }
      return json;
    };
    return response;
  };
})();


// ── Auth Guard ──
(function() {
  const isLoginPage = window.location.pathname.includes('/admin/index.html') || 
                      window.location.pathname.endsWith('/admin/') ||
                      window.location.pathname.endsWith('/admin');
  const hasSessionAuth = sessionStorage.getItem('lumina_admin_auth') === 'true';
  const hasCookieAuth = document.cookie.split(';').some(c => c.trim().startsWith('lumina_admin_auth=') || c.trim().startsWith('lumina_admin_access='));
  
  if (!isLoginPage && !hasSessionAuth && !hasCookieAuth) {
    window.location.href = 'index.html';
  }
  
  // Sync cookie auth to sessionStorage for consistency
  if (!isLoginPage && hasCookieAuth && !hasSessionAuth) {
    sessionStorage.setItem('lumina_admin_auth', 'true');
  }
})();

// ── Logout ──
async function adminLogout() {
  if (confirm('Are you sure you want to log out?')) {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('API logout failed, performing local logout.');
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

// ── Sidebar Toggle (mobile) ──
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  if (s) {
    s.classList.toggle('open');
    if (s.classList.contains('open')) {
      setTimeout(() => {
        const closeOnOutsideClick = (e) => {
          if (!s.contains(e.target) && !e.target.closest('button[onclick="toggleSidebar()"]')) {
            s.classList.remove('open');
            document.removeEventListener('click', closeOnOutsideClick);
          }
        };
        document.addEventListener('click', closeOnOutsideClick);
      }, 50);
    }
  }
}

// ── Set Active Nav ──
function setActiveNav(activeId) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

// ── Toast Notification ──
function showAdminToast(title, message, type = 'success') {
  let box = document.getElementById('admin-toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'admin-toast-box';
    box.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:320px;';
    document.body.appendChild(box);
  }
  const colors = {
    success: { border: 'rgba(74,222,128,0.3)', icon: '#4ade80', sym: 'check_circle' },
    error: { border: 'rgba(255,107,107,0.3)', icon: '#ff6b6b', sym: 'error' },
    info: { border: 'rgba(125,211,252,0.3)', icon: '#7dd3fc', sym: 'info' },
    warn: { border: 'rgba(251,191,36,0.3)', icon: '#fbbf24', sym: 'warning' }
  };
  const c = colors[type] || colors.info;
  const t = document.createElement('div');
  t.style.cssText = `background:rgba(15,21,36,0.95);backdrop-filter:blur(20px);border:1px solid ${c.border};border-radius:12px;padding:14px;display:flex;align-items:flex-start;gap:10px;transform:translateY(20px);opacity:0;transition:all 0.3s;box-shadow:0 8px 32px rgba(0,0,0,0.4);`;
  t.innerHTML = `<span class="material-symbols-outlined" style="color:${c.icon};font-size:20px">${c.sym}</span>
    <div style="flex:1"><div style="font-size:13px;font-weight:600;color:#e0e8f0">${title}</div>
    <div style="font-size:12px;color:#a0b4c4;margin-top:2px">${message}</div></div>
    <span class="material-symbols-outlined" style="color:#4a6070;cursor:pointer;font-size:16px" onclick="this.parentElement.remove()">close</span>`;
  box.appendChild(t);
  setTimeout(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; }, 10);
  setTimeout(() => {
    t.style.transform = 'translateY(20px)'; t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ── Confirm Modal ──
function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.7);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:rgba(15,21,36,0.95);border:1px solid rgba(125,211,252,0.15);border-radius:20px;padding:28px;max-width:360px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,0.5);">
    <h3 style="font-size:16px;font-weight:700;color:#e0e8f0;margin-bottom:8px">${title}</h3>
    <p style="font-size:13px;color:#a0b4c4;margin-bottom:20px">${message}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button id="confirm-cancel" style="padding:8px 16px;border-radius:8px;background:rgba(42,58,72,0.5);border:1px solid rgba(42,58,72,0.8);color:#a0b4c4;font-size:13px;cursor:pointer">Cancel</button>
      <button id="confirm-ok" style="padding:8px 16px;border-radius:8px;background:rgba(255,107,107,0.15);border:1px solid rgba(255,107,107,0.3);color:#ff6b6b;font-size:13px;font-weight:600;cursor:pointer">Confirm</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ── Global Chat Unread Badge Check ──
async function updateSidebarUnreadBadge() {
  const badge = document.getElementById('chat-unread-badge');
  if (!badge) return;
  try {
    const res = await fetch('/api/chat/messages');
    if (res.ok) {
      const msgs = await res.json();
      const clientMsgs = msgs.filter(m => m.isClient);
      const unreadCount = clientMsgs.length;
      if (unreadCount > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.warn('Failed to fetch unread chat count.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.children.length === 0) {
    sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon"><span class="material-symbols-outlined"
          style="font-variation-settings:'FILL' 1">bubble</span></div>
      <div>
        <div class="text-sm font-bold text-primary tracking-tight leading-tight">Lumina Admin</div>
        <div class="text-[10px] text-on-surface-variant">Management Suite</div>
      </div>
    </div>

    <button class="new-project-btn" onclick="window.location='projects.html'">
      <span class="material-symbols-outlined text-sm">add</span> New Project
    </button>

    <nav class="sidebar-nav">
      <p class="nav-label">Main</p>
      <a href="dashboard.html" class="nav-link" id="nav-dashboard">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">dashboard</span>
        <span>Dashboard</span>
      </a>
      <a href="projects.html" class="nav-link" id="nav-projects">
        <span class="material-symbols-outlined">folder_open</span>
        <span>Projects</span>
      </a>
      <a href="crm.html" class="nav-link" id="nav-crm">
        <span class="material-symbols-outlined">group_add</span>
        <span>CRM Leads</span>
      </a>
      <a href="invoices.html" class="nav-link" id="nav-invoices">
        <span class="material-symbols-outlined">receipt_long</span>
        <span>Invoices</span>
      </a>
      <a href="content.html" class="nav-link" id="nav-content">
        <span class="material-symbols-outlined">view_quilt</span>
        <span>Website Content</span>
      </a>
      <p class="nav-label">Management</p>
      <a href="team.html" class="nav-link" id="nav-team">
        <span class="material-symbols-outlined">badge</span>
        <span>Team</span>
      </a>
      <a href="media.html" class="nav-link" id="nav-media">
        <span class="material-symbols-outlined">photo_library</span>
        <span>Media Library</span>
      </a>
      <a href="inbox.html" class="nav-link" id="nav-inbox">
        <span class="material-symbols-outlined">mail</span>
        <span>Inbox</span>
      </a>
      <a href="client-workspace.html" class="nav-link" id="nav-client-workspace">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">forum</span>
        <span>Client Workspace</span>
        <span id="chat-unread-badge" style="display:none;background:#7dd3fc;color:#020617;font-size:10px;font-weight:700;padding:1px 6px;border-radius:9999px;margin-left:auto"></span>
      </a>
      <p class="nav-label">🤖 AI Automation</p>
      <a href="ai-dashboard.html" class="nav-link" id="nav-ai-dashboard">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Dashboard</span>
      </a>
      <a href="ai-proposal-generator.html" class="nav-link" id="nav-ai-proposal">
        <span class="material-symbols-outlined">description</span>
        <span>AI Proposal</span>
      </a>
      <a href="ai-content-writer.html" class="nav-link" id="nav-ai-content-writer">
        <span class="material-symbols-outlined">edit_document</span>
        <span>Content Writer</span>
      </a>
      <a href="ai-meeting-summary.html" class="nav-link" id="nav-ai-meeting">
        <span class="material-symbols-outlined">forum</span>
        <span>Meeting Summary</span>
      </a>
      <a href="ai-client-onboarding.html" class="nav-link" id="nav-ai-onboarding">
        <span class="material-symbols-outlined">person_add</span>
        <span>Client Onboarding</span>
      </a>
      <a href="ai-email-assistant.html" class="nav-link" id="nav-ai-email">
        <span class="material-symbols-outlined">mail</span>
        <span>Email Assistant</span>
      </a>
      <a href="ai-google-calendar.html" class="nav-link" id="nav-ai-calendar">
        <span class="material-symbols-outlined">event</span>
        <span>Google Calendar</span>
      </a>
      <a href="ai-prompt-library.html" class="nav-link" id="nav-ai-prompt">
        <span class="material-symbols-outlined">library_books</span>
        <span>Prompt Library</span>
      </a>
      <a href="ai-templates.html" class="nav-link" id="nav-ai-templates">
        <span class="material-symbols-outlined">widgets</span>
        <span>AI Templates</span>
      </a>
      <a href="ai-knowledge-base.html" class="nav-link" id="nav-ai-kb">
        <span class="material-symbols-outlined">menu_book</span>
        <span>Knowledge Base</span>
      </a>
      <a href="ai-settings.html" class="nav-link" id="nav-ai-settings">
        <span class="material-symbols-outlined">settings_suggest</span>
        <span>AI Settings</span>
      </a>
      <a href="ai-api-connections.html" class="nav-link" id="nav-ai-api">
        <span class="material-symbols-outlined">api</span>
        <span>API Connections</span>
      </a>
      <a href="ai-usage-logs.html" class="nav-link" id="nav-ai-logs">
        <span class="material-symbols-outlined">receipt_long</span>
        <span>Usage Logs</span>
      </a>
      <p class="nav-label">System</p>
      <a href="settings.html" class="nav-link" id="nav-settings">
        <span class="material-symbols-outlined">settings</span>
        <span>Settings</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <a href="#" class="nav-link text-sm">
        <span class="material-symbols-outlined text-sm">help</span>
        <span>Support</span>
      </a>
      <a href="#" class="nav-link text-sm text-error/70 hover:text-error hover:!bg-error/10" onclick="adminLogout()">
        <span class="material-symbols-outlined text-sm">logout</span>
        <span>Logout</span>
      </a>
    </div>
    `;
    
    // Auto-highlight active link
    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    const activeLink = sidebar.querySelector(`a[href="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  updateSidebarUnreadBadge();
  setInterval(updateSidebarUnreadBadge, 15000);

  // Auto-wrap all tables to make them responsive
  document.querySelectorAll('table').forEach(table => {
    if (!table.parentElement.classList.contains('table-container') && !table.closest('.inv-preview')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-container';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // ── Mobile: Inject hamburger button into admin topbar ──
  const topbar = document.querySelector('.admin-topbar');
  if (topbar && window.innerWidth <= 768) {
    const existingHamburger = topbar.querySelector('.admin-mobile-menu-btn');
    if (!existingHamburger) {
      const hamburgerBtn = document.createElement('button');
      hamburgerBtn.className = 'admin-mobile-menu-btn';
      hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
      hamburgerBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px">menu</span>';
      hamburgerBtn.addEventListener('click', toggleSidebar);
      topbar.insertBefore(hamburgerBtn, topbar.firstChild);
    }
  }

  // Also inject hamburger via resize listener
  function ensureAdminHamburger() {
    const topbar = document.querySelector('.admin-topbar');
    if (!topbar) return;
    const existing = topbar.querySelector('.admin-mobile-menu-btn');
    if (window.innerWidth <= 768 && !existing) {
      const btn = document.createElement('button');
      btn.className = 'admin-mobile-menu-btn';
      btn.setAttribute('aria-label', 'Open navigation menu');
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px">menu</span>';
      btn.addEventListener('click', toggleSidebar);
      topbar.insertBefore(btn, topbar.firstChild);
    } else if (window.innerWidth > 768 && existing) {
      existing.remove();
    }
  }
  window.addEventListener('resize', ensureAdminHamburger);
  ensureAdminHamburger();

  // ── Mobile: Create sidebar overlay ──
  if (!document.querySelector('.sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
    document.body.appendChild(overlay);
  }

  // Hook toggleSidebar to also show/hide overlay
  const origToggleSidebar = window.toggleSidebar;
  window.toggleSidebar = function() {
    origToggleSidebar();
    const overlay = document.querySelector('.sidebar-overlay');
    const sidebar = document.getElementById('sidebar');
    if (overlay && sidebar) {
      overlay.classList.toggle('visible', sidebar.classList.contains('open'));
    }
  };
});
