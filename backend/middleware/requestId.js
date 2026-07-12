const crypto = require('crypto');

function requestId(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(16).substring(2, 6)}`;
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}

module.exports = requestId;
