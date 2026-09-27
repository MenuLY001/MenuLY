import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { adminApi } from '../lib/api';
import { Category } from '@qr-menu/types';
import { AdminTableSkeleton } from '../components/SkeletonLoader';

export function CategoriesPanel() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminApi.getCategories(token);
      setCategories(data);
    } catch (e) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const openCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formName.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        const updated = await adminApi.updateCategory(token, editingCategory.id, { name: formName.trim() });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await adminApi.createCategory(token, { name: formName.trim() });
        setCategories((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token || !confirm(`Delete category "${name}"? All items in this category will also be deleted.`)) return;
    try {
      await adminApi.deleteCategory(token, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError('Failed to delete category');
    }
  };

  const moveSort = async (id: string, direction: 'up' | 'down') => {
    if (!token) return;
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const newCategories = [...categories];
    const newSortA = newCategories[swapIdx].sort_order;
    const newSortB = newCategories[idx].sort_order;
    newCategories[idx] = { ...newCategories[idx], sort_order: newSortA };
    newCategories[swapIdx] = { ...newCategories[swapIdx], sort_order: newSortB };
    newCategories.sort((a, b) => a.sort_order - b.sort_order);
    setCategories(newCategories);
    await Promise.all([
      adminApi.updateCategory(token, newCategories[idx].id, { sort_order: newCategories[idx].sort_order }),
      adminApi.updateCategory(token, newCategories[swapIdx].id, { sort_order: newCategories[swapIdx].sort_order }),
    ]);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h1 className="panel__title">Categories</h1>
          <p className="panel__subtitle">{categories.length} categories</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Category</button>
      </div>

      {error && <div className="panel-error">{error}</div>}

      {loading ? (
        <AdminTableSkeleton />
      ) : categories.length === 0 ? (
        <div className="panel-empty">
          <p className="panel-empty__icon">📋</p>
          <p>No categories yet. Create your first one!</p>
        </div>
      ) : (
        <div className="item-list">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="item-row">
              <div className="item-row__sort">
                <button
                  className="sort-btn"
                  onClick={() => moveSort(cat.id, 'up')}
                  disabled={idx === 0}
                  aria-label="Move up"
                >↑</button>
                <button
                  className="sort-btn"
                  onClick={() => moveSort(cat.id, 'down')}
                  disabled={idx === categories.length - 1}
                  aria-label="Move down"
                >↓</button>
              </div>
              <span className="item-row__name">{cat.name}</span>
              <div className="item-row__actions">
                <button className="btn-ghost" onClick={() => openEdit(cat)}>Edit</button>
                <button className="btn-danger-ghost" onClick={() => handleDelete(cat.id, cat.name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSave} className="modal__form">
              <div className="field">
                <label className="field__label" htmlFor="cat-name">Name</label>
                <input
                  id="cat-name"
                  className="field__input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Starters, Mains, Desserts"
                  required
                  autoFocus
                />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || !formName.trim()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminPanelStyles />
    </div>
  );
}

// Shared admin styles (injected once per panel)
export function AdminPanelStyles() {
  return (
    <style>{`
      .panel { display: flex; flex-direction: column; gap: 24px; }
      .panel__header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
      .panel__title { font-size: 24px; font-weight: 800; color: #1a1a2e; }
      .panel__subtitle { font-size: 14px; color: #9ca3af; margin-top: 2px; }
      .panel-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
      .panel-empty { text-align: center; padding: 48px 20px; color: #9ca3af; }
      .panel-empty__icon { font-size: 40px; margin-bottom: 12px; }
      .item-list { display: flex; flex-direction: column; gap: 8px; }
      .item-row { display: flex; align-items: center; gap: 12px; background: #fff; padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e7eb; transition: box-shadow 0.15s ease; }
      .item-row:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
      .item-row__sort { display: flex; flex-direction: column; gap: 2px; }
      .sort-btn { width: 24px; height: 22px; font-size: 12px; color: #9ca3af; background: #f0f2f8; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: color 0.1s; }
      .sort-btn:hover:not(:disabled) { color: #1a1a2e; background: #e5e7eb; }
      .sort-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      .item-row__name { flex: 1; font-size: 15px; font-weight: 600; color: #1a1a2e; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .item-row__actions { display: flex; gap: 8px; flex-shrink: 0; }
      .item-row__img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: #f0f2f8; flex-shrink: 0; }
      .item-row__meta { font-size: 12px; color: #9ca3af; }
      .item-row__price { font-size: 14px; font-weight: 700; color: var(--brand); flex-shrink: 0; }
      .item-row__avail { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; flex-shrink: 0; }
      .item-row__avail--yes { background: #dcfce7; color: #16a34a; }
      .item-row__avail--no { background: #fef2f2; color: #dc2626; }
      .btn-primary { padding: 10px 18px; background: var(--brand); color: #fff; border-radius: 10px; font-size: 14px; font-weight: 700; font-family: inherit; transition: opacity 0.15s; white-space: nowrap; }
      .btn-primary:hover { opacity: 0.88; }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-ghost { padding: 8px 14px; background: #f0f2f8; color: #374151; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; transition: background 0.15s; }
      .btn-ghost:hover { background: #e5e7eb; }
      .btn-danger-ghost { padding: 8px 14px; background: #fef2f2; color: #dc2626; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: inherit; transition: background 0.15s; }
      .btn-danger-ghost:hover { background: #fee2e2; }
      .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .modal { background: #fff; border-radius: 16px; padding: 28px 24px; width: 100%; max-width: 480px; box-shadow: 0 8px 40px rgba(0,0,0,0.2); animation: fadeIn 0.2s ease; }
      .modal__title { font-size: 20px; font-weight: 800; color: #1a1a2e; margin-bottom: 20px; }
      .modal__form { display: flex; flex-direction: column; gap: 16px; }
      .modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
      .field { display: flex; flex-direction: column; gap: 6px; }
      .field__label { font-size: 13px; font-weight: 600; color: #374151; }
      .field__input, .field__textarea, .field__select { padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #1a1a2e; background: #f9fafb; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
      .field__input:focus, .field__textarea:focus, .field__select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand) 18%, transparent); background: #fff; }
      .field__textarea { resize: vertical; min-height: 80px; }
      .field__row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 480px) { .field__row { grid-template-columns: 1fr; } }
    `}</style>
  );
}
