const db = require('../db');

module.exports = function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'missing_api_key' });
  const row = db.getApiKeyRow(key);
  if (!row) return res.status(401).json({ error: 'invalid_api_key' });
  req.apiKey = key;
  req.apiKeyOwner = row.owner;
  next();
};
