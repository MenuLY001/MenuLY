import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { adminApi } from '../lib/api';
import { MenuItem, Category } from '@qr-menu/types';
import { AdminTableSkeleton } from '../components/SkeletonLoader';
import { AdminPanelStyles } from './CategoriesPanel';
import { formatPrice } from '../lib/format';

interface ItemForm {
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
  is_veg: boolean;
  is_special: boolean;
}

const DEFAULT_FORM: ItemForm = {
  category_id: '',
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_available: true,
  is_veg: true,
  is_special: false,
};

export function ItemsPanel() {
  const { token } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<ItemForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        adminApi.getItems(token),
        adminApi.getCategories(token),
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ ...DEFAULT_FORM, category_id: categories[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      is_veg: item.is_veg ?? true,
      is_special: item.is_special ?? false,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const url = await adminApi.uploadImage(token, file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setError('Invalid price'); return; }
    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        image_url: form.image_url || undefined,
        is_available: form.is_available,
        is_veg: form.is_veg,
        is_special: form.is_special,
      };
      if (editingItem) {
        const updated = await adminApi.updateItem(token, editingItem.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await adminApi.createItem(token, payload);
        setItems((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token || !confirm(`Delete "${name}"?`)) return;
    try {
      await adminApi.deleteItem(token, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError('Failed to delete item');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    if (!token) return;
    const updated = await adminApi.updateItem(token, item.id, { is_available: !item.is_available });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const filteredItems = filterCat === 'all'
    ? items
    : items.filter((i) => i.category_id === filterCat);

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h1 className="panel__title">Menu Items</h1>
          <p className="panel__subtitle">{items.length} items</p>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={categories.length === 0}>
          + New Item
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <div className="items-no-cats">
          ⚠️ Create at least one category before adding items.
        </div>
      )}

      {error && <div className="panel-error">{error}</div>}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="items-filter">
          <button
            className={`filter-pill ${filterCat === 'all' ? 'filter-pill--active' : ''}`}
            onClick={() => setFilterCat('all')}
          >All</button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-pill ${filterCat === cat.id ? 'filter-pill--active' : ''}`}
              onClick={() => setFilterCat(cat.id)}
            >{cat.name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton />
      ) : filteredItems.length === 0 ? (
        <div className="panel-empty">
          <p className="panel-empty__icon">🍽️</p>
          <p>{filterCat === 'all' ? 'No items yet.' : 'No items in this category.'}</p>
        </div>
      ) : (
        <div className="item-list">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-row">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="item-row__img" />
              ) : (
                <div className="item-row__img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🍽️</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-row__name">{item.name}</div>
                <div className="item-row__meta">{getCatName(item.category_id)}</div>
              </div>
              <span className="item-row__price">{formatPrice(item.price)}</span>
              <button
                className={`item-row__avail ${item.is_available ? 'item-row__avail--yes' : 'item-row__avail--no'}`}
                onClick={() => handleToggleAvailable(item)}
                title={item.is_available ? 'Click to mark unavailable' : 'Click to mark available'}
              >
                {item.is_available ? 'Available' : 'Unavailable'}
              </button>
              <div className="item-row__actions">
                <button className="btn-ghost" onClick={() => openEdit(item)}>Edit</button>
                <button className="btn-danger-ghost" onClick={() => handleDelete(item.id, item.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
            <h2 className="modal__title">{editingItem ? 'Edit Item' : 'New Item'}</h2>
            <form onSubmit={handleSave} className="modal__form">
              <div className="field">
                <label className="field__label" htmlFor="item-cat">Category</label>
                <select
                  id="item-cat"
                  className="field__select"
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="item-name">Name</label>
                <input
                  id="item-name"
                  className="field__input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Paneer Tikka"
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="item-desc">Description (optional)</label>
                <textarea
                  id="item-desc"
                  className="field__textarea"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Fresh paneer marinated in spices and grilled in tandoor"
                />
              </div>

              <div className="field__row">
                <div className="field">
                  <label className="field__label" htmlFor="item-price">Price (₹)</label>
                  <input
                    id="item-price"
                    className="field__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="180"
                    required
                  />
                </div>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <label className="field__label">Available</label>
                  <button
                    type="button"
                    className={`toggle-btn ${form.is_available ? 'toggle-btn--on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, is_available: !f.is_available }))}
                  >
                    <span className="toggle-btn__thumb" />
                  </button>
                </div>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <label className="field__label">Veg / Non-Veg</label>
                  <button
                    type="button"
                    className="veg-toggle"
                    style={{
                      background: form.is_veg ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      borderColor: form.is_veg ? '#22c55e' : '#ef4444',
                      color: form.is_veg ? '#22c55e' : '#ef4444',
                    }}
                    onClick={() => setForm((f) => ({ ...f, is_veg: !f.is_veg }))}
                  >
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: form.is_veg ? '#22c55e' : '#ef4444', marginRight: 6,
                    }} />
                    {form.is_veg ? 'Veg' : 'Non-Veg'}
                  </button>
                </div>
                <div className="field" style={{ justifyContent: 'flex-end' }}>
                  <label className="field__label">Today&apos;s Special</label>
                  <button
                    type="button"
                    className="veg-toggle"
                    style={{
                      background: form.is_special ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                      borderColor: form.is_special ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                      color: form.is_special ? '#f59e0b' : '#888',
                    }}
                    onClick={() => setForm((f) => ({ ...f, is_special: !f.is_special }))}
                  >
                    ⭐ {form.is_special ? 'Special' : 'Regular'}
                  </button>
                </div>
              </div>

              {/* Image upload */}
              <div className="field">
                <label className="field__label">Image</label>
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : form.image_url ? '↺ Change Image' : '↑ Upload Image'}
                </button>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || uploading}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminPanelStyles />
      <style>{`
        .items-filter { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-pill { padding: 6px 14px; border-radius: 9999px; background: #f0f2f8; border: 1.5px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #5f6380; font-family: inherit; transition: all 0.15s; }
        .filter-pill:hover { background: #e5e7eb; }
        .filter-pill--active { background: color-mix(in srgb, var(--brand) 12%, transparent); color: var(--brand); border-color: var(--brand); }
        .items-no-cats { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; }
        .toggle-btn { width: 48px; height: 26px; border-radius: 9999px; background: #d1d5db; position: relative; transition: background 0.2s; font-family: inherit; }
        .toggle-btn--on { background: var(--brand); }
        .toggle-btn__thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
        .toggle-btn--on .toggle-btn__thumb { transform: translateX(22px); }
        .veg-toggle { padding: 7px 14px; border-radius: 8px; border: 1.5px solid; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; transition: all 0.2s; font-family: inherit; }
        .veg-toggle:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
