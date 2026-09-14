# AI Autonomous Deal Broker - Deployment Guide

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js >= 16
- npm
- PayPal Developer Account
- OpenAI API Key

### Installation

```bash
git clone https://github.com/kamogelonkareng-cmyk/global-ai-commerce-autonomous-broker
cd global-ai-commerce-autonomous-broker
npm install
```

### Configuration

1. **Get PayPal Credentials:**
   - Go to https://developer.paypal.com/
   - Create an app in Sandbox (testing) or Live (production)
   - Copy Client ID and Secret

2. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/
   - Create an API key

3. **Create .env file:**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=sk-your-key
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret
ADMIN_SECRET=your_secret_admin_key
BASE_URL=http://localhost:3000  # Change for production
```

### Run Locally

```bash
npm run dev
# Server runs on http://localhost:3000
```

## 📦 Docker Deployment

### Build & Run with Docker

```bash
docker build -t ai-deal-broker .
docker run -p 3000:3000 --env-file .env ai-deal-broker
```

### Docker Compose

```bash
docker-compose up -d
```

## ☁️ Production Deployment (Heroku, Railway, Render)

### Heroku Example

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-deal-broker

# Set environment variables
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set PAYPAL_CLIENT_ID=...
heroku config:set PAYPAL_SECRET=...
heroku config:set ADMIN_SECRET=...
heroku config:set BASE_URL=https://your-deal-broker.herokuapp.com

# Deploy
git push heroku main
```

### Railway.app

1. Connect GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy (auto deploys on push)

### Render

1. Connect GitHub repo
2. Create Web Service
3. Set environment variables
4. Deploy

## 🔐 Production Checklist

- [ ] Use PayPal Live credentials (not Sandbox)
- [ ] Set strong `ADMIN_SECRET`
- [ ] Enable HTTPS (all platforms do this by default)
- [ ] Set `BASE_URL` to your production domain
- [ ] Monitor logs for errors
- [ ] Set up payment webhook handlers
- [ ] Regular database backups

## 📊 API Testing

### Create a Deal Proposal

```bash
curl -X POST http://localhost:3000/v1/deals/propose \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer123",
    "sellerId": "seller456",
    "description": "Logo design project",
    "estimatedAmount": 500,
    "buyerProfile": {"name": "Acme Corp"},
    "sellerProfile": {"name": "Designer Pro"}
  }'
```

### Get Commissions Summary

```bash
curl http://localhost:3000/v1/commissions/summary
```

### Admin Dashboard

```bash
curl -H "x-admin-secret: your_secret" \
  http://localhost:3000/admin/commissions
```

## 💡 How It Works

1. **Buyer & Seller submit deal** → `/v1/deals/propose`
2. **AI generates proposal** (price, terms, timeline)
3. **Parties negotiate** via `/v1/deals/:dealId/respond`
4. **AI mediates** (generates counter-proposals)
5. **Deal closes** → `/v1/deals/:dealId/close`
6. **PayPal payment initiated** for 3% commission
7. **Buyer approves payment** → `earnings credited`
8. **Monitor earnings** at `/v1/commissions/summary`

## 🛠️ Troubleshooting

**"PayPal credentials not configured"**
- Check `.env` file has `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET`

**"OpenAI API error"**
- Verify API key is valid
- Check quota/billing in OpenAI account

**Database locked error**
- Using SQLite for simplicity; consider PostgreSQL for production
- Restart server

## 📈 Scaling

As deals increase:
1. Switch from SQLite to PostgreSQL
2. Add message queue (Redis/Bull) for deal processing
3. Implement fraud detection
4. Add more AI models for negotiation
5. Implement rate limiting

## 💰 Revenue Model

- **Commission Rate:** 3% of each deal amount
- **Example:** $1000 deal = $30 commission
- Withdrawals via PayPal to your account

---

🚀 **You're live!** Start proposing deals and earning commission.
