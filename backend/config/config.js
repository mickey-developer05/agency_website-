const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  LUMINA_AUTH_SECRET: process.env.LUMINA_AUTH_SECRET || 'lumina-digital-auth-secret',
  DB_FILE: path.join(__dirname, '..', 'database', 'database.json'),
  ACCESS_TOKEN_TTL: 15 * 60,       // 15 minutes
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60 // 7 days
};
