import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE } from '../lib/api';
import { useToastHelpers } from '../components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  trial_ends_at: string | null;
  created_at: string;
  subscription: {
    status: string;
    razorpay_subscription_id: string;
    current_period_end: string | null;
  } | null;
}

interface Stats {
  totalRestaurants: number;
  activeCount: number;
  trialCount: number;
  suspendedCount: number;
  totalAdmins: number;
  totalRevenuePaise: number;
}

interface DashboardData {
  stats: Stats;
  restaurants: RestaurantRow[];
  recentPayments: { restaurant_id: string; amount_paise: number; status: string; created_at: string }[];
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function superAdminFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/superadmin${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg: '#dcfce7', color: '#166534' },
  trialing:  { bg: '#fef9c3', color: '#854d0e' },
  past_due:  { bg: '#ffedd5', color: '#9a3412' },
  suspended: { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, background: c.bg, color: c.color,
    }}>{status}</span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuperAdminPage() {
  const toast = useToastHelpers();

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr || !auth.session) throw new Error(authErr?.message ?? 'Login failed');
      const res = await fetch(`${API_BASE}/superadmin/dashboard`, {
        headers: { Authorization: `Bearer ${auth.session.access_token}` },
      });
      if (res.status === 403) throw new Error('This account is not a super admin.');
      if (!res.ok) throw new Error('Could not load dashboard.');
      const json = await res.json() as DashboardData;
      setToken(auth.session.access_token);
      setData(json);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  // ── Refresh dashboard ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const d = await superAdminFetch<DashboardData>('/dashboard', token);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Status change ──────────────────────────────────────────────────────────
  async function changeStatus(restaurantId: string, status: string) {
    if (!token) return;
    setActionLoading(restaurantId + status);
    try {
      await superAdminFetch(`/restaurants/${restaurantId}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      await refresh();
      toast.success('Status updated', `Restaurant set to "${status}".`);
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Extend trial ───────────────────────────────────────────────────────────
  async function extendTrial(restaurantId: string) {
    if (!token) return;
    const days = parseInt(extendDays[restaurantId] ?? '7', 10);
    if (!days || days < 1) return;
    setActionLoading(restaurantId + 'extend');
    try {
      await superAdminFetch(`/restaurants/${restaurantId}/extend-trial`, token, {
        method: 'PATCH', body: JSON.stringify({ days }),
      });
      await refresh();
      toast.success('Trial extended', `Trial extended by ${days} day(s).`);
    } catch (err) {
      toast.error('Action failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(null);
    }
  }

  // ── Login screen ───────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginCard}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Super Admin</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Menuly Platform Control</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={styles.input} type="email" placeholder="Admin email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input style={styles.input} type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required />
            {loginError && <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{loginError}</p>}
            <button type="submit" style={styles.btn} disabled={loggingIn}>
              {loggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const { stats, restaurants } = data ?? { stats: null, restaurants: [] };

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Menuly Super Admin</span>
        </div>
        <button onClick={refresh} style={styles.btnSm} disabled={loading}>
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Stats cards */}
      {stats && (
        <div style={styles.statsGrid}>
          {[
            { label: 'Total Restaurants', value: stats.totalRestaurants, icon: '🍽️' },
            { label: 'Active (paying)',    value: stats.activeCount,      icon: '✅' },
            { label: 'On Trial',           value: stats.trialCount,       icon: '⏳' },
            { label: 'Suspended',          value: stats.suspendedCount,   icon: '🔒' },
            { label: 'Total Revenue',      value: `₹${(stats.totalRevenuePaise / 100).toLocaleString('en-IN')}`, icon: '💰' },
          ].map(card => (
            <div key={card.label} style={styles.statCard}>
              <div style={{ fontSize: 28 }}>{card.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Restaurants table */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Restaurants</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name / Slug', 'Status', 'Subscription', 'Trial Ends', 'Created', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(restaurants as RestaurantRow[]).map(r => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer"
                        style={{ color: '#e67e22' }}>{r.slug}</a>
                    </div>
                  </td>
                  <td style={styles.td}><StatusBadge status={r.status} /></td>
                  <td style={styles.td}>
                    {r.subscription
                      ? <><StatusBadge status={r.subscription.status} /><div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{r.subscription.razorpay_subscription_id}</div></>
                      : <span style={{ color: '#9ca3af', fontSize: 13 }}>None</span>}
                  </td>
                  <td style={styles.td}>
                    {r.trial_ends_at
                      ? new Date(r.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={styles.td}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {r.status !== 'active' && (
                        <button style={styles.actionBtn('#dcfce7', '#166534')}
                          disabled={!!actionLoading}
                          onClick={() => changeStatus(r.id, 'active')}>
                          {actionLoading === r.id + 'active' ? '…' : 'Activate'}
                        </button>
                      )}
                      {r.status !== 'suspended' && (
                        <button style={styles.actionBtn('#fee2e2', '#991b1b')}
                          disabled={!!actionLoading}
                          onClick={() => changeStatus(r.id, 'suspended')}>
                          {actionLoading === r.id + 'suspended' ? '…' : 'Suspend'}
                        </button>
                      )}
                      <input
                        type="number" min={1} max={365} placeholder="Days"
                        value={extendDays[r.id] ?? ''}
                        onChange={e => setExtendDays(prev => ({ ...prev, [r.id]: e.target.value }))}
                        style={{ width: 54, padding: '2px 6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12 }}
                      />
                      <button style={styles.actionBtn('#fef9c3', '#854d0e')}
                        disabled={!!actionLoading || !extendDays[r.id]}
                        onClick={() => extendTrial(r.id)}>
                        {actionLoading === r.id + 'extend' ? '…' : '+ Trial'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  loginWrap: {
    minHeight: '100dvh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f8fafc',
  } as React.CSSProperties,
  loginCard: {
    background: '#fff', borderRadius: 16, padding: 36, width: 360,
    boxShadow: '0 4px 24px rgba(0,0,0,.10)', textAlign: 'center' as const,
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' as const,
    outline: 'none',
  } as React.CSSProperties,
  btn: {
    width: '100%', padding: '11px 0', background: '#e67e22', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  } as React.CSSProperties,
  btnSm: {
    padding: '6px 14px', background: '#f3f4f6', border: 'none', borderRadius: 8,
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  } as React.CSSProperties,
  shell: {
    minHeight: '100dvh', background: '#f8fafc', fontFamily: 'inherit',
  } as React.CSSProperties,
  header: {
    background: '#1e293b', color: '#fff', padding: '14px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  } as React.CSSProperties,
  errorBanner: {
    background: '#fee2e2', color: '#991b1b', padding: '10px 28px', fontSize: 14,
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))',
    gap: 16, padding: '24px 28px 0',
  } as React.CSSProperties,
  statCard: {
    background: '#fff', borderRadius: 12, padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,.07)',
    display: 'flex', flexDirection: 'column' as const, gap: 4,
  } as React.CSSProperties,
  section: {
    background: '#fff', borderRadius: 12, margin: '20px 28px',
    boxShadow: '0 1px 4px rgba(0,0,0,.07)', overflow: 'hidden',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 15, fontWeight: 700, padding: '16px 20px 0', margin: 0,
  } as React.CSSProperties,
  table: {
    width: '100%', borderCollapse: 'collapse' as const, fontSize: 13,
  },
  th: {
    padding: '10px 16px', textAlign: 'left' as const,
    background: '#f8fafc', color: '#374151', fontWeight: 600,
    borderBottom: '1px solid #e5e7eb', fontSize: 12,
  } as React.CSSProperties,
  tr: { borderBottom: '1px solid #f1f5f9' } as React.CSSProperties,
  td: { padding: '12px 16px', verticalAlign: 'middle' as const } as React.CSSProperties,
  actionBtn: (bg: string, color: string) => ({
    padding: '4px 10px', background: bg, color, border: 'none',
    borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: 'pointer',
  } as React.CSSProperties),
};
