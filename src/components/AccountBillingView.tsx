import { useEffect, useState, type FormEvent } from 'react';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import {
  AlertCircle,
  Check,
  CreditCard,
  Crown,
  FileText,
  Globe,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import type { CEFRLevel } from '../data/vocabulary';
import type { PaymentReceipt, SubscriptionState, UserProfile } from '../types/vocabflow';

interface AccountBillingViewProps {
  profile: UserProfile | null;
  subscription: SubscriptionState;
  receipts: PaymentReceipt[];
  isPremium: boolean;
  getIdToken: () => Promise<string>;
  onUpdateProfile: (updates: {
    displayName: string;
    targetLevel: CEFRLevel;
    dailyGoal: number;
    region: 'IN' | 'INTL';
  }) => Promise<void>;
  onRefreshSubscription: () => Promise<void>;
}

interface PaymentConfigResponse {
  priceInr: number;
  amountPaise: number;
  currency: string;
  razorpay: { mode: 'sandbox' | 'test-gateway'; keyId: string };
  stripe: { mode: 'sandbox' | 'test-gateway' };
  webhookPaths: { razorpay: string; stripe: string };
}

interface SandboxCheckoutState {
  provider: 'razorpay' | 'stripe';
  orderId: string;
  amountLabel: string;
}

export function AccountBillingView({
  profile,
  subscription,
  receipts,
  isPremium,
  getIdToken,
  onUpdateProfile,
  onRefreshSubscription,
}: AccountBillingViewProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [targetLevel, setTargetLevel] = useState<CEFRLevel>(profile?.targetLevel || 'B2');
  const [dailyGoal, setDailyGoal] = useState<number>(profile?.dailyGoal || 10);
  const [region, setRegion] = useState<'IN' | 'INTL'>(profile?.region || 'IN');

  const [saveMessage, setSaveMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingStatusMsg, setBillingStatusMsg] = useState('');
  const [billingError, setBillingError] = useState('');
  const [sandboxModal, setSandboxModal] = useState<SandboxCheckoutState | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setTargetLevel(profile.targetLevel);
      setDailyGoal(profile.dailyGoal);
      setRegion(profile.region);
    }
  }, [profile]);

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((d) => setPaymentConfig(d as PaymentConfigResponse))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaveMessage('');
    await onUpdateProfile({ displayName, targetLevel, dailyGoal, region });
    setSaveMessage('Profile and daily learning goal saved across devices.');
  };

  const handleSendPasswordReset = async () => {
    if (!profile?.email) return;
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setResetMessage(`Password recovery email sent to ${profile.email}.`);
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : 'Unable to send reset email.');
    }
  };

  // Start Razorpay Checkout (India)
  const handleStartRazorpay = async () => {
    setBillingError('');
    setBillingStatusMsg('');
    setCheckoutLoading(true);
    try {
      const token = await getIdToken();
      const resp = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not initialize Razorpay order');

      if (data.mode === 'sandbox') {
        setSandboxModal({
          provider: 'razorpay',
          orderId: data.orderId,
          amountLabel: '₹49 / month (Sandbox Test Mode)',
        });
      } else {
        // Load Razorpay Checkout script dynamically when real test-gateway keys are present
        const scriptLoaded = await new Promise<boolean>((resolve) => {
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.body.appendChild(s);
        });
        if (!scriptLoaded) {
          throw new Error('Could not load Razorpay Checkout script.');
        }

        const RzpCtor = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay;
        const rzp = new RzpCtor({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'VocabFlow',
          description: 'VocabFlow Premium Monthly Subscription',
          order_id: data.orderId,
          prefill: {
            name: profile?.displayName || '',
            email: profile?.email || '',
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyResp = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResp.json();
            if (!verifyResp.ok) {
              setBillingError(verifyData.error || 'Server payment verification failed');
              return;
            }
            setBillingStatusMsg('Payment verified on server. VocabFlow Premium is now active.');
            await onRefreshSubscription();
          },
        });
        rzp.open();
      }
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Razorpay checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Start Stripe Checkout (International)
  const handleStartStripe = async () => {
    setBillingError('');
    setBillingStatusMsg('');
    setCheckoutLoading(true);
    try {
      const token = await getIdToken();
      const resp = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not create Stripe session');

      if (data.mode === 'test-gateway' && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else {
        setSandboxModal({
          provider: 'stripe',
          orderId: data.sessionId,
          amountLabel: '₹49 / month (~$0.60 USD · Sandbox Test Mode)',
        });
      }
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Stripe checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Complete Sandbox Simulation -> STILL executes full server-side HMAC / session verification!
  const handleSandboxOutcome = async (outcome: 'success' | 'failure') => {
    if (!sandboxModal) return;
    setBillingError('');
    setBillingStatusMsg('');
    setCheckoutLoading(true);

    try {
      const token = await getIdToken();
      const simResp = await fetch('/api/payments/sandbox/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: sandboxModal.provider,
          orderId: sandboxModal.orderId,
          outcome,
        }),
      });
      const simData = await simResp.json();
      if (!simResp.ok) {
        throw new Error(simData.error || 'Payment declined by sandbox gateway');
      }

      if (sandboxModal.provider === 'razorpay') {
        const verifyResp = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(simData),
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) throw new Error(verifyData.error || 'Razorpay signature verification failed');
      } else {
        const verifyResp = await fetch('/api/payments/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId: sandboxModal.orderId }),
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) throw new Error(verifyData.error || 'Stripe session verification failed');
      }

      setSandboxModal(null);
      setBillingStatusMsg(
        `Server verified ${sandboxModal.provider === 'razorpay' ? 'Razorpay HMAC signature' : 'Stripe checkout session'}. VocabFlow Premium unlocked for 30 days.`
      );
      await onRefreshSubscription();
    } catch (err) {
      setSandboxModal(null);
      setBillingError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setBillingError('');
    setBillingStatusMsg('');
    try {
      const token = await getIdToken();
      const resp = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Cancellation failed');
      setBillingStatusMsg('Auto-renewal cancelled. Premium access remains active until period end.');
      await onRefreshSubscription();
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Unable to cancel subscription');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Profile Settings + Subscription Summary */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profile Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Learner Profile</h1>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700">
                Display Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-level" className="block text-xs font-semibold text-slate-700">
                  Target CEFR Level
                </label>
                <select
                  id="prof-level"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value as CEFRLevel)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Int</option>
                  <option value="C1">C1 Advanced</option>
                  <option value="C2">C2 Mastery</option>
                </select>
              </div>
              <div>
                <label htmlFor="prof-goal" className="block text-xs font-semibold text-slate-700">
                  Daily Word Goal
                </label>
                <select
                  id="prof-goal"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value={5}>5 words / day</option>
                  <option value={10}>10 words / day</option>
                  <option value={15}>15 words / day</option>
                  <option value={20}>20 words / day</option>
                  <option value={30}>30 words / day</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="prof-region" className="block text-xs font-semibold text-slate-700">
                Billing Region
              </label>
              <select
                id="prof-region"
                value={region}
                onChange={(e) => setRegion(e.target.value as 'IN' | 'INTL')}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="IN">India (Razorpay · UPI, RuPay, Netbanking)</option>
                <option value="INTL">International (Stripe · Global Cards)</option>
              </select>
            </div>

            {saveMessage && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                {saveMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save Profile Settings
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Password Recovery</span>
              <button
                type="button"
                onClick={handleSendPasswordReset}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Send Reset Email
              </button>
            </div>
            {resetMessage && <p className="mt-2 text-xs text-slate-700">{resetMessage}</p>}
          </div>
        </section>

        {/* Subscription & Payment Gateway Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Subscription &amp; Billing</span>
                <span aria-hidden="true">·</span>
                <span>{isPremium ? 'Premium Active' : 'Free Plan'}</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                VocabFlow Premium — ₹49<span className="text-sm font-normal text-slate-500"> / month</span>
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowDocs((d) => !d)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{showDocs ? 'Hide Gateway Docs' : 'Sandbox & Webhook Docs'}</span>
            </button>
          </div>

          {billingStatusMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
              {billingStatusMsg}
            </div>
          )}
          {billingError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{billingError}</span>
            </div>
          )}

          {/* Plan Comparison Table (Concrete limits, zero vague checkmarks) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-2.5 font-semibold">Feature</th>
                  <th className="px-4 py-2.5 font-semibold">Free</th>
                  <th className="px-4 py-2.5 font-semibold text-indigo-700">Premium (₹49/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="h-10">
                  <td className="px-4 font-medium">Flashcards</td>
                  <td className="px-4 font-mono-tabular">20 cards / day</td>
                  <td className="px-4 font-semibold text-slate-900">Unlimited</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Adaptive Quizzes</td>
                  <td className="px-4 font-mono-tabular">3 quizzes / day</td>
                  <td className="px-4 font-semibold text-slate-900">Unlimited + Mistake Clinic</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Custom Collections</td>
                  <td className="px-4 font-mono-tabular">Up to 2 lists</td>
                  <td className="px-4 font-semibold text-slate-900">Unlimited lists</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">AI Stories &amp; AI Coach</td>
                  <td className="px-4 text-slate-400">Not included</td>
                  <td className="px-4 font-semibold text-slate-900">Gemini Story Studio + Coach</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Exclusive Courses &amp; Revision</td>
                  <td className="px-4">Module 1 preview</td>
                  <td className="px-4 font-semibold text-slate-900">All 3 Courses + SM-2 Queue</td>
                </tr>
                <tr className="h-10">
                  <td className="px-4 font-medium">Experience</td>
                  <td className="px-4">Ad-supported (non-quiz)</td>
                  <td className="px-4 font-semibold text-emerald-700">100% Ad-Free</td>
                </tr>
              </tbody>
            </table>
          </div>

          {isPremium ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-emerald-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Premium Active via {subscription.provider.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono-tabular text-xs text-slate-600">
                  Renews / Ends:{' '}
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                {subscription.cancelAtPeriodEnd
                  ? 'Auto-renewal is cancelled. You retain full Premium access until the end of your current period.'
                  : 'All unlimited learning tools, Gemini AI stories, courses, and ad-free study are active.'}
              </p>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel Auto-Renewal
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleStartRazorpay}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                  region === 'IN'
                    ? 'border-indigo-600 bg-indigo-50/60 hover:bg-indigo-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                    Pay with Razorpay (India)
                  </span>
                  <span className="text-[11px] font-medium text-indigo-700">
                    {paymentConfig?.razorpay.mode === 'test-gateway' ? 'Test Keys' : 'Sandbox'}
                  </span>
                </div>
                <span className="mt-1 text-xs text-slate-600">
                  UPI, RuPay, Indian Cards &amp; Netbanking · ₹49/mo
                </span>
              </button>

              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleStartStripe}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                  region === 'INTL'
                    ? 'border-indigo-600 bg-indigo-50/60 hover:bg-indigo-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Globe className="h-4 w-4 text-slate-700" />
                    Pay with Stripe (International)
                  </span>
                  <span className="text-[11px] font-medium text-slate-600">
                    {paymentConfig?.stripe.mode === 'test-gateway' ? 'Test Keys' : 'Sandbox'}
                  </span>
                </div>
                <span className="mt-1 text-xs text-slate-600">
                  Global Visa, Mastercard, Apple Pay · ₹49/mo
                </span>
              </button>
            </div>
          )}

          {showDocs && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-900">Server-Authoritative Payment &amp; Webhook Setup</p>
              <p>
                Premium entitlements are never unlocked on client redirects. Every order/session is bound to your verified Firebase UID and verified server-side via HMAC-SHA256 (Razorpay) or Stripe Checkout retrieval + webhooks.
              </p>
              <div className="font-mono-tabular rounded-lg bg-white border border-slate-200 p-3 text-[11px] space-y-1">
                <p>Razorpay Webhook: POST {paymentConfig?.webhookPaths.razorpay || '/api/payments/webhooks/razorpay'}</p>
                <p>Stripe Webhook: POST {paymentConfig?.webhookPaths.stripe || '/api/payments/webhooks/stripe'}</p>
                <p>Env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Verified Receipts Ledger */}
      {receipts.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-bold text-slate-900">Verified Payment History</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Gateway</th>
                  <th className="pb-2 font-semibold">Order / Session ID</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => (
                  <tr key={r.id} className="h-10">
                    <td className="font-mono-tabular text-slate-600">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="capitalize font-medium text-slate-800">
                      {r.provider} ({r.mode})
                    </td>
                    <td className="font-mono-tabular text-slate-500">{r.orderId}</td>
                    <td className="text-right font-mono-tabular text-slate-900">
                      ₹{(r.amount / 100).toFixed(0)} {r.currency}
                    </td>
                    <td className="text-right font-semibold text-emerald-700">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sandbox Test Checkout Modal */}
      {sandboxModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>Sandbox Test Checkout</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {sandboxModal.provider === 'razorpay' ? 'Razorpay Test Mode (India)' : 'Stripe Test Checkout'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSandboxModal(null)}
                aria-label="Close checkout dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
              <p className="font-semibold text-slate-900">VocabFlow Premium Monthly</p>
              <p className="text-slate-600">{sandboxModal.amountLabel}</p>
              <p className="font-mono-tabular text-[11px] text-slate-500">
                Server Order ID: {sandboxModal.orderId}
              </p>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              No live gateway keys are configured in <code className="font-mono">.env</code> yet, so this sandbox simulates the gateway callback and still runs full server-side cryptographic signature &amp; session verification.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => handleSandboxOutcome('success')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Simulate Successful Payment &amp; Verify</span>
              </button>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => handleSandboxOutcome('failure')}
                className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                Simulate Declined Card / Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
