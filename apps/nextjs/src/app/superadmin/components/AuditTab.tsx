import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_id: string;
  target_type: string;
  target_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function formatAction(action: string) {
  switch (action) {
    case 'restaurant.status.active': return 'Activated Restaurant';
    case 'restaurant.status.suspended': return 'Suspended Restaurant';
    case 'restaurant.status.trialing': return 'Moved to Trial';
    case 'restaurant.status.cancelled': return 'Cancelled Restaurant';
    case 'restaurant.soft_delete': return 'Deleted Restaurant';
    case 'restaurant.restore': return 'Restored Restaurant';
    case 'restaurant.extend_trial': return 'Extended Trial';
    case 'restaurant.reset_password': return 'Reset Admin Password';
    default: return action;
  }
}

export function AuditTab({ token, isActive }: { token: string; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/superadmin/audit', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        const json = await res.json();
        if (mounted) setLogs(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (token && isActive && loading) {
      void load();
    }
    return () => { mounted = false; };
  }, [token, isActive, loading]);

  if (!isActive) return null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: '#1a1a24', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Activity size={18} color="#a5b4fc" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f2f2f5' }}>Admin Audit Log</h2>
          <div style={{ flex: 1 }} />
          <button onClick={() => setLoading(true)} disabled={loading}
            style={{ padding: '6px 12px', background: 'rgba(255,255,255,.05)', color: '#f2f2f5', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading && logs.length === 0 ? (
          <div style={{ padding: 20, color: 'rgba(255,255,255,.4)' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 20, color: 'rgba(255,255,255,.4)' }}>No audit logs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.2)' }}>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Timestamp</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Action</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Target</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#f2f2f5' }}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                      {log.target_name || log.target_id || '—'}
                      {log.target_type && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginLeft: 6 }}>({log.target_type})</span>}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
