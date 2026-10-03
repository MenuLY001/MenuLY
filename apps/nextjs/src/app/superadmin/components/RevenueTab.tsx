import { useState, useEffect } from 'react';
import { IndianRupee, Clock, TrendingUp } from 'lucide-react';

function fmt(paise: number) {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

interface RevenueData {
  mrrPaise: number;
  activeSubsCount: number;
  expiringSoon: Array<{ id: string; status: string; current_period_end: string; restaurant?: { name: string } }>;
  payments: Array<{ id: string; status: string; amount_paise: number; created_at: string; restaurant?: { name: string } }>;
}

export function RevenueTab({ token, isActive }: { token: string; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/superadmin/revenue', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch revenue');
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (token && !data && loading) {
      void load();
    }
    return () => { mounted = false; };
  }, [token, data, loading]);

  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: 24 }}>
      {!data ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Loading analytics...</div>
      ) : (
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
          {/* Top Cards */}
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.15) 0%, rgba(34,197,94,.02) 100%)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 12, padding: 24, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4ade80', marginBottom: 12, fontWeight: 600 }}>
              <TrendingUp size={20} />
              Monthly Recurring Revenue (MRR)
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              {fmt(data.mrrPaise)}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 8 }}>
              From {data.activeSubsCount} active subscriptions
            </div>
          </div>

          {/* Expiring Soon */}
          <div style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eab308', marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
              <Clock size={18} />
              Expiring Next 7 Days
            </div>
            {data.expiringSoon.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>No subscriptions expiring soon.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.expiringSoon.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.restaurant?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Expires: {new Date(sub.current_period_end).toLocaleDateString()}</div>
                    </div>
                    <div style={{ background: 'rgba(234,179,8,.15)', color: '#fde047', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {sub.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
              <IndianRupee size={18} />
              Recent Payments
            </div>
            {data.payments.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>No recent payments found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.payments.slice(0, 5).map(pay => (
                  <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{pay.restaurant?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{new Date(pay.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: pay.status === 'captured' ? '#4ade80' : '#ef4444' }}>
                        {fmt(pay.amount_paise)}
                      </div>
                      <div style={{ fontSize: 11, color: pay.status === 'captured' ? 'rgba(74,222,128,.7)' : 'rgba(239,68,68,.7)', textTransform: 'uppercase', marginTop: 2, fontWeight: 600 }}>
                        {pay.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
