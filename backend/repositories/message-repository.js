const BaseRepository = require('./base-repository');
const db = require('../database/db');

class MessageRepository extends BaseRepository {
  constructor() {
    super('messages');
  }

  async getChatMessages() {
    const dbData = db.readDb();
    return dbData.chatMessages || [];
  }

  async createChatMessage(msg) {
    const dbData = db.readDb();
    dbData.chatMessages = dbData.chatMessages || [];
    dbData.chatMessages.push(msg);
    db.writeDb(dbData);
    return msg;
  }

  async clearChatMessages() {
    const dbData = db.readDb();
    dbData.chatMessages = [];
    db.writeDb(dbData);
    return true;
  }

  async createNotification(notif) {
    const dbData = db.readDb();
    dbData.notifications = dbData.notifications || [];
    dbData.notifications.push(notif);
    db.writeDb(dbData);
    return notif;
  }

  async getNotifications() {
    const dbData = db.readDb();
    return dbData.notifications || [];
  }

  async markNotificationsRead(username) {
    const dbData = db.readDb();
    dbData.notifications = dbData.notifications || [];
    let updated = false;
    dbData.notifications.forEach(n => {
      if (n.username.toLowerCase() === username.toLowerCase()) {
        n.read = true;
        updated = true;
      }
    });
    if (updated) {
      db.writeDb(dbData);
    }
    return updated;
  }
}

module.exports = new MessageRepository();
