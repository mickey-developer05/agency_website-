const { validate } = require('../validators/validation');

function validateRequest(schemaName) {
  return function(req, res, next) {
    try {
      req.body = validate(schemaName, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validateRequest;
