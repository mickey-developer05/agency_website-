const BaseRepository = require('./base-repository');

class CrmRepository extends BaseRepository {
  constructor() {
    super('crm');
  }
}

module.exports = new CrmRepository();
