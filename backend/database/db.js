const fs = require('fs');
const { DB_FILE } = require('../config/config');

// Standardized read method
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Create empty db if missing
      fs.writeFileSync(DB_FILE, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading database file, returning empty:', err);
    return {};
  }
}

// Standardized write method
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to database:', err);
    return false;
  }
}

// Abstracted collections management helper
function getCollection(name) {
  const db = readDb();
  return db[name] || [];
}

function saveCollection(name, data) {
  const db = readDb();
  db[name] = data;
  return writeDb(db);
}

module.exports = {
  readDb,
  writeDb,
  getCollection,
  saveCollection
};
