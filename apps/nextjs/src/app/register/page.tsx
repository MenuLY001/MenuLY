'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

type Step = 'form' | 'payment' | 'done';

const inputStyle: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit', transition:'border-color .15s' };
const primaryBtn: React.CSSProperties = { width:'100%', background:'linear-gradient(135deg,#e67e22,#d35400)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ restaurant_name:'', restaurant_slug:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle'|'verifying'|'done'|'skipped'>('idle');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = k === 'restaurant_slug' ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }

      // Auto-login
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (authErr || !authData.session) { setError('Account created. Please log in.'); router.push('/admin'); return; }
      setAccessToken(authData.session.access_token);
      setStep('payment');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function handleStartPayment() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/billing/create-subscription', {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      const { subscription_id, key_id, error: apiErr } = await res.json();
      if (apiErr) { setError(apiErr); return; }
      const win = window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } };
      const rzp = new win.Razorpay({
        key: key_id, subscription_id, name: 'Menuly',
        description: '₹299/month — Restaurant QR Menu Platform',
        image: '/favicon.ico', theme: { color: '#e67e22' }, prefill: { email: form.email },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          setPaymentStatus('verifying');
          try {
            await fetch('/api/admin/billing/verify-payment', {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
          } finally { setPaymentStatus('done'); setStep('done'); }
        },
        modal: { ondismiss: () => { setPaymentStatus('skipped'); setStep('done'); } },
      });
      rzp.open();
    } catch { setError('Could not start payment.'); }
    finally { setLoading(false); }
  }

  // ── Step: Form ─────────────────────────────────────────────────────────────
  if (step === 'form') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🍽️</div>
          <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px', color:'#1a1a2e' }}>Join Menuly</h1>
          <p style={{ color:'#6b7280', fontSize:14, margin:0 }}>Your digital QR menu, live in minutes</p>
        </div>

        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Restaurant Name</label>
            <input style={inputStyle} placeholder="Spice Garden" value={form.restaurant_name} onChange={set('restaurant_name')} required minLength={2} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Menu URL Slug</label>
            <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
              <span style={{ padding:'11px 12px', background:'#f9fafb', color:'#9ca3af', fontSize:13, flexShrink:0 }}>menuly.shop/menu/</span>
              <input style={{ ...inputStyle, border:'none', borderRadius:0, flex:1 }} placeholder="spice-garden" value={form.restaurant_slug} onChange={set('restaurant_slug')} required minLength={2} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@restaurant.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Password</label>
            <input style={inputStyle} type="password" placeholder="min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
          </div>
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'10px 14px', borderRadius:8, fontSize:13 }}>{error}</div>}
          <button type="submit" style={primaryBtn} disabled={loading}>{loading ? 'Creating account…' : 'Create Free Account'}</button>
        </form>

        <div style={{ marginTop:20, padding:16, background:'#f0fdf4', borderRadius:10, fontSize:13, color:'#166534' }}>
          ✅ <strong>7-day free trial</strong> — no credit card required to start
        </div>
        <p style={{ textAlign:'center', marginTop:14, fontSize:13, color:'#6b7280' }}>
          Already have an account? <a href="/admin" style={{ color:'#e67e22', fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );

  // ── Step: Payment ──────────────────────────────────────────────────────────
  if (step === 'payment') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:'0 0 8px', color:'#1a1a2e' }}>Account Created!</h2>
        <p style={{ color:'#6b7280', fontSize:14, lineHeight:1.6, marginBottom:24 }}>
          Your 7-day free trial is now active. Set up autopay now to avoid interruption — you won&apos;t be charged until the trial ends.
        </p>
        <div style={{ background:'#f8fafc', borderRadius:12, padding:16, marginBottom:24, textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color:'#6b7280' }}>Plan</span><strong>Menuly Pro</strong>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color:'#6b7280' }}>Price</span><strong>₹299/month</strong>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
            <span style={{ color:'#6b7280' }}>First charge</span><strong style={{ color:'#15803d' }}>After 7-day trial</strong>
          </div>
        </div>
        {error && <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', color:'#dc2626', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
        {paymentStatus === 'verifying' && <p style={{ color:'#6b7280', fontSize:14 }}>Verifying payment…</p>}
        <button onClick={handleStartPayment} style={primaryBtn} disabled={loading || paymentStatus === 'verifying'}>
          {loading ? 'Opening checkout…' : '⚡ Setup Autopay — ₹299/month'}
        </button>
        <button onClick={() => { setPaymentStatus('skipped'); setStep('done'); }}
          style={{ marginTop:12, background:'none', border:'none', color:'#9ca3af', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          Skip for now — activate from dashboard
        </button>
      </div>
    </div>
  );

  // ── Step: Done ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{paymentStatus === 'done' ? '🎊' : '✅'}</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:'0 0 8px', color:'#1a1a2e' }}>
          {paymentStatus === 'done' ? 'You\'re all set!' : 'Welcome to Menuly!'}
        </h2>
        <p style={{ color:'#6b7280', fontSize:14, lineHeight:1.6, marginBottom:28 }}>
          {paymentStatus === 'done'
            ? 'Autopay is active. Your menu is live and ready to share!'
            : 'Your 7-day trial is active. Activate autopay anytime from the billing section.'}
        </p>
        <button onClick={() => router.push('/admin')} style={primaryBtn}>Go to Dashboard →</button>
      </div>
    </div>
  );
}
