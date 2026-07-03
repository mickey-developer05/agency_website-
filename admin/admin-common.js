/* Lumina Admin — Shared JS */

// ── Automated CSRF & Credentials Injector ──
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
      }
    }
    return originalFetch(url, options);
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
  s && s.classList.toggle('open');
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
  updateSidebarUnreadBadge();
  setInterval(updateSidebarUnreadBadge, 15000);
});
