const BaseRepository = require('./base-repository');
const db = require('../database/db');

class SettingRepository extends BaseRepository {
  constructor() {
    super('settings');
  }

  async getSettings() {
    const dbData = db.readDb();
    return dbData.settings || {};
  }

  async saveSettings(settings) {
    const dbData = db.readDb();
    dbData.settings = { ...dbData.settings, ...settings };
    db.writeDb(dbData);
    return dbData.settings;
  }

  async getWebsiteContent() {
    const dbData = db.readDb();
    return dbData.websiteContent || {};
  }

  async saveWebsiteContent(content) {
    const dbData = db.readDb();
    dbData.websiteContent = { ...dbData.websiteContent, ...content };
    db.writeDb(dbData);
    return dbData.websiteContent;
  }
}

module.exports = new SettingRepository();
