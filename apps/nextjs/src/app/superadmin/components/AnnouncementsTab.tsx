'use client';
import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'trialing' | 'active';
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const TYPE_COLORS = {
  info:    { bg: 'rgba(165,180,252,.15)', color: '#a5b4fc', border: 'rgba(165,180,252,.3)' },
  warning: { bg: 'rgba(234,179,8,.15)',   color: '#fde047', border: 'rgba(234,179,8,.3)' },
  success: { bg: 'rgba(34,197,94,.15)',   color: '#4ade80', border: 'rgba(34,197,94,.3)' },
  error:   { bg: 'rgba(239,68,68,.15)',   color: '#f87171', border: 'rgba(239,68,68,.3)' },
};

const EMPTY_FORM = { title: '', message: '', type: 'info' as const, target: 'all' as const, expires_at: '' };

export function AnnouncementsTab({ token, isActive }: { token: string; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/announcements', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setAnnouncements(Array.isArray(json) ? json : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    if (token && isActive) void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isActive]);

  if (!isActive) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch('/api/superadmin/announcements', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expires_at: form.expires_at || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create'); return; }
      setShowModal(false); setForm(EMPTY_FORM); void load();
    } catch { setError('Network error'); } finally { setSaving(false); }
  };

  const toggleActive = async (a: Announcement) => {
    await fetch(`/api/superadmin/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !a.is_active }),
    });
    void load();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/superadmin/announcements/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void load();
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.1)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', background: '#13131a', color: '#f2f2f5' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: '#1a1a24', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Megaphone size={18} color="#a5b4fc" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f2f2f5' }}>Announcements</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.4)', flex: 1 }}>Broadcast messages shown inside restaurant dashboards</p>
          <button onClick={() => { setForm(EMPTY_FORM); setError(''); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> New Announcement
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, color: 'rgba(255,255,255,.4)' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
            <Megaphone size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No announcements yet. Create one to broadcast to all restaurants.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {announcements.map((a, i) => {
              const colors = TYPE_COLORS[a.type] ?? TYPE_COLORS.info;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < announcements.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', opacity: a.is_active ? 1 : 0.5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#f2f2f5' }}>{a.title}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{a.type.toUpperCase()}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.5)' }}>→ {a.target}</span>
                      {!a.is_active && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.3)' }}>HIDDEN</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>{a.message}</div>
                    {a.expires_at && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>
                        Expires: {new Date(a.expires_at).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(a)} title={a.is_active ? 'Hide' : 'Show'}
                      style={{ background: 'none', border: 'none', color: a.is_active ? '#4ade80' : 'rgba(255,255,255,.3)', cursor: 'pointer', padding: 6, display: 'flex' }}>
                      {a.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => deleteAnnouncement(a.id)} title="Delete"
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 6, display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'relative', background: '#1a1a24', width: '100%', maxWidth: 500, borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 24px 48px rgba(0,0,0,.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f2f2f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Megaphone size={18} color="#a5b4fc" /> New Announcement
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input required style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Scheduled Maintenance on Oct 10" />
              </div>
              <div>
                <label style={lbl}>Message *</label>
                <textarea required rows={3} style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Explain what this announcement is about..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Type</label>
                  <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}>
                    <option value="info">ℹ️ Info</option>
                    <option value="warning">⚠️ Warning</option>
                    <option value="success">✅ Success</option>
                    <option value="error">🚨 Error</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Show to</label>
                  <select style={inp} value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as typeof form.target }))}>
                    <option value="all">All restaurants</option>
                    <option value="trialing">Trialing only</option>
                    <option value="active">Active (paid) only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Expires At (optional)</label>
                <input type="datetime-local" style={inp} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>Leave blank to show indefinitely</div>
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'transparent', color: '#f2f2f5', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '10px', background: '#a5b4fc', color: '#0f0f13', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Broadcasting...' : '📢 Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
