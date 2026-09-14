# AI Deal Broker - Production Deployment Guide

## 🚀 Quick Deployment Options

Choose your platform and follow the steps.

---

## Option 1: Heroku (Easiest - 5 minutes)

### Prerequisites
- Heroku account (free at heroku.com)
- Heroku CLI installed
- GitHub repo pushed

### Steps

**1. Login to Heroku**
```bash
heroku login
```

**2. Create Heroku App**
```bash
heroku create your-ai-broker
# Replace 'your-ai-broker' with your desired app name
# (must be unique across all Heroku apps)
```

**3. Get Your Credentials**

#### OpenAI API Key:
- Go to https://platform.openai.com/api/keys
- Click "Create new secret key"
- Copy the key

#### PayPal Credentials:
- Go to https://developer.paypal.com/
- Sign in to your PayPal account
- Click "Apps & Credentials"
- Select "Sandbox" tab (for testing) or "Live" (for real money)
- Under "REST API apps", click on your app
- Copy **Client ID** and **Secret**

**4. Set Environment Variables on Heroku**
```bash
heroku config:set OPENAI_API_KEY=sk-your-actual-key
heroku config:set PAYPAL_CLIENT_ID=your-client-id
heroku config:set PAYPAL_SECRET=your-secret
heroku config:set ADMIN_SECRET=your-super-secret-password
heroku config:set PAYPAL_API_BASE=https://api.paypal.com
```

**For SANDBOX (testing - no real money):**
```bash
heroku config:set PAYPAL_API_BASE=https://api.sandbox.paypal.com
```

**5. Deploy from Current Branch**
```bash
git push heroku paypal-autonomous-deals:main
```

**6. View Your App**
```bash
heroku open
# Opens your dashboard at https://your-ai-broker.herokuapp.com/dashboard
```

**7. Check Logs**
```bash
heroku logs --tail
```

### Heroku Success! ✅
Your app is live at: `https://your-ai-broker.herokuapp.com/dashboard`

---

## Option 2: Railway.app (Recommended - 3 minutes)

### Prerequisites
- Railway account (free at railway.app)
- GitHub account connected

### Steps

**1. Go to railway.app**
- Sign up with GitHub

**2. New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Select `kamogelonkareng-cmyk/global-ai-commerce-autonomous-broker`
- Select branch: `paypal-autonomous-deals`

**3. Configure Environment Variables**
In the Railway dashboard:
- Click on your project
- Go to "Variables"
- Add each variable:

```
OPENAI_API_KEY = sk-...
PAYPAL_CLIENT_ID = ...
PAYPAL_SECRET = ...
ADMIN_SECRET = your-secret
PAYPAL_API_BASE = https://api.paypal.com
NODE_ENV = production
PORT = 3000
```

**4. Deploy**
- Railway auto-deploys when you push to the branch
- Watch the deploy logs in dashboard

**5. Get Your URL**
- In Railway, find the "Public URL"
- Your dashboard: `https://your-url.railway.app/dashboard`

### Railway Success! ✅
Auto-deploys on every push to `paypal-autonomous-deals` branch

---

## Option 3: Render.com (Free - 5 minutes)

### Steps

**1. Go to render.com**
- Sign up with GitHub

**2. Create New Web Service**
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Select branch: `paypal-autonomous-deals`

**3. Configure**
- Name: `ai-deal-broker`
- Environment: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free tier is fine

**4. Environment Variables**
In Render dashboard:
```
OPENAI_API_KEY=sk-...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
ADMIN_SECRET=your-secret
PAYPAL_API_BASE=https://api.paypal.com
NODE_ENV=production
```

**5. Deploy**
- Click "Create Web Service"
- Render auto-deploys from GitHub

### Render Success! ✅
Your app: `https://ai-deal-broker.onrender.com/dashboard`

---

## Option 4: Docker (Any Cloud - 10 minutes)

Works on AWS, Google Cloud, DigitalOcean, Azure, etc.

### Local Docker Test

**1. Build Image**
```bash
docker build -t ai-deal-broker .
```

**2. Create .env.docker file**
```bash
cat > .env.docker << EOF
OPENAI_API_KEY=sk-your-key
PAYPAL_CLIENT_ID=your-id
PAYPAL_SECRET=your-secret
ADMIN_SECRET=your-secret
PAYPAL_API_BASE=https://api.paypal.com
NODE_ENV=production
PORT=3000
EOF
```

