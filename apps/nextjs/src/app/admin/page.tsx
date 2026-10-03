'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Session } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category   { id: string; name: string; sort_order: number; }
interface MenuItem   { id: string; name: string; description?: string; price: number; image_url?: string; category_id: string; is_available: boolean; is_veg: boolean; is_special: boolean; }
interface Restaurant { id: string; name: string; slug: string; status: string; trial_ends_at: string | null; theme_color?: string; logo_url?: string; address?: string; phone?: string; menu_template?: string; }
type Tab = 'categories' | 'items' | 'settings' | 'billing';
type ToastType = 'success' | 'error' | 'info';

// ─── Toast ────────────────────────────────────────────────────────────────────
const TC: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '✅' },
  error:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: '❌' },
  info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', icon: 'ℹ️' },
};
function useToast() {
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; msg?: string }[]>([]);
  const add = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = crypto.randomUUID();
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === 'error' ? 6000 : 4000);
  }, []);
  return { toasts, success: (t: string, m?: string) => add('success', t, m), error: (t: string, m?: string) => add('error', t, m), info: (t: string, m?: string) => add('info', t, m) };
}

// ─── Style constants ──────────────────────────────────────────────────────────
const BRAND = '#e67e22';
const inp: React.CSSProperties  = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#f9fafb', color: '#1a1a2e' };
const btnP: React.CSSProperties = { padding: '10px 18px', background: BRAND, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnG: React.CSSProperties = { padding: '8px 14px', background: '#f0f2f8', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };

const lbl: React.CSSProperties  = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: BRAND, borderRadius: '50%', animation: 'admin-spin .7s linear infinite' }} /></div>;
}
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}><div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{icon}</div><p style={{ margin: 0 }}>{text}</p></div>;
}
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: wide ? 560 : 480, maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(token: string, path: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) } });
  return res.json();
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORIES PANEL
// ════════════════════════════════════════════════════════════════════════════
function CategoriesPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(token, '/api/admin/categories'); setCats(Array.isArray(d) ? d : []); }
    catch { setCats([]); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setName(''); setModal(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setSaving(true);
    try {
      if (editing) {
        const u = await apiFetch(token, `/api/admin/categories/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        setCats(p => p.map(c => c.id === u.id ? u : c)); toast.success('Category updated');
      } else {
        const u = await apiFetch(token, '/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        setCats(p => [...p, u]); toast.success('Category created');
      }
      setModal(false);
    } catch { toast.error('Failed to save category'); } finally { setSaving(false); }
  };

  const del = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? All items in this category will also be deleted.`)) return;
    await apiFetch(token, `/api/admin/categories/${c.id}`, { method: 'DELETE' });
    setCats(p => p.filter(x => x.id !== c.id)); toast.success('Category deleted');
  };

  const move = async (id: string, dir: 'up' | 'down') => {
    const idx = cats.findIndex(c => c.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= cats.length) return;
    const next = [...cats];
    const tmp = next[idx].sort_order;
    next[idx] = { ...next[idx], sort_order: next[swapIdx].sort_order };
    next[swapIdx] = { ...next[swapIdx], sort_order: tmp };
    next.sort((a, b) => a.sort_order - b.sort_order);
    setCats(next);
    await Promise.all([
      apiFetch(token, `/api/admin/categories/${next[idx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: next[idx].sort_order }) }),
      apiFetch(token, `/api/admin/categories/${next[swapIdx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: next[swapIdx].sort_order }) }),
    ]);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div><h1 className="panel__title">Categories</h1><p className="panel__subtitle">{cats.length} categories</p></div>
        <button onClick={openCreate} style={btnP}>+ New Category</button>
      </div>
      {loading ? (
        <Spinner />
      ) : cats.length === 0 ? (
        <EmptyState icon="📋" text="No categories yet. Create your first one!" />
      ) : (
        <div className="item-list">
          {cats.map((c, i) => {
            const isFirst = i === 0;
            const isLast = i === cats.length - 1;
            return (
              <div key={c.id} className="item-row">
                <div className="item-row__sort">
                  <button onClick={() => move(c.id, 'up')} disabled={isFirst} className="sort-btn">↑</button>
                  <button onClick={() => move(c.id, 'down')} disabled={isLast} className="sort-btn">↓</button>
                </div>
                <span className="item-row__name">{c.name}</span>
                <div className="item-row__actions">
                  <button onClick={() => openEdit(c)} className="btn-ghost">Edit</button>
                  <button onClick={() => del(c)} className="btn-danger-ghost">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal title={editing ? 'Edit Category' : 'New Category'} onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={lbl}>Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Starters, Mains, Desserts" required autoFocus /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setModal(false)} style={btnG}>Cancel</button>
              <button type="submit" style={btnP} disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ITEMS PANEL
// ════════════════════════════════════════════════════════════════════════════
const EMPTY_FORM = { category_id: '', name: '', description: '', price: '', image_url: '', is_available: true, is_veg: true, is_special: false };

function ItemsPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [id, cd] = await Promise.all([
        apiFetch(token, '/api/admin/items'),
        apiFetch(token, '/api/admin/categories'),
      ]);
      setItems(Array.isArray(id) ? id : []);
      setCats(Array.isArray(cd) ? cd : []);
    } catch { setItems([]); setCats([]); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, category_id: cats[0]?.id ?? '' }); setModal(true); };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ category_id: item.category_id, name: item.name, description: item.description ?? '', price: String(item.price), image_url: item.image_url ?? '', is_available: item.is_available, is_veg: item.is_veg, is_special: item.is_special });
    setModal(true);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { url, error } = await apiFetch(token, '/api/admin/upload', { method: 'POST', body: fd });
      if (error) { toast.error('Upload failed', error); return; }
      setForm(f => ({ ...f, image_url: url }));
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { toast.error('Invalid price'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price, description: form.description || undefined, image_url: form.image_url || undefined };
      if (editing) {
        const u = await apiFetch(token, `/api/admin/items/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setItems(p => p.map(i => i.id === u.id ? u : i)); toast.success('Item updated');
      } else {
        const u = await apiFetch(token, '/api/admin/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setItems(p => [...p, u]); toast.success('Item created');
      }
      setModal(false);
    } catch { toast.error('Failed to save item'); } finally { setSaving(false); }
  };

  const del = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await apiFetch(token, `/api/admin/items/${item.id}`, { method: 'DELETE' });
    setItems(p => p.filter(i => i.id !== item.id)); toast.success('Item deleted');
  };

  const toggleAvail = async (item: MenuItem) => {
    const u = await apiFetch(token, `/api/admin/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_available: !item.is_available }) });
    setItems(p => p.map(i => i.id === u.id ? u : i));
  };

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category_id === filterCat);
  const catName = (id: string) => cats.find(c => c.id === id)?.name ?? '—';

  return (
    <div className="panel">
      <div className="panel__header">
        <div><h1 className="panel__title">Menu Items</h1><p className="panel__subtitle">{items.length} items</p></div>
        <button onClick={openCreate} disabled={cats.length === 0} style={{ ...btnP, opacity: cats.length === 0 ? 0.5 : 1 }}>+ New Item</button>
      </div>
      {cats.length === 0 && !loading && <div className="panel-warn">⚠️ Create at least one category before adding items.</div>}

      {cats.length > 0 && (
        <div className="items-filter">
          {['all', ...cats.map(c => c.id)].map(id => (
            <button key={id} onClick={() => setFilterCat(id)} className={`filter-pill ${filterCat === id ? 'filter-pill--active' : ''}`}>
              {id === 'all' ? 'All' : catName(id)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🍽️" text={filterCat === 'all' ? 'No items yet.' : 'No items in this category.'} />
      ) : (
        <div className="item-list">
          {filtered.map(item => (
            <div key={item.id} className="item-row">
              {item.image_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.image_url} alt={item.name} className="item-row__img" />
                : <div className="item-row__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍽️</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-row__name">{item.name}</div>
                <div className="item-row__meta">{catName(item.category_id)}</div>
              </div>
              <span className="item-row__price">₹{item.price}</span>
              <button
                onClick={() => toggleAvail(item)}
                className={item.is_available ? 'item-row__avail item-row__avail--yes' : 'item-row__avail item-row__avail--no'}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </button>
              <div className="item-row__actions">
                <button onClick={() => openEdit(item)} className="btn-ghost">Edit</button>
                <button onClick={() => del(item)} className="btn-danger-ghost">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Item' : 'New Item'} onClose={() => setModal(false)} wide>
          <form onSubmit={save} className="modal__form">
            <div className="field"><label style={lbl}>Category</label>
              <select style={inp} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} required>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field"><label style={lbl}>Name</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Paneer Tikka" required />
            </div>
            <div className="field"><label style={lbl}>Description (optional)</label>
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Fresh paneer marinated in spices…" />
            </div>
            <div className="field__row">
              <div className="field"><label style={lbl}>Price (₹)</label>
                <input style={inp} type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="180" required />
              </div>
              <div className="field" style={{ justifyContent: 'flex-end', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Available', key: 'is_available' as const, on: form.is_available, c: BRAND },
                  { label: form.is_veg ? '🟢 Veg' : '🔴 Non-Veg', key: 'is_veg' as const, on: form.is_veg, c: form.is_veg ? '#22c55e' : '#ef4444' },
                  { label: form.is_special ? '⭐ Special' : 'Regular', key: 'is_special' as const, on: form.is_special, c: '#f59e0b' },
                ].map(({ label, key, on, c }) => (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, [key]: !on }))}
                    style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${on ? c : '#e5e7eb'}`, background: on ? `${c}18` : '#f9fafb', color: on ? c : '#9ca3af', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label style={lbl}>Image</label>
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
              )}
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={upload} />
              <button type="button" style={btnG} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : form.image_url ? '↺ Change Image' : '↑ Upload Image'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setModal(false)} style={btnG}>Cancel</button>
              <button type="submit" style={btnP} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS PANEL
// ════════════════════════════════════════════════════════════════════════════
function SettingsPanel({ token, toast, onRestaurantUpdate }: { token: string; toast: ReturnType<typeof useToast>; onRestaurantUpdate: (r: Restaurant) => void }) {
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
        // qrcode is a CJS module — the module itself IS the API (no .default)
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

// ════════════════════════════════════════════════════════════════════════════
// BILLING PANEL
// ════════════════════════════════════════════════════════════════════════════
function BillingPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch(token, '/api/admin/billing'); setBilling(d && !d.error ? d : null); }
    catch { setBilling(null); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

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
    cancelled: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  };
  const ss = SS[status] ?? SS.active;

  const activateAutopay = async () => {
    setActionLoading(true);
    try {
      const { subscription_id, key_id, error } = await apiFetch(token, '/api/admin/billing/create-subscription', { method: 'POST' });
      if (error) { toast.error('Payment Error', error); return; }
      const win = window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open(): void } };
      const rzp = new win.Razorpay({
        key: key_id, subscription_id, name: 'Menuly', description: '₹299/month', theme: { color: BRAND },
        handler: async (response: Record<string, string>) => {
          await apiFetch(token, '/api/admin/billing/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) });
          toast.success('🎉 Autopay Activated!'); load();
        },
        modal: { ondismiss: () => setActionLoading(false) },
      });
      rzp.open();
    } catch { toast.error('Payment Error', 'Could not start payment.'); setActionLoading(false); }
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
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 4 }}>Menuly Pro</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>₹299 <span style={{ fontSize: 16, fontWeight: 400, color: '#9ca3af' }}>/month</span></div>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: ss.bg, color: ss.color, border: `1.5px solid ${ss.border}` }}>{status}</span>
          </div>
          <div style={{ borderTop: '1px solid #f0f2f8', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {trialEndsAt && status === 'trialing' && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#9ca3af' }}>Trial ends</span><strong>{fmtDate(trialEndsAt)} <span style={{ color: '#1d4ed8' }}>({daysLeft(trialEndsAt)} days left)</span></strong></div>}
            {(sub?.current_period_end as string | null | undefined) && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#9ca3af' }}>Next billing</span><strong>{fmtDate(sub!.current_period_end as string)}</strong></div>}
            {(plan?.price_paise as number | null | undefined) && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#9ca3af' }}>Amount</span><strong>₹{Math.round((plan!.price_paise as number) / 100)}/month</strong></div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!hasActiveSub && status !== 'cancelled' && (
              <button onClick={activateAutopay} disabled={actionLoading} style={{ ...btnP, padding: '12px 20px' }}>
                {actionLoading ? 'Opening payment…' : '⚡ Activate Autopay — ₹299/month'}
              </button>
            )}
            {hasActiveSub && !cancelPending && (
              <button onClick={() => setShowCancel(true)} disabled={actionLoading} style={{ background: 'transparent', border: '1.5px solid #e5e7eb', color: '#6b7280', padding: '11px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel subscription</button>
            )}
          </div>
        </div>
        {/* Payment history */}
        {payments.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Payment History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['Date', 'Amount', 'Status', 'Ref'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#9ca3af', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f2f8' }}>
                    <td style={{ padding: 12 }}>{fmtDate(p.created_at as string)}</td>
                    <td style={{ padding: 12 }}>₹{Math.round((p.amount_paise as number) / 100)}</td>
                    <td style={{ padding: 12 }}><span style={{ color: p.status === 'captured' ? '#15803d' : '#dc2626', fontWeight: 600 }}>{p.status === 'captured' ? '✅ Paid' : '❌ Failed'}</span></td>
                    <td style={{ padding: 12, color: '#9ca3af', fontFamily: 'monospace', fontSize: 11 }}>{(p.razorpay_payment_id as string)?.slice(0, 18) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showCancel && (
        <Modal title="Cancel Subscription?" onClose={() => setShowCancel(false)}>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>You will keep full access until the end of your current billing period. After that, your menu will be suspended.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCancel(false)} style={btnG}>Keep Subscription</button>
            <button onClick={cancelSub} style={{ ...btnP, background: '#dc2626' }}>Yes, Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN AdminPage
// ════════════════════════════════════════════════════════════════════════════
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'categories', label: 'Categories', icon: '📋' },
  { id: 'items',      label: 'Menu Items', icon: '🍽️' },
  { id: 'settings',   label: 'Settings',   icon: '⚙️' },
  { id: 'billing',    label: 'Billing',    icon: '💳' },
];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('categories');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load restaurant info for sidebar
  useEffect(() => {
    if (!session) return;
    apiFetch(session.access_token, '/api/admin/restaurant').then(d => { if (d && !d.error) setRestaurant(d); }).catch(() => {});
  }, [session]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f8' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: BRAND, borderRadius: '50%', animation: 'admin-spin .7s linear infinite' }} />
      <style>{`@keyframes admin-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#1a1a2e' }}>Admin Login</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Sign in to manage your restaurant</p>
        </div>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input style={inp} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inp} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {loginError && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{loginError}</p>}
          <button type="submit" style={btnP} disabled={loginLoading}>{loginLoading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          Don&apos;t have an account? <a href="/register" style={{ color: BRAND, fontWeight: 600 }}>Register</a>
        </p>
      </div>
      <style>{`@keyframes admin-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const token = session.access_token;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#f0f2f8', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Toast ──────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toast.toasts.map(t => {
          const c = TC[t.type];
          return (
            <div key={t.id} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, maxWidth: 380, boxShadow: '0 8px 24px rgba(0,0,0,.1)', animation: 'slideIn .3s ease' }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div><div style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{t.title}</div>{t.msg && <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{t.msg}</div>}</div>
            </div>
          );
        })}
      </div>

      {/* ── Sidebar ────────────────────────────────────── */}
      {mobileNavOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 199 }} onClick={() => setMobileNavOpen(false)} />}
      <aside style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 200, transform: mobileNavOpen ? 'translateX(0)' : undefined, overflowY: 'auto' }} className="admin-sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 24px', borderBottom: '1px solid #f0f2f8', marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0f2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
            {restaurant?.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={restaurant.logo_url} alt="logo" style={{ width: 36, height: 36, objectFit: 'cover' }} />
              : '🍽️'
            }
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' }}>QR Menu</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{restaurant?.name ?? '…'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMobileNavOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .15s, color .15s', background: tab === t.id ? `${BRAND}18` : 'transparent', color: tab === t.id ? BRAND : '#5f6380' }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>

        {/* View Menu link */}
        <a href={`/menu/${restaurant?.slug ?? ''}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#6b7280', textDecoration: 'none', transition: 'background .15s', marginTop: 4 }}>
          <span>🔗</span> View Menu
        </a>

        {/* Sign out */}
        <button onClick={() => supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#9ca3af', fontFamily: 'inherit', border: 'none', cursor: 'pointer', background: 'transparent', transition: 'color .15s, background .15s', marginTop: 4 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#dc2626'; (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <span>↩</span> Sign Out
        </button>
      </aside>

      {/* ── Main ───────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', marginLeft: 240 }} className="admin-main">
        {/* Mobile header */}
        <header style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }} className="admin-mobile-header">
          <button onClick={() => setMobileNavOpen(true)} style={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#f0f2f8', border: 'none', cursor: 'pointer' }}>☰</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{restaurant?.name ?? 'Admin'}</span>
          <div style={{ width: 36 }} />
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: 32, maxWidth: 900 }}>
          {tab === 'categories' && <CategoriesPanel token={token} toast={toast} />}
          {tab === 'items'      && <ItemsPanel      token={token} toast={toast} />}
          {tab === 'settings'   && <SettingsPanel   token={token} toast={toast} onRestaurantUpdate={setRestaurant} />}
          {tab === 'billing'    && <BillingPanel    token={token} toast={toast} />}
        </div>
      </div>

      <style>{`
        @keyframes admin-spin  { to { transform: rotate(360deg); } }
        @keyframes slideIn     { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .panel                 { display: flex; flex-direction: column; gap: 24px; }
        .panel__header         { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .panel__title          { font-size: 24px; font-weight: 800; color: #1a1a2e; margin: 0; }
        .panel__subtitle       { font-size: 14px; color: #9ca3af; margin: 2px 0 0; }
        .panel-warn            { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; padding: 12px 16px; border-radius: 10px; font-size: 14px; }

        .item-list             { display: flex; flex-direction: column; gap: 8px; }
        .item-row              { display: flex; align-items: center; gap: 12px; background: #fff; padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e7eb; transition: box-shadow 0.15s; }
        .item-row:hover        { box-shadow: 0 2px 12px rgba(0,0,0,.07); }
        .item-row__sort        { display: flex; flex-direction: column; gap: 2px; }
        .sort-btn              { width: 24px; height: 22px; font-size: 12px; color: #9ca3af; background: #f0f2f8; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; transition: color .1s; }
        .sort-btn:hover:not(:disabled) { color: #1a1a2e; background: #e5e7eb; }
        .sort-btn:disabled     { opacity: 0.3; cursor: not-allowed; }
        .item-row__name        { flex: 1; font-size: 15px; font-weight: 600; color: #1a1a2e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .item-row__actions     { display: flex; gap: 8px; flex-shrink: 0; }
        .item-row__img         { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #f0f2f8; flex-shrink: 0; }
        .item-row__meta        { font-size: 12px; color: #9ca3af; }
        .item-row__price       { font-size: 14px; font-weight: 800; color: ${BRAND}; flex-shrink: 0; }
        .item-row__avail       { padding: 4px 10px; border-radius: 9999px; border: none; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .item-row__avail--yes  { background: #dcfce7; color: #16a34a; }
        .item-row__avail--no   { background: #fee2e2; color: #dc2626; }

        .items-filter          { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-pill           { padding: 6px 14px; border-radius: 9999px; background: #f0f2f8; border: 1.5px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #5f6380; font-family: inherit; cursor: pointer; transition: all .15s; }
        .filter-pill:hover     { background: #e5e7eb; }
        .filter-pill--active   { background: ${BRAND}18; color: ${BRAND}; border-color: ${BRAND}; }

        .btn-ghost             { padding: 8px 14px; background: #f0f2f8; color: #374151; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background .15s; }
        .btn-ghost:hover       { background: #e5e7eb; }
        .btn-danger-ghost      { padding: 8px 14px; background: #fef2f2; color: #dc2626; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background .15s; }
        .btn-danger-ghost:hover{ background: #fee2e2; }

        .modal__form           { display: flex; flex-direction: column; gap: 14px; }
        .field                 { display: flex; flex-direction: column; gap: 6px; }
        .field__row            { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .settings-layout       { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }

        @media (max-width: 768px) {
          .admin-sidebar       { transform: translateX(-100%); transition: transform .25s ease; box-shadow: 4px 0 32px rgba(0,0,0,.15); }
          .admin-main          { margin-left: 0 !important; }
          .admin-mobile-header { display: flex !important; }
          .settings-layout     { grid-template-columns: 1fr !important; }
          .field__row          { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
