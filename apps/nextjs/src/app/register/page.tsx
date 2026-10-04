'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

type Step = 'form' | 'payment' | 'done';

const inputStyle: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:10, border: '1.5px solid var(--border)', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit', transition:'border-color .15s', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' };
const primaryBtn: React.CSSProperties = { width:'100%', background:'linear-gradient(135deg,#e67e22,#d35400)', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ restaurant_name:'', restaurant_slug:'', email:'', password:'', confirm_password:'' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle'|'verifying'|'done'|'skipped'>('idle');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = k === 'restaurant_slug' ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'') : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('menuly_dark') !== '0') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
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
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background: 'var(--bg-main)', padding:20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🍽️</div>
          <h1 style={{ fontSize:26, fontWeight:800, margin:'0 0 4px', color: 'var(--text-main)' }}>Join Menuly</h1>
          <p style={{ color: 'var(--text-sub)', fontSize:14, margin:0 }}>Your digital QR menu, live in minutes</p>
        </div>

        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: 'var(--text-main)', display:'block', marginBottom:4 }}>Restaurant Name</label>
            <input style={inputStyle} placeholder="Spice Garden" value={form.restaurant_name} onChange={set('restaurant_name')} required minLength={2} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: 'var(--text-main)', display:'block', marginBottom:4 }}>Menu URL Slug</label>
            <div style={{ display:'flex', alignItems:'center', border: '1.5px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <span style={{ padding:'11px 12px', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize:13, flexShrink:0 }}>menuly.shop/menu/</span>
              <input style={{ ...inputStyle, border:'none', borderRadius:0, flex:1 }} placeholder="spice-garden" value={form.restaurant_slug} onChange={set('restaurant_slug')} required minLength={2} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: 'var(--text-main)', display:'block', marginBottom:4 }}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@restaurant.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: 'var(--text-main)', display:'block', marginBottom:4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{...inputStyle, paddingRight: 40}} type={showPassword ? "text" : "password"} placeholder="min. 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color: 'var(--text-main)', display:'block', marginBottom:4 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{...inputStyle, paddingRight: 40}} type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} required minLength={8} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <div style={{ background: 'var(--bg-error)', border: '1px solid var(--border-error)', color: 'var(--text-error)', padding:'10px 14px', borderRadius:8, fontSize:13 }}>{error}</div>}
          <button type="submit" style={primaryBtn} disabled={loading}>{loading ? 'Creating account…' : 'Create Free Account'}</button>
        </form>

        <div style={{ marginTop:20, padding:16, background: 'var(--bg-success)', borderRadius:10, fontSize:13, color: 'var(--text-success)' }}>
          ✅ <strong>7-day free trial</strong> — no credit card required to start
        </div>
        <p style={{ textAlign:'center', marginTop:14, fontSize:13, color: 'var(--text-sub)' }}>
          Already have an account? <a href="/admin" style={{ color:'#e67e22', fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );

  // ── Step: Payment ──────────────────────────────────────────────────────────
  if (step === 'payment') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background: 'var(--bg-main)', padding:20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:'0 0 8px', color: 'var(--text-main)' }}>Account Created!</h2>
        <p style={{ color: 'var(--text-sub)', fontSize:14, lineHeight:1.6, marginBottom:24 }}>
          Your 7-day free trial is now active. Set up autopay now to avoid interruption — you won&apos;t be charged until the trial ends.
        </p>
        <div style={{ background: 'var(--bg-hover)', borderRadius:12, padding:16, marginBottom:24, textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color: 'var(--text-sub)' }}>Plan</span><strong>Menuly Pro</strong>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color: 'var(--text-sub)' }}>Price</span><strong>₹299/month</strong>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
            <span style={{ color: 'var(--text-sub)' }}>First charge</span><strong style={{ color: 'var(--text-success)' }}>After 7-day trial</strong>
          </div>
        </div>
        {error && <div style={{ background: 'var(--bg-error)', border: '1px solid var(--border-error)', color: 'var(--text-error)', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
        {paymentStatus === 'verifying' && <p style={{ color: 'var(--text-sub)', fontSize:14 }}>Verifying payment…</p>}
        <button onClick={handleStartPayment} style={primaryBtn} disabled={loading || paymentStatus === 'verifying'}>
          {loading ? 'Opening checkout…' : '⚡ Setup Autopay — ₹299/month'}
        </button>
        <button onClick={() => { setPaymentStatus('skipped'); setStep('done'); }}
          style={{ marginTop:12, background:'none', border:'none', color: 'var(--text-muted)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          Skip for now — activate from dashboard
        </button>
      </div>
    </div>
  );

  // ── Step: Done ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background: 'var(--bg-main)', padding:20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius:20, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{paymentStatus === 'done' ? '🎊' : '✅'}</div>
        <h2 style={{ fontSize:22, fontWeight:800, margin:'0 0 8px', color: 'var(--text-main)' }}>
          {paymentStatus === 'done' ? 'You\'re all set!' : 'Welcome to Menuly!'}
        </h2>
        <p style={{ color: 'var(--text-sub)', fontSize:14, lineHeight:1.6, marginBottom:28 }}>
          {paymentStatus === 'done'
            ? 'Autopay is active. Your menu is live and ready to share!'
            : 'Your 7-day trial is active. Activate autopay anytime from the billing section.'}
        </p>
        <button onClick={() => router.push('/admin')} style={primaryBtn}>Go to Dashboard →</button>
      </div>
    </div>
  );
}
