# Stripe Webhook Setup Guide

## Problem: Orders Stay "Pending" and No Confirmation Email

If orders remain in "pending" status after Stripe checkout and customers don't receive confirmation emails, the Stripe webhook is not configured properly.

## How It Works

### Order Creation Flow (Stripe Payments):

1. **User completes checkout** → Redirected to Stripe
2. **User pays on Stripe** → Returns to site
3. **Order created with status**: `pending` / payment: `pending`
4. **Stripe webhook fires** → Notifies backend of successful payment
5. **Backend updates order**: `processing` / payment: `paid`
6. **Email sent** → Order confirmation email to customer

### Why Orders Stay Pending:

The webhook at step 4 is not reaching your backend, so:
- ❌ Order status never updates from "pending" to "processing"
- ❌ Payment status never updates from "pending" to "paid"
- ❌ Confirmation email is never sent (email only sends when webhook confirms payment)

## Solution: Configure Stripe Webhook

### 1. Get Your Webhook Endpoint URL

Your webhook endpoint is:
```
https://your-backend-domain.com/api/payments/stripe-webhook
```

**For development:**
```
http://localhost:5000/api/payments/stripe-webhook
```

**For production (example):**
```
https://api.yourstore.com/api/payments/stripe-webhook
```

### 2. Add Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL (from step 1)
4. Select events to listen for:
   - `checkout.session.completed` ✅ (REQUIRED)
   - `payment_intent.succeeded` (optional)
   - `payment_intent.payment_failed` (optional)
5. Click **"Add endpoint"**

### 3. Get Webhook Signing Secret

After creating the webhook:
1. Click on the webhook you just created
2. Click **"Reveal"** under **"Signing secret"**
3. Copy the secret (starts with `whsec_...`)

### 4. Add Secret to Environment Variables

Add to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here
```

### 5. Restart Your Backend

```bash
# Stop your backend server (Ctrl+C)
# Then restart it
npm start
# or
npm run dev
```

## Testing Webhooks Locally

### Option 1: Stripe CLI (Recommended for Local Development)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/stripe-webhook
   ```
4. Use the webhook secret from the CLI output

### Option 2: ngrok (Expose Local Server)

1. Install ngrok: https://ngrok.com/
2. Start ngrok:
   ```bash
   ngrok http 5000
   ```
3. Use the ngrok URL as your webhook endpoint:
   ```
   https://your-ngrok-url.ngrok.io/api/payments/stripe-webhook
   ```
4. Configure this URL in Stripe Dashboard

## Verifying Webhook is Working

### Check Backend Logs

When a payment is completed, you should see:
```
🔔 Received Stripe webhook: checkout.session.completed
✅ Found existing preliminary order: [order-id]
🔄 Online payment confirmed - updating order status to paid/processing...
📧 Sending order success email to: customer@email.com
✅ Sent transactional email [type: order_success_email]
```

### Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook
3. Check the **"Recent deliveries"** tab
4. Look for:
   - ✅ Green checkmarks = webhook delivered successfully
   - ❌ Red X = webhook failed (check error message)

## Common Issues

### Issue 1: Webhook Returns 404
**Problem:** Backend route not found
**Solution:** Ensure your backend is running and the URL is correct

### Issue 2: Webhook Returns 401/403
**Problem:** Authentication issue
**Solution:** Check that `STRIPE_WEBHOOK_SECRET` is set correctly

### Issue 3: Webhook Doesn't Fire at All
**Problem:** Not configured in Stripe
**Solution:** Follow "Configure Stripe Webhook" section above

### Issue 4: Webhook Fires But Order Still Pending
**Problem:** Webhook secret mismatch
**Solution:** Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

## Production Checklist

- [ ] Webhook endpoint URL configured in Stripe Dashboard
- [ ] Webhook listening to `checkout.session.completed` event
- [ ] `STRIPE_WEBHOOK_SECRET` added to environment variables
- [ ] Backend server restarted after adding secret
- [ ] Test order placed and confirmed webhook fires
- [ ] Order status updates to "processing"
- [ ] Customer receives confirmation email

## For Store Admins

If customers report:
- Orders showing as "pending" forever
- Not receiving order confirmation emails
- Payment went through but order not confirmed

**Tell them to:**
1. Check Stripe Dashboard → Webhooks
2. Verify webhook is configured
3. Check webhook delivery logs for errors
4. Ensure `STRIPE_WEBHOOK_SECRET` is set in backend environment

---

**Need Help?**
- Stripe Webhook Docs: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Test Webhooks: https://stripe.com/docs/webhooks/test
