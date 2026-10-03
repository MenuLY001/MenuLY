'use client';
import { useState } from 'react';
import type { RestaurantRow, FilterState, SortKey, SortDir } from './types';
import { relativeDate, fullDate, trialDaysLeft } from './helpers';

interface Props {
  restaurants: RestaurantRow[];
  filter: FilterState;
  search: string;
  actionLoading: string | null;
  onActivate: (id: string, name: string) => void;
  onSuspend: (r: RestaurantRow) => void;
  onManage: (r: RestaurantRow) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: 'Active',     bg: 'rgba(34,197,94,.15)',   color: '#4ade80' },
  trialing:  { label: 'Trial',      bg: 'rgba(234,179,8,.15)',   color: '#facc15' },
  suspended: { label: 'Suspended',  bg: 'rgba(239,68,68,.15)',   color: '#f87171' },
  cancelled: { label: 'Cancelled',  bg: 'rgba(255,255,255,.08)', color: '#a1a1aa' },
};

function TrialIndicator({ trialEndsAt, status }: { trialEndsAt: string | null; status: string }) {
  if (status !== 'trialing' || !trialEndsAt) return null;
  const days = trialDaysLeft(trialEndsAt);
  if (days === null) return null;
  const color = days <= 0 ? '#f87171' : days <= 3 ? '#fb923c' : '#4ade80';
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 6 }}>
      {days <= 0 ? 'Expired' : `${days}d left`}
    </span>
  );
}

export function RestaurantTable({ restaurants, filter, search, actionLoading, onActivate, onSuspend, onManage }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = restaurants
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (sortKey === 'status') { av = a.status; bv = b.status; }
      else if (sortKey === 'created_at') { av = a.created_at; bv = b.created_at; }
      else if (sortKey === 'trial_ends_at') { av = a.trial_ends_at ?? ''; bv = b.trial_ends_at ?? ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) return <span style={{ opacity: .3, marginLeft: 4, fontSize: 10 }}>⇅</span>;
    return <span style={{ marginLeft: 4, fontSize: 10, color: '#a5b4fc' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle = (col?: SortKey): React.CSSProperties => ({
    padding: '12px 16px', textAlign: 'left', background: '#13131a', color: 'rgba(255,255,255,.4)',
    fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '.6px', cursor: col ? 'pointer' : 'default',
    userSelect: 'none', whiteSpace: 'nowrap',
  });

  if (!filtered.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.3)', fontSize: 15 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      No restaurants match your filters.
    </div>
  );

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle('name')} onClick={() => toggleSort('name')}>Name / Slug {renderSortIcon('name')}</th>
              <th style={thStyle('status')} onClick={() => toggleSort('status')}>Plan & Status {renderSortIcon('status')}</th>
              <th style={thStyle('trial_ends_at')} onClick={() => toggleSort('trial_ends_at')}>Trial / Renewal {renderSortIcon('trial_ends_at')}</th>
              <th style={thStyle('created_at')} onClick={() => toggleSort('created_at')}>Created {renderSortIcon('created_at')}</th>
              <th style={thStyle()}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(r => {
              const sc = STATUS_CONFIG[r.status] ?? { label: r.status, bg: 'rgba(255,255,255,.08)', color: '#a1a1aa' };
              const sub = r.subscription;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                  {/* Name / Slug */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#f2f2f5', marginBottom: 3 }}>{r.name}</div>
                    <a href={`https://menuly.shop/menu/${r.slug}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', textDecoration: 'none', transition: 'color .15s' }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e67e22')}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,.35)')}>
                      ↗ {r.slug}
                    </a>
                  </td>

                  {/* Plan & Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span>
                      <TrialIndicator trialEndsAt={r.trial_ends_at} status={r.status} />
                    </div>
                    {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>₹299/mo · {sub.razorpay_subscription_id.slice(0, 18)}</div>}
                  </td>

                  {/* Trial / Renewal */}
                  <td style={{ padding: '14px 16px' }}>
                    {r.status === 'trialing' && r.trial_ends_at && (
                      <span title={fullDate(r.trial_ends_at)} style={{ color: (trialDaysLeft(r.trial_ends_at) ?? 99) <= 3 ? '#fb923c' : 'rgba(255,255,255,.5)', fontSize: 13, cursor: 'default' }}>
                        {relativeDate(r.trial_ends_at)}
                      </span>
                    )}
                    {sub?.current_period_end && r.status === 'active' && (
                      <span title={fullDate(sub.current_period_end)} style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, cursor: 'default' }}>
                        Renews {relativeDate(sub.current_period_end)}
                      </span>
                    )}
                    {!r.trial_ends_at && !sub?.current_period_end && <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 13 }}>—</span>}
                  </td>

                  {/* Created */}
                  <td style={{ padding: '14px 16px' }}>
                    <span title={fullDate(r.created_at)} style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, cursor: 'default' }}>
                      {relativeDate(r.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {r.status !== 'active' && (
                        <button onClick={() => onActivate(r.id, r.name)} disabled={!!actionLoading}
                          style={{ padding: '5px 12px', background: 'rgba(34,197,94,.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,.25)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s' }}>
                          {actionLoading === r.id + 'active' ? '…' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => onManage(r)} disabled={!!actionLoading}
                        style={{ padding: '5px 12px', background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Manage
                      </button>
                      {r.status !== 'suspended' && (
                        <button onClick={() => onSuspend(r)} disabled={!!actionLoading}
                          style={{ padding: '5px 12px', background: 'transparent', color: 'rgba(248,113,113,.6)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.15)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,.6)'; }}>
                          {actionLoading === r.id + 'suspended' ? '…' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${p === page ? '#a5b4fc55' : 'rgba(255,255,255,.1)'}`, background: p === page ? 'rgba(165,180,252,.15)' : 'transparent', color: p === page ? '#a5b4fc' : 'rgba(255,255,255,.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
