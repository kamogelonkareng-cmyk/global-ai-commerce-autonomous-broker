const axios = require('axios');
const db = require('../db');

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const COMMISSION_RATE = 0.03; // 3%

let cachedAccessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }

  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    cachedAccessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min before expiry
    return cachedAccessToken;
  } catch (err) {
    console.error('PayPal OAuth error:', err.response?.data || err.message);
    throw err;
  }
}

async function createPayment(amount, currency, dealId, description) {
  const token = await getAccessToken();

  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    transactions: [
      {
        amount: {
          total: amount.toFixed(2),
          currency: currency || 'USD',
          details: {
            subtotal: amount.toFixed(2),
          },
        },
        description: description || `Deal Commission #${dealId}`,
        invoice_number: `deal-${dealId}-${Date.now()}`,
        custom: dealId,
      },
    ],
    redirect_urls: {
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/paypal-return?dealId=${dealId}`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/paypal-cancel?dealId=${dealId}`,
    },
  };

  try {
    const response = await axios.post(`${PAYPAL_API_BASE}/v1/payments/payment`, paymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (err) {
    console.error('PayPal payment creation error:', err.response?.data || err.message);
    throw err;
  }
}

async function executePayment(paymentId, payerId) {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/payments/payment/${paymentId}/execute`,
      { payer_id: payerId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error('PayPal payment execution error:', err.response?.data || err.message);
    throw err;
  }
}

function calculateCommission(dealAmount) {
  return parseFloat((dealAmount * COMMISSION_RATE).toFixed(2));
}

function logDealCommission(dealId, buyerId, sellerId, amount, status = 'pending') {
  const commission = calculateCommission(amount);
  db.logDealCommission(dealId, buyerId, sellerId, amount, commission, status);
  return commission;
}

module.exports = {
  getAccessToken,
  createPayment,
  executePayment,
  calculateCommission,
  logDealCommission,
  COMMISSION_RATE,
};
