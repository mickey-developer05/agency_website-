const BaseRepository = require('./base-repository');

class LogRepository extends BaseRepository {
  constructor() {
    super('systemLogs');
  }
}

module.exports = new LogRepository();
