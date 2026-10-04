'use client';
import { useState, useEffect } from 'react';
import { useToast, BRAND, btnP, Spinner, Modal, apiFetch, fmtDate, daysLeft } from './shared';

export function BillingPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const load = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    apiFetch(token, '/api/admin/billing')
      .then(d => { if (!cancelled) setBilling(d && !d.error ? d : null); })
      .catch(() => { if (!cancelled) setBilling(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const status = (billing?.status as string) ?? '';
  const sub = billing?.subscription as Record<string, unknown> | null;
  const plan = billing?.plan as Record<string, unknown> | null;
  const payments = (billing?.payments as Record<string, unknown>[]) ?? [];
  const trialEndsAt = billing?.trial_ends_at as string | null;
  const hasActiveSub = ['authenticated', 'active'].includes((sub?.status as string) ?? '');
  const cancelPending = sub?.cancel_at_period_end as boolean;
  const SS: Record<string, { bg: string; color: string; border: string }> = {
    active:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    trialing:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    past_due:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    suspended: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    cancelled: { bg: '#f9fafb', color: 'var(--text-sub)', border: '#e5e7eb' },
  };
  const ss = SS[status] ?? SS.active;

  const activateAutopay = async () => {
    setActionLoading(true);
    try {
      const { subscription_id, key_id, error } = await apiFetch(token, '/api/admin/billing/create-subscription', { method: 'POST' });
      if (error) { toast.error('Payment Error', error); setActionLoading(false); return; }

      const win = window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open(): void } };
      if (!win.Razorpay) {
        toast.error('Payment Error', 'Razorpay checkout not loaded. Please refresh the page and try again.');
        setActionLoading(false);
        return;
      }

      const rzp = new win.Razorpay({
        key: key_id,
        subscription_id,
        name: 'Menuly',
        description: '₹299/month',
        theme: { color: BRAND },
        prefill: {},
        handler: async (response: Record<string, string>) => {
          try {
            const result = await apiFetch(token, '/api/admin/billing/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (result?.error) {
              toast.error('Verification Failed', result.error);
            } else {
              toast.success('🎉 Autopay Activated!', 'Your restaurant is now active.');
              load();
            }
          } catch {
            toast.error('Verification Error', 'Payment received but verification failed. Contact support.');
          } finally {
            setActionLoading(false);
          }
        },
        modal: {
          ondismiss: () => setActionLoading(false),
        },
      });
      rzp.open();
    } catch {
      toast.error('Payment Error', 'Could not start payment. Please try again.');
      setActionLoading(false);
    }
  };

  const cancelSub = async () => {
    setShowCancel(false); setActionLoading(true);
    try {
      const d = await apiFetch(token, '/api/admin/billing/cancel', { method: 'POST' });
      if (d.error) toast.error('Cancel Failed', d.error);
      else { toast.success('Subscription Cancelled', d.message); load(); }
    } finally { setActionLoading(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="panel">
      <h1 className="panel__title">Billing</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Status card */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-sub)', marginBottom: 6 }}>Menuly Pro</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)' }}>₹299 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-sub)' }}>/month</span></div>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: ss.bg, color: ss.color, border: `1.5px solid ${ss.border}` }}>{status}</span>
          </div>
          <div style={{ borderTop: '1px solid #f0f2f8', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {trialEndsAt && status === 'trialing' && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span style={{ color: 'var(--text-sub)' }}>Trial ends</span><strong style={{ color: 'var(--text-main)' }}>{fmtDate(trialEndsAt)} <span style={{ color: '#1d4ed8' }}>({daysLeft(trialEndsAt)} days left)</span></strong></div>}
            {(sub?.current_period_end as string | null | undefined) && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span style={{ color: 'var(--text-sub)' }}>Next billing</span><strong style={{ color: 'var(--text-main)' }}>{fmtDate(sub!.current_period_end as string)}</strong></div>}
            {(plan?.price_paise as number | null | undefined) && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span style={{ color: 'var(--text-sub)' }}>Amount</span><strong style={{ color: 'var(--text-main)' }}>₹{Math.round((plan!.price_paise as number) / 100)}/month</strong></div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!hasActiveSub && status !== 'cancelled' && (
              <button onClick={activateAutopay} disabled={actionLoading} style={{ ...btnP, padding: '12px 20px' }}>
                {actionLoading ? 'Opening payment…' : '⚡ Activate Autopay — ₹299/month'}
              </button>
            )}
            {hasActiveSub && !cancelPending && (
              <button onClick={() => setShowCancel(true)} disabled={actionLoading} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'center', marginTop: 8 }}>Cancel subscription</button>
            )}
          </div>
        </div>
        {/* Payment history */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>Payment History</h3>
          {payments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr>{['Date', 'Amount', 'Status', 'Ref'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #f0f2f8' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f2f8' }}>
                      <td style={{ padding: '14px 12px', color: '#374151', fontWeight: 500 }}>{fmtDate(p.created_at as string)}</td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-main)', fontWeight: 700 }}>₹{Math.round((p.amount_paise as number) / 100)}</td>
                      <td style={{ padding: '14px 12px' }}><span style={{ color: p.status === 'captured' ? '#15803d' : '#dc2626', fontWeight: 700, background: p.status === 'captured' ? '#f0fdf4' : '#fef2f2', padding: '4px 8px', borderRadius: 6 }}>{p.status === 'captured' ? '✓ Paid' : '✕ Failed'}</span></td>
                      <td style={{ padding: '14px 12px', color: 'var(--text-sub)', fontFamily: 'monospace', fontSize: 12 }}>{(p.razorpay_payment_id as string)?.slice(0, 18) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--text-sub)', fontSize: 14, textAlign: 'center', padding: '32px 0', background: 'var(--bg-main)', borderRadius: 12 }}>
              No payments yet.
            </div>
          )}
        </div>
      </div>
      {showCancel && (
        <Modal title="Cancel Subscription?" onClose={() => setShowCancel(false)}>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>You will keep full access until the end of your current billing period. After that, your menu will be suspended.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCancel(false)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--bg-hover)', color: '#374151', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Keep Subscription</button>
            <button onClick={cancelSub} disabled={actionLoading} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{actionLoading ? 'Cancelling…' : 'Yes, Cancel'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
