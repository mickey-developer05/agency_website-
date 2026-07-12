const { readDb, writeDb } = require('../database/db');

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const requestId = meta.requestId || 'system';
  
  // Format log entry
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    ...meta
  };
  
  // Console logging
  const formattedMsg = `[${timestamp}] [${level}] [Req: ${requestId}] ${message}`;
  if (level === 'ERROR') {
    console.error(formattedMsg, meta.error || '');
  } else if (level === 'WARN') {
    console.warn(formattedMsg);
  } else if (level === 'DEBUG') {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formattedMsg);
    }
  } else {
    console.log(formattedMsg);
  }

  // Save info/warn/error logs in db.systemLogs for admin dashboard
  if (level !== 'DEBUG') {
    try {
      const db = readDb();
      db.systemLogs = db.systemLogs || [];
      db.systemLogs.push({
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        level,
        message: `${message}${meta.error ? ' : ' + meta.error.message : ''}`,
        timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        requestId
      });
      // Keep last 1000 logs to prevent memory/file bloat
      if (db.systemLogs.length > 1000) {
        db.systemLogs = db.systemLogs.slice(-1000);
      }
      writeDb(db);
    } catch (err) {
      console.error('Failed to write system log to database:', err);
    }
  }
}

module.exports = {
  info: (message, meta) => log('INFO', message, meta),
  warn: (message, meta) => log('WARN', message, meta),
  error: (message, meta) => log('ERROR', message, meta),
  debug: (message, meta) => log('DEBUG', message, meta),
  log
};
