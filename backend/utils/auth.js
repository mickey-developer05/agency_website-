const crypto = require('crypto');
const { LUMINA_AUTH_SECRET } = require('../config/config');

function base64Url(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(text).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createHash(password, salt) {
  const iterations = 120000;
  const keyLength = 64;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');
  return `${iterations}$${salt}$${derived.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const [iterations, salt, hash] = storedHash.split('$');
  if (!iterations || !salt || !hash) return false;
  const derived = crypto.pbkdf2Sync(password, salt, Number(iterations), 64, 'sha512');
  return crypto.timingSafeEqual(Buffer.from(derived.toString('hex'), 'hex'), Buffer.from(hash, 'hex'));
}

function createToken(payload, secret = LUMINA_AUTH_SECRET) {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' });
  const body = base64Url(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret = LUMINA_AUTH_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    try {
      return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    } catch (error) {
      return null;
    }
  }
  return null;
}

function sanitizeInput(input) {
  return String(input || '').trim().replace(/[<>]/g, '').slice(0, 200);
}

function isStrongPassword(password) {
  return password && password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName) {
      acc[rawName] = decodeURIComponent(rawValue.join('='));
    }
    return acc;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  return parts.join('; ');
}

function clearCookie(name) {
  return serializeCookie(name, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'Lax' });
}

function createFingerprint(req) {
  const forward = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forward) ? forward[0] : (forward || req.socket.remoteAddress || 'local');
  const userAgent = req.headers['user-agent'] || 'unknown';
  return `${ip}:${userAgent}`;
}

function createCsrfToken(sessionId) {
  return createToken({ sessionId, type: 'csrf' });
}

module.exports = {
  LUMINA_AUTH_SECRET,
  base64Url,
  createHash,
  verifyPassword,
  createToken,
  verifyToken,
  sanitizeInput,
  isStrongPassword,
  createSalt,
  parseCookies,
  serializeCookie,
  clearCookie,
  createFingerprint,
  createCsrfToken
};
