const BaseRepository = require('./base-repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('authUsers');
  }

  async getByEmail(email) {
    const users = await this.getAll();
    return users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  }
}

module.exports = new UserRepository();
