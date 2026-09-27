import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, AuthProvider detects session change and renders dashboard
  };

  return (
    <div className="login-root">
      <div className="login-card">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo">🍽️</div>
          <h1 className="login-title">QR Menu</h1>
          <p className="login-subtitle">Admin Dashboard</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@restaurant.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">Password</label>
            <input
              id="password"
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error" role="alert">{error}</div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="login-note">
          Admin accounts are provisioned by the platform owner.
          <br />No public registration.
        </p>
      </div>

      <style>{`
        .login-root {
          min-height: 100dvh;
          background: linear-gradient(135deg, #f8f9fc 0%, #e8ebf5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: var(--font-sans);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.12);
          animation: fadeIn 0.35s ease;
        }
        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .login-title {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1;
        }
        .login-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
          font-weight: 500;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field__label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .field__input {
          padding: 12px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a2e;
          background: #f9fafb;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          outline: none;
        }
        .field__input:focus {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 20%, transparent);
          background: #fff;
        }
        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: var(--brand);
          color: #fff;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          margin-top: 4px;
          transition: opacity 0.15s ease, transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.88; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .login-note {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
