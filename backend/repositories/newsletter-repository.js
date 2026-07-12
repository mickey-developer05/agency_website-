const BaseRepository = require('./base-repository');

class NewsletterRepository extends BaseRepository {
  constructor() {
    super('newsletter');
  }
}

module.exports = new NewsletterRepository();
