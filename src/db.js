const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'broker.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

function initDB() {
  // API Keys & Subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      key TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_status TEXT DEFAULT 'inactive',
      quota_remaining INTEGER DEFAULT 0
    );
  `);

  // Usage logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT NOT NULL,
      prompt TEXT,
      response TEXT,
      tokens_used INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key) REFERENCES api_keys(key)
    );
  `);

  // Deal tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      description TEXT,
      proposed_amount REAL,
      status TEXT DEFAULT 'pending',
      payment_id TEXT,
      payer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Commission tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      buyer_id TEXT,
      seller_id TEXT,
      deal_amount REAL,
      commission_amount REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (deal_id) REFERENCES deals(id)
    );
  `);

  // Deal negotiations
  db.exec(`
    CREATE TABLE IF NOT EXISTS deal_negotiations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id TEXT NOT NULL,
      party TEXT,
      message TEXT,
      ai_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id)
    );
  `);
}

// API Key functions
function createApiKey(owner) {
  const key = `sk-${uuidv4()}`;
  const stmt = db.prepare(`
    INSERT INTO api_keys (key, owner, subscription_status, quota_remaining)
    VALUES (?, ?, 'active', 1000)
  `);
  stmt.run(key, owner);
  return key;
}

function getApiKeyRow(key) {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE key = ?');
  return stmt.get(key);
}

function getAllApiKeys() {
  const stmt = db.prepare('SELECT key, owner, subscription_status, quota_remaining FROM api_keys');
  return stmt.all();
}

function topUpQuota(key, amount) {
  const stmt = db.prepare(`
    UPDATE api_keys SET quota_remaining = quota_remaining + ?
    WHERE key = ?
  `);
  stmt.run(amount, key);
}

function consumeQuota(key, amount) {
  const stmt = db.prepare(`
    UPDATE api_keys SET quota_remaining = quota_remaining - ?
    WHERE key = ?
  `);
  stmt.run(amount, key);
}

// Usage logging
function logUsage(apiKey, prompt, tokensUsed, response = null) {
  const stmt = db.prepare(`
    INSERT INTO usage_logs (api_key, prompt, response, tokens_used)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(apiKey, prompt, response, tokensUsed);
}

function getUsageForKey(apiKey) {
  const stmt = db.prepare(`
    SELECT prompt, response, tokens_used, timestamp FROM usage_logs
    WHERE api_key = ?
    ORDER BY timestamp DESC
    LIMIT 50
  `);
  return stmt.all(apiKey);
}

// Deal functions
function createDeal(buyerId, sellerId, description, proposedAmount) {
  const dealId = `deal-${uuidv4()}`;
  const stmt = db.prepare(`
    INSERT INTO deals (id, buyer_id, seller_id, description, proposed_amount, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `);
  stmt.run(dealId, buyerId, sellerId, description, proposedAmount);
  return dealId;
}

function getDeal(dealId) {
  const stmt = db.prepare('SELECT * FROM deals WHERE id = ?');
  return stmt.get(dealId);
}

function updateDealStatus(dealId, status, paymentId = null, payerId = null) {
  const stmt = db.prepare(`
    UPDATE deals SET status = ?, payment_id = ?, payer_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, paymentId, payerId, dealId);
}

function getAllDeals() {
  const stmt = db.prepare(`
    SELECT id, buyer_id, seller_id, description, proposed_amount, status, created_at
    FROM deals
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return stmt.all();
}

// Commission functions
function logDealCommission(dealId, buyerId, sellerId, dealAmount, commissionAmount, status = 'pending') {
  const stmt = db.prepare(`
    INSERT INTO commissions (deal_id, buyer_id, seller_id, deal_amount, commission_amount, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(dealId, buyerId, sellerId, dealAmount, commissionAmount, status);
}

function getCommissionsByDeal(dealId) {
  const stmt = db.prepare('SELECT * FROM commissions WHERE deal_id = ?');
  return stmt.all(dealId);
}

function getTotalCommissions() {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_deals,
      SUM(commission_amount) as total_commission,
      SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commission
    FROM commissions
  `);
  return stmt.get();
}

function updateCommissionStatus(dealId, status) {
  const stmt = db.prepare(`
    UPDATE commissions SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
    WHERE deal_id = ?
  `);
  stmt.run(status, status, dealId);
}

// Negotiation logging
function logNegotiation(dealId, party, message, aiResponse) {
  const stmt = db.prepare(`
    INSERT INTO deal_negotiations (deal_id, party, message, ai_response)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(dealId, party, message, aiResponse);
}

function getNegotiationHistory(dealId) {
  const stmt = db.prepare(`
    SELECT party, message, ai_response, created_at FROM deal_negotiations
    WHERE deal_id = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(dealId);
}

module.exports = {
  initDB,
  createApiKey,
  getApiKeyRow,
  getAllApiKeys,
  topUpQuota,
  consumeQuota,
  logUsage,
  getUsageForKey,
  createDeal,
  getDeal,
  updateDealStatus,
  getAllDeals,
  logDealCommission,
  getCommissionsByDeal,
  getTotalCommissions,
  updateCommissionStatus,
  logNegotiation,
  getNegotiationHistory,
};
