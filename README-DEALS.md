# 🤖 AI Autonomous Deal Broker

> An intelligent AI agent that autonomously negotiates and closes deals between buyers and sellers, earning 3% commission per transaction via PayPal.

## Features

✅ **AI-Powered Deal Negotiation** - GPT-3.5 generates proposals and mediates negotiations  
✅ **Autonomous Operation** - Broker acts as middleman between parties  
✅ **3% Commission Tracking** - Automatic commission calculation per deal  
✅ **PayPal Integration** - Direct payment processing and earnings  
✅ **Deal Management API** - RESTful endpoints for deal lifecycle  
✅ **Negotiation History** - Full audit trail of all negotiations  
✅ **Real-time Earnings** - Track commissions in real-time  

## Quick Start

### 1. Setup

```bash
npm install
cp .env.example .env
# Fill in your PayPal & OpenAI keys
```

### 2. Start Broker

```bash
npm run dev
# Server on http://localhost:3000
```

### 3. Submit a Deal

```bash
curl -X POST http://localhost:3000/v1/deals/propose \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer_001",
    "sellerId": "seller_001",
    "description": "Website redesign project - Full responsive redesign",
    "estimatedAmount": 2500,
    "buyerProfile": {
      "name": "Tech Startup Inc",
      "industry": "SaaS",
      "budget": "2500-3500"
    },
    "sellerProfile": {
      "name": "Creative Studios",
      "experience": "5 years web design",
      "portfolio": "50+ projects"
    }
  }'
```

**Response:**
```json
{
  "dealId": "deal-uuid-12345",
  "status": "proposed",
  "proposal": {
    "proposedPrice": 2500,
    "paymentTerms": "50% upfront, 50% on completion",
    "deliverables": "Full responsive design, wireframes, 3 revisions",
    "timeline": "4 weeks",
    "commissionAmount": 75
  },
  "commission": 75,
  "message": "Deal proposed by AI broker. Awaiting buyer and seller acceptance."
}
```

### 4. Parties Respond (Negotiate)

```bash
curl -X POST http://localhost:3000/v1/deals/deal-uuid-12345/respond \
  -H "Content-Type: application/json" \
  -d '{
    "party": "buyer",
    "message": "We prefer 60% upfront, 40% on delivery",
    "counterTerms": {
      "paymentTerms": "60% upfront, 40% on completion",
      "timeline": "5 weeks"
    }
  }'
```

**AI Response:**
```json
{
  "dealId": "deal-uuid-12345",
  "negotiation": {
    "adjustedTerms": "55% upfront, 45% on completion",
    "rationale": "Fair compromise - seller gets early capital, buyer retains risk mitigation",
    "nextSteps": "Seller review and approval needed"
  }
}
```

### 5. Close Deal & Collect Commission

```bash
curl -X POST http://localhost:3000/v1/deals/deal-uuid-12345/close \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "paypal",
    "buyerEmail": "buyer@techstartup.com",
    "sellerEmail": "seller@creativestudios.com",
    "finalAmount": 2500
  }'
```

**Response:**
```json
{
  "dealId": "deal-uuid-12345",
  "status": "payment_pending",
  "commission": 75,
  "totalDealAmount": 2500,
  "approvalUrl": "https://paypal.com/checkoutuuid",
  "message": "Deal closed! Commission payment initiated."
}
```

Buyer clicks approval link → PayPal charges them → **$75 commission hits your account**

### 6. Track Earnings

```bash
curl http://localhost:3000/v1/commissions/summary
```

**Response:**
```json
{
  "totalDeals": 12,
  "totalCommission": 3450,
  "paidCommission": 2100,
  "pendingCommission": 1350
}
```

## API Endpoints

### Deal Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/deals/propose` | Create a new deal proposal |
| `GET` | `/v1/deals/:dealId` | Get deal details + negotiation history |
| `POST` | `/v1/deals/:dealId/respond` | Submit party response (triggers AI negotiation) |
| `POST` | `/v1/deals/:dealId/close` | Finalize deal + initiate payment |
| `GET` | `/v1/deals` | List all deals |

