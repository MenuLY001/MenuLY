'use client';
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

interface RestaurantRow {
  id: string; name: string; slug: string; status: string;
  trial_ends_at: string | null; created_at: string;
  subscription: { status: string; razorpay_subscription_id: string; current_period_end: string | null } | null;
}
interface DashboardData {
  stats: { totalRestaurants: number; activeCount: number; trialCount: number; suspendedCount: number; totalAdmins: number; totalRevenuePaise: number };
  restaurants: RestaurantRow[];
}

const TOAST_COLORS = {
  success: { bg:'#f0fdf4', border:'#86efac', color:'#15803d', icon:'✅' },
  error:   { bg:'#fef2f2', border:'#fca5a5', color:'#dc2626', icon:'❌' },
  info:    { bg:'#eff6ff', border:'#93c5fd', color:'#1d4ed8', icon:'ℹ️' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg:'#dcfce7', color:'#166534' }, trialing: { bg:'#fef9c3', color:'#854d0e' },
  suspended: { bg:'#fee2e2', color:'#991b1b' }, cancelled: { bg:'#f3f4f6', color:'#6b7280' },
};

export default function SuperAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<{ id:string; type:'success'|'error'|'info'; title:string; msg?:string }[]>([]);

  const addToast = useCallback((type: 'success'|'error'|'info', title: string, msg?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === 'error' ? 6000 : 4000);
  }, []);

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
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoggingIn(false); }
  }

  const refresh = useCallback(async () => {
    if (!token) return; setLoading(true);
    try {
      const res = await fetch('/api/superadmin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setData(await res.json());
    } finally { setLoading(false); }
  }, [token]);

  async function changeStatus(id: string, status: string) {
    if (!token) return; setActionLoading(id + status);
    try {
      await fetch(`/api/superadmin/restaurants/${id}/status`, { method:'PATCH', headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ status }) });
      await refresh(); addToast('success', 'Status updated', `Set to "${status}".`);
    } catch (err) { addToast('error', 'Failed', err instanceof Error ? err.message : 'Unknown error'); }
    finally { setActionLoading(null); }
  }

  async function extendTrial(id: string) {
    if (!token) return;
    const days = parseInt(extendDays[id] ?? '7', 10);
    if (!days || days < 1) return;
    setActionLoading(id + 'extend');
    try {
      await fetch(`/api/superadmin/restaurants/${id}/extend-trial`, { method:'PATCH', headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ days }) });
      await refresh(); addToast('success', 'Trial extended', `Extended by ${days} day(s).`);
    } catch (err) { addToast('error', 'Failed', err instanceof Error ? err.message : 'Unknown error'); }
    finally { setActionLoading(null); }
  }

  if (!token) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:36, width:360, boxShadow:'0 4px 24px rgba(0,0,0,.10)', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>🛡️</div>
        <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Super Admin</h1>
        <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>Menuly Platform Control</p>
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input style={inp} type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={inp} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {loginError && <p style={{ color:'#ef4444', fontSize:13, margin:0 }}>{loginError}</p>}
          <button type="submit" style={btn} disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );

  const { stats, restaurants } = data ?? { stats: null, restaurants: [] };

  return (
    <div style={{ minHeight:'100dvh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      {/* Toast */}
      <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
        {toasts.map(t => {
          const c = TOAST_COLORS[t.type];
          return <div key={t.id} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:'14px 16px', display:'flex', gap:10, maxWidth:380, boxShadow:'0 8px 24px rgba(0,0,0,.1)' }}>
            <span style={{ fontSize:18 }}>{c.icon}</span>
            <div><div style={{ fontWeight:700, fontSize:13, color:c.color }}>{t.title}</div>{t.msg && <div style={{ fontSize:12, color:'#374151', marginTop:2 }}>{t.msg}</div>}</div>
          </div>;
        })}
      </div>

      <div style={{ background:'#1e293b', color:'#fff', padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:700, fontSize:18 }}>🛡️ Menuly Super Admin</span>
        <button onClick={refresh} disabled={loading} style={{ padding:'6px 14px', background:'#f3f4f6', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, padding:'24px 28px 0' }}>
          {[
            { label:'Total Restaurants', value:stats.totalRestaurants, icon:'🍽️' },
            { label:'Active (paying)',   value:stats.activeCount,      icon:'✅' },
            { label:'On Trial',          value:stats.trialCount,       icon:'⏳' },
            { label:'Suspended',         value:stats.suspendedCount,   icon:'🔒' },
            { label:'Total Revenue',     value:`₹${Math.round(stats.totalRevenuePaise/100).toLocaleString('en-IN')}`, icon:'💰' },
          ].map(c => (
            <div key={c.label} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.07)', display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ fontSize:28 }}>{c.icon}</div>
              <div style={{ fontSize:26, fontWeight:700 }}>{c.value}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'#fff', borderRadius:12, margin:'20px 28px', boxShadow:'0 1px 4px rgba(0,0,0,.07)', overflow:'hidden' }}>
        <h2 style={{ fontSize:15, fontWeight:700, padding:'16px 20px 0', margin:0 }}>All Restaurants</h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Name / Slug','Status','Subscription','Trial Ends','Created','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', background:'#f8fafc', color:'#374151', fontWeight:600, borderBottom:'1px solid #e5e7eb', fontSize:12 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(restaurants as RestaurantRow[]).map(r => {
                const sc = STATUS_COLORS[r.status] ?? { bg:'#f3f4f6', color:'#374151' };
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600 }}>{r.name}</div>
                      <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#e67e22' }}>{r.slug}</a>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:sc.bg, color:sc.color }}>{r.status}</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>{r.subscription?.status ?? <span style={{ color:'#9ca3af', fontSize:13 }}>None</span>}</td>
                    <td style={{ padding:'12px 16px' }}>{r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
                    <td style={{ padding:'12px 16px' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                        {r.status !== 'active' && <button onClick={() => changeStatus(r.id,'active')} disabled={!!actionLoading} style={{ padding:'4px 10px', background:'#dcfce7', color:'#166534', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'active'?'…':'Activate'}</button>}
                        {r.status !== 'suspended' && <button onClick={() => changeStatus(r.id,'suspended')} disabled={!!actionLoading} style={{ padding:'4px 10px', background:'#fee2e2', color:'#991b1b', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'suspended'?'…':'Suspend'}</button>}
                        <input type="number" min={1} max={365} placeholder="Days" value={extendDays[r.id]??''} onChange={e => setExtendDays(p=>({...p,[r.id]:e.target.value}))} style={{ width:54, padding:'2px 6px', borderRadius:6, border:'1px solid #d1d5db', fontSize:12 }} />
                        <button onClick={() => extendTrial(r.id)} disabled={!!actionLoading || !extendDays[r.id]} style={{ padding:'4px 10px', background:'#fef9c3', color:'#854d0e', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'extend'?'…':'+ Trial'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
const btn: React.CSSProperties = { width:'100%', padding:'11px 0', background:'#e67e22', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' };
