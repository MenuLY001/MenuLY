import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, billingApi, ApiError } from '../lib/api';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'form' | 'processing' | 'payment' | 'success';

interface FormData {
  restaurant_name: string;
  restaurant_slug: string;
  email: string;
  password: string;
  confirm_password: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function getDaysLeft(trialEndsAt: string): number {
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormData>({
    restaurant_name: '',
    restaurant_slug: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    access_token: string;
    trial_ends_at: string;
    restaurant: { name: string; slug: string };
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'verifying' | 'done' | 'skipped'>('idle');

  // Auto-generate slug from restaurant name
  useEffect(() => {
    if (!slugManuallyEdited && form.restaurant_name) {
      setForm(f => ({ ...f, restaurant_slug: slugify(f.restaurant_name) }));
    }
  }, [form.restaurant_name, slugManuallyEdited]);

  const updateField = (field: keyof FormData, value: string) => {
    setError(null);
    setForm(f => ({ ...f, [field]: value }));
  };

  // ─── Step 1: Submit registration form ───────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!form.restaurant_slug) {
      setError('Slug is required.');
      return;
    }

    setSubmitting(true);
    setStep('processing');

    try {
      const result = await authApi.register({
        restaurant_name: form.restaurant_name,
        restaurant_slug: form.restaurant_slug,
        email: form.email,
        password: form.password,
      });

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError || !authData.session) {
        throw new Error('Account created, but auto-login failed. Please sign in manually.');
      }

      setRegistrationResult({
        access_token: authData.session.access_token,
        trial_ends_at: result.trial_ends_at,
        restaurant: { name: result.restaurant.name, slug: result.restaurant.slug },
      });

      setStep('payment');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2: Open Razorpay Checkout ─────────────────────────────────────────
  const handleActivateAutopay = async () => {
    if (!registrationResult?.access_token) return;
    setError(null);

    try {
      const { subscription_id, key_id } = await billingApi.createSubscription(
        registrationResult.access_token
      );

      // Open Razorpay Checkout
      const rzp = new ((window as unknown) as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } }).Razorpay({
        key: key_id,
        subscription_id,
        name: 'Menuly',
        description: '₹299/month — Restaurant QR Menu Platform',
        image: 'https://menuly.shop/favicon.svg',
        theme: { color: '#e67e22' },
        prefill: { email: form.email },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          setPaymentStatus('verifying');
          try {
            await billingApi.verifyPayment(registrationResult.access_token, response);
            setPaymentStatus('done');
          } catch {
            setPaymentStatus('done'); // Even if verify fails, let them in — webhook will reconcile
          }
        },
        modal: {
          ondismiss: () => {
            // User closed checkout — that's fine, they can activate later from admin
            setPaymentStatus('skipped');
          },
        },
      });
      rzp.open();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not start payment. Please try from your dashboard.';
      setError(msg);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/admin');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="reg-root">
      <div className="reg-card">
        {/* Header */}
        <div className="reg-header">
          <div className="reg-logo">🍽️</div>
          <h1 className="reg-title">Join Menuly</h1>
          <p className="reg-subtitle">Your digital QR menu, live in minutes.</p>
        </div>

        {/* Step: Form */}
        {step === 'form' && (
          <form className="reg-form" onSubmit={handleRegister} noValidate>
            <div className="reg-section-label">Restaurant</div>

            <div className="reg-field">
              <label htmlFor="reg-name">Restaurant Name</label>
              <input
                id="reg-name"
                type="text"
                value={form.restaurant_name}
                onChange={e => updateField('restaurant_name', e.target.value)}
                placeholder="e.g. Spice Garden"
                required
                maxLength={120}
                autoFocus
              />
            </div>

            <div className="reg-field">
              <label htmlFor="reg-slug">
                Menu URL slug
                <span className="reg-hint"> — menuly.shop/menu/<strong>{form.restaurant_slug || 'your-slug'}</strong></span>
              </label>
              <input
                id="reg-slug"
                type="text"
                value={form.restaurant_slug}
                onChange={e => {
                  setSlugManuallyEdited(true);
                  updateField('restaurant_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                }}
                placeholder="spice-garden"
                required
                maxLength={60}
                pattern="[a-z0-9-]+"
              />
              <span className="reg-field-hint">Lowercase letters, numbers, hyphens only. Cannot be changed later.</span>
            </div>

            <div className="reg-divider" />

            <div className="reg-section-label">Admin account</div>

            <div className="reg-field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="you@restaurant.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="reg-field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="reg-field">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                value={form.confirm_password}
                onChange={e => updateField('confirm_password', e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </div>

            {error && <div className="reg-error" role="alert">{error}</div>}

            <div className="reg-plan-badge">
              <span className="reg-plan-icon">⚡</span>
              <span>
                <strong>₹299/month</strong> after your 7-day free trial.
                Set up autopay after registration.
              </span>
            </div>

            <button
              type="submit"
              className="reg-btn reg-btn--primary"
              disabled={
                submitting ||
                !form.restaurant_name ||
                !form.restaurant_slug ||
                !form.email ||
                !form.password ||
                !form.confirm_password
              }
            >
              {submitting ? <span className="reg-spinner" /> : 'Create Restaurant Account'}
            </button>

            <p className="reg-login-link">
              Already have an account?{' '}
              <a href="/admin">Sign in →</a>
            </p>
          </form>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="reg-state">
            <div className="reg-spinner reg-spinner--large" />
            <p>Creating your restaurant account…</p>
          </div>
        )}

        {/* Step: Payment Setup */}
        {step === 'payment' && registrationResult && (
          <div className="reg-payment">
            <div className="reg-success-icon">✅</div>
            <h2 className="reg-success-title">
              Welcome, {registrationResult.restaurant.name}!
            </h2>
            <p className="reg-success-body">
              Your account is ready. You have{' '}
              <strong>{getDaysLeft(registrationResult.trial_ends_at)} days</strong> of free trial.
            </p>

            {paymentStatus === 'idle' && (
              <>
                <div className="reg-plan-detail">
                  <div className="reg-plan-detail__row">
                    <span>Plan</span><strong>Menuly Pro</strong>
                  </div>
                  <div className="reg-plan-detail__row">
                    <span>Amount</span><strong>₹299 / month</strong>
                  </div>
                  <div className="reg-plan-detail__row">
                    <span>Billing</span><strong>Monthly autopay</strong>
                  </div>
                  <div className="reg-plan-detail__row">
                    <span>First charge</span><strong>After 7-day trial</strong>
                  </div>
                </div>

                {error && <div className="reg-error" role="alert">{error}</div>}

                <button
                  className="reg-btn reg-btn--primary"
                  onClick={handleActivateAutopay}
                >
                  ⚡ Set Up Autopay — ₹299/month
                </button>
                <button
                  className="reg-btn reg-btn--ghost"
                  onClick={() => setPaymentStatus('skipped')}
                >
                  Skip — set up later from dashboard
                </button>
              </>
            )}

            {paymentStatus === 'verifying' && (
              <div className="reg-state" style={{ gap: 12 }}>
                <div className="reg-spinner reg-spinner--large" />
                <p>Verifying payment…</p>
              </div>
            )}

            {(paymentStatus === 'done' || paymentStatus === 'skipped') && (
              <>
                {paymentStatus === 'done' && (
                  <div className="reg-payment-done">
                    🎉 Autopay activated! Your subscription is now active.
                  </div>
                )}
                {paymentStatus === 'skipped' && (
                  <div className="reg-payment-skip">
                    ℹ️ You can activate autopay anytime from the Billing section in your dashboard.
                    Your trial ends in <strong>{getDaysLeft(registrationResult.trial_ends_at)} days</strong>.
                  </div>
                )}
                <button
                  className="reg-btn reg-btn--primary"
                  onClick={handleGoToDashboard}
                  style={{ marginTop: 16 }}
                >
                  Go to Dashboard →
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .reg-root {
          min-height: 100dvh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        .reg-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4);
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reg-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .reg-logo {
          font-size: 44px;
          margin-bottom: 8px;
        }
        .reg-title {
          font-family: var(--font-serif, 'Playfair Display', serif);
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1;
          margin: 0 0 4px;
        }
        .reg-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        .reg-section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #9ca3af;
          margin-bottom: 12px;
        }
        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .reg-field label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .reg-hint {
          font-weight: 400;
          color: #9ca3af;
          font-size: 12px;
        }
        .reg-field input {
          padding: 11px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a2e;
          background: #f9fafb;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
          font-family: inherit;
        }
        .reg-field input:focus {
          border-color: #e67e22;
          box-shadow: 0 0 0 3px rgba(230,126,34,0.15);
          background: #fff;
        }
        .reg-field-hint {
          font-size: 11px;
          color: #9ca3af;
        }
        .reg-divider {
          height: 1px;
          background: #f0f2f8;
          margin: 4px 0;
        }
        .reg-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        .reg-plan-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #fff7ed, #fef3c7);
          border: 1px solid #fed7aa;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13px;
          color: #92400e;
        }
        .reg-plan-icon { font-size: 18px; flex-shrink: 0; }
        .reg-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          transition: opacity 0.15s, transform 0.15s;
          cursor: pointer;
        }
        .reg-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .reg-btn--primary {
          background: #e67e22;
          color: #fff;
        }
        .reg-btn--primary:hover:not(:disabled) { opacity: 0.88; }
        .reg-btn--primary:active:not(:disabled) { transform: scale(0.98); }
        .reg-btn--ghost {
          background: transparent;
          color: #6b7280;
          border: 1.5px solid #e5e7eb;
          font-size: 14px;
          margin-top: 6px;
        }
        .reg-btn--ghost:hover:not(:disabled) { background: #f9fafb; }
        .reg-login-link {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .reg-login-link a {
          color: #e67e22;
          font-weight: 600;
          text-decoration: none;
        }
        .reg-login-link a:hover { text-decoration: underline; }
        .reg-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .reg-spinner--large {
          width: 36px;
          height: 36px;
          border: 3px solid #e5e7eb;
          border-top-color: #e67e22;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .reg-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 32px 0;
          color: #6b7280;
          font-size: 15px;
        }
        .reg-payment {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .reg-success-icon {
          font-size: 40px;
          text-align: center;
        }
        .reg-success-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          text-align: center;
          margin: 0;
        }
        .reg-success-body {
          text-align: center;
          color: #6b7280;
          font-size: 15px;
          margin: 0;
        }
        .reg-plan-detail {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .reg-plan-detail__row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #374151;
        }
        .reg-plan-detail__row span { color: #9ca3af; }
        .reg-payment-done {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
        .reg-payment-skip {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          text-align: center;
        }
        @media (max-width: 520px) {
          .reg-card { padding: 28px 20px; border-radius: 16px; }
        }
      `}</style>
    </div>
  );
}
