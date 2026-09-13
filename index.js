require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./src/db');
const openai = require('./src/connectors/openai');
const anthropic = require('./src/connectors/anthropic');
const apiKeyAuth = require('./src/auth/apiKeyAuth');
const stripeBilling = require('./src/billing/stripe');

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

// Dev-only: top up quota for an API key
app.post('/v1/topup', async (req, res) => {
  const secret = process.env.CREATE_API_KEY_SECRET;
  const provided = req.body.secret;
  if (!secret || provided !== secret) return res.status(403).json({error: 'forbidden'});
  const key = req.body.apiKey;
  const amount = parseInt(req.body.amount || '0', 10);
  if (!key || amount <= 0) return res.status(400).json({error: 'apiKey and positive amount required'});
  db.topUpQuota(key, amount);
  res.json({ok: true});
});

// Create a Stripe Checkout Session to purchase a subscription / quota.
app.post('/v1/create-checkout-session', async (req, res) => {
  try {
    const { apiKey, priceId } = req.body;
    if (!apiKey || !priceId) return res.status(400).json({ error: 'apiKey and priceId required' });
    const session = await stripeBilling.createCheckoutSession(apiKey, priceId, req.protocol + '://' + req.get('host'));
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'checkout_error' });
  }
});

// Stripe webhook endpoint (raw body required)
app.post('/v1/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await stripeBilling.handleWebhook(req, res);
  } catch (err) {
    console.error('stripe webhook error', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Proxy endpoint: requires x-api-key header
app.post('/v1/broker', apiKeyAuth, async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({error: 'prompt required'});

    // enforce subscription / quota
    const keyRow = db.getApiKeyRow(req.apiKey);
    if (!keyRow) return res.status(401).json({ error: 'invalid_api_key' });

    if (keyRow.subscription_status !== 'active') {
      return res.status(402).json({ error: 'subscription_inactive' });
    }

    const model = req.body.model || 'gpt-3.5-turbo';
    const supplier = req.body.supplier || 'openai';

    // forward to chosen connector
    let result;
    if (supplier === 'anthropic') {
      result = await anthropic.complete(prompt, model);
    } else {
      result = await openai.complete(prompt, model);
    }

    // crude token/usage estimate: length of prompt + response
    const usageEstimate = Math.max(1, Math.round((prompt.length + (result ? result.length : 0)) / 4)); // rough tokens

    // check quota
    if (typeof keyRow.quota_remaining === 'number' && keyRow.quota_remaining - usageEstimate < 0) {
      return res.status(429).json({ error: 'quota_exceeded' });
    }

    db.logUsage(req.apiKey, prompt, usageEstimate);
    db.consumeQuota(req.apiKey, usageEstimate);

    res.json({reply: result, usageEstimate});
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

// ADMIN dashboard (very small HTML) protected by ADMIN_SECRET env var
app.get('/admin/apis', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers['x-admin-secret'] || req.query.admin_secret;
  if (!adminSecret || provided !== adminSecret) return res.status(403).send('forbidden');
  const keys = db.getAllApiKeys();
  res.json({ apiKeys: keys });
});

app.get('/admin/usage/:apiKey', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.headers['x-admin-secret'] || req.query.admin_secret;
  if (!adminSecret || provided !== adminSecret) return res.status(403).send('forbidden');
  const usage = db.getUsageForKey(req.params.apiKey);
  res.json({ usage });
});

app.listen(PORT, () => {
  console.log(`Broker listening on port ${PORT}`);
});
