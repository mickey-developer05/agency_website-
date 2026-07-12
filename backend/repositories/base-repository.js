const db = require('../database/db');

class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async getAll() {
    return db.getCollection(this.collectionName);
  }

  async getById(id) {
    const items = await this.getAll();
    return items.find(item => item.id === id);
  }

  async create(data) {
    const items = await this.getAll();
    items.push(data);
    db.saveCollection(this.collectionName, items);
    return data;
  }

  async update(id, data) {
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      db.saveCollection(this.collectionName, items);
      return items[index];
    }
    return null;
  }

  async delete(id) {
    const items = await this.getAll();
    const initialLen = items.length;
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length < initialLen) {
      db.saveCollection(this.collectionName, filtered);
      return true;
    }
    return false;
  }
}

module.exports = BaseRepository;
