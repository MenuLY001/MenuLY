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
  active:    { bg:'rgba(34,197,94,.15)', color:'#4ade80' }, trialing: { bg:'rgba(234,179,8,.15)', color:'#facc15' },
  suspended: { bg:'rgba(239,68,68,.15)', color:'#f87171' }, cancelled: { bg:'rgba(255,255,255,.1)', color:'#a1a1aa' },
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

  function downloadCSV() {
    const rs = data?.restaurants;
    if (!rs || rs.length === 0) return;
    const headers = ['Name', 'Slug', 'Status', 'Subscription', 'Trial Ends', 'Created At'];
    const rows = rs.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.slug,
      r.status,
      r.subscription?.status ?? 'None',
      r.trial_ends_at ? new Date(r.trial_ends_at).toISOString().split('T')[0] : '—',
      new Date(r.created_at).toISOString().split('T')[0]
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `menuly_restaurants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!token) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0f13', color:'#f2f2f5' }}>
      <div style={{ background:'#1a1a24', borderRadius:16, padding:36, width:360, border:'1px solid rgba(255,255,255,.08)', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>🛡️</div>
        <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 4px', color:'#f2f2f5' }}>Super Admin</h1>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:14, marginBottom:24 }}>Menuly Platform Control</p>
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input style={{...inp, background:'#13131a', color:'#f2f2f5', borderColor:'rgba(255,255,255,.1)'}} type="email" placeholder="Admin email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={{...inp, background:'#13131a', color:'#f2f2f5', borderColor:'rgba(255,255,255,.1)'}} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {loginError && <p style={{ color:'#ef4444', fontSize:13, margin:0 }}>{loginError}</p>}
          <button type="submit" style={btn} disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );

  const { stats, restaurants } = data ?? { stats: null, restaurants: [] };

  return (
    <div style={{ minHeight:'100dvh', background:'#0f0f13', color:'#f2f2f5', fontFamily:'Inter,sans-serif' }}>
      {/* Toast */}
      <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
        {toasts.map(t => {
          const c = TOAST_COLORS[t.type];
          return <div key={t.id} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:'14px 16px', display:'flex', gap:10, maxWidth:380, boxShadow:'0 8px 24px rgba(0,0,0,.3)' }}>
            <span style={{ fontSize:18 }}>{c.icon}</span>
            <div><div style={{ fontWeight:700, fontSize:13, color:c.color }}>{t.title}</div>{t.msg && <div style={{ fontSize:12, color:c.color, opacity:0.8, marginTop:2 }}>{t.msg}</div>}</div>
          </div>;
        })}
      </div>

      <div style={{ background:'#1a1a24', color:'#f2f2f5', padding:'14px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
        <span style={{ fontWeight:700, fontSize:18 }}>🛡️ Menuly Super Admin</span>
        <button onClick={refresh} disabled={loading} style={{ padding:'6px 14px', background:'rgba(255,255,255,.1)', color:'#f2f2f5', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
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
            <div key={c.label} style={{ background:'#1a1a24', borderRadius:12, padding:20, border:'1px solid rgba(255,255,255,.08)', display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ fontSize:28 }}>{c.icon}</div>
              <div style={{ fontSize:26, fontWeight:700, color:'#f2f2f5' }}>{c.value}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'#1a1a24', borderRadius:12, margin:'20px 28px', border:'1px solid rgba(255,255,255,.08)', overflow:'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px' }}>
          <h2 style={{ fontSize:15, fontWeight:700, margin:0, color:'#f2f2f5' }}>All Restaurants</h2>
          <button onClick={downloadCSV} disabled={!restaurants || restaurants.length === 0} style={{ padding:'6px 14px', background:'rgba(255,255,255,.05)', color:'#f2f2f5', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>⬇️</span> Download CSV
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Name / Slug','Status','Subscription','Trial Ends','Created','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', background:'#13131a', color:'rgba(255,255,255,.5)', fontWeight:600, borderBottom:'1px solid rgba(255,255,255,.08)', fontSize:12 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {(restaurants as RestaurantRow[]).map(r => {
                const sc = STATUS_COLORS[r.status] ?? { bg:'rgba(255,255,255,.1)', color:'#f2f2f5' };
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600, color:'#f2f2f5' }}>{r.name}</div>
                      <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#e67e22' }}>{r.slug}</a>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:sc.bg, color:sc.color }}>{r.status}</span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#f2f2f5' }}>{r.subscription?.status ?? <span style={{ color:'rgba(255,255,255,.4)', fontSize:13 }}>None</span>}</td>
                    <td style={{ padding:'12px 16px', color:'#f2f2f5' }}>{r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
                    <td style={{ padding:'12px 16px', color:'#f2f2f5' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                        {r.status !== 'active' && <button onClick={() => changeStatus(r.id,'active')} disabled={!!actionLoading} style={{ padding:'4px 10px', background:'rgba(34,197,94,.15)', color:'#4ade80', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'active'?'…':'Activate'}</button>}
                        {r.status !== 'suspended' && <button onClick={() => changeStatus(r.id,'suspended')} disabled={!!actionLoading} style={{ padding:'4px 10px', background:'rgba(239,68,68,.15)', color:'#f87171', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'suspended'?'…':'Suspend'}</button>}
                        <input type="number" min={1} max={365} placeholder="Days" value={extendDays[r.id]??''} onChange={e => setExtendDays(p=>({...p,[r.id]:e.target.value}))} style={{ width:54, padding:'2px 6px', borderRadius:6, border:'1px solid rgba(255,255,255,.1)', background:'#13131a', color:'#f2f2f5', fontSize:12, outline:'none' }} />
                        <button onClick={() => extendTrial(r.id)} disabled={!!actionLoading || !extendDays[r.id]} style={{ padding:'4px 10px', background:'rgba(234,179,8,.15)', color:'#facc15', border:'none', borderRadius:6, fontWeight:600, fontSize:12, cursor:'pointer' }}>{actionLoading===r.id+'extend'?'…':'+ Trial'}</button>
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