**3. Run Container**
```bash
docker run -p 3000:3000 --env-file .env.docker ai-deal-broker
```

**4. Test**
```
http://localhost:3000/dashboard
```

### Deploy to Cloud

#### AWS EC2:
```bash
# 1. Launch EC2 instance (Ubuntu)
# 2. SSH into instance
# 3. Install Docker
sudo apt update
sudo apt install docker.io -y

# 4. Clone repo
git clone https://github.com/kamogelonkareng-cmyk/global-ai-commerce-autonomous-broker.git
cd global-ai-commerce-autonomous-broker
git checkout paypal-autonomous-deals

# 5. Build & run
docker build -t broker .
docker run -p 80:3000 --env-file .env broker
```

#### DigitalOcean App Platform:
```bash
# 1. Push to GitHub
# 2. Go to digitalocean.com
# 3. Create "App" from GitHub
# 4. Select this repo + paypal-autonomous-deals branch
# 5. Add env vars
# 6. Deploy!
```

---

## 🔑 Getting Your Credentials (Most Important!)

### OpenAI API Key (2 min)

1. Go to https://platform.openai.com/api/keys
2. Login with your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **IMPORTANT**: Don't share this key!
6. Store safely: `OPENAI_API_KEY=sk-...`

### PayPal Credentials (5 min)

#### For Testing (Sandbox):
1. Go to https://developer.paypal.com/
2. Login or create PayPal account
3. Click "Sign up" for Developer Account
4. Go to "Apps & Credentials"
5. Select **"Sandbox"** tab
6. Under "REST API apps", click your app (or create one)
7. Copy:
   - Client ID
   - Secret
8. Set `PAYPAL_API_BASE=https://api.sandbox.paypal.com`

#### For Live (Real Money):
1. Same steps as above
2. Select **"Live"** tab
3. Copy production credentials
4. Set `PAYPAL_API_BASE=https://api.paypal.com`

---

## ✅ Verify Deployment

Once deployed, test these URLs:

**1. Dashboard**
```
https://your-app-url.com/dashboard
```
Should show the beautiful purple dashboard with stats.

**2. Health Check**
```
https://your-app-url.com/health
```
Should return:
```json
{"status":"ok","version":"0.3.0"}
```

**3. Broker Status**
```
https://your-app-url.com/v1/broker-status
```
Should show:
```json
{
  "status":"operational",
  "earningStats": {"totalCommissionsEarned":0, ...}
}
```

**4. Create a Test Deal**
```bash
curl -X POST https://your-app-url.com/v1/deals/propose \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "test_buyer",
    "sellerId": "test_seller",
    "description": "Test deal",
    "estimatedAmount": 1000
  }'
```

Should return a deal object with an ID.

---

## 🐛 Troubleshooting

### "Module not found" error
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push heroku paypal-autonomous-deals:main  # or your platform
```

### "PayPal credentials not configured"
- Check all env vars are set correctly
- No extra spaces or quotes
- Use exact names: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`

### "Cannot find module './src/db'"
- Make sure you're in the repo root directory
- Run `npm install`
- Check all files are pushed

### Dashboard not loading
- Check browser console for errors (F12)
- Verify API is responding: `https://your-url.com/v1/broker-status`
- Check server logs in your deployment platform

### PayPal payment failing
- Make sure you're using SANDBOX credentials for testing
- Set `PAYPAL_API_BASE=https://api.sandbox.paypal.com`
- Test with sandbox buyer account

---

## 📊 Next Steps After Deployment

1. **Visit your dashboard**
   - `https://your-app-url.com/dashboard`

2. **Create test deals** in dashboard
   - Use buyer/seller IDs like: buyer_001, seller_001
   - AI will generate proposals automatically

3. **Share dashboard URL**
   - With your network
   - With potential buyers/sellers
   - On social media / communities

4. **Monitor earnings**
   - Check `/v1/commissions/summary`
   - Watch real-time updates in dashboard (refreshes every 10s)

5. **Scale up**
   - As deals flow in, upgrade to paid tier if needed
   - Monitor app performance
   - Add more AI models as revenue grows

---

## 💰 Ready to Earn!

Your autonomous deal broker is live! Now deals can start flowing in and commissions can start accumulating. 🚀

Need help? Check the logs on your deployment platform or review the README-DEALS.md for API details.

**Happy selling!** 🎉
