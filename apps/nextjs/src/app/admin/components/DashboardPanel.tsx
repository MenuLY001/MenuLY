'use client';
import { useState, useEffect } from 'react';
import { type Restaurant, type Category, type MenuItem } from './types';
import { useToast, BRAND, Spinner, apiFetch } from './shared';
import { CheckCircle2, Circle, ExternalLink, QrCode, Smartphone } from 'lucide-react';

export function DashboardPanel({ token, onNavigate }: { token: string; onNavigate: (tab: string) => void }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch(token, '/api/admin/restaurant'),
      apiFetch(token, '/api/admin/categories'),
      apiFetch(token, '/api/admin/items')
    ]).then(([r, c, i]) => {
      if (cancelled) return;
      if (r && r.id) setRestaurant(r);
      if (Array.isArray(c)) setCategories(c);
      if (Array.isArray(i)) setItems(i);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <Spinner />;
  if (!restaurant) return <div>Error loading dashboard.</div>;

  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${restaurant.slug}` : '';

  const checklist = [
    { id: 'cat', label: 'Create your first category', done: categories.length > 0, tab: 'categories' },
    { id: 'item', label: 'Add at least 3 menu items', done: items.length >= 3, tab: 'items' },
    { id: 'brand', label: 'Upload your logo in settings', done: !!restaurant.logo_url, tab: 'settings' },
  ];
  const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  return (
    <div className="panel" style={{ gap: 32 }}>
      <div>
        <h1 className="panel__title" style={{ fontSize: 28 }}>Welcome back, {restaurant.name}! 👋</h1>
        <p className="panel__subtitle">Here's what's happening with your menu today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Stats */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Menu Items</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e' }}>{items.length}</div>
          <div style={{ fontSize: 13, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>{items.filter(i => i.is_available).length} available right now</div>
        </div>
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Categories</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e' }}>{categories.length}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Organized for easy browsing</div>
        </div>
        <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Today's QR Scans</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e' }}>--</div>
          <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>Analytics coming soon 🚀</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32, alignItems: 'start' }} className="dashboard-grid">
        {/* Setup Checklist */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px' }}>Setup Checklist</h2>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
              <span>Profile Completion</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 8, background: '#f0f2f8', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: BRAND, width: `${progress}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checklist.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: c.done ? '#f8fafc' : '#fff', border: `1px solid ${c.done ? '#e2e8f0' : '#e5e7eb'}`, borderRadius: 12, transition: 'all .2s' }}>
                <div style={{ color: c.done ? '#10b981' : '#cbd5e1' }}>
                  {c.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.done ? '#64748b' : '#1a1a2e', textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</div>
                {!c.done && <button onClick={() => onNavigate(c.tab)} style={{ background: '#f0f2f8', color: '#1a1a2e', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .2s' }}>Go →</button>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: '#dcfce7', color: '#16a34a', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Ready for customers?</div>
              <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Download your QR code to put on tables.</div>
            </div>
            <button onClick={() => onNavigate('settings')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Get QR</button>
          </div>
        </div>

        {/* Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a1a2e', fontWeight: 700, fontSize: 15 }}>
              <Smartphone size={18} /> Live Preview
            </div>
            <a href={menuUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: BRAND, fontWeight: 700, textDecoration: 'none' }}>Open <ExternalLink size={14} /></a>
          </div>
          
          <div style={{ width: 320, height: 640, background: '#fff', borderRadius: 40, padding: 8, border: '1px solid #e5e7eb', boxShadow: '0 20px 40px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05)', position: 'relative' }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }}></div>
            {/* Iframe container */}
            <div style={{ width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f0f0f0' }}>
              {menuUrl ? (
                <iframe src={menuUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Menu Preview" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Loading...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
