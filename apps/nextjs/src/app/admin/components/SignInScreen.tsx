'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      // On success, onAuthStateChange in parent will update session automatically
    } catch {
      setError('Network error. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/admin` });
      setForgotSent(true);
    } finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s', color: 'var(--text-main)',
    background: 'var(--bg-card)',
  };

  if (showForgot) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,.25)' }}>
        <button onClick={() => { setShowForgot(false); setForgotSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
          ← Back to sign in
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: 14, marginBottom: 24 }}>We&apos;ll send a reset link to your email.</p>
        {forgotSent ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 16, color: '#15803d', fontSize: 14, textAlign: 'center' }}>
            ✅ Reset link sent! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input style={inputStyle} type="email" placeholder="your@email.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            <button type="submit" disabled={loading} style={{ padding: '13px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,.25)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#1a1a2e,#2d2d4e)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(26,26,46,.3)' }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 6px', color: 'var(--text-main)', letterSpacing: '-.5px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-sub)', fontSize: 14, margin: 0 }}>Sign in to your restaurant dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>Email</label>
            <input
              style={inputStyle} type="email" placeholder="you@restaurant.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              onFocus={e => (e.target.style.borderColor = 'var(--text-main)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Password</label>
              <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: '#e67e22', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>Forgot password?</button>
            </div>
            <input
              style={inputStyle} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
              onFocus={e => (e.target.style.borderColor = 'var(--text-main)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding: '14px', background: 'linear-gradient(135deg,#1a1a2e,#2d2d4e)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: loading ? 0.7 : 1, letterSpacing: '.2px', transition: 'opacity .15s, transform .15s' }}
            onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = '')}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>NEW HERE?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Register CTA */}
        <a href="/register"
          style={{ display: 'block', padding: '13px', background: 'var(--bg-card)', color: 'var(--text-main)', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, textAlign: 'center', border: '2px solid var(--border)', transition: 'border-color .15s, background .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-main)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}>
          Create a free account
        </a>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Powered by{' '}
          <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vyoma-logo.jpg" alt="" style={{ width: 12, height: 12, borderRadius: 2 }} />
            vyoma.world
          </a>
        </p>
      </div>
    </div>
  );
}
