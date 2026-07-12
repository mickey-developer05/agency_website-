const BaseRepository = require('./base-repository');

class BackupRepository extends BaseRepository {
  constructor() {
    super('backups');
  }
}

module.exports = new BackupRepository();
