import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from './AuthContext';
import { adminApi } from '../lib/api';
import { Restaurant } from '@qr-menu/types';
import { AdminPanelStyles } from './CategoriesPanel';

export function SettingsPanel() {
  const { token } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#e67e22');
  const [logoUrl, setLogoUrl] = useState('');

  // QR state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrMenuUrl, setQrMenuUrl] = useState('');

  // Form state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    adminApi.getRestaurant(token)
      .then(async (r: Restaurant) => {
        setRestaurant(r);
        setName(r.name);
        setThemeColor(r.theme_color);
        setLogoUrl(r.logo_url ?? '');

        // Generate QR immediately
        const menuUrl = `${window.location.origin}/menu/${r.slug}`;
        setQrMenuUrl(menuUrl);
        const dataUrl = await QRCode.toDataURL(menuUrl, {
          width: 512,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(dataUrl);
      })
      .catch(() => setError('Failed to load restaurant'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const url = await adminApi.uploadImage(token, file);
      setLogoUrl(url);
    } catch {
      setError('Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await adminApi.updateRestaurant(token, {
        name: name.trim(),
        theme_color: themeColor,
        logo_url: logoUrl || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl || !restaurant) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${restaurant.slug}-menu-qr.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="panel">
        <h1 className="panel__title" style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>Settings</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div>
        <h1 className="panel__title">Restaurant Settings</h1>
        <p className="panel__subtitle">Manage your restaurant profile and menu QR code</p>
      </div>

      {error && <div className="panel-error">{error} <button onClick={() => setError(null)} style={{ marginLeft: 8, fontWeight: 700 }}>✕</button></div>}
      {saved && <div className="panel-success">✓ Settings saved successfully</div>}

      <div className="settings-layout">
        {/* ── Left: Profile form ───────────────────────────────────────── */}
        <form onSubmit={handleSave} className="settings-form">
          <h2 className="settings-section-title">Profile</h2>

          {/* Logo */}
          <div className="field">
            <label className="field__label">Logo</label>
            <div className="logo-upload">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="logo-upload__preview" />
              ) : (
                <div className="logo-upload__placeholder">🍽️</div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : logoUrl ? '↺ Change Logo' : '↑ Upload Logo'}
                </button>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PNG, JPG, WebP — max 5 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="field">
            <label className="field__label" htmlFor="rest-name">Restaurant Name</label>
            <input
              id="rest-name"
              className="field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spice Route"
              required
            />
          </div>

          {/* Theme color */}
          <div className="field">
            <label className="field__label" htmlFor="theme-color">Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                id="theme-color"
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'transparent' }}
              />
              <input
                className="field__input"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                placeholder="#e67e22"
                style={{ flex: 1 }}
              />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: themeColor,
                  border: '1px solid #e5e7eb',
                  flexShrink: 0,
                  transition: 'background 0.2s ease',
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>Applied to your public menu page</p>
          </div>

          {/* Slug (read-only) */}
          <div className="field">
            <label className="field__label">Menu URL (read-only)</label>
            <div className="slug-display">
              <code>
                {window.location.origin}/menu/<strong>{restaurant?.slug}</strong>
              </code>
              <span className="slug-note">Contact the platform owner to change this URL</span>
            </div>
          </div>

          <div>
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* ── Right: QR Code ───────────────────────────────────────────── */}
        <div className="qr-section">
          <h2 className="settings-section-title">Restaurant QR Code</h2>
          <p className="qr-section__desc">
            Print and display this QR code at your tables. Customers scan it to browse your menu.
          </p>

          {qrDataUrl ? (
            <div className="qr-card">
              <div className="qr-card__header">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="qr-card__logo" />
                )}
                <div className="qr-card__name">{name || restaurant?.name}</div>
              </div>
              <img
                src={qrDataUrl}
                alt="Menu QR Code"
                className="qr-card__img"
              />
              <div className="qr-card__url">{qrMenuUrl}</div>
              <button className="btn-primary qr-download-btn" onClick={downloadQR}>
                ↓ Download QR Code
              </button>
            </div>
          ) : (
            <div className="qr-placeholder">
              <div style={{ fontSize: 40, opacity: 0.3 }}>📱</div>
              <p>Generating QR…</p>
            </div>
          )}

          <div className="qr-tip">
            <strong>💡 Tip:</strong> The QR links directly to your menu at<br />
            <code>{qrMenuUrl || `${window.location.origin}/menu/${restaurant?.slug}`}</code>
          </div>
        </div>
      </div>

      <AdminPanelStyles />
      <style>{`
        .settings-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
        @media (max-width: 860px) { .settings-layout { grid-template-columns: 1fr; } }
        .settings-form { display: flex; flex-direction: column; gap: 20px; }
        .settings-section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
        .logo-upload { display: flex; align-items: center; gap: 16px; }
        .logo-upload__preview { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; border: 1px solid #e5e7eb; }
        .logo-upload__placeholder { width: 72px; height: 72px; border-radius: 12px; background: #f0f2f8; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 1px solid #e5e7eb; }
        .slug-display { display: flex; flex-direction: column; gap: 4px; background: #f0f2f8; padding: 10px 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .slug-display code { font-size: 13px; color: #1a1a2e; word-break: break-all; }
        .slug-note { font-size: 12px; color: #9ca3af; }
        .panel-success { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; }

        .qr-section { display: flex; flex-direction: column; gap: 12px; }
        .qr-section__desc { font-size: 13px; color: #6b7280; line-height: 1.6; }
        .qr-card { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .qr-card__header { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
        .qr-card__logo { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb; }
        .qr-card__name { font-size: 16px; font-weight: 800; color: #1a1a2e; }
        .qr-card__img { width: 200px; height: 200px; border-radius: 8px; }
        .qr-card__url { font-size: 11px; color: #9ca3af; text-align: center; word-break: break-all; }
        .qr-download-btn { width: 100%; text-align: center; padding: 12px; }
        .qr-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #9ca3af; padding: 48px 0; }
        .qr-tip { background: #fffbeb; border: 1px solid #fcd34d; padding: 12px 14px; border-radius: 10px; font-size: 12px; color: #92400e; line-height: 1.6; }
        .qr-tip code { background: rgba(0,0,0,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
      `}</style>
    </div>
  );
}
