'use client';
import type { DashboardStats, FilterState } from './types';

interface Props { stats: DashboardStats; activeFilter: FilterState; onFilter: (f: FilterState) => void; }

const CARDS: { key: FilterState; label: string; getValue: (s: DashboardStats) => string | number; sub: string; color: string }[] = [
  { key: 'all',       label: 'Total',     getValue: s => s.totalRestaurants,                                         sub: 'All restaurants',   color: '#a5b4fc' },
  { key: 'active',    label: 'Active',    getValue: s => s.activeCount,                                              sub: 'Paying subscribers', color: '#4ade80' },
  { key: 'trialing',  label: 'Trial',     getValue: s => s.trialCount,                                               sub: 'On free trial',      color: '#facc15' },
  { key: 'suspended', label: 'Suspended', getValue: s => s.suspendedCount,                                           sub: 'Access blocked',     color: '#f87171' },
  { key: 'all',       label: 'Revenue',   getValue: s => `₹${Math.round(s.totalRevenuePaise / 100).toLocaleString('en-IN')}`, sub: 'Total collected', color: '#34d399' },
];

export function StatCards({ stats, activeFilter, onFilter }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, padding: '20px 24px 0' }}>
      {CARDS.map((c, i) => {
        const isActive = i < 4 && activeFilter === c.key;
        return (
          <button key={i} onClick={() => i < 4 && onFilter(c.key)}
            style={{ background: isActive ? `${c.color}15` : '#1a1a24', borderRadius: 14, padding: '18px 20px', border: `1.5px solid ${isActive ? c.color + '55' : 'rgba(255,255,255,.07)'}`, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left', cursor: i < 4 ? 'pointer' : 'default', transition: 'all .2s', fontFamily: 'inherit' }}
            onMouseEnter={e => { if (i < 4) { (e.currentTarget as HTMLElement).style.borderColor = c.color + '55'; (e.currentTarget as HTMLElement).style.background = c.color + '10'; } }}
            onMouseLeave={e => { if (i < 4 && !isActive) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLElement).style.background = '#1a1a24'; } }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color, letterSpacing: '-1px' }}>{c.getValue(stats)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f2f2f5' }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{c.sub}</div>
          </button>
        );
      })}
    </div>
  );
}
