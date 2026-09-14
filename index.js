require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./src/db');
const apiKeyAuth = require('./src/auth/apiKeyAuth');
const paypal = require('./src/billing/paypal');
const dealNegotiator = require('./src/connectors/dealNegotiator');

const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET', 'ADMIN_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
}

try {
  db.initDB();
  console.log('✓ Database initialized');
} catch (err) {
  console.error('✗ Failed to initialize database:', err.message);
  process.exit(1);
}

const app = express();
app.use(bodyParser.json());

// Serve static dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'internal_server_error', message: err.message });
});

app.get('/health', (req, res) => res.json({ status: 'ok', version: '0.3.0' }));

// ============================================
// AUTONOMOUS DEAL BROKER ENDPOINTS
// ============================================

/**
 * POST /v1/deals/propose
 * Submit a new deal for the AI broker to negotiate
 */
app.post('/v1/deals/propose', async (req, res) => {
  try {
    const { buyerId, sellerId, description, estimatedAmount, buyerProfile, sellerProfile } = req.body;

    if (!buyerId || !sellerId || !description || !estimatedAmount) {
      return res.status(400).json({ error: 'Missing required fields: buyerId, sellerId, description, estimatedAmount' });
    }

    // Create deal in DB
    const dealId = db.createDeal(buyerId, sellerId, description, estimatedAmount);
    console.log(`✓ New deal created: ${dealId}`);

    // AI generates initial proposal
    const proposal = await dealNegotiator.generateDealProposal(
      description,
      buyerProfile || { id: buyerId },
      sellerProfile || { id: sellerId }
    );

    // Log proposal as negotiation
    db.logNegotiation(dealId, 'broker', 'Initial proposal generated', JSON.stringify(proposal));

    // Log commission
    const proposedPrice = proposal.proposedPrice || estimatedAmount;
    paypal.logDealCommission(dealId, buyerId, sellerId, proposedPrice, 'proposed');

    res.json({
      dealId,
      status: 'proposed',
      proposal,
      commission: paypal.calculateCommission(proposedPrice),
      message: 'Deal proposed by AI broker. Awaiting buyer and seller acceptance.',
    });
  } catch (err) {
    console.error('Deal proposal error:', err);
    res.status(500).json({ error: 'proposal_error', message: err.message });
  }
});

/**
 * GET /v1/deals/:dealId
 * Get deal details and negotiation history
 */
