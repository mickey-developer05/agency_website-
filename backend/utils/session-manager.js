const crypto = require('crypto');
const { createToken, verifyToken, parseCookies, serializeCookie, createFingerprint, clearCookie } = require('./auth');
const { readDb, writeDb } = require('../database/db');
const { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, LUMINA_AUTH_SECRET } = require('../config/config');

function ensureSessionStore(db) {
  db.authSessions = db.authSessions || [];
  db.authUsers = db.authUsers || [];
  return db;
}

function createSessionRecord({ userId, role = 'client', req, user }) {
  const db = ensureSessionStore(readDb());
  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = Math.floor(Date.now() / 1000);
  const accessToken = createToken({ sub: userId, role, sessionId, type: 'access', exp: now + ACCESS_TOKEN_TTL }, LUMINA_AUTH_SECRET);
  const refreshToken = createToken({ sub: userId, role, sessionId, type: 'refresh', exp: now + REFRESH_TOKEN_TTL }, LUMINA_AUTH_SECRET);
  const session = {
    id: sessionId,
    userId,
    role,
    accessToken,
    refreshToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL * 1000).toISOString(),
    refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
    userAgent: req.headers['user-agent'] || 'unknown',
    fingerprint: createFingerprint(req),
    active: true,
    user: user ? { id: user.id, email: user.email, fullName: user.fullName, companyName: user.companyName, role: user.role || role } : null
  };
  db.authSessions.push(session);
  writeDb(db);
  return { session, accessToken, refreshToken };
}

function getSessionById(sessionId) {
  const db = ensureSessionStore(readDb());
  return db.authSessions.find((item) => item.id === sessionId && item.active);
}

function validateAccessToken(token) {
  const payload = verifyToken(token, LUMINA_AUTH_SECRET);
  if (!payload) return null;
  if (payload.type !== 'access') return null;
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function validateRefreshToken(token) {
  const payload = verifyToken(token, LUMINA_AUTH_SECRET);
  if (!payload) return null;
  if (payload.type !== 'refresh') return null;
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function validateSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies.lumina_client_access || cookies.lumina_admin_access || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const payload = validateAccessToken(token);
  if (!payload) return null;
  const session = getSessionById(payload.sessionId);
  if (!session || !session.active) return null;
  return { session, payload };
}

function rotateSession(sessionId, req, user) {
  const db = ensureSessionStore(readDb());
  const session = db.authSessions.find((item) => item.id === sessionId && item.active);
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  const accessToken = createToken({ sub: session.userId, role: session.role, sessionId, type: 'access', exp: now + ACCESS_TOKEN_TTL }, LUMINA_AUTH_SECRET);
  const refreshToken = createToken({ sub: session.userId, role: session.role, sessionId, type: 'refresh', exp: now + REFRESH_TOKEN_TTL }, LUMINA_AUTH_SECRET);
  session.accessToken = accessToken;
  session.refreshToken = refreshToken;
  session.expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000).toISOString();
  session.refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString();
  session.fingerprint = createFingerprint(req);
  session.userAgent = req.headers['user-agent'] || 'unknown';
  session.user = user ? { id: user.id, email: user.email, fullName: user.fullName, companyName: user.companyName, role: user.role || session.role } : session.user;
  writeDb(db);
  return { session, accessToken, refreshToken };
}

function destroySession(sessionId) {
  const db = ensureSessionStore(readDb());
  const session = db.authSessions.find((item) => item.id === sessionId);
  if (session) {
    session.active = false;
    session.destroyedAt = new Date().toISOString();
    writeDb(db);
  }
  return session;
}

function destroyAllSessionsForUser(userId) {
  const db = ensureSessionStore(readDb());
  db.authSessions = (db.authSessions || []).map((item) => item.userId === userId ? { ...item, active: false, destroyedAt: new Date().toISOString() } : item);
  writeDb(db);
}

function getSessionCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    path: '/'
  };
}

function createCookieHeaders(accessToken, refreshToken, csrfToken, role = 'client') {
  const baseOptions = getSessionCookieOptions();
  return [
    serializeCookie(role === 'admin' ? 'lumina_admin_access' : 'lumina_client_access', accessToken, { ...baseOptions, maxAge: ACCESS_TOKEN_TTL }),
    serializeCookie(role === 'admin' ? 'lumina_admin_refresh' : 'lumina_client_refresh', refreshToken, { ...baseOptions, maxAge: REFRESH_TOKEN_TTL }),
    serializeCookie('lumina_csrf', csrfToken, { ...baseOptions, httpOnly: false, maxAge: ACCESS_TOKEN_TTL }), // CSRF MUST be httpOnly: false so javascript can read it
    serializeCookie(role === 'admin' ? 'lumina_admin_auth' : 'lumina_client_auth', 'true', { ...baseOptions, maxAge: ACCESS_TOKEN_TTL })
  ];
}

function clearCookieHeaders(role = 'client') {
  return [
    clearCookie(role === 'admin' ? 'lumina_admin_access' : 'lumina_client_access'),
    clearCookie(role === 'admin' ? 'lumina_admin_refresh' : 'lumina_client_refresh'),
    clearCookie('lumina_csrf'),
    clearCookie(role === 'admin' ? 'lumina_admin_auth' : 'lumina_client_auth'),
    clearCookie(role === 'admin' ? 'lumina_admin_user' : 'lumina_client_user')
  ];
}

module.exports = {
  createSessionRecord,
  validateSessionFromRequest,
  validateAccessToken,
  validateRefreshToken,
  rotateSession,
  destroySession,
  destroyAllSessionsForUser,
  createCookieHeaders,
  clearCookieHeaders,
  getSessionById,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL
};
