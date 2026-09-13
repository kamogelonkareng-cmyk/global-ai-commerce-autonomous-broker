require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./src/db');
const openai = require('./src/connectors/openai');
const apiKeyAuth = require('./src/auth/apiKeyAuth');

const PORT = process.env.PORT || 3000;

db.initDB();

const app = express();
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({status: 'ok'}));

// Dev-only: create an API key for an owner. Protect with CREATE_API_KEY_SECRET env var.
app.post('/v1/create-apikey', async (req, res) => {
  const secret = process.env.CREATE_API_KEY_SECRET;
  const provided = req.body.secret;
  if (!secret || provided !== secret) return res.status(403).json({error: 'forbidden'});
  const owner = req.body.owner || 'unknown';
  const key = db.createApiKey(owner);
  res.json({apiKey: key});
});

// Proxy endpoint: requires x-api-key header
app.post('/v1/broker', apiKeyAuth, async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({error: 'prompt required'});

    const model = req.body.model || 'gpt-3.5-turbo';
    const result = await openai.complete(prompt, model);

    // crude token/usage estimate: length of prompt + response
    const usageEstimate = (prompt.length + (result ? result.length : 0)) / 4; // rough

    db.logUsage(req.apiKey, prompt, usageEstimate);

    res.json({reply: result});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'broker_error'});
  }
});

// View usage for the calling API key (dev/admin)
app.get('/v1/usage', apiKeyAuth, (req, res) => {
  const rows = db.getUsageForKey(req.apiKey);
  res.json({usage: rows});
});

app.listen(PORT, () => {
  console.log(`Broker listening on port ${PORT}`);
});
