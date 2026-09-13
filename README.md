# Global AI Commerce Autonomous Broker

This repo is an MVP "broker" that forwards prompts to AI suppliers (OpenAI and stubs for Anthropic), meters usage per API key, and integrates with Stripe to gate access by subscription.

What's new (v0.2)
- Stripe integration: create checkout sessions and handle webhooks to activate subscriptions and top up quota.
- Per-API-key quota enforcement: requests consume quota and will be rejected when exhausted.
- Admin endpoints to list API keys and review usage (protected by ADMIN_SECRET).
- Anthropic connector stub (replace with real implementation if you have an API key).

Quick start
1. Copy .env.example to .env and set:
   - OPENAI_API_KEY
   - CREATE_API_KEY_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET (configure webhook URL in your Stripe dashboard to /v1/stripe-webhook)
   - ADMIN_SECRET

2. Install & start

```bash
npm install
npm start
```

3. Create an API key (dev)

```bash
curl -X POST http://localhost:3000/v1/create-apikey \
  -H "Content-Type: application/json" \
  -d '{"owner":"you@example.com","secret":"<CREATE_API_KEY_SECRET>"}'
```

4. Create a Stripe Checkout session (replace priceId with your price)

```bash
curl -X POST http://localhost:3000/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"<YOUR_KEY>","priceId":"price_XXXXX"}'
```

5. Use the broker

```bash
curl -X POST http://localhost:3000/v1/broker \
  -H "Content-Type: application/json" \
  -H "x-api-key: <YOUR_KEY>" \
  -d '{"prompt":"Sell my product in one paragraph."}'
```

Security notes
- The create-apikey and topup endpoints are dev-only and require CREATE_API_KEY_SECRET. Remove or replace with an admin UI / OAuth in production.
- Keep STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY private.
- Migrate to Postgres for production and add proper admin authentication and rate limiting.
