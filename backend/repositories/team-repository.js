const BaseRepository = require('./base-repository');

class TeamRepository extends BaseRepository {
  constructor() {
    super('team');
  }
}

module.exports = new TeamRepository();
