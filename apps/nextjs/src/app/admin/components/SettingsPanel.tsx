'use client';
import { useState, useEffect, useRef } from 'react';
import { type Restaurant } from './types';
import { useToast, BRAND, inp, btnP, btnG, lbl, Spinner, apiFetch } from './shared';

export function SettingsPanel({ token, toast, onRestaurantUpdate }: { token: string; toast: ReturnType<typeof useToast>; onRestaurantUpdate: (r: Restaurant) => void }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#e67e22');
  const [logoUrl, setLogoUrl] = useState('');
  const [menuTemplate, setMenuTemplate] = useState<'classic' | 'menuly-dark'>('classic');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrMenuUrl, setQrMenuUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch(token, '/api/admin/restaurant').then(async (r: Restaurant) => {
      if (!r || r.id === undefined) { setLoading(false); return; }
      setRestaurant(r); setName(r.name); setThemeColor(r.theme_color ?? '#e67e22'); setLogoUrl(r.logo_url ?? '');
      setMenuTemplate((r.menu_template as 'classic' | 'menuly-dark') ?? 'classic');
      const menuUrl = `${window.location.origin}/menu/${r.slug}`;
      setQrMenuUrl(menuUrl);
      try {
        const QRCodeMod = await import('qrcode');
        const QRCode = (QRCodeMod as unknown as { toDataURL: typeof import('qrcode').toDataURL }).toDataURL
          ?? (QRCodeMod.default as unknown as { toDataURL: typeof import('qrcode').toDataURL })?.toDataURL
          ?? (QRCodeMod as unknown as typeof import('qrcode')).toDataURL;
        const dataUrl = await QRCode(menuUrl, { width: 512, margin: 2, errorCorrectionLevel: 'H' });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { url, error } = await apiFetch(token, '/api/admin/upload', { method: 'POST', body: fd });
      if (error) { toast.error('Upload failed', error); return; }
      setLogoUrl(url);
    } catch { toast.error('Logo upload failed'); } finally { setUploading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const u = await apiFetch(token, '/api/admin/restaurant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), theme_color: themeColor, logo_url: logoUrl || undefined, menu_template: menuTemplate }) });
      setRestaurant(u); onRestaurantUpdate(u); toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); } finally { setSaving(false); }
  };

  const downloadQR = () => {
    if (!qrDataUrl || !restaurant) return;
    const a = document.createElement('a'); a.href = qrDataUrl; a.download = `${restaurant.slug}-menu-qr.png`; a.click();
  };

  if (loading) return <Spinner />;

  return (
    <div className="panel">
      <div><h1 className="panel__title">Restaurant Settings</h1><p className="panel__subtitle">Manage your restaurant profile and menu QR code</p></div>

      <div className="settings-layout">
        {/* Left: form */}
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Profile</h2>

          {/* Logo */}
          <div className="field"><label style={lbl}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoUrl} alt="Logo" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                : <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f0f2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '1px solid #e5e7eb' }}>🍽️</div>
              }
              <div>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={uploadLogo} />
                <button type="button" style={btnG} onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : logoUrl ? '↺ Change Logo' : '↑ Upload Logo'}
                </button>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PNG, JPG, WebP — max 5 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="field"><label style={lbl} htmlFor="rest-name">Restaurant Name</label>
            <input id="rest-name" style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Spice Route" required />
          </div>

          {/* Brand Color */}
          <div className="field"><label style={lbl} htmlFor="theme-color">Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input id="theme-color" type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'transparent' }} />
              <input style={{ ...inp, flex: 1 }} value={themeColor} onChange={e => setThemeColor(e.target.value)} pattern="#[0-9a-fA-F]{6}" placeholder="#e67e22" />
              <div style={{ width: 40, height: 40, borderRadius: 8, background: themeColor, border: '1px solid #e5e7eb', flexShrink: 0, transition: 'background .2s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Applied to your public menu page</p>
          </div>

          {/* Slug (read-only) */}
          <div className="field"><label style={lbl}>Menu URL (read-only)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#f0f2f8', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <code style={{ fontSize: 13, color: '#1a1a2e', wordBreak: 'break-all' }}>{typeof window !== 'undefined' ? window.location.origin : 'https://menuly.shop'}/menu/<strong>{restaurant?.slug}</strong></code>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Contact the platform owner to change this URL</span>
            </div>
          </div>

          <div><button type="submit" style={btnP} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save Settings'}</button></div>
        </form>

        {/* Right: template + QR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Template Picker */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>Menu Template</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>Choose how your public menu looks to customers.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Classic */}
              <button type="button" onClick={() => setMenuTemplate('classic')} style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${menuTemplate === 'classic' ? BRAND : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: '#fafafa', padding: 0, fontFamily: 'inherit', position: 'relative', boxShadow: menuTemplate === 'classic' ? `0 0 0 3px ${BRAND}30` : 'none', transition: 'all .2s' }}>
                <div style={{ height: 120, padding: 10, background: '#f8f9fc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e5e7eb' }} /><div style={{ height: 7, borderRadius: 4, background: '#e5e7eb', width: '70%' }} /></div>
                  {[1, 2, 3].map(i => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: '#e5e7eb' }} /><div style={{ flex: 1 }}><div style={{ height: 7, borderRadius: 4, background: '#e5e7eb', width: '80%' }} /><div style={{ height: 5, borderRadius: 4, background: '#e5e7eb', width: '50%', marginTop: 4 }} /></div></div>)}
                </div>
                <div style={{ padding: '10px 12px 12px', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Classic</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Clean, light/dark with grid & list views</div>
                </div>
                {menuTemplate === 'classic' && <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, background: BRAND, borderRadius: '50%', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
              </button>
              {/* Menuly Dark */}
              <button type="button" onClick={() => setMenuTemplate('menuly-dark')} style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${menuTemplate === 'menuly-dark' ? BRAND : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: '#fafafa', padding: 0, fontFamily: 'inherit', position: 'relative', boxShadow: menuTemplate === 'menuly-dark' ? `0 0 0 3px ${BRAND}30` : 'none', transition: 'all .2s' }}>
                <div style={{ height: 120, padding: 10, background: '#0f0f13', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: BRAND }} /><div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.15)', width: '70%' }} /></div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,.1)', marginBottom: 2 }} />
                  <div style={{ display: 'flex', gap: 4 }}><div style={{ height: 10, width: 28, borderRadius: 5, background: BRAND }} /><div style={{ height: 10, width: 28, borderRadius: 5, background: 'rgba(255,255,255,.1)' }} /><div style={{ height: 10, width: 28, borderRadius: 5, background: 'rgba(255,255,255,.1)' }} /></div>
                  {[1, 2].map(i => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.12)' }} /><div style={{ flex: 1 }}><div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.15)', width: '80%' }} /><div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,.1)', width: '50%', marginTop: 4 }} /></div></div>)}
                </div>
                <div style={{ padding: '10px 12px 12px', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Menuly Dark ✨</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Modern dark UI with category tabs & search</div>
                </div>
                {menuTemplate === 'menuly-dark' && <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, background: BRAND, borderRadius: '50%', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Restaurant QR Code</h2>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>Print and display this QR code at your tables. Customers scan it to browse your menu.</p>
            {qrDataUrl ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                  )}
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>{name || restaurant?.name}</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Menu QR Code" style={{ width: 200, height: 200, borderRadius: 8 }} />
                <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', wordBreak: 'break-all' }}>{qrMenuUrl}</div>
                <button onClick={downloadQR} style={{ ...btnP, width: '100%', textAlign: 'center', padding: 12 }}>↓ Download QR Code</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#9ca3af', padding: '48px 0' }}><div style={{ fontSize: 40, opacity: 0.3 }}>📱</div><p>Generating QR…</p></div>
            )}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '12px 14px', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
              <strong>💡 Tip:</strong> The QR links directly to your menu at<br />
              <code style={{ background: 'rgba(0,0,0,.08)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{qrMenuUrl}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
