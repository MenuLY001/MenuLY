'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Session } from '@supabase/supabase-js';

import { type Tab, type Restaurant } from './components/types';
import { useToast, TC, Spinner, apiFetch } from './components/shared';
import { CategoriesPanel } from './components/CategoriesPanel';
import { ItemsPanel } from './components/ItemsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { BillingPanel } from './components/BillingPanel';
import { SignInScreen } from './components/SignInScreen';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tab, setTab] = useState<Tab>('categories');
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toastObj = useToast();
  const { toasts } = toastObj;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    let cancelled = false;
    if (!token) {
      Promise.resolve().then(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(() => { if (!cancelled) setLoading(true); });
    apiFetch(token, '/api/admin/restaurant')
      .then(async r => {
        if (cancelled) return;
        if (r && r.id !== undefined) {
          setRestaurant(r);
        } else {
          const create = await apiFetch(token, '/api/admin/restaurant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'My Restaurant' }) });
          if (!cancelled) setRestaurant(create);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session]);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;

  if (!session) {
    return <SignInScreen />;
  }


  const token = session.access_token;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fc', color: '#1a1a2e' }}>
      {/* ── Toasts ────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 999 }}>
        {toasts.map(t => {
          const c = TC[t.type];
          return (
            <div key={t.id} style={{ background: c.bg, border: `1px solid ${c.border}`, padding: '12px 16px', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start', boxShadow: '0 8px 24px rgba(0,0,0,.08)', minWidth: 280, animation: 'slideIn .2s ease-out' }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: t.msg ? 2 : 0 }}>{t.title}</div>{t.msg && <div style={{ fontSize: 13, color: c.text, opacity: 0.8 }}>{t.msg}</div>}</div>
            </div>
          );
        })}
      </div>

      {/* ── Sidebar ────────────────────────────────────── */}
      {mobileNavOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40 }} onClick={() => setMobileNavOpen(false)} />}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'admin-sidebar--open' : ''}`} style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 24, position: 'fixed', top: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>M</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>Menuly</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {[
            { id: 'categories', label: 'Categories', icon: '📋' },
            { id: 'items', label: 'Menu Items', icon: '🍽️' },
            { id: 'settings', label: 'Settings & QR', icon: '⚙️' },
            { id: 'billing', label: 'Billing', icon: '💳' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as Tab); setMobileNavOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', background: tab === t.id ? '#f0f2f8' : 'transparent', color: tab === t.id ? '#1a1a2e' : '#6b7280', fontSize: 14, fontWeight: tab === t.id ? 700 : 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            >
              <span>{t.icon}</span> {t.label}
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

        {/* Powered by */}
        <div style={{ marginTop: 'auto', paddingTop: 32, textAlign: 'center', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          Powered by 
          <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a2e', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vyoma-logo.jpg" alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
            vyoma.world
          </a>
        </div>
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
          {tab === 'categories' && <CategoriesPanel token={token} toast={toastObj} />}
          {tab === 'items'      && <ItemsPanel      token={token} toast={toastObj} />}
          {tab === 'settings'   && <SettingsPanel   token={token} toast={toastObj} onRestaurantUpdate={setRestaurant} />}
          {tab === 'billing'    && <BillingPanel    token={token} toast={toastObj} />}
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
        .item-row__price       { font-size: 14px; font-weight: 800; color: var(--brand, #e67e22); flex-shrink: 0; }
        .item-row__avail       { padding: 4px 10px; border-radius: 9999px; border: none; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .item-row__avail--yes  { background: #dcfce7; color: #16a34a; }
        .item-row__avail--no   { background: #fee2e2; color: #dc2626; }

        .items-filter          { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-pill           { padding: 6px 14px; border-radius: 9999px; background: #f0f2f8; border: 1.5px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #5f6380; font-family: inherit; cursor: pointer; transition: all .15s; }
        .filter-pill:hover     { background: #e5e7eb; }
        .filter-pill--active   { background: var(--brand, #e67e22)18; color: var(--brand, #e67e22); border-color: var(--brand, #e67e22); }

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
          .admin-sidebar--open { transform: translateX(0); }
          .admin-main          { margin-left: 0 !important; }
          .admin-mobile-header { display: flex !important; }
          .settings-layout     { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
