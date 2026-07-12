const BaseRepository = require('./base-repository');

class FileRepository extends BaseRepository {
  constructor() {
    super('files');
  }
}

module.exports = new FileRepository();
