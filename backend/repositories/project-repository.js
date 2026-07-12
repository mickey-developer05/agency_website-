const BaseRepository = require('./base-repository');

class ProjectRepository extends BaseRepository {
  constructor() {
    super('projects');
  }
}

module.exports = new ProjectRepository();
