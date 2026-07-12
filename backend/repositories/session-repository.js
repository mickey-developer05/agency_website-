const BaseRepository = require('./base-repository');
const db = require('../database/db');

class SessionRepository extends BaseRepository {
  constructor() {
    super('authSessions');
  }

  async getActiveBySessionId(sessionId) {
    const sessions = await this.getAll();
    return sessions.find(s => s.id === sessionId && s.active);
  }

  async deactivateAllForUser(userId) {
    const sessions = await this.getAll();
    let updated = false;
    const nextSessions = sessions.map(s => {
      if (s.userId === userId && s.active) {
        updated = true;
        return { ...s, active: false, destroyedAt: new Date().toISOString() };
      }
      return s;
    });
    if (updated) {
      db.saveCollection(this.collectionName, nextSessions);
    }
    return updated;
  }
}

module.exports = new SessionRepository();
