const path = require('path');
const fs = require('fs');

// Manual dotenv parser to support loading environment variables from .env file
const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const PORT = process.env.PORT || 3000;
const LUMINA_AUTH_SECRET = process.env.LUMINA_AUTH_SECRET;

// Security audit and validation
if (!LUMINA_AUTH_SECRET) {
  console.warn('[Security Warning] LUMINA_AUTH_SECRET is not configured. Falling back to development default.');
} else if (LUMINA_AUTH_SECRET === 'lumina-digital-auth-secret') {
  console.warn('[Security Warning] Default production secret detected. Please configure a unique secret in .env.');
}

module.exports = {
  PORT: Number(PORT),
  LUMINA_AUTH_SECRET: LUMINA_AUTH_SECRET || 'lumina-digital-auth-secret',
  DB_FILE: path.join(__dirname, '..', 'database', 'database.json'),
  ACCESS_TOKEN_TTL: 15 * 60,       // 15 minutes
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60 // 7 days
};
