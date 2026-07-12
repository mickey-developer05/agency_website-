const BaseRepository = require('./base-repository');

class InvoiceRepository extends BaseRepository {
  constructor() {
    super('invoices');
  }
}

module.exports = new InvoiceRepository();
