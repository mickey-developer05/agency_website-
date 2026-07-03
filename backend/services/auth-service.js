const { sanitizeInput, isStrongPassword, createHash, verifyPassword, createSalt, createToken } = require('../utils/auth');
const { createSessionRecord, destroyAllSessionsForUser, validateRefreshToken, rotateSession, destroySession } = require('../utils/session-manager');
const { readDb, writeDb } = require('../database/db');

function ensureUsersDb(db) {
  db.authUsers = db.authUsers || [];
  db.clients = db.clients || [];
  db.activityLog = db.activityLog || [];
  return db;
}

function createUserRecord(user) {
  const db = ensureUsersDb(readDb());
  const salt = createSalt();
  const passwordHash = createHash(user.password, salt);
  const normalizedEmail = user.email.toLowerCase();
  const userRecord = {
    id: `user_${Date.now()}`,
    fullName: sanitizeInput(user.fullName),
    companyName: sanitizeInput(user.companyName),
    email: normalizedEmail,
    passwordHash,
    salt,
    role: 'client',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.authUsers.push(userRecord);
  db.clients.push({
    id: userRecord.id,
    username: normalizedEmail,
    passwordHash,
    company: sanitizeInput(user.companyName),
    name: sanitizeInput(user.fullName),
    email: normalizedEmail,
    avatar: '',
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'active',
    role: 'client'
  });
  writeDb(db);
  return userRecord;
}

function findUserByEmail(email) {
  const db = ensureUsersDb(readDb());
  return db.authUsers.find((item) => item.email.toLowerCase() === String(email || '').toLowerCase());
}

function findUserById(userId) {
  const db = ensureUsersDb(readDb());
  return db.authUsers.find((item) => item.id === userId);
}

function registerClient({ fullName, companyName, email, password, confirmPassword }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!fullName || !companyName || !normalizedEmail || !password || !confirmPassword) {
    return { error: 'All fields are required.', status: 400 };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', status: 400 };
  }
  if (!isStrongPassword(password)) {
    return { error: 'Use at least 10 characters, including uppercase, a number, and a symbol.', status: 400 };
  }
  if (findUserByEmail(normalizedEmail)) {
    return { error: 'This email is already registered.', status: 409 };
  }
  const user = createUserRecord({ fullName, companyName, email: normalizedEmail, password });
  return { user, status: 201 };
}

function authenticateClient({ email, password }) {
  const db = ensureUsersDb(readDb());
  const searchKey = String(email || '').trim().toLowerCase();
  
  // Find client by username or email
  const client = (db.clients || []).find(c => 
    (c.username && c.username.toLowerCase() === searchKey) || 
    (c.email && c.email.toLowerCase() === searchKey)
  );
  
  if (!client) {
    return { error: 'Invalid credentials.', status: 401 };
  }
  
  const user = db.authUsers.find(u => u.id === client.id && u.role === 'client');
  if (!user) {
    return { error: 'Invalid credentials.', status: 401 };
  }
  
  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) return { error: 'Invalid credentials.', status: 401 };
  return { user, status: 200 };
}

function authenticateAdmin({ username, password }) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (normalizedUsername === 'admin' && password === 'admin123') {
    const user = { id: 'admin', email: 'admin@luminadigital.com', fullName: 'Lumina Admin', companyName: 'Lumina Digital Agency', role: 'admin' };
    return { user, status: 200 };
  }
  return { error: 'Invalid admin credentials.', status: 401 };
}

function createResetToken(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const db = ensureUsersDb(readDb());
  const user = db.authUsers.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) return null;
  const token = createToken({ sub: user.id, type: 'reset', exp: Math.floor(Date.now() / 1000) + 1800 });
  user.resetToken = token;
  user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  writeDb(db);
  return { token, user };
}

function resetPassword(token, newPassword) {
  const payload = require('../utils/auth').verifyToken(token);
  if (!payload || payload.type !== 'reset') return { error: 'Invalid or expired reset token.', status: 400 };
  const db = ensureUsersDb(readDb());
  const user = db.authUsers.find((item) => item.id === payload.sub);
  if (!user || user.resetToken !== token) return { error: 'Invalid or expired reset token.', status: 400 };
  if (!isStrongPassword(newPassword)) {
    return { error: 'Use at least 10 characters, including uppercase, a number, and a symbol.', status: 400 };
  }
  const salt = createSalt();
  user.passwordHash = createHash(newPassword, salt);
  user.salt = salt;
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  user.updatedAt = new Date().toISOString();
  const client = db.clients.find((item) => item.email === user.email);
  if (client) {
    client.passwordHash = user.passwordHash;
  }
  writeDb(db);
  return { success: true };
}

function finishAuth(user, role, req, csrfToken) {
  const { session, accessToken, refreshToken } = createSessionRecord({ userId: user.id, role, req, user });
  return { session, accessToken, refreshToken, csrfToken };
}

function logoutSession(sessionId) {
  return destroySession(sessionId);
}

function logoutAll(userId) {
  destroyAllSessionsForUser(userId);
}

function refreshSession(token, req, user) {
  const payload = validateRefreshToken(token);
  if (!payload) return { error: 'Session expired.', status: 401 };
  const rotated = rotateSession(payload.sessionId, req, user);
  if (!rotated) return { error: 'Session expired.', status: 401 };
  return { session: rotated.session, accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
}

function migrateLegacyClients() {
  const db = ensureUsersDb(readDb());
  let migratedCount = 0;
  
  db.clients.forEach(client => {
    let authUser = db.authUsers.find(u => u.id === client.id || u.email.toLowerCase() === client.email.toLowerCase());
    
    if (!authUser) {
      const plainPassword = client.password || 'Password123!';
      const salt = createSalt();
      const passwordHash = createHash(plainPassword, salt);
      
      authUser = {
        id: client.id || `user_${Date.now()}`,
        fullName: client.name || 'Client',
        companyName: client.company || 'Lumina Client',
        email: client.email.toLowerCase(),
        passwordHash,
        salt,
        role: client.role || 'client',
        status: client.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      client.id = authUser.id;
      db.authUsers.push(authUser);
      migratedCount++;
    }
    
    if (authUser) {
      client.passwordHash = authUser.passwordHash;
      delete client.password;
    }
  });
  
  if (migratedCount > 0) {
    writeDb(db);
    console.log(`[Migration] Migrated ${migratedCount} legacy clients to secure JWT system.`);
  }
}

module.exports = {
  registerClient,
  authenticateClient,
  authenticateAdmin,
  createResetToken,
  resetPassword,
  finishAuth,
  logoutSession,
  logoutAll,
  refreshSession,
  findUserByEmail,
  findUserById,
  migrateLegacyClients
};
