import os
import re

dashboard_path = 'c:/Users/USER/Desktop/Agency Website/admin/dashboard.html'
with open(dashboard_path, 'r', encoding='utf-8') as f:
    template = f.read()

# We need to replace everything inside <div class="page-content">...</div>
# First, let's extract the part before <div class="page-content"> and the part after </main>
# Looking at dashboard.html, it ends with:
#   </main>
# </body>
# </html>
# We can just split on <div class="page-content">

split1 = template.split('<div class="page-content">')
prefix = split1[0] + '<div class="page-content">\n'

# Find the end of </main> in split1[1]
split2 = split1[1].split('</main>')
suffix = '  </main>' + split2[1]

def create_page(filename, title, content_html, icon):
    # Set the active class on the sidebar nav-link
    # Remove active class from nav-dashboard if it's there
    page_template = prefix
    
    # We need to make sure the right nav link has the active styling if they use it.
    # Looking at the HTML, there might not be an explicit .active class on the nav elements, they rely on JS or CSS.
    
    # Replace the topbar breadcrumb
    bc_old = '<span class="bc-item text-primary font-semibold">Overview</span>'
    bc_new = f'<span class="bc-item text-primary font-semibold">{title}</span>'
    page_template = page_template.replace(bc_old, bc_new)
    
    # Replace document title
    title_old = '<title>Dashboard — Lumina Admin</title>'
    title_new = f'<title>{title} — AI Automation Hub</title>'
    page_template = page_template.replace(title_old, title_new)
    
    header = f"""
      <div class="page-header">
        <div>
          <h2 class="page-title">{title}</h2>
          <p class="page-subtitle">AI Automation Hub module.</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-primary"><span class="material-symbols-outlined text-sm">{icon}</span> Actions</button>
        </div>
      </div>
    """
    
    full_content = page_template + header + content_html + '\n    </div>\n' + suffix
    
    out_path = os.path.join('c:/Users/USER/Desktop/Agency Website/admin', filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(full_content)
    print(f"Created {filename}")

pages = [
    {
        "file": "ai-dashboard.html",
        "title": "AI Dashboard",
        "icon": "dashboard",
        "content": """
      <div class="stats-grid" id="ai-stats-grid">
        <div class="stat-card" style="--accent:#7dd3fc">
          <div class="stat-top">
            <div>
              <p class="stat-label">Total AI Requests</p>
              <h3 class="stat-value" id="stat-requests">...</h3>
            </div>
            <div class="stat-icon" style="background:rgba(125,211,252,0.1);border-color:rgba(125,211,252,0.2)">
              <span class="material-symbols-outlined text-primary">analytics</span>
            </div>
          </div>
        </div>
        <div class="stat-card" style="--accent:#c8a0f0">
          <div class="stat-top">
            <div>
              <p class="stat-label">Active Providers</p>
              <h3 class="stat-value" id="stat-providers">...</h3>
            </div>
            <div class="stat-icon" style="background:rgba(200,160,240,0.1);border-color:rgba(200,160,240,0.2)">
              <span class="material-symbols-outlined text-tertiary">hub</span>
            </div>
          </div>
        </div>
        <div class="stat-card" style="--accent:#88b4cc">
          <div class="stat-top">
            <div>
              <p class="stat-label">Generated Content</p>
              <h3 class="stat-value" id="stat-content">...</h3>
            </div>
            <div class="stat-icon" style="background:rgba(136,180,204,0.1);border-color:rgba(136,180,204,0.2)">
              <span class="material-symbols-outlined text-secondary">edit_document</span>
            </div>
          </div>
        </div>
        <div class="stat-card" style="--accent:#7dd3fc">
          <div class="stat-top">
            <div>
              <p class="stat-label">Meeting Summaries</p>
              <h3 class="stat-value" id="stat-meetings">...</h3>
            </div>
            <div class="stat-icon" style="background:rgba(125,211,252,0.1);border-color:rgba(125,211,252,0.2)">
              <span class="material-symbols-outlined text-primary">forum</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6 glass-card">
        <div class="card-header">
           <h3 class="card-title">Recent Generations</h3>
        </div>
        <div class="p-6 text-on-surface-variant text-sm">
           <p>No recent data available. Connect an API provider to start.</p>
        </div>
      </div>
      
      <script>
        fetch('/api/admin/ai/dashboard-stats').then(res => res.json()).then(data => {
            if(data.success) {
                document.getElementById('stat-requests').innerText = data.data.totalRequests || '0';
                document.getElementById('stat-providers').innerText = data.data.activeProviders || '0';
                document.getElementById('stat-content').innerText = data.data.generatedContent || '0';
                document.getElementById('stat-meetings').innerText = data.data.meetingSummaries || '0';
            }
        }).catch(e => console.error(e));
      </script>
        """
    },
    {
        "file": "ai-proposal-generator.html",
        "title": "AI Proposal Generator",
        "icon": "description",
        "content": """
        <div class="glass-card">
           <div class="p-6">
             <form id="proposal-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Client Name</label>
                 <input type="text" class="glass-input" placeholder="e.g. Acme Corp" />
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Project Details</label>
                 <textarea class="glass-input h-32" placeholder="Describe the project scope..."></textarea>
               </div>
               <button type="submit" class="btn-primary w-full">Generate Proposal</button>
             </form>
           </div>
        </div>
        
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Generated Proposal</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        
        <script>
           document.getElementById('proposal-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerHTML = 'Generating... <span class="material-symbols-outlined animate-spin text-sm">sync</span>';
               btn.disabled = true;
               
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Proposal Generator' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerHTML = 'Generate Proposal';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-api-connections.html",
        "title": "API Connections",
        "icon": "api",
        "content": """
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <!-- OpenAI -->
           <div class="glass-card">
              <div class="card-header flex justify-between items-center">
                 <h3 class="card-title">OpenAI</h3>
                 <span class="px-2 py-1 bg-surface-container-highest text-xs rounded border border-outline-variant">Not Configured</span>
              </div>
              <div class="p-6 space-y-4">
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">API Key</label>
                   <input type="password" class="glass-input" placeholder="sk-..." id="openai-key" />
                 </div>
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">Default Model</label>
                   <select class="glass-input" id="openai-model">
                     <option value="gpt-4">GPT-4</option>
                     <option value="gpt-4o">GPT-4o</option>
                     <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                   </select>
                 </div>
                 <div class="flex gap-2">
                    <button class="btn-primary flex-1 text-sm py-2" onclick="testConnection('OpenAI', 'openai-key')">Test Connection</button>
                    <button class="btn-outline flex-1 text-sm py-2" onclick="saveConnection('OpenAI', 'openai-key', 'openai-model')">Save</button>
                 </div>
              </div>
           </div>
           
           <!-- Anthropic Claude -->
           <div class="glass-card">
              <div class="card-header flex justify-between items-center">
                 <h3 class="card-title">Anthropic Claude</h3>
                 <span class="px-2 py-1 bg-surface-container-highest text-xs rounded border border-outline-variant">Not Configured</span>
              </div>
              <div class="p-6 space-y-4">
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">API Key</label>
                   <input type="password" class="glass-input" placeholder="sk-ant-..." id="anthropic-key" />
                 </div>
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">Default Model</label>
                   <select class="glass-input" id="anthropic-model">
                     <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                     <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                     <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                   </select>
                 </div>
                 <div class="flex gap-2">
                    <button class="btn-primary flex-1 text-sm py-2" onclick="testConnection('Anthropic', 'anthropic-key')">Test Connection</button>
                    <button class="btn-outline flex-1 text-sm py-2" onclick="saveConnection('Anthropic', 'anthropic-key', 'anthropic-model')">Save</button>
                 </div>
              </div>
           </div>
           
           <!-- Google Gemini -->
           <div class="glass-card">
              <div class="card-header flex justify-between items-center">
                 <h3 class="card-title">Google Gemini</h3>
                 <span class="px-2 py-1 bg-surface-container-highest text-xs rounded border border-outline-variant">Not Configured</span>
              </div>
              <div class="p-6 space-y-4">
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">API Key</label>
                   <input type="password" class="glass-input" placeholder="AIza..." id="gemini-key" />
                 </div>
                 <div>
                   <label class="block text-xs text-on-surface-variant mb-1">Default Model</label>
                   <select class="glass-input" id="gemini-model">
                     <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                     <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                   </select>
                 </div>
                 <div class="flex gap-2">
                    <button class="btn-primary flex-1 text-sm py-2" onclick="testConnection('Google Gemini', 'gemini-key')">Test Connection</button>
                    <button class="btn-outline flex-1 text-sm py-2" onclick="saveConnection('Google Gemini', 'gemini-key', 'gemini-model')">Save</button>
                 </div>
              </div>
           </div>
        </div>
        
        <script>
           function testConnection(provider, keyId) {
               const key = document.getElementById(keyId).value;
               fetch('/api/admin/ai/connections/test', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ provider, apiKey: key })
               }).then(res => res.json()).then(data => {
                   alert(data.message);
               });
           }
           function saveConnection(provider, keyId, modelId) {
               const key = document.getElementById(keyId).value;
               const model = document.getElementById(modelId).value;
               fetch('/api/admin/ai/connections', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ provider, apiKey: key, defaultModel: model, status: 'active' })
               }).then(res => res.json()).then(data => {
                   alert(provider + ' connection saved successfully!');
               });
           }
        </script>
        """
    },
    {
        "file": "ai-content-writer.html",
        "title": "AI Content Writer",
        "icon": "edit_document",
        "content": """
        <div class="glass-card p-6">
           <form id="content-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Topic / Subject</label>
                 <input type="text" class="glass-input" placeholder="What should the content be about?" />
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Content Type</label>
                 <select class="glass-input">
                    <option>Blog Post</option>
                    <option>Social Media Post</option>
                    <option>Website Copy</option>
                    <option>Newsletter</option>
                 </select>
               </div>
               <button type="submit" class="btn-primary w-full">Generate Content</button>
           </form>
        </div>
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Output</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        <script>
           document.getElementById('content-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerHTML = 'Generating... <span class="material-symbols-outlined animate-spin text-sm">sync</span>';
               btn.disabled = true;
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Content Writer' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerHTML = 'Generate Content';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-meeting-summary.html",
        "title": "Meeting Summary",
        "icon": "forum",
        "content": """
        <div class="glass-card p-6">
           <form id="meeting-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Meeting Transcript or Notes</label>
                 <textarea class="glass-input h-32" placeholder="Paste the raw transcript here..."></textarea>
               </div>
               <button type="submit" class="btn-primary w-full">Generate Summary & Action Items</button>
           </form>
        </div>
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Summary</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        <script>
           document.getElementById('meeting-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerText = 'Generating...';
               btn.disabled = true;
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Meeting Summary' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerText = 'Generate Summary & Action Items';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-client-onboarding.html",
        "title": "Client Onboarding Assistant",
        "icon": "person_add",
        "content": """
        <div class="glass-card p-6">
           <form id="onboarding-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Client Business Type</label>
                 <input type="text" class="glass-input" placeholder="e.g. Real Estate Agency" />
               </div>
               <button type="submit" class="btn-primary w-full">Generate Onboarding Questionnaire</button>
           </form>
        </div>
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Onboarding Kit</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        <script>
           document.getElementById('onboarding-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerText = 'Generating...';
               btn.disabled = true;
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Client Onboarding' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerText = 'Generate Onboarding Questionnaire';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-email-assistant.html",
        "title": "Email Assistant",
        "icon": "mail",
        "content": """
        <div class="glass-card p-6">
           <form id="email-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Email Objective</label>
                 <input type="text" class="glass-input" placeholder="e.g. Follow up on the previous proposal" />
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Tone</label>
                 <select class="glass-input">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Persuasive</option>
                 </select>
               </div>
               <button type="submit" class="btn-primary w-full">Draft Email</button>
           </form>
        </div>
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Draft</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        <script>
           document.getElementById('email-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerText = 'Generating...';
               btn.disabled = true;
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Email Assistant' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerText = 'Draft Email';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-google-calendar.html",
        "title": "Google Calendar AI",
        "icon": "event",
        "content": """
        <div class="glass-card p-6">
           <div class="text-center">
              <span class="material-symbols-outlined text-4xl text-primary mb-2">calendar_month</span>
              <h3 class="text-lg font-medium text-on-surface mb-2">Intelligent Scheduling</h3>
              <p class="text-on-surface-variant text-sm mb-6">Describe your schedule requirements and let AI find the perfect slot or draft invites.</p>
              <form id="cal-form" class="space-y-4 max-w-lg mx-auto text-left">
                  <textarea class="glass-input h-24" placeholder="e.g. Schedule a 30-min call with Marcus tomorrow afternoon..."></textarea>
                  <button type="submit" class="btn-primary w-full">Analyze & Schedule</button>
              </form>
           </div>
        </div>
        <div class="mt-6 glass-card" id="result-card" style="display:none;">
           <div class="card-header"><h3 class="card-title">Proposed Action</h3></div>
           <div class="p-6" id="result-content"></div>
        </div>
        <script>
           document.getElementById('cal-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const btn = this.querySelector('button');
               btn.innerText = 'Processing...';
               btn.disabled = true;
               fetch('/api/admin/ai/generate', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ feature: 'Google Calendar' })
               }).then(res => res.json()).then(data => {
                   document.getElementById('result-card').style.display = 'block';
                   document.getElementById('result-content').innerHTML = `<p class="text-on-surface">${data.data}</p>`;
                   btn.innerText = 'Analyze & Schedule';
                   btn.disabled = false;
               });
           });
        </script>
        """
    },
    {
        "file": "ai-prompt-library.html",
        "title": "Prompt Library",
        "icon": "library_books",
        "content": """
        <div class="glass-card">
           <div class="card-header flex justify-between items-center">
              <h3 class="card-title">Saved Prompts</h3>
              <button class="btn-primary text-sm py-1.5 px-3">Add Prompt</button>
           </div>
           <div class="table-container">
             <table class="data-table">
               <thead>
                 <tr>
                   <th>Title</th>
                   <th>Category</th>
                   <th>Date Added</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody id="prompts-body">
                 <tr><td colspan="4" class="text-center text-sm py-6 text-on-surface-variant">No prompts found. Create one to get started.</td></tr>
               </tbody>
             </table>
           </div>
        </div>
        <script>
           fetch('/api/admin/ai/prompts').then(res => res.json()).then(data => {
               if(data.success && data.data.length > 0) {
                   const tbody = document.getElementById('prompts-body');
                   tbody.innerHTML = '';
                   data.data.forEach(p => {
                       tbody.innerHTML += `<tr>
                         <td>${p.title}</td>
                         <td><span class="status-badge status-active">${p.category || 'Custom'}</span></td>
                         <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                         <td><button class="text-primary hover:underline text-xs">Edit</button></td>
                       </tr>`;
                   });
               }
           });
        </script>
        """
    },
    {
        "file": "ai-templates.html",
        "title": "AI Templates",
        "icon": "widgets",
        "content": """
        <div class="glass-card">
           <div class="card-header flex justify-between items-center">
              <h3 class="card-title">Manage Templates</h3>
              <button class="btn-primary text-sm py-1.5 px-3">Create Template</button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6" id="templates-grid">
               <div class="border border-outline-variant rounded-lg p-4 text-center">
                  <p class="text-sm text-on-surface-variant">No templates configured.</p>
               </div>
           </div>
        </div>
        <script>
           fetch('/api/admin/ai/templates').then(res => res.json()).then(data => {
               if(data.success && data.data.length > 0) {
                   const grid = document.getElementById('templates-grid');
                   grid.innerHTML = '';
                   data.data.forEach(t => {
                       grid.innerHTML += `<div class="border border-outline-variant rounded-lg p-4 bg-surface-container-highest">
                          <h4 class="font-medium text-on-surface mb-2">${t.name}</h4>
                          <p class="text-xs text-on-surface-variant mb-4">${t.description}</p>
                          <button class="btn-outline text-xs py-1 px-2 w-full">Edit Template</button>
                       </div>`;
                   });
               }
           });
        </script>
        """
    },
    {
        "file": "ai-knowledge-base.html",
        "title": "Knowledge Base",
        "icon": "menu_book",
        "content": """
        <div class="glass-card">
           <div class="card-header flex justify-between items-center">
              <h3 class="card-title">Company Knowledge Base</h3>
              <button class="btn-primary text-sm py-1.5 px-3">Upload Document</button>
           </div>
           <div class="p-6">
              <p class="text-sm text-on-surface-variant mb-4">Add company information, services, pricing, and policies to give the AI context about your agency.</p>
              <div class="border border-dashed border-outline-variant rounded-lg p-8 text-center bg-surface-container hover:bg-surface-container-high transition cursor-pointer">
                 <span class="material-symbols-outlined text-3xl text-on-surface-variant mb-2">cloud_upload</span>
                 <p class="text-sm text-on-surface">Click to upload or drag and drop</p>
                 <p class="text-xs text-on-surface-variant mt-1">PDF, DOCX, TXT (Max 10MB)</p>
              </div>
           </div>
           <div class="table-container border-t border-outline-variant">
             <table class="data-table">
               <thead>
                 <tr>
                   <th>Document Name</th>
                   <th>Type</th>
                   <th>Size</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody id="kb-body">
                 <tr><td colspan="4" class="text-center text-sm py-6 text-on-surface-variant">No knowledge base documents found.</td></tr>
               </tbody>
             </table>
           </div>
        </div>
        """
    },
    {
        "file": "ai-settings.html",
        "title": "AI Settings",
        "icon": "settings_suggest",
        "content": """
        <div class="glass-card p-6 max-w-2xl">
           <form id="settings-form" class="space-y-4">
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Global Default Model</label>
                 <select class="glass-input" id="set-model">
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                 </select>
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Temperature (0.0 to 1.0)</label>
                 <input type="number" step="0.1" min="0" max="1" class="glass-input" id="set-temp" value="0.7" />
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Max Tokens</label>
                 <input type="number" class="glass-input" id="set-tokens" value="2048" />
               </div>
               <div>
                 <label class="block text-sm font-medium text-on-surface mb-1">Brand Voice</label>
                 <textarea class="glass-input h-24" id="set-voice" placeholder="Describe the company's brand voice..."></textarea>
               </div>
               <button type="submit" class="btn-primary">Save Settings</button>
           </form>
        </div>
        <script>
           fetch('/api/admin/ai/settings').then(res => res.json()).then(data => {
               if(data.success && data.data) {
                   if(data.data.defaultModel) document.getElementById('set-model').value = data.data.defaultModel;
                   if(data.data.temperature) document.getElementById('set-temp').value = data.data.temperature;
                   if(data.data.maxTokens) document.getElementById('set-tokens').value = data.data.maxTokens;
                   if(data.data.brandVoice) document.getElementById('set-voice').value = data.data.brandVoice;
               }
           });
           document.getElementById('settings-form').addEventListener('submit', function(e) {
               e.preventDefault();
               const payload = {
                   defaultModel: document.getElementById('set-model').value,
                   temperature: document.getElementById('set-temp').value,
                   maxTokens: document.getElementById('set-tokens').value,
                   brandVoice: document.getElementById('set-voice').value
               };
               fetch('/api/admin/ai/settings', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify(payload)
               }).then(res => res.json()).then(data => {
                   alert('Settings saved successfully!');
               });
           });
        </script>
        """
    },
    {
        "file": "ai-usage-logs.html",
        "title": "Usage Logs",
        "icon": "receipt_long",
        "content": """
        <div class="glass-card">
           <div class="card-header flex justify-between items-center">
              <h3 class="card-title">Generation History & Logs</h3>
              <button class="btn-outline text-sm py-1.5 px-3">Export CSV</button>
           </div>
           <div class="table-container">
             <table class="data-table">
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Feature</th>
                   <th>Provider / Model</th>
                   <th>Tokens</th>
                   <th>Cost Est.</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody id="logs-body">
                 <tr><td colspan="6" class="text-center text-sm py-6 text-on-surface-variant">No usage logs available.</td></tr>
               </tbody>
             </table>
           </div>
        </div>
        <script>
           fetch('/api/admin/ai/usage-logs').then(res => res.json()).then(data => {
               if(data.success && data.data.length > 0) {
                   const tbody = document.getElementById('logs-body');
                   tbody.innerHTML = '';
                   data.data.reverse().forEach(log => {
                       tbody.innerHTML += `<tr>
                         <td class="text-xs text-on-surface-variant">${new Date(log.createdAt).toLocaleString()}</td>
                         <td>${log.feature}</td>
                         <td class="text-xs text-on-surface-variant">${log.provider}<br/>${log.model}</td>
                         <td>${log.tokens || 0}</td>
                         <td>$${log.estimatedCost || '0.00'}</td>
                         <td><span class="status-badge status-${log.status === 'success' ? 'active' : 'inactive'}">${log.status}</span></td>
                       </tr>`;
                   });
               }
           });
        </script>
        """
    }
]

for p in pages:
    create_page(p['file'], p['title'], p['content'], p['icon'])
