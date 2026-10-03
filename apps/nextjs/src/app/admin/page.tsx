'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Session } from '@supabase/supabase-js';

// ─── Toast system ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: string; type: 'success'|'error'|'info'; title: string; msg?: string }[]>([]);
  const add = (type: 'success'|'error'|'info', title: string, msg?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === 'error' ? 6000 : 4000);
  };
  return { toasts, success: (t: string, m?: string) => add('success', t, m), error: (t: string, m?: string) => add('error', t, m), info: (t: string, m?: string) => add('info', t, m) };
}

const TOAST_COLORS = { success: { bg:'#f0fdf4', border:'#86efac', text:'#15803d', icon:'✅' }, error: { bg:'#fef2f2', border:'#fca5a5', text:'#dc2626', icon:'❌' }, info: { bg:'#eff6ff', border:'#93c5fd', text:'#1d4ed8', icon:'ℹ️' } };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(iso: string | null) { return iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function daysLeft(iso: string) { return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)); }
function fmtPaise(p: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p / 100); }

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  active:    { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0' },
  trialing:  { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  past_due:  { bg:'#fffbeb', color:'#b45309', border:'#fde68a' },
  suspended: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  cancelled: { bg:'#f9fafb', color:'#6b7280', border:'#e5e7eb' },
};

// ─── AdminPage ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'billing'>('menu');
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && activeTab === 'billing') loadBilling();
  }, [session, activeTab]); // eslint-disable-line

  async function loadBilling() {
    if (!session) return;
    setBillingLoading(true);
    try {
      const res = await fetch('/api/admin/billing', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      setBilling(data);
    } finally { setBillingLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  }

  async function handleActivateAutopay() {
    if (!session) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/billing/create-subscription', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } });
      const { subscription_id, key_id, error } = await res.json();
      if (error) { toast.error('Payment Error', error); return; }
      const win = window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } };
      const rzp = new win.Razorpay({
        key: key_id, subscription_id, name: 'Menuly',
        description: '₹299/month — Restaurant QR Menu Platform',
        theme: { color: '#e67e22' },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            await fetch('/api/admin/billing/verify-payment', {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            toast.success('🎉 Autopay Activated!', 'Your subscription is now active.');
            setTimeout(() => window.location.reload(), 2000);
          } catch { toast.info('Payment recorded', 'Your plan will activate shortly.'); }
        },
        modal: { ondismiss: () => setActionLoading(false) },
      });
      rzp.open();
    } catch { toast.error('Payment Error', 'Could not start payment.'); setActionLoading(false); }
  }

  async function handleCancelSubscription() {
    if (!session) return;
    setShowCancelConfirm(false); setActionLoading(true);
    try {
      const res = await fetch('/api/admin/billing/cancel', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (data.error) toast.error('Cancel Failed', data.error);
      else { toast.success('Subscription Cancelled', data.message); loadBilling(); }
    } catch { toast.error('Error', 'Failed to cancel subscription.'); }
    finally { setActionLoading(false); }
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#e67e22', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!session) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🍽️</div>
          <h1 style={{ fontSize:24, fontWeight:800, margin:'0 0 4px', color:'#1a1a2e' }}>Admin Login</h1>
          <p style={{ color:'#6b7280', fontSize:14, margin:0 }}>Sign in to manage your menu</p>
        </div>
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {loginError && <p style={{ color:'#ef4444', fontSize:13, margin:0 }}>{loginError}</p>}
          <button type="submit" style={primaryBtn} disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6b7280' }}>
          Don&apos;t have an account? <a href="/register" style={{ color:'#e67e22', fontWeight:600 }}>Register</a>
        </p>
      </div>
    </div>
  );

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const bil = billing as Record<string, unknown> | null;
  const status = (bil?.status as string) ?? 'active';
  const ss = STATUS_STYLE[status] ?? STATUS_STYLE.active;
  const sub = bil?.subscription as Record<string, unknown> | null;
  const plan = bil?.plan as Record<string, unknown> | null;
  const payments = (bil?.payments as Record<string, unknown>[]) ?? [];
  const hasActiveSub = ['authenticated','active'].includes((sub?.status as string) ?? '');
  const cancelPending = sub?.cancel_at_period_end as boolean;
  const trialEndsAt = bil?.trial_ends_at as string | null;

  return (
    <div style={{ minHeight:'100dvh', background:'#f8fafc', fontFamily:'Inter, sans-serif' }}>
      {/* Toast Container */}
      <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
        {toast.toasts.map(t => {
          const c = TOAST_COLORS[t.type];
          return (
            <div key={t.id} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12,
              padding:'14px 16px', display:'flex', gap:10, maxWidth:380, boxShadow:'0 8px 24px rgba(0,0,0,.1)',
              animation:'slideIn .3s ease' }}>
              <span style={{ fontSize:18 }}>{c.icon}</span>
              <div><div style={{ fontWeight:700, fontSize:13, color:c.text }}>{t.title}</div>
              {t.msg && <div style={{ fontSize:12, color:'#374151', marginTop:2 }}>{t.msg}</div>}</div>
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <nav style={{ background:'#1a1a2e', color:'#fff', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:800, fontSize:18 }}>🍽️ Menuly Admin</span>
        <button onClick={() => supabase.auth.signOut()} style={{ background:'transparent', border:'1px solid #ffffff33', color:'#fff', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Sign out</button>
      </nav>

      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px', display:'flex', gap:0 }}>
        {(['menu', 'billing'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding:'14px 20px', background:'none', border:'none', cursor:'pointer',
              fontWeight:600, fontSize:14, fontFamily:'inherit', textTransform:'capitalize',
              color:activeTab===tab ? '#e67e22' : '#6b7280',
              borderBottom:activeTab===tab ? '2px solid #e67e22' : '2px solid transparent' }}>
            {tab === 'menu' ? '📋 Menu' : '💳 Billing'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:24 }}>
        {activeTab === 'menu' && (
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e5e7eb' }}>
            <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700 }}>Your Menu</h2>
            <p style={{ color:'#6b7280', fontSize:14 }}>Manage your menu items and categories in the full admin panel.</p>
            <p style={{ fontSize:14, color:'#374151' }}>Your public menu: <a href={`/menu/${session.user.email?.split('@')[0]}`} target="_blank" rel="noreferrer" style={{ color:'#e67e22', fontWeight:600 }}>View Menu</a></p>
          </div>
        )}

        {activeTab === 'billing' && (
          billingLoading ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#e67e22', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto' }} />
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Status Card */}
              <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e5e7eb', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#9ca3af', marginBottom:4 }}>Menuly Pro</div>
                    <div style={{ fontSize:28, fontWeight:800 }}>₹299 <span style={{ fontSize:16, fontWeight:500, color:'#9ca3af' }}>/month</span></div>
                  </div>
                  <span style={{ padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600, background:ss.bg, color:ss.color, border:`1.5px solid ${ss.border}` }}>
                    {status}
                  </span>
                </div>

                <div style={{ borderTop:'1px solid #f0f2f8', paddingTop:16, display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                  {trialEndsAt && status === 'trialing' && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                      <span style={{ color:'#9ca3af' }}>Trial ends</span>
                      <strong>{fmt(trialEndsAt)} <span style={{ color:'#1d4ed8' }}>({daysLeft(trialEndsAt)} days left)</span></strong>
                    </div>
                  )}
                  {(sub?.current_period_end as string | null) && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                      <span style={{ color:'#9ca3af' }}>Next billing</span>
                      <strong>{fmt(sub!.current_period_end as string)}</strong>
                    </div>
                  )}
                  {(plan?.price_paise as number | null) && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                      <span style={{ color:'#9ca3af' }}>Amount</span>
                      <strong>{fmtPaise(plan!.price_paise as number)}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {!hasActiveSub && status !== 'cancelled' && (
                    <button onClick={handleActivateAutopay} disabled={actionLoading} style={{ ...primaryBtn, width:'100%' }}>
                      {actionLoading ? 'Opening payment…' : '⚡ Activate Autopay — ₹299/month'}
                    </button>
                  )}
                  {hasActiveSub && !cancelPending && (
                    <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading}
                      style={{ background:'transparent', border:'1.5px solid #e5e7eb', color:'#6b7280', padding:'11px 20px', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                      Cancel subscription
                    </button>
                  )}
                </div>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e5e7eb' }}>
                  <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700 }}>Payment History</h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr>{['Date','Amount','Status','Ref'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'#9ca3af', fontSize:12, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f0f2f8' }}>
                            <td style={{ padding:'12px' }}>{fmt(p.created_at as string)}</td>
                            <td style={{ padding:'12px' }}>{fmtPaise(p.amount_paise as number)}</td>
                            <td style={{ padding:'12px' }}><span style={{ color: p.status === 'captured' ? '#15803d' : '#dc2626', fontWeight:600 }}>{p.status === 'captured' ? '✅ Paid' : '❌ Failed'}</span></td>
                            <td style={{ padding:'12px', color:'#9ca3af', fontFamily:'monospace', fontSize:11 }}>{(p.razorpay_payment_id as string)?.slice(0,18) ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Confirm Cancel Modal */}
      {showCancelConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:20 }}
          onClick={() => setShowCancelConfirm(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:400, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Cancel Subscription?</div>
            <p style={{ color:'#6b7280', fontSize:14, lineHeight:1.6, marginBottom:24 }}>You will keep full access until the end of your current billing period. After that, your menu will be suspended.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{ padding:'10px 20px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Keep Subscription</button>
              <button onClick={handleCancelSubscription} style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
const primaryBtn: React.CSSProperties = { background:'#e67e22', color:'#fff', border:'none', borderRadius:10, padding:'12px 20px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' };
