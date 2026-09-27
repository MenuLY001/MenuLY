import React, { useState } from 'react';

type Mode = 'new' | 'existing';

interface FormState {
  secretKey: string;
  email: string;
  password: string;
  confirmPassword: string;
  mode: Mode;
  // new restaurant
  restaurantName: string;
  restaurantSlug: string;
  themeColor: string;
  // existing restaurant
  restaurantId: string;
}

interface ApiResult {
  ok: boolean;
  message?: string;
  error?: string;
  user?: { id: string; email: string };
  restaurant?: { id: string; slug: string; name: string; theme_color: string };
}

const INITIAL: FormState = {
  secretKey: '',
  email: '',
  password: '',
  confirmPassword: '',
  mode: 'new',
  restaurantName: '',
  restaurantSlug: '',
  themeColor: '#e67e22',
  restaurantId: '',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug when name changes
      if (field === 'restaurantName') {
        next.restaurantSlug = slugify(value) + '-' + Math.random().toString(36).slice(2, 6);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (form.password !== form.confirmPassword) {
      setResult({ ok: false, error: 'Passwords do not match.' });
      return;
    }
    if (form.secretKey.length < 32) {
      setResult({ ok: false, error: 'Secret key must be at least 32 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
        theme_color: form.themeColor,
      };
      if (form.mode === 'new') {
        body.restaurant_name = form.restaurantName.trim();
        body.restaurant_slug = form.restaurantSlug.trim();
      } else {
        body.restaurant_id = form.restaurantId.trim();
      }

      const res = await fetch(`/api/platform/${form.secretKey.trim()}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, ...data });
        setForm(INITIAL);
      } else {
        setResult({ ok: false, error: data.error ?? 'Registration failed.' });
      }
    } catch {
      setResult({ ok: false, error: 'Network error. Is the API server running?' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rp-root">
      <div className="rp-card">
        {/* Header */}
        <div className="rp-header">
          <div className="rp-logo">🍽️</div>
          <h1 className="rp-title">QR Menu Platform</h1>
          <p className="rp-subtitle">Register a new restaurant admin</p>
          <div className="rp-badge">🔐 Platform Owner Only</div>
        </div>

        {/* Success */}
        {result?.ok && (
          <div className="rp-success">
            <div className="rp-success__icon">✅</div>
            <div className="rp-success__title">Admin created successfully!</div>
            <div className="rp-success__detail">
              <b>{result.user?.email}</b> has been registered as admin for <b>{result.restaurant?.name}</b>.
            </div>
            <div className="rp-success__info">
              <div><span>Restaurant URL</span><code>/menu/{result.restaurant?.slug}</code></div>
              <div><span>Restaurant ID</span><code>{result.restaurant?.id}</code></div>
            </div>
            <p className="rp-success__note">
              The admin can now log in at <a href="/admin">/admin</a> using these credentials.
            </p>
            <button className="rp-btn-outline" onClick={() => setResult(null)}>Register Another</button>
          </div>
        )}

        {/* Error */}
        {result && !result.ok && (
          <div className="rp-error">
            ⚠️ {result.error}
          </div>
        )}

        {/* Form */}
        {!result?.ok && (
          <form onSubmit={handleSubmit} className="rp-form">
            {/* Secret Key */}
            <div className="rp-section">
              <div className="rp-section__title">🔑 Platform Secret Key</div>
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-key">Secret Key</label>
                <div className="rp-pw-wrap">
                  <input
                    id="rp-key"
                    className="rp-input"
                    type={showKey ? 'text' : 'password'}
                    value={form.secretKey}
                    onChange={set('secretKey')}
                    placeholder="Paste your PLATFORM_REGISTRATION_KEY from .env"
                    required
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button type="button" className="rp-pw-toggle" onClick={() => setShowKey((v) => !v)}>
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="rp-hint">Found in <code>apps/api/.env</code> as <code>PLATFORM_REGISTRATION_KEY</code></p>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="rp-section">
              <div className="rp-section__title">👤 Admin Credentials</div>
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-email">Email</label>
                <input
                  id="rp-email"
                  className="rp-input"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="admin@restaurant.com"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-pw">Password</label>
                <div className="rp-pw-wrap">
                  <input
                    id="rp-pw"
                    className="rp-input"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                  />
                  <button type="button" className="rp-pw-toggle" onClick={() => setShowPw((v) => !v)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-cpw">Confirm Password</label>
                <input
                  id="rp-cpw"
                  className="rp-input"
                  type={showPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            {/* Restaurant */}
            <div className="rp-section">
              <div className="rp-section__title">🏪 Restaurant</div>

              {/* Mode toggle */}
              <div className="rp-mode-toggle">
                <button
                  type="button"
                  className={`rp-mode-btn ${form.mode === 'new' ? 'rp-mode-btn--active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, mode: 'new' }))}
                >
                  Create New Restaurant
                </button>
                <button
                  type="button"
                  className={`rp-mode-btn ${form.mode === 'existing' ? 'rp-mode-btn--active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, mode: 'existing' }))}
                >
                  Link to Existing
                </button>
              </div>

              {form.mode === 'new' ? (
                <>
                  <div className="rp-field">
                    <label className="rp-label" htmlFor="rp-rname">Restaurant Name</label>
                    <input
                      id="rp-rname"
                      className="rp-input"
                      type="text"
                      value={form.restaurantName}
                      onChange={set('restaurantName')}
                      placeholder="Spice Route"
                      required={form.mode === 'new'}
                    />
                  </div>
                  <div className="rp-field">
                    <label className="rp-label" htmlFor="rp-slug">
                      URL Slug <span className="rp-optional">(auto-generated, editable)</span>
                    </label>
                    <div className="rp-slug-wrap">
                      <span className="rp-slug-prefix">/menu/</span>
                      <input
                        id="rp-slug"
                        className="rp-input rp-slug-input"
                        type="text"
                        value={form.restaurantSlug}
                        onChange={set('restaurantSlug')}
                        placeholder="spice-route-8f3a"
                        pattern="^[a-z0-9\-]+$"
                        title="Lowercase letters, numbers, and hyphens only"
                        required={form.mode === 'new'}
                      />
                    </div>
                    <p className="rp-hint">Lowercase letters, numbers, and hyphens only</p>
                  </div>
                  <div className="rp-field">
                    <label className="rp-label" htmlFor="rp-color">Brand Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        id="rp-color"
                        type="color"
                        value={form.themeColor}
                        onChange={set('themeColor')}
                        style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                      />
                      <input
                        className="rp-input"
                        type="text"
                        value={form.themeColor}
                        onChange={set('themeColor')}
                        pattern="#[0-9a-fA-F]{6}"
                        placeholder="#e67e22"
                        style={{ flex: 1 }}
                      />
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: form.themeColor, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rp-field">
                  <label className="rp-label" htmlFor="rp-rid">Restaurant ID (UUID)</label>
                  <input
                    id="rp-rid"
                    className="rp-input"
                    type="text"
                    value={form.restaurantId}
                    onChange={set('restaurantId')}
                    placeholder="a1b2c3d4-0000-0000-0000-000000000001"
                    required={form.mode === 'existing'}
                  />
                  <p className="rp-hint">Find this in Supabase → Table Editor → restaurants → id</p>
                </div>
              )}
            </div>

            <button type="submit" className="rp-submit" disabled={submitting}>
              {submitting ? (
                <><span className="rp-spinner" /> Creating admin…</>
              ) : (
                '→ Create Admin'
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .rp-root {
          min-height: 100dvh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: 'Inter', sans-serif;
        }
        .rp-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px 36px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4);
        }
        .rp-header { text-align: center; margin-bottom: 32px; }
        .rp-logo { font-size: 48px; margin-bottom: 12px; }
        .rp-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .rp-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 12px; }
        .rp-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 9999px;
        }

        .rp-form { display: flex; flex-direction: column; gap: 24px; }
        .rp-section {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rp-section__title {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .rp-field { display: flex; flex-direction: column; gap: 6px; }
        .rp-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); }
        .rp-input {
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.12);
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.3); }
        .rp-input:focus { border-color: #e67e22; background: rgba(255,255,255,0.1); }
        .rp-hint { font-size: 11px; color: rgba(255,255,255,0.35); }
        .rp-hint code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-family: monospace; }
        .rp-optional { font-weight: 400; color: rgba(255,255,255,0.35); font-size: 11px; }

        .rp-pw-wrap { position: relative; }
        .rp-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .rp-mode-toggle { display: flex; border-radius: 10px; overflow: hidden; border: 1.5px solid rgba(255,255,255,0.12); }
        .rp-mode-btn {
          flex: 1;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          background: none;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rp-mode-btn--active {
          background: #e67e22;
          color: #fff;
        }

        .rp-slug-wrap { display: flex; align-items: center; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.07); }
        .rp-slug-prefix { padding: 10px 10px 10px 14px; font-size: 13px; color: rgba(255,255,255,0.35); white-space: nowrap; font-family: monospace; }
        .rp-slug-input { border: none !important; background: transparent !important; padding-left: 4px !important; }
        .rp-slug-input:focus { outline: none; }

        .rp-submit {
          padding: 14px;
          background: linear-gradient(135deg, #e67e22, #d35400);
          color: #fff;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .rp-submit:hover { opacity: 0.9; transform: translateY(-1px); }
        .rp-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .rp-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .rp-error {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .rp-success {
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(22,163,74,0.3);
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }
        .rp-success__icon { font-size: 36px; }
        .rp-success__title { font-size: 18px; font-weight: 800; color: #4ade80; }
        .rp-success__detail { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6; }
        .rp-success__info {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .rp-success__info > div { display: flex; flex-direction: column; gap: 2px; }
        .rp-success__info span { font-size: 11px; color: rgba(255,255,255,0.4); }
        .rp-success__info code { font-size: 13px; color: #4ade80; font-family: monospace; }
        .rp-success__note { font-size: 12px; color: rgba(255,255,255,0.4); }
        .rp-success__note a { color: #e67e22; }
        .rp-btn-outline {
          padding: 10px 20px;
          border: 1.5px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          background: none;
          margin-top: 4px;
        }
        .rp-btn-outline:hover { border-color: rgba(255,255,255,0.5); color: #fff; }

        @media (max-width: 520px) {
          .rp-card { padding: 28px 20px; border-radius: 20px; }
        }
      `}</style>
    </div>
  );
}