### Commission & Earnings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/commissions/summary` | Get total earnings summary |
| `GET` | `/v1/broker-status` | Get broker operational status & earnings |
| `GET` | `/admin/commissions` | Admin panel: full commission details |

### PayPal Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/paypal-return` | Buyer approved payment (success) |
| `GET` | `/v1/paypal-cancel` | Buyer cancelled payment |

## How Deals Get Closed (AI Flow)

```
┌─────────────┐
│   Buyer     │
└──────┬──────┘
       │ submits deal request
       ▼
┌──────────────────────────┐
│  AI Broker Receives      │
│  - Description           │
│  - Budget                │
│  - Requirements          │
└──────┬───────────────────┘
       │ generates proposal with GPT-3.5
       ▼
┌──────────────────────────┐
│  AI Generates Proposal   │
│  - Price                 │
│  - Terms                 │
│  - Timeline              │
└──────┬───────────────────┘
       │ sends to seller
       ▼
┌─────────────┐
│   Seller    │
│  Reviews    │
└──────┬──────┘
       │ counters with objections
       ▼
┌──────────────────────────┐
│  AI Negotiates           │
│  - Analyzes objections   │
│  - Adjusts terms         │
│  - Finds compromise      │
└──────┬───────────────────┘
       │ back to buyer
       ▼
┌─────────────┐
│   Buyer     │
│  Approves!  │
└──────┬──────┘
       │ initiates PayPal payment
       ▼
┌──────────────────────────┐
│  PayPal Checkout         │
│  Amount: $2500           │
│  Commission: $75 (3%)    │
└──────┬───────────────────┘
       │ buyer approves
       ▼
┌──────────────────────────┐
│  💰 Commission Earned!   │
│  $75 transferred to YOU  │
└──────────────────────────┘
```

## Real-World Scenarios

### Scenario 1: Freelance Project
- Buyer: Needs a React app built
- Seller: React developer available
- Deal: $5000 project
- **Your Commission: $150**

### Scenario 2: B2B Service Contract
- Buyer: Needs marketing consulting
- Seller: Marketing agency
- Deal: $10,000 contract
- **Your Commission: $300**

### Scenario 3: Product Wholesale
- Buyer: Retailer needs inventory
- Seller: Manufacturer
- Deal: $50,000 order
- **Your Commission: $1,500**

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production deployment guide.

### Quick Deploy to Heroku

```bash
heroku create your-deal-broker
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set PAYPAL_CLIENT_ID=...
heroku config:set PAYPAL_SECRET=...
git push heroku paypal-autonomous-deals:main
```

## Environment Variables

```env
# OpenAI (for deal negotiation)
OPENAI_API_KEY=sk-...

# PayPal (for payment processing)
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_API_BASE=https://api.paypal.com  # or sandbox

# App
PORT=3000
BASE_URL=https://your-domain.com
ADMIN_SECRET=your_secret_key
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file
- Use strong `ADMIN_SECRET`
- PayPal credentials must be environment variables
- Validate all inputs on backend
- Use HTTPS in production
- Monitor PayPal webhooks for fraud

## Monitoring Earnings

Check your earnings dashboard:

```bash
curl -H "x-admin-secret: your_secret" \
  https://your-domain.com/admin/commissions
```

Or check summary anytime:

```bash
curl https://your-domain.com/v1/commissions/summary
```

## Future Enhancements

- 🔐 Escrow system (hold funds until completion)
- 📱 Mobile app for deal management
- 🌍 Multi-currency support
- 🤖 Advanced AI negotiation (Claude 3, GPT-4)
- 📊 Dashboard analytics
- 🔔 Real-time notifications
- 💳 Cryptocurrency payments
- 🏆 Reputation system

## Support

Questions? Issues?
- GitHub Issues: https://github.com/kamogelonkareng-cmyk/global-ai-commerce-autonomous-broker/issues
- Documentation: See `/DEPLOYMENT.md`

---

**Made with ❤️ by @kamogelonkareng-cmyk**

*An AI broker for the AI age. Earn commission while your AI negotiates deals.*
