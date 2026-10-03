'use client';
import { useState, useEffect } from 'react';
import { type Category } from './types';
import { useToast, inp, btnP, btnG, lbl, Spinner, EmptyState, Modal, apiFetch } from './shared';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCategoryItem({ category, onEdit, onDelete }: { category: Category, onEdit: () => void, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1, position: 'relative' as const, opacity: isDragging ? 0.8 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={`item-row ${isDragging ? 'is-dragging' : ''}`}>
      <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '12px 8px', color: '#9ca3af', display: 'flex', alignItems: 'center', touchAction: 'none' }}>
        <GripVertical size={18} />
      </div>
      <span className="item-row__name">{category.name}</span>
      <div className="item-row__actions">
        <button onClick={onEdit} className="btn-ghost" title="Edit" style={{ padding: '8px 10px', color: '#6b7280' }}><Pencil size={16} /></button>
        <button onClick={onDelete} className="btn-danger-ghost" title="Delete" style={{ padding: '8px 10px', background: 'transparent' }}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cats.findIndex(c => c.id === active.id);
      const newIndex = cats.findIndex(c => c.id === over.id);
      const newCats = arrayMove(cats, oldIndex, newIndex);
      
      // Apply new sort orders based on index
      const updatedCats = newCats.map((c, i) => ({ ...c, sort_order: i }));
      setCats(updatedCats);
      
      // Save all updated sort orders
      Promise.all(updatedCats.map(c => 
        apiFetch(token, `/api/admin/categories/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: c.sort_order }) })
      )).catch(() => {
        toast.error("Failed to save ordering");
      });
    }
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cats.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="item-list">
              {cats.map(c => (
                <SortableCategoryItem key={c.id} category={c} onEdit={() => openEdit(c)} onDelete={() => del(c)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
