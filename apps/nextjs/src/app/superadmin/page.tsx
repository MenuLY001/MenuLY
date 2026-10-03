'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { DashboardData, FilterState, RestaurantRow, ToastType, Toast } from './components/types';
import { downloadCSV } from './components/helpers';
import { ToastStack } from './components/ToastStack';
import { StatCards } from './components/StatCards';
import { RestaurantTable } from './components/RestaurantTable';
import { ManageModal, SuspendModal, AddRestaurantModal } from './components/Modals';

import { Shield, RefreshCw, Search, Download, Plus } from 'lucide-react';

// ── Shared input/button styles ───────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.1)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', background: '#13131a', color: '#f2f2f5' };
const btn: React.CSSProperties = { width: '100%', padding: '11px 0', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' };

export default function SuperAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<FilterState>('all');
  const [search, setSearch] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [manageTarget, setManageTarget] = useState<RestaurantRow | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<RestaurantRow | null>(null);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === 'error' ? 6000 : 4000);
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoggingIn(true); setLoginError('');
    try {
      const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr || !auth.session) throw new Error(authErr?.message ?? 'Login failed');
      const res = await fetch('/api/superadmin/dashboard', { headers: { Authorization: `Bearer ${auth.session.access_token}` } });
      if (res.status === 403) throw new Error('This account is not a super admin.');
      if (!res.ok) throw new Error('Could not load dashboard.');
      setToken(auth.session.access_token);
      setData(await res.json());
      setLastRefreshed(new Date());
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoggingIn(false); }
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!token) return; setLoading(true);
    try {
      const res = await fetch('/api/superadmin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setData(await res.json());
      setLastRefreshed(new Date());
    } finally { setLoading(false); }
  }, [token]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleActivate(id: string, name: string) {
    if (!token) return; setActionLoading(id + 'active');
    try {
      await fetch(`/api/superadmin/restaurants/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
      await refresh();
      addToast('success', 'Activated', `${name} is now active.`);
    } catch { addToast('error', 'Failed', 'Could not activate.'); }
    finally { setActionLoading(null); }
  }

  // ── Login Screen ───────────────────────────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13', color: '#f2f2f5', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ background: '#1a1a24', borderRadius: 16, padding: 36, width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 60px rgba(0,0,0,.5)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(165,180,252,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#a5b4fc' }}><Shield size={26} /></div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#f2f2f5' }}>Super Admin</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 28 }}>Menuly Platform Control</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inp} type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={inp} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {loginError && <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'left' }}>{loginError}</p>}
          <button type="submit" style={btn} disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );

  const { stats, restaurants } = data ?? { stats: null, restaurants: [] };

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f13', color: '#f2f2f5', fontFamily: 'Inter,sans-serif' }}>
      <ToastStack toasts={toasts} />

      {/* Modals */}
      {showAddModal && (
        <AddRestaurantModal
          onClose={() => setShowAddModal(false)}
          onDone={msg => { addToast('success', 'Created', msg); refresh(); }}
          onError={msg => addToast('error', 'Failed to Create', msg)}
        />
      )}
      {manageTarget && token && (
        <ManageModal
          restaurantId={manageTarget.id} restaurantName={manageTarget.name} token={token}
          onDone={msg => { addToast('success', 'Trial Extended', msg); refresh(); }}
          onError={msg => addToast('error', 'Failed', msg)}
          onClose={() => setManageTarget(null)}
        />
      )}
      {suspendTarget && token && (
        <SuspendModal
          restaurantId={suspendTarget.id} restaurantName={suspendTarget.name} token={token}
          onDone={msg => { addToast('success', 'Suspended', msg); refresh(); }}
          onError={msg => addToast('error', 'Failed', msg)}
          onClose={() => setSuspendTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: '#1a1a24', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#a5b4fc" />
          <span style={{ fontWeight: 800, fontSize: 17, color: '#f2f2f5' }}>Menuly Super Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRefreshed && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
              Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={() => setShowAddModal(true)} disabled={loading}
            style={{ padding: '7px 16px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} strokeWidth={3} /> Add Restaurant
          </button>
          <button onClick={refresh} disabled={loading}
            style={{ padding: '7px 16px', background: 'rgba(255,255,255,.07)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && <StatCards stats={stats} activeFilter={filter} onFilter={f => { setFilter(f); setSearch(''); }} />}

      {/* Table Card */}
      <div style={{ margin: '20px 24px', background: '#1a1a24', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f2f2f5', flex: 1 }}>All Restaurants</h2>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#13131a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '0 12px', height: 38, minWidth: 220 }}>
            <Search size={16} color="rgba(255,255,255,.3)" />
            <input placeholder="Search name or slug…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#f2f2f5', fontSize: 13, fontFamily: 'inherit', width: '100%' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'active', 'trialing', 'suspended', 'cancelled'] as FilterState[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${filter === f ? '#a5b4fc55' : 'rgba(255,255,255,.08)'}`, background: filter === f ? 'rgba(165,180,252,.12)' : 'transparent', color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', textTransform: 'capitalize' }}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* CSV Download */}
          <button onClick={() => downloadCSV(restaurants as RestaurantRow[])} disabled={!restaurants.length}
            style={{ padding: '7px 14px', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Download size={14} /> CSV
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && !data && (
          <div style={{ padding: '20px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 52, borderRadius: 8, background: 'rgba(255,255,255,.04)', marginBottom: 8, animation: 'saPulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {restaurants && (
          <RestaurantTable
            restaurants={restaurants as RestaurantRow[]}
            filter={filter} search={search}
            actionLoading={actionLoading}
            onActivate={handleActivate}
            onSuspend={r => setSuspendTarget(r)}
            onManage={r => setManageTarget(r)}
          />
        )}
      </div>

      <style>{`
        @keyframes saFadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes saPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes saSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin { animation: saSpin 1s linear infinite; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
