'use client';
import { useState, useRef } from 'react';
import { type MenuItem } from './types';
import { useToast, inp, btnP, btnG, lbl, Spinner, EmptyState, FormModal, apiFetch } from './shared';
import { Pencil, Trash2, Search, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableMenuItem({ item, catName, onToggle, onEdit, onDelete, showDrag }: { item: MenuItem, catName: string, onToggle: () => void, onEdit: () => void, onDelete: () => void, showDrag: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !showDrag });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1, position: 'relative' as const, opacity: isDragging ? 0.8 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={`item-row ${isDragging ? 'is-dragging' : ''}`}>
      {showDrag && (
        <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '12px 8px', color: '#9ca3af', display: 'flex', alignItems: 'center', marginLeft: -8, touchAction: 'none' }}>
          <GripVertical size={18} />
        </div>
      )}
      {item.image_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={item.image_url} alt={item.name} className="item-row__img" />
        : <div className="item-row__img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🍽️</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="item-row__name" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, border: `1.5px solid ${item.is_veg ? '#22c55e' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.is_veg ? '#22c55e' : '#ef4444' }} />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        </div>
        <div className="item-row__meta">{catName}</div>
      </div>
      <span className="item-row__price">₹{item.price}</span>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, paddingRight: 8 }} title={item.is_available ? 'Available' : 'Unavailable'}>
        <div style={{ position: 'relative' }}>
          <input type="checkbox" style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} checked={item.is_available} onChange={onToggle} />
          <div style={{ width: 36, height: 20, backgroundColor: item.is_available ? '#22c55e' : '#d1d5db', borderRadius: 20, transition: 'background-color 0.2s ease' }} />
          <div style={{ position: 'absolute', top: 2, left: item.is_available ? 18 : 2, width: 16, height: 16, backgroundColor: '#fff', borderRadius: '50%', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>
      </label>
      <div className="item-row__actions">
        <button onClick={onEdit} className="btn-ghost" title="Edit" style={{ padding: '8px 10px', color: '#6b7280' }}><Pencil size={16} /></button>
        <button onClick={onDelete} className="btn-danger-ghost" title="Delete" style={{ padding: '8px 10px', background: 'transparent' }}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useItems } from './hooks';

const EMPTY_FORM = { category_id: '', name: '', description: '', price: '', image_url: '', is_available: true, is_veg: true, is_special: false, is_todays_special: false };

export function ItemsPanel({ token, toast }: { token: string; toast: ReturnType<typeof useToast> }) {
  const queryClient = useQueryClient();
  const { data: cats = [], isLoading: catLoading } = useCategories(token);
  const { data: items = [], isLoading: itemLoading } = useItems(token);
  const loading = catLoading || itemLoading;
  
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM, category_id: cats[0]?.id ?? '' }); setModal(true); };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ category_id: item.category_id, name: item.name, description: item.description ?? '', price: String(item.price), image_url: item.image_url ?? '', is_available: item.is_available, is_veg: item.is_veg, is_special: item.is_special, is_todays_special: item.is_todays_special || false });
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
    const priceStr = String(form.price).replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) { toast.error('Enter a valid price'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price, description: form.description || undefined, image_url: form.image_url || undefined };
      if (editing) {
        await apiFetch(token, `/api/admin/items/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        toast.success('Item updated');
      } else {
        await apiFetch(token, '/api/admin/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        toast.success('Item created');
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setModal(false);
    } catch { toast.error('Failed to save item'); } finally { setSaving(false); }
  };

  const del = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await apiFetch(token, `/api/admin/items/${item.id}`, { method: 'DELETE' });
    queryClient.invalidateQueries({ queryKey: ['items'] });
    toast.success('Item deleted');
  };

  const toggleAvail = async (item: MenuItem) => {
    await apiFetch(token, `/api/admin/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_available: !item.is_available }) });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  };

  const filtered = items.filter(i => {
    if (filterCat !== 'all' && i.category_id !== filterCat) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0; // fallback to sort_order (which is the default array order)
  });

  const catName = (id: string) => cats.find(c => c.id === id)?.name ?? '—';
  const showDrag = sortBy === 'default' && searchQuery === '';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      const updatedItems = newItems.map((item, i) => ({ ...item, sort_order: i }));
      queryClient.setQueryData(['items'], updatedItems);
      
      Promise.all(updatedItems.map(item => 
        apiFetch(token, `/api/admin/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: item.sort_order }) })
      )).catch(() => toast.error("Failed to save ordering"));
    }
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div><h1 className="panel__title">Menu Items</h1><p className="panel__subtitle">{items.length} items</p></div>
        <button onClick={openCreate} disabled={cats.length === 0} style={{ ...btnP, opacity: cats.length === 0 ? 0.5 : 1 }}>+ New Item</button>
      </div>
      {cats.length === 0 && !loading && <div className="panel-warn">⚠️ Create at least one category before adding items.</div>}

      {cats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {/* Top Bar: Search & Sort */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search menu items..." style={{ ...inp, paddingLeft: 38, width: '100%', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.02)' }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width: 'auto', background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,.02)' }}>
              <option value="default">Custom Order</option>
              <option value="name">Name (A-Z)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="items-filter">
            {['all', ...cats.map(c => c.id)].map(id => (
              <button key={id} onClick={() => setFilterCat(id)} className={`filter-pill ${filterCat === id ? 'filter-pill--active' : ''}`}>
                {id === 'all' ? 'All' : catName(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : sortedAndFiltered.length === 0 ? (
        <EmptyState icon="🍽️" text={searchQuery ? 'No items matched your search.' : filterCat === 'all' ? 'No items yet.' : 'No items in this category.'} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedAndFiltered.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="item-list">
              {sortedAndFiltered.map(item => (
                <SortableMenuItem 
                  key={item.id} 
                  item={item} 
                  catName={catName(item.category_id)} 
                  showDrag={showDrag}
                  onToggle={() => toggleAvail(item)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => del(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal && (
        <FormModal title={editing ? 'Edit Item' : 'New Item'} onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="f-modal-body" style={{ padding: '24px 24px 8px' }}>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <label style={{ ...lbl, marginBottom: 8 }}>Image</label>
                  <div 
                    onClick={() => fileRef.current?.click()}
                    style={{ width: 120, height: 120, borderRadius: 12, border: '2px dashed #d1d5db', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    {uploading ? (
                      <Spinner />
                    ) : form.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: '#9ca3af', textAlign: 'center', fontSize: 12, padding: 8 }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                        Upload JPG/PNG
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={upload} />
                  {form.image_url && !uploading && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, marginTop: 8, cursor: 'pointer', width: '100%' }}>Remove</button>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lbl}>Name *</label>
                    <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Paneer Tikka" required autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>Category *</label>
                    <select style={inp} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} required>
                      <option value="" disabled>Select category...</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={lbl}>Description</label>
                  <span style={{ fontSize: 12, color: form.description.length > 150 ? '#ef4444' : '#9ca3af' }}>{form.description.length}/150</span>
                </div>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Fresh paneer marinated in spices…" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                <div>
                  <label style={lbl}>Price (₹) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: 10, color: '#6b7280', fontWeight: 600 }}>₹</span>
                    <input style={{ ...inp, paddingLeft: 30 }} type="text" inputMode="decimal" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="180" required />
                  </div>
                </div>
                
                <div>
                  <label style={lbl}>Veg type</label>
                  <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: true }))} style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: 6, background: form.is_veg ? '#fff' : 'transparent', boxShadow: form.is_veg ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: form.is_veg ? '#1f2937' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                       <div style={{ width: 12, height: 12, borderRadius: 2, border: `1.5px solid #22c55e`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} /></div> Veg
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: false }))} style={{ flex: 1, padding: '8px 4px', border: 'none', borderRadius: 6, background: !form.is_veg ? '#fff' : 'transparent', boxShadow: !form.is_veg ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: !form.is_veg ? '#1f2937' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                       <div style={{ width: 12, height: 12, borderRadius: 2, border: `1.5px solid #ef4444`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} /></div> Non-veg
                    </button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Special Tags</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <input type="checkbox" style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} checked={form.is_special} onChange={e => setForm(f => ({ ...f, is_special: e.target.checked }))} />
                        <div style={{ width: 44, height: 24, backgroundColor: form.is_special ? '#f59e0b' : '#d1d5db', borderRadius: 20, transition: 'background-color 0.2s ease' }} />
                        <div style={{ position: 'absolute', top: 2, left: form.is_special ? 22 : 2, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Chef`&apos`s Special</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <input type="checkbox" style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} checked={form.is_todays_special} onChange={e => setForm(f => ({ ...f, is_todays_special: e.target.checked }))} />
                        <div style={{ width: 44, height: 24, backgroundColor: form.is_todays_special ? '#3b82f6' : '#d1d5db', borderRadius: 20, transition: 'background-color 0.2s ease' }} />
                        <div style={{ position: 'absolute', top: 2, left: form.is_todays_special ? 22 : 2, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Today`&apos`s Special</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Available for ordering</label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', height: 42 }}>
                    <div style={{ position: 'relative' }}>
                      <input type="checkbox" style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                      <div style={{ width: 44, height: 24, backgroundColor: form.is_available ? '#22c55e' : '#d1d5db', borderRadius: 20, transition: 'background-color 0.2s ease' }} />
                      <div style={{ position: 'absolute', top: 2, left: form.is_available ? 22 : 2, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                    </div>
                  </label>
                </div>
              </div>

            </div>
            
            <div className="f-modal-footer">
              <button type="button" onClick={() => setModal(false)} style={btnG}>Cancel</button>
              <button type="submit" style={btnP} disabled={saving || uploading || !form.name.trim() || !form.category_id || !form.price}>{saving ? 'Saving…' : 'Save item'}</button>
            </div>
          </form>
        </FormModal>
      )}
    </div>
  );
}
