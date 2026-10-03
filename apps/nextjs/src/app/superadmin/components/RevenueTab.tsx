'use client';
import { useState, useEffect } from 'react';
import { IndianRupee, Clock, TrendingUp, Users, ArrowUpRight, MessageSquare, Download } from 'lucide-react';

function fmt(paise: number) {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

interface TrialExpiring {
  id: string;
  name: string;
  slug: string;
  trial_ends_at: string;
  status: string;
}

interface RevenueData {
  mrrPaise: number;
  activeSubsCount: number;
  expiringSoon: Array<{ id: string; status: string; current_period_end: string; restaurant?: { name: string } }>;
  payments: Array<{ id: string; restaurant_id: string; status: string; amount_paise: number; created_at: string; restaurant?: { name: string; slug?: string } }>;
  stats: {
    signupsLast30: number;
    signupsLast7: number;
    convertedFromTrial: number;
    totalEverTrialed: number;
    conversionRatePct: number;
    cancelledThisMonth: number;
    revenueLast30: number;
    trialEndingUrgent: TrialExpiring[];
  };
}

function StatMini({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? '#f2f2f5' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function downloadPaymentsCSV(payments: RevenueData['payments']) {
  const headers = ['Restaurant', 'Amount (₹)', 'Status', 'Date'];
  const rows = payments
    .filter(p => p.status === 'captured')
    .map(p => [
      `"${(p.restaurant?.name ?? 'Unknown').replace(/"/g, '""')}"`,
      (p.amount_paise / 100).toFixed(2),
      p.status,
      new Date(p.created_at).toISOString().split('T')[0],
    ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `menuly_payments_${new Date().toISOString().split('T')[0]}.csv`; a.click();
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
    if (token && isActive && !data) {
      void load();
    }
  }, [token, isActive, data]);

  return (
    <div style={{ display: isActive ? 'block' : 'none', padding: 24 }}>
      {loading || !data ? (
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Loading analytics...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* MRR Hero */}
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.15) 0%, rgba(34,197,94,.02) 100%)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 14, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4ade80', marginBottom: 12, fontWeight: 600 }}>
              <TrendingUp size={20} /> Monthly Recurring Revenue (MRR)
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>{fmt(data.mrrPaise)}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>From {data.activeSubsCount} active subscriptions</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f2f2f5' }}>{fmt(data.stats.revenueLast30)}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Collected last 30 days</div>
              </div>
            </div>
          </div>

          {/* Churn & Conversion Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatMini label="Signups (7d)" value={data.stats.signupsLast7} sub="New restaurants this week" color="#a5b4fc" />
            <StatMini label="Signups (30d)" value={data.stats.signupsLast30} sub="New restaurants this month" color="#a5b4fc" />
            <StatMini label="Trial → Paid" value={`${data.stats.conversionRatePct}%`} sub={`${data.stats.convertedFromTrial} of ${data.stats.totalEverTrialed} converted`} color="#4ade80" />
            <StatMini label="Suspended/Cancelled" value={data.stats.cancelledThisMonth} sub="Total inactive accounts" color="#f87171" />
          </div>

          {/* Trial Ending Urgently (≤3 days) */}
          {data.stats.trialEndingUrgent.length > 0 && (
            <div style={{ background: 'rgba(234,179,8,.06)', border: '1px solid rgba(234,179,8,.2)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fde047', marginBottom: 16, fontWeight: 700, fontSize: 15 }}>
                <Clock size={18} /> ⚡ Urgent — Trials ending in ≤ 3 days
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.stats.trialEndingUrgent.map(r => {
                  const days = daysLeft(r.trial_ends_at);
                  const waMsg = encodeURIComponent(
                    `Hi! This is a reminder that your Menuly free trial for *${r.name}* ends in ${days} day${days !== 1 ? 's' : ''}. To keep your digital menu live, please activate your subscription from the dashboard: ${typeof window !== 'undefined' ? window.location.origin : 'https://menuly.shop'}/admin\n\nIf you have any questions, we're here to help! 😊`
                  );
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${waMsg}`;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f2f2f5' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
                          menuly.shop/menu/{r.slug} · Ends {new Date(r.trial_ends_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div style={{ background: days <= 1 ? 'rgba(239,68,68,.2)' : 'rgba(234,179,8,.15)', color: days <= 1 ? '#f87171' : '#fde047', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {days <= 0 ? 'Expires today' : `${days}d left`}
                      </div>
                      <a href={whatsappUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        <MessageSquare size={14} /> WhatsApp Nudge
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expiring Soon (7 days) */}
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }} className="revenue-grid">
            <div style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eab308', marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
                <Clock size={18} /> Subscriptions Expiring (7d)
              </div>
              {data.expiringSoon.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>No subscriptions expiring soon. ✅</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.expiringSoon.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.restaurant?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
                          Expires: {new Date(sub.current_period_end).toLocaleDateString('en-IN')}
                        </div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontWeight: 600, fontSize: 15 }}>
                  <IndianRupee size={18} /> Recent Payments
                </div>
                <button onClick={() => downloadPaymentsCSV(data.payments)} disabled={!data.payments.length}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Download size={12} /> CSV
                </button>
              </div>
              {data.payments.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>No recent payments found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.payments.filter(p => p.amount_paise > 0).slice(0, 6).map(pay => (
                    <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{pay.restaurant?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{new Date(pay.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: pay.status === 'captured' ? '#4ade80' : '#ef4444' }}>{fmt(pay.amount_paise)}</div>
                        <div style={{ fontSize: 10, color: pay.status === 'captured' ? 'rgba(74,222,128,.6)' : 'rgba(239,68,68,.6)', textTransform: 'uppercase', marginTop: 2, fontWeight: 700 }}>{pay.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversion Funnel Visual */}
          <div style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
              <Users size={18} /> Conversion Funnel
            </div>
            <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
              {[
                { label: 'Signed Up', value: data.stats.totalEverTrialed, color: '#6366f1' },
                { label: 'Converted', value: data.stats.convertedFromTrial, color: '#22c55e' },
                { label: 'Active Now', value: data.activeSubsCount, color: '#3b82f6' },
              ].map((item, i) => {
                const pct = data.stats.totalEverTrialed > 0 ? Math.round((item.value / data.stats.totalEverTrialed) * 100) : 0;
                return (
                  <div key={item.label} style={{ flex: 1, padding: '16px 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,.06)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 13, color: '#f2f2f5', fontWeight: 600, marginTop: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{pct}% of signups</div>
                    <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 860px) { .revenue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
