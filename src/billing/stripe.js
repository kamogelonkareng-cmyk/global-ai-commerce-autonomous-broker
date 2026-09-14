const db = require('../db');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

async function createCheckoutSession(apiKey, priceId, origin) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');

  try {
    // ensure customer exists or create one and attach to apiKey
    const keyRow = db.getApiKeyRow(apiKey);
    let customerId = keyRow && keyRow.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { apiKey }
      });
      customerId = customer.id;
      db.setStripeCustomerId(apiKey, customerId);
    }

    // create checkout session for subscription/one-time price
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/admin?checkout=success`,
      cancel_url: `${origin}/admin?checkout=cancel`,
      client_reference_id: apiKey
    });

    return session;
  } catch (err) {
    console.error('Error creating checkout session:', err);
    throw err;
  }
}

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Invalid webhook signature:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const apiKey = session.client_reference_id;
        if (apiKey) {
          // mark subscription active and top up quota (for example)
          db.setSubscriptionStatus(apiKey, 'active');
          // top up by a default amount when subscription starts
          db.topUpQuota(apiKey, 100000);
          console.log(`✓ Activated subscription for ${apiKey}`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        // find customer -> apiKey via stored mapping
        const invoice = event.data.object;
        const customerId = invoice.customer;
        // look up apiKey by customer id
        // simple approach: scan apikeys (acceptable for small scale)
        const keys = db.getAllApiKeys();
        const match = keys.find(k => k.stripe_customer_id === customerId);
        if (match) {
          db.setSubscriptionStatus(match.api_key, 'past_due');
          console.log(`⚠️  Payment failed for ${match.api_key}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const keys = db.getAllApiKeys();
        const match = keys.find(k => k.stripe_customer_id === customerId);
        if (match) {
          db.setSubscriptionStatus(match.api_key, 'canceled');
          console.log(`✗ Subscription canceled for ${match.api_key}`);
        }
        break;
      }
      default:
        // console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook event:', err);
    res.status(500).json({ error: 'webhook_processing_error', message: err.message });
  }
}

module.exports = { createCheckoutSession, handleWebhook };
