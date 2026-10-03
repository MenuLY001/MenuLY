'use client';
import { useState } from 'react';

interface Props {
  restaurantId: string;
  restaurantName: string;
  token: string;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

export function ManageModal({ restaurantId, restaurantName, token, onDone, onError, onClose }: Props) {
  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(false);

  async function extend() {
    const d = parseInt(days, 10);
    if (!d || d < 1) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/restaurants/${restaurantId}/extend-trial`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: d }),
      });
      if (!res.ok) throw new Error('Failed');
      onDone(`Extended trial by ${d} day(s) for ${restaurantName}`);
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#1a1a24', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#f2f2f5' }}>Manage Trial</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{restaurantName}</p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Extend trial by</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['3', '7', '14', '30'].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${days === d ? '#a5b4fc' : 'rgba(255,255,255,.1)'}`, background: days === d ? 'rgba(165,180,252,.15)' : 'transparent', color: days === d ? '#a5b4fc' : 'rgba(255,255,255,.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
              {d}d
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Custom:</span>
          <input type="number" min={1} max={365} value={days} onChange={e => setDays(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.1)', background: '#13131a', color: '#f2f2f5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>days</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.5)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={extend} disabled={loading || !days}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: 'rgba(165,180,252,.2)', color: '#a5b4fc', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '.8')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            {loading ? 'Extending…' : `Extend ${days ? `+${days}d` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuspendProps {
  restaurantId: string;
  restaurantName: string;
  token: string;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

export function SuspendModal({ restaurantId, restaurantName, token, onDone, onError, onClose }: SuspendProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function suspend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/restaurants/${restaurantId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended', reason }),
      });
      if (!res.ok) throw new Error('Failed');
      onDone(`${restaurantName} has been suspended`);
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#1a1a24', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, border: '1px solid rgba(239,68,68,.2)', boxShadow: '0 20px 60px rgba(0,0,0,.7)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 20 }}>⚠️</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#f87171' }}>Suspend Restaurant?</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>
          <strong style={{ color: '#f2f2f5' }}>{restaurantName}</strong> will lose access to their dashboard and menu immediately.
        </p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Reason (optional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Non-payment, abuse, owner request…" rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.1)', background: '#13131a', color: '#f2f2f5', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.5)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={suspend} disabled={loading}
            style={{ flex: 2, padding: '11px', borderRadius: 10, background: 'rgba(239,68,68,.2)', color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid rgba(239,68,68,.3)' }}>
            {loading ? 'Suspending…' : 'Yes, Suspend'}
          </button>
        </div>
      </div>
    </div>
  );
}
