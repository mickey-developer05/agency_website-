const { sanitizeInput, isStrongPassword, createHash, verifyPassword, createSalt, createToken } = require('../utils/auth');
const { createSessionRecord, validateRefreshToken, rotateSession, destroySession } = require('../utils/session-manager');
const userRepository = require('../repositories/user-repository');
const sessionRepository = require('../repositories/session-repository');
const db = require('../database/db');
const logger = require('../utils/logger');

const adminAttempts = new Map();
const adminLockUntil = new Map();

function ensureUsersDb(dbData) {
  dbData.authUsers = dbData.authUsers || [];
  dbData.clients = dbData.clients || [];
  dbData.activityLog = dbData.activityLog || [];
  return dbData;
}

async function createUserRecord(user) {
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
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await userRepository.create(userRecord);

  // Sync with clients array
  const dbData = ensureUsersDb(db.readDb());
  dbData.clients.push({
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
  db.writeDb(dbData);

  return userRecord;
}

async function findUserByEmail(email) {
  return userRepository.getByEmail(email);
}

async function findUserById(userId) {
  return userRepository.getById(userId);
}

async function registerClient({ fullName, companyName, email, password, confirmPassword }) {
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
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return { error: 'This email is already registered.', status: 409 };
  }
  const user = await createUserRecord({ fullName, companyName, email: normalizedEmail, password });
  logger.info(`New client registered: ${normalizedEmail}`);
  return { user, status: 201 };
}

async function authenticateClient({ email, password }) {
  const searchKey = String(email || '').trim().toLowerCase();
  
  const dbData = ensureUsersDb(db.readDb());
  const client = (dbData.clients || []).find(c => 
    (c.username && c.username.toLowerCase() === searchKey) || 
    (c.email && c.email.toLowerCase() === searchKey)
  );
  
  if (!client) {
    logger.warn(`Login attempt with non-existent client email: ${searchKey}`);
    return { error: 'Invalid credentials.', status: 401 };
  }
  
  const user = await findUserById(client.id);
  if (!user || user.role !== 'client') {
    logger.warn(`Login attempt with invalid user mapping for client: ${searchKey}`);
    return { error: 'Invalid credentials.', status: 401 };
  }

  // Check lockout
  if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
    logger.warn(`Locked out user login attempt: ${searchKey}`);
    return { error: 'Account temporarily locked out due to multiple failed attempts. Please try again in 15 minutes.', status: 423 };
  }
  
  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      user.loginAttempts = 0;
      logger.warn(`Account locked out due to brute force: ${searchKey}`);
      await userRepository.update(user.id, user);
      return { error: 'Account temporarily locked out due to multiple failed attempts. Please try again in 15 minutes.', status: 423 };
    }
    await userRepository.update(user.id, user);
    logger.warn(`Failed login attempt (${user.loginAttempts}/5) for client: ${searchKey}`);
    return { error: 'Invalid credentials.', status: 401 };
  }

  // Reset lockout
  user.loginAttempts = 0;
  user.lockUntil = null;
  await userRepository.update(user.id, user);
  
  logger.info(`Successful login for client: ${searchKey}`);
  return { user, status: 200 };
}

async function authenticateAdmin({ username, password }) {
  const normalizedUsername = String(username || '').trim().toLowerCase();

  // Check lockout
  if (adminLockUntil.has(normalizedUsername) && adminLockUntil.get(normalizedUsername) > Date.now()) {
    logger.warn(`Locked out admin login attempt: ${normalizedUsername}`);
    return { error: 'Account temporarily locked out due to multiple failed attempts. Please try again in 15 minutes.', status: 423 };
  }
  
  if (normalizedUsername === 'admin' && password === 'admin123') {
    adminAttempts.delete(normalizedUsername);
    adminLockUntil.delete(normalizedUsername);
    const user = { id: 'admin', email: 'admin@luminadigital.com', fullName: 'Lumina Admin', companyName: 'Lumina Digital Agency', role: 'admin' };
    logger.info(`Successful login for admin: ${normalizedUsername}`);
    return { user, status: 200 };
  }

  const attempts = (adminAttempts.get(normalizedUsername) || 0) + 1;
  adminAttempts.set(normalizedUsername, attempts);
  if (attempts >= 5) {
    adminLockUntil.set(normalizedUsername, Date.now() + 15 * 60 * 1000);
    adminAttempts.delete(normalizedUsername);
    logger.warn(`Admin account locked out due to brute force: ${normalizedUsername}`);
    return { error: 'Account temporarily locked out due to multiple failed attempts. Please try again in 15 minutes.', status: 423 };
  }

  logger.warn(`Failed login attempt (${attempts}/5) for admin: ${normalizedUsername}`);
  return { error: 'Invalid admin credentials.', status: 401 };
}

async function createResetToken(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) return null;
  const token = createToken({ sub: user.id, type: 'reset', exp: Math.floor(Date.now() / 1000) + 1800 });
  
  user.resetToken = token;
  user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await userRepository.update(user.id, user);
  return { token, user };
}

async function resetPassword(token, newPassword) {
  const payload = require('../utils/auth').verifyToken(token);
  if (!payload || payload.type !== 'reset') return { error: 'Invalid or expired reset token.', status: 400 };
  
  const user = await findUserById(payload.sub);
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
  await userRepository.update(user.id, user);

  // Sync clients collection
  const dbData = ensureUsersDb(db.readDb());
  const client = dbData.clients.find((item) => item.email === user.email);
  if (client) {
    client.passwordHash = user.passwordHash;
    db.writeDb(dbData);
  }
  
  return { success: true };
}

function finishAuth(user, role, req, csrfToken) {
  const { session, accessToken, refreshToken } = createSessionRecord({ userId: user.id, role, req, user });
  return { session, accessToken, refreshToken, csrfToken };
}

async function logoutSession(sessionId) {
  return destroySession(sessionId);
}

async function logoutAll(userId) {
  await sessionRepository.deactivateAllForUser(userId);
}

async function refreshSession(token, req, user) {
  const payload = validateRefreshToken(token);
  if (!payload) return { error: 'Session expired.', status: 401 };
  const rotated = rotateSession(payload.sessionId, req, user);
  if (!rotated) return { error: 'Session expired.', status: 401 };
  return { session: rotated.session, accessToken: rotated.accessToken, refreshToken: rotated.refreshToken };
}

function migrateLegacyClients() {
  const dbData = ensureUsersDb(db.readDb());
  let migratedCount = 0;
  
  dbData.clients.forEach(client => {
    let authUser = dbData.authUsers.find(u => u.id === client.id || u.email.toLowerCase() === client.email.toLowerCase());
    
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
      dbData.authUsers.push(authUser);
      migratedCount++;
    }
    
    if (authUser) {
      client.passwordHash = authUser.passwordHash;
      delete client.password;
    }
  });
  
  if (migratedCount > 0) {
    db.writeDb(dbData);
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
