# VocabFlow Payment & Webhook Configuration Guide

VocabFlow supports **Razorpay** (for Indian customers paying in INR) and **Stripe** (for international customers) at **₹49 / month** (`4900` paise).

By default, the server starts in **Sandbox Test Mode** when gateway keys are absent from `.env`. No real money is charged, and every security check (HMAC-SHA256 signatures, order/session ownership binding, server-side status checks, and webhook handlers) executes on the server.

## 1. Security Invariants
- **Never** unlock Premium on a client redirect or success URL visit.
- `/users/{uid}/billing/subscription` in Firestore is **read-only** for clients (`allow write: if false`).
- All checkout verification happens on the Express backend after verifying the user's Firebase ID token (`Authorization: Bearer <token>`).

## 2. Razorpay Test-Mode Setup (India)
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com) and switch the top toggle to **Test Mode**.
2. Go to **Account & Settings → API Keys** and generate a Test Key pair (`rzp_test_...`).
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
   RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxx"
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
   ```
4. Configure Webhook in Razorpay Test Mode:
   - Endpoint URL: `https://<your-domain>/api/payments/webhooks/razorpay`
   - Events: `payment.captured`, `subscription.activated`, `subscription.charged`, `subscription.cancelled`
5. Verification Endpoint:
   - `POST /api/payments/razorpay/verify` checks `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)` using `crypto.timingSafeEqual`.

## 3. Stripe Test-Mode Setup (International)
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com) and switch to **Test Mode**.
2. Go to **Developers → API keys** and copy your **Secret key** (`sk_test_...`).
3. Create a Product ("VocabFlow Premium") with a recurring **₹49/month** (`INR`) or `$0.60/month` (`USD`) price, and copy the Price ID (`price_...`).
4. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
   STRIPE_PRICE_ID="price_xxxxxxxxxxxxx"
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
   ```
5. Configure Webhook (or test locally with Stripe CLI):
   - Endpoint URL: `https://<your-domain>/api/payments/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Local CLI test: `stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe`
6. Verification Endpoint:
   - Returning from Stripe Checkout calls `POST /api/payments/stripe/verify-session`, which queries Stripe (`stripe.checkout.sessions.retrieve(sessionId)`), verifies `payment_status === 'paid'` and `metadata.uid === authenticatedUid`, and only then activates Premium.

## 4. Firebase Authentication Providers
Google Sign-In is pre-enabled by AI Studio provisioning. To enable Email/Password registration, login, and password recovery in production:
1. Open [Firebase Console](https://console.firebase.google.com) → select project `flash-carport-m6gf7`.
2. Navigate to **Authentication → Sign-in method**.
3. Click **Add new provider → Email/Password**, enable **Email/Password**, and click **Save**.
