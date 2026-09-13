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
    created_at INTEGER,
    stripe_customer_id TEXT,
    subscription_status TEXT,
    quota_limit INTEGER DEFAULT 10000,
    quota_remaining INTEGER DEFAULT 10000
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
  const stmt = db.prepare('INSERT INTO apikeys(api_key, owner, created_at, subscription_status, quota_limit, quota_remaining) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(key, owner, Date.now(), 'inactive', 10000, 10000);
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

function getAllApiKeys() {
  return db.prepare('SELECT api_key, owner, created_at, subscription_status, quota_limit, quota_remaining FROM apikeys ORDER BY created_at DESC').all();
}

function setStripeCustomerId(apiKey, customerId) {
  return db.prepare('UPDATE apikeys SET stripe_customer_id = ? WHERE api_key = ?').run(customerId, apiKey);
}

function setSubscriptionStatus(apiKey, status) {
  return db.prepare('UPDATE apikeys SET subscription_status = ? WHERE api_key = ?').run(status, apiKey);
}

function topUpQuota(apiKey, amount) {
  const row = getApiKeyRow(apiKey);
  if (!row) return null;
  const newRemaining = (row.quota_remaining || 0) + amount;
  return db.prepare('UPDATE apikeys SET quota_remaining = ? WHERE api_key = ?').run(newRemaining, apiKey);
}

function consumeQuota(apiKey, amount) {
  const row = getApiKeyRow(apiKey);
  if (!row) return null;
  const remaining = (row.quota_remaining || 0) - amount;
  const newRemaining = Math.max(0, remaining);
  return db.prepare('UPDATE apikeys SET quota_remaining = ? WHERE api_key = ?').run(newRemaining, apiKey);
}

module.exports = {
  initDB,
  createApiKey,
  getApiKeyRow,
  logUsage,
  getUsageForKey,
  getAllApiKeys,
  setStripeCustomerId,
  setSubscriptionStatus,
  topUpQuota,
  consumeQuota
};
