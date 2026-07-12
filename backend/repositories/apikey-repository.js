const BaseRepository = require('./base-repository');

class ApiKeyRepository extends BaseRepository {
  constructor() {
    super('apiKeys');
  }
}

module.exports = new ApiKeyRepository();
