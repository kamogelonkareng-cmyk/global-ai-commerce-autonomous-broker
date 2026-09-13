const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
let db;

function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.prepare(`CREATE TABLE IF NOT EXISTS apikeys (
    api_key TEXT PRIMARY KEY,
    owner TEXT,
    created_at INTEGER
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS usage (
    id TEXT PRIMARY KEY,
    api_key TEXT,
    prompt TEXT,
    usage_estimate REAL,
    created_at INTEGER
  )`).run();
}

function createApiKey(owner) {
  const key = uuidv4();
  const stmt = db.prepare('INSERT INTO apikeys(api_key, owner, created_at) VALUES (?, ?, ?)');
  stmt.run(key, owner, Date.now());
  return key;
}

function getApiKeyRow(key) {
  return db.prepare('SELECT * FROM apikeys WHERE api_key = ?').get(key);
}

function logUsage(apiKey, prompt, usageEstimate) {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO usage(id, api_key, prompt, usage_estimate, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, apiKey, prompt, usageEstimate || 0, Date.now());
}

function getUsageForKey(apiKey) {
  return db.prepare('SELECT id, prompt, usage_estimate, created_at FROM usage WHERE api_key = ? ORDER BY created_at DESC').all(apiKey);
}

module.exports = {
  initDB,
  createApiKey,
  getApiKeyRow,
  logUsage,
  getUsageForKey
};
