# 🚀 Railway Deployment - Quick Start

## Step 1: Go to Railway
**URL:** https://railway.app

## Step 2: Sign Up with GitHub
1. Click **"Login with GitHub"**
2. Authorize Railway to access your GitHub
3. GitHub login complete ✓

## Step 3: Create New Project
1. Click **"New Project"** (top left)
2. Click **"Deploy from GitHub repo"**
3. Search for: `global-ai-commerce-autonomous-broker`
4. Select your repo
5. Select branch: **`paypal-autonomous-deals`**
6. Click **"Deploy"**

Railway will now build and deploy your app! ⏳ (Takes 2-3 minutes)

## Step 4: Add Environment Variables

**IMPORTANT: Do this BEFORE deployment completes**

1. In Railway dashboard, click your project
2. Go to **"Variables"** tab
3. Add these 6 variables:

### Variable 1: OpenAI API Key
**Name:** `OPENAI_API_KEY`  
**Value:** `sk-...` (your key from openai.com)

### Variable 2: PayPal Client ID
**Name:** `PAYPAL_CLIENT_ID`  
**Value:** (from developer.paypal.com)

### Variable 3: PayPal Secret
**Name:** `PAYPAL_SECRET`  
**Value:** (from developer.paypal.com)

### Variable 4: Admin Secret
**Name:** `ADMIN_SECRET`  
**Value:** `MySecurePassword123!` (make up something secure)

### Variable 5: PayPal API Base
**Name:** `PAYPAL_API_BASE`  
**Value:** `https://api.sandbox.paypal.com` (for testing)

### Variable 6: Environment
**Name:** `NODE_ENV`  
**Value:** `production`

## Step 5: Save & Deploy
1. Click **"Save"**
2. Railway auto-redeploys with new variables
3. Wait for build to complete (green checkmark)

## Step 6: Get Your Live URL
1. In Railway dashboard, find **"Public URL"**
2. Copy the URL (looks like: `https://railwayapp-abc123.railway.app`)
3. Visit: `https://your-url/dashboard`

## ✅ Done!

Your dashboard is live! 🎉

---

## 🔑 Need to Get Credentials First?

### OpenAI API Key (2 min)
1. Go to: https://platform.openai.com/api/keys
2. Login
3. Click "Create new secret key"
4. Copy the key

### PayPal Credentials (5 min)
1. Go to: https://developer.paypal.com/
2. Login or create account
3. Click "Apps & Credentials"
4. Select **"Sandbox"** tab (for testing)
5. Click your app
6. Copy Client ID and Secret

---

## 🎯 Direct Links

- **Railway:** https://railway.app
- **OpenAI Keys:** https://platform.openai.com/api/keys
- **PayPal Sandbox:** https://developer.paypal.com/ (select Sandbox tab)
- **Your GitHub:** https://github.com/kamogelonkareng-cmyk/global-ai-commerce-autonomous-broker

---

**Questions? Check the PRODUCTION_DEPLOYMENT.md file for troubleshooting!**
