import os
import glob
import re

directory = 'c:/Users/USER/Desktop/Agency Website/admin'
files = glob.glob(os.path.join(directory, '*.html'))

new_content = """      <p class="nav-label">🤖 AI Automation</p>
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
      <p class="nav-label">System</p>"""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to replace from <p class="nav-label">AI Automation</p> up to <p class="nav-label">System</p>
    pattern = re.compile(r'<p\s+class="nav-label">\s*AI Automation\s*</p>.*?<p\s+class="nav-label">\s*System\s*</p>', re.DOTALL)
    
    if pattern.search(content):
        new_text = pattern.sub(new_content, content)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f"Updated {file}")
