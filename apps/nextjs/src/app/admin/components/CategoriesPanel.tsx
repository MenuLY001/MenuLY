'use client';
import { useState, useEffect } from 'react';
import { type Category } from './types';
import { useToast, inp, btnP, btnG, lbl, Spinner, EmptyState, Modal, apiFetch } from './shared';

export function CategoriesPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    apiFetch(token, '/api/admin/categories')
      .then(d => { if (!cancelled) setCats(Array.isArray(d) ? d : []); })
      .catch(() => { if (!cancelled) setCats([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

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
