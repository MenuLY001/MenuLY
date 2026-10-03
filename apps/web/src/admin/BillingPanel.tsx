import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { billingApi, ApiError } from '../lib/api';
import { BillingInfo } from '@qr-menu/types';
import { useToastHelpers, ConfirmModal } from '../components/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(paise: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(paise / 100);
}

function getDaysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

type StatusColor = { bg: string; text: string; border: string };

const STATUS_STYLES: Record<string, StatusColor> = {
  active:    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  trialing:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  past_due:  { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  suspended: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  cancelled: { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
};

const STATUS_LABELS: Record<string, string> = {
  active:    '✅ Active',
  trialing:  '⏳ Free Trial',
  past_due:  '⚠️ Payment Due',
  suspended: '🔴 Suspended',
  cancelled: '⭕ Cancelled',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingPanel() {
  const { token } = useAuth();
  const toast = useToastHelpers();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    billingApi.getBilling(token)
      .then(setBilling)
      .catch(() => setError('Failed to load billing information.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleActivateAutopay = async () => {
    if (!token) return;
    setActionLoading(true);
    setError(null);
    try {
      const { subscription_id, key_id } = await billingApi.createSubscription(token);

      const rzp = new ((window as unknown) as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } }).Razorpay({
        key: key_id,
        subscription_id,
        name: 'Menuly',
        description: '₹299/month — Restaurant QR Menu Platform',
        theme: { color: '#e67e22' },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            await billingApi.verifyPayment(token, response);
            toast.success('🎉 Autopay Activated!', 'Your subscription is now active. Reloading…');
            setTimeout(() => window.location.reload(), 2500);
          } catch {
            toast.info('Payment recorded', 'Your plan will activate shortly.');
          }
        },
        modal: {
          ondismiss: () => setActionLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not start payment.';
      toast.error('Payment Error', msg);
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setShowCancelConfirm(false);
    setActionLoading(true);
    try {
      const result = await billingApi.cancelSubscription(token);
      toast.success('Subscription Cancelled', result.message);
      const updated = await billingApi.getBilling(token);
      setBilling(updated);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to cancel subscription.';
      toast.error('Cancel Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <div className="billing-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-error-card">{error}</div>
    );
  }

  const status = billing?.status ?? 'active';
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.active;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const trialDaysLeft = billing?.trial_ends_at ? getDaysLeft(billing.trial_ends_at) : null;
  const hasActiveSub = ['authenticated', 'active'].includes(billing?.subscription?.status ?? '');
  const isCancelPending = billing?.subscription?.cancel_at_period_end;

  return (
    <div className="billing-root">
      <h2 className="billing-page-title">Billing &amp; Subscription</h2>

      {/* ── Status banner ── */}
      {status === 'past_due' && (
        <div className="billing-alert billing-alert--warn">
          ⚠️ <strong>Payment is past due.</strong> Update your payment method in Razorpay to keep your menu live.
          Your menu stays active for 7 days after a failed payment.
        </div>
      )}
      {status === 'suspended' && (
        <div className="billing-alert billing-alert--danger">
          🔴 <strong>Your menu is suspended.</strong> Activate autopay below to restore access.
        </div>
      )}

      {/* ── Plan card ── */}
      <div className="billing-card">
        <div className="billing-card__header">
          <div>
            <div className="billing-card__plan-name">Menuly Pro</div>
            <div className="billing-card__plan-price">₹299 <span>/month</span></div>
          </div>
          <div
            className="billing-status-badge"
            style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
          >
            {statusLabel}
          </div>
        </div>

        <div className="billing-card__details">
          {status === 'trialing' && billing?.trial_ends_at && (
            <div className="billing-detail-row">
              <span>Trial ends</span>
              <strong>
                {formatDate(billing.trial_ends_at)}
                {trialDaysLeft !== null && (
                  <span className="billing-trial-days"> ({trialDaysLeft} days left)</span>
                )}
              </strong>
            </div>
          )}
          {billing?.subscription?.current_period_end && (
            <div className="billing-detail-row">
              <span>Next billing date</span>
              <strong>{formatDate(billing.subscription.current_period_end)}</strong>
            </div>
          )}
          {billing?.plan?.price_paise && (
            <div className="billing-detail-row">
              <span>Amount</span>
              <strong>{formatAmount(billing.plan.price_paise)}</strong>
            </div>
          )}
          {isCancelPending && (
            <div className="billing-detail-row">
              <span>Cancellation</span>
              <strong style={{ color: '#b45309' }}>At end of period</strong>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="billing-actions">
          {!hasActiveSub && status !== 'cancelled' && (
            <button
              className="billing-btn billing-btn--primary"
              onClick={handleActivateAutopay}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="billing-spinner" /> : '⚡ Activate Autopay — ₹299/month'}
            </button>
          )}
          {hasActiveSub && !isCancelPending && (
            <button
              className="billing-btn billing-btn--ghost"
              onClick={() => setShowCancelConfirm(true)}
              disabled={actionLoading}
            >
              Cancel subscription
            </button>
          )}
        </div>
      </div>

      {showCancelConfirm && (
        <ConfirmModal
          title="Cancel Subscription?"
          message="You will keep full access until the end of your current billing period. After that, your menu will be suspended."
          confirmLabel="Yes, Cancel"
          cancelLabel="Keep Subscription"
          danger
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* ── Payment history ── */}
      <div className="billing-section">
        <h3 className="billing-section-title">Payment History</h3>
        {(!billing?.payments || billing.payments.length === 0) ? (
          <p className="billing-empty">No payments yet.</p>
        ) : (
          <div className="billing-table-wrap">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.created_at)}</td>
                    <td>{formatAmount(p.amount_paise, p.currency)}</td>
                    <td>
                      <span className={`billing-payment-status billing-payment-status--${p.status}`}>
                        {p.status === 'captured' ? '✅ Paid' : p.status === 'failed' ? '❌ Failed' : '↩ Refunded'}
                      </span>
                    </td>
                    <td className="billing-ref">{p.razorpay_payment_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .billing-root { display: flex; flex-direction: column; gap: 24px; }
        .billing-page-title {
          font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0;
        }
        .billing-alert {
          padding: 14px 18px; border-radius: 12px; font-size: 14px;
        }
        .billing-alert--warn  { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
        .billing-alert--danger { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .billing-card {
          background: #fff; border-radius: 16px; padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .billing-card__header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 20px;
        }
        .billing-card__plan-name {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px;
        }
        .billing-card__plan-price {
          font-size: 28px; font-weight: 800; color: #1a1a2e;
        }
        .billing-card__plan-price span { font-size: 16px; font-weight: 500; color: #9ca3af; }
        .billing-status-badge {
          padding: 6px 14px; border-radius: 20px; font-size: 13px;
          font-weight: 600; border: 1.5px solid;
        }
        .billing-card__details {
          display: flex; flex-direction: column; gap: 10px;
          border-top: 1px solid #f0f2f8; padding-top: 16px; margin-bottom: 20px;
        }
        .billing-detail-row {
          display: flex; justify-content: space-between; font-size: 14px; color: #374151;
        }
        .billing-detail-row span { color: #9ca3af; }
        .billing-trial-days { color: #1d4ed8; font-weight: 700; }
        .billing-action-msg {
          padding: 10px 14px; border-radius: 8px; font-size: 13px;
          font-weight: 500; margin-bottom: 12px;
        }
        .billing-action-msg--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
        .billing-action-msg--error   { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .billing-actions { display: flex; flex-direction: column; gap: 8px; }
        .billing-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 20px; border-radius: 10px; font-size: 15px; font-weight: 700;
          font-family: inherit; cursor: pointer; transition: opacity 0.15s, transform 0.15s;
          min-height: 48px;
        }
        .billing-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .billing-btn--primary {
          background: #e67e22; color: #fff; width: 100%;
        }
        .billing-btn--primary:hover:not(:disabled) { opacity: 0.88; }
        .billing-btn--primary:active:not(:disabled) { transform: scale(0.98); }
        .billing-btn--ghost {
          background: transparent; color: #6b7280;
          border: 1.5px solid #e5e7eb; font-size: 14px;
        }
        .billing-btn--ghost:hover:not(:disabled) { background: #f9fafb; }
        .billing-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .billing-section-title {
          font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;
        }
        .billing-empty { color: #9ca3af; font-size: 14px; }
        .billing-table-wrap { overflow-x: auto; }
        .billing-table {
          width: 100%; border-collapse: collapse; font-size: 14px;
        }
        .billing-table th {
          text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;
          border-bottom: 1px solid #e5e7eb;
        }
        .billing-table td {
          padding: 12px; border-bottom: 1px solid #f0f2f8; color: #374151;
        }
        .billing-table tbody tr:last-child td { border-bottom: none; }
        .billing-payment-status { font-size: 13px; font-weight: 600; }
        .billing-payment-status--captured { color: #15803d; }
        .billing-payment-status--failed   { color: #dc2626; }
        .billing-payment-status--refunded { color: #6b7280; }
        .billing-ref { color: #9ca3af; font-size: 12px; font-family: monospace; }
        .billing-error-card {
          background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
          padding: 16px; border-radius: 12px; font-size: 14px;
        }
      `}</style>
    </div>
  );
}