app.get('/v1/deals/:dealId', async (req, res) => {
  try {
    const deal = db.getDeal(req.params.dealId);
    if (!deal) return res.status(404).json({ error: 'deal_not_found' });

    const negotiations = db.getNegotiationHistory(req.params.dealId);
    const commissions = db.getCommissionsByDeal(req.params.dealId);

    res.json({ deal, negotiations, commissions });
  } catch (err) {
    console.error('Error fetching deal:', err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * POST /v1/deals/:dealId/respond
 * Submit buyer/seller response; AI negotiates
 */
app.post('/v1/deals/:dealId/respond', async (req, res) => {
  try {
    const { party, message, counterTerms } = req.body;
    const dealId = req.params.dealId;

    const deal = db.getDeal(dealId);
    if (!deal) return res.status(404).json({ error: 'deal_not_found' });

    db.logNegotiation(dealId, party, message, '');

    const negotiation = await dealNegotiator.negotiateTerms(
      { amount: deal.proposed_amount, ...counterTerms },
      party === 'buyer' ? 'seller' : 'buyer',
      message
    );

    db.logNegotiation(dealId, 'broker', 'Negotiation response', JSON.stringify(negotiation));

    res.json({
      dealId,
      negotiation,
      message: 'AI broker has generated a response for the other party.',
    });
  } catch (err) {
    console.error('Deal negotiation error:', err);
    res.status(500).json({ error: 'negotiation_error', message: err.message });
  }
});

/**
 * POST /v1/deals/:dealId/close
 * Finalize deal and initiate PayPal payment for commission
 */
app.post('/v1/deals/:dealId/close', async (req, res) => {
  try {
    const { paymentMethod, buyerEmail, sellerEmail, finalAmount } = req.body;
    const dealId = req.params.dealId;

    const deal = db.getDeal(dealId);
    if (!deal) return res.status(404).json({ error: 'deal_not_found' });

    const closingAmount = finalAmount || deal.proposed_amount;
    const commission = paypal.calculateCommission(closingAmount);

    const payment = await paypal.createPayment(
      commission,
      'USD',
      dealId,
      `Commission for deal negotiation - Deal #${dealId}`
    );

    db.updateDealStatus(dealId, 'processing', payment.id, null);
    db.updateCommissionStatus(dealId, 'processing');

    const closingMessage = await dealNegotiator.generateDealClose(
      { amount: closingAmount, commission },
      buyerEmail,
      sellerEmail
    );

    db.logNegotiation(dealId, 'broker', 'Deal closed', closingMessage);

    const approvalUrl = payment.links.find(link => link.rel === 'approval_url')?.href;

    res.json({
      dealId,
      status: 'payment_pending',
      commission,
      totalDealAmount: closingAmount,
      paymentId: payment.id,
      approvalUrl,
      closingMessage,
      message: 'Deal closed! Commission payment initiated.',
    });
  } catch (err) {
    console.error('Deal closing error:', err);
    res.status(500).json({ error: 'closing_error', message: err.message });
  }
});

/**
 * GET /v1/paypal-return
 * PayPal callback after buyer approves payment
 */
app.get('/v1/paypal-return', async (req, res) => {
  try {
    const { paymentId, PayerID, dealId } = req.query;

    if (!paymentId || !PayerID) {
      return res.status(400).json({ error: 'Missing paymentId or PayerID' });
    }

    const result = await paypal.executePayment(paymentId, PayerID);

    db.updateDealStatus(dealId, 'completed', paymentId, PayerID);
    db.updateCommissionStatus(dealId, 'paid');

    res.json({
      status: 'success',
      message: '✓ Payment processed successfully! Commission earned.',
      dealId,
      transactionId: result.id,
    });
  } catch (err) {
    console.error('PayPal return error:', err);
    res.status(500).json({ error: 'payment_error', message: err.message });
  }
});

/**
 * GET /v1/paypal-cancel
 * PayPal callback if buyer cancels
 */
app.get('/v1/paypal-cancel', (req, res) => {
  const { dealId } = req.query;
  res.json({
    status: 'cancelled',
    message: 'Payment cancelled by buyer.',
    dealId,
  });
});

/**
 * GET /v1/deals
 * List all deals
 */
app.get('/v1/deals', async (req, res) => {
  try {
    const deals = db.getAllDeals();
    res.json({ deals });
  } catch (err) {
    console.error('Error fetching deals:', err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * GET /v1/commissions/summary
 * Get total commission earnings
 */
app.get('/v1/commissions/summary', async (req, res) => {
  try {
    const summary = db.getTotalCommissions();
    res.json({
      totalDeals: summary.total_deals,
      totalCommission: summary.total_commission || 0,
      paidCommission: summary.paid_commission || 0,
      pendingCommission: (summary.total_commission || 0) - (summary.paid_commission || 0),
    });
  } catch (err) {
    console.error('Error fetching commission summary:', err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * ADMIN DASHBOARD: View all commissions
 */
app.get('/admin/commissions', (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const provided = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (!adminSecret || provided !== adminSecret) return res.status(403).send('forbidden');

    const summary = db.getTotalCommissions();
    res.json({
      summary,
      adminMessage: `✓ Total commissions earned: $${summary.total_commission || 0}`,
    });
  } catch (err) {
    console.error('Error fetching admin commissions:', err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * Health check
 */
app.get('/v1/broker-status', (req, res) => {
  try {
    const summary = db.getTotalCommissions();
    res.json({
      status: 'operational',
      version: '0.3.0',
      mode: 'deal_broker',
      earningStats: {
        totalCommissionsEarned: summary.total_commission || 0,
        paidOut: summary.paid_commission || 0,
        pending: (summary.total_commission || 0) - (summary.paid_commission || 0),
        commissionRate: '3%',
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 AI Autonomous Deal Broker running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`💳 Commission Rate: 3%`);
  console.log(`💰 Payment Method: PayPal`);
  console.log(`✓ Ready to negotiate and close deals!\n`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});
