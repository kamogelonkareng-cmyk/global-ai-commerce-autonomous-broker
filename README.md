# global-ai-commerce-autonomous-broker

An MVP broker that forwards prompts to AI suppliers and provides a minimal API key system and usage logging so you can start charging for access.

This repository now contains a minimal Express-based MVP that:
- Lets you create API keys (dev-only endpoint guarded by CREATE_API_KEY_SECRET)
- Accepts POST /v1/broker to forward a prompt to OpenAI and return the reply
- Logs usage to a local SQLite database (data.sqlite)

Why this helps you make money now
- You can issue API keys to customers and charge them externally (Stripe integration is next).
- The proxy lets you meter and inspect usage so you can bill per-request or per-token.

Next steps I recommend (I can implement any of these):
- Add Stripe integration to require active subscription before allowing requests
- Add rate limiting and quotas per API key
- Add multiple connectors (Anthropic, hosted model endpoints) and routing logic
- Add dashboard for creating keys, viewing usage and invoices
- Deploy to Vercel/Render/Heroku and connect a managed Postgres

Getting started (local)

1. Copy .env.example to .env and fill in OPENAI_API_KEY and CREATE_API_KEY_SECRET
2. Install deps and start:

```bash
npm install
npm start
```

3. Create an API key (dev):

```bash
curl -X POST http://localhost:3000/v1/create-apikey -H "Content-Type: application/json" -d '{"owner":"you@example.com","secret":"<CREATE_API_KEY_SECRET>"}'
```

4. Use your new key to call the broker:

```bash
curl -X POST http://localhost:3000/v1/broker -H "Content-Type: application/json" -H "x-api-key: <YOUR_KEY>" -d '{"prompt":"Say hello and sell my product."}'
```

License: MIT
