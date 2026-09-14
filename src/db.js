const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
let db;

function initDB() {
  try {
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

    // Create index for faster queries
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_usage_api_key ON usage(api_key)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_apikeys_owner ON apikeys(owner)`).run();

    console.log('✓ Database initialized successfully');
  } catch (err) {
    console.error('✗ Database initialization failed:', err);
    throw err;
  }
}

function createApiKey(owner) {
  try {
    const key = uuidv4();
    const stmt = db.prepare('INSERT INTO apikeys(api_key, owner, created_at, subscription_status, quota_limit, quota_remaining) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(key, owner, Date.now(), 'inactive', 10000, 10000);
    return key;
  } catch (err) {
    console.error('Error creating API key:', err);
    throw err;
  }
}

function getApiKeyRow(key) {
  try {
    return db.prepare('SELECT * FROM apikeys WHERE api_key = ?').get(key);
  } catch (err) {
    console.error('Error fetching API key:', err);
    throw err;
  }
}

function logUsage(apiKey, prompt, usageEstimate) {
  try {
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO usage(id, api_key, prompt, usage_estimate, created_at) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, apiKey, prompt, usageEstimate || 0, Date.now());
  } catch (err) {
    console.error('Error logging usage:', err);
    throw err;
  }
}

function getUsageForKey(apiKey) {
  try {
    return db.prepare('SELECT id, prompt, usage_estimate, created_at FROM usage WHERE api_key = ? ORDER BY created_at DESC LIMIT 100').all(apiKey);
  } catch (err) {
    console.error('Error fetching usage:', err);
    throw err;
  }
}

function getAllApiKeys() {
  try {
    return db.prepare('SELECT api_key, owner, created_at, subscription_status, quota_limit, quota_remaining FROM apikeys ORDER BY created_at DESC').all();
  } catch (err) {
    console.error('Error fetching all API keys:', err);
    throw err;
  }
}

function setStripeCustomerId(apiKey, customerId) {
  try {
    return db.prepare('UPDATE apikeys SET stripe_customer_id = ? WHERE api_key = ?').run(customerId, apiKey);
  } catch (err) {
    console.error('Error setting Stripe customer ID:', err);
    throw err;
  }
}

function setSubscriptionStatus(apiKey, status) {
  try {
    return db.prepare('UPDATE apikeys SET subscription_status = ? WHERE api_key = ?').run(status, apiKey);
  } catch (err) {
    console.error('Error setting subscription status:', err);
    throw err;
  }
}

function topUpQuota(apiKey, amount) {
  try {
    const row = getApiKeyRow(apiKey);
    if (!row) return null;
    const newRemaining = (row.quota_remaining || 0) + amount;
    return db.prepare('UPDATE apikeys SET quota_remaining = ? WHERE api_key = ?').run(newRemaining, apiKey);
  } catch (err) {
    console.error('Error topping up quota:', err);
    throw err;
  }
}

function consumeQuota(apiKey, amount) {
  try {
    const row = getApiKeyRow(apiKey);
    if (!row) return null;
    const remaining = (row.quota_remaining || 0) - amount;
    const newRemaining = Math.max(0, remaining);
    return db.prepare('UPDATE apikeys SET quota_remaining = ? WHERE api_key = ?').run(newRemaining, apiKey);
  } catch (err) {
    console.error('Error consuming quota:', err);
    throw err;
  }
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
