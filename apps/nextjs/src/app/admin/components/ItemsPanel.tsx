'use client';
import { useState, useEffect, useRef } from 'react';
import { type Category, type MenuItem } from './types';
import { useToast, BRAND, inp, btnP, btnG, lbl, Spinner, EmptyState, Modal, apiFetch } from './shared';

const EMPTY_FORM = { category_id: '', name: '', description: '', price: '', image_url: '', is_available: true, is_veg: true, is_special: false };

export function ItemsPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
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

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    Promise.all([
      apiFetch(token, '/api/admin/items'),
      apiFetch(token, '/api/admin/categories'),
    ])
      .then(([id, cd]) => {
        if (!cancelled) {
          setItems(Array.isArray(id) ? id : []);
          setCats(Array.isArray(cd) ? cd : []);
        }
      })
      .catch(() => { if (!cancelled) { setItems([]); setCats([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

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
