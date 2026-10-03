'use client';
import { useState } from 'react';
import { X, User, Link as LinkIcon, Mail, Lock, Plus } from 'lucide-react';

interface Props {
  restaurantId: string;
  restaurantName: string;
  token: string;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.1)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', background: '#13131a', color: '#f2f2f5' };
const btn: React.CSSProperties = { width: '100%', padding: '11px 0', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' };

export function AddRestaurantModal({ onClose, onDone, onError }: { onClose: () => void; onDone: (msg: string) => void; onError: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !email || !password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name: name, restaurant_slug: slug, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      onDone(`Created ${name} successfully!`);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error creating restaurant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1a1a24', width: '100%', maxWidth: 440, borderRadius: 16, padding: 32, zIndex: 1001, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'saFadeIn .2s ease-out' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}><Plus size={22} color="#a5b4fc" /> Add Restaurant</h2>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>Create a new restaurant and owner account. A free 7-day trial will be started automatically.</p>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Restaurant Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="rgba(255,255,255,.3)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input style={{ ...inp, paddingLeft: 38 }} placeholder="Spice Garden" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>URL Slug</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={16} color="rgba(255,255,255,.3)" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input style={{ ...inp, paddingLeft: 38 }} placeholder="spice-garden" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required />
              </div>
            </div>
          </div>
          <div>
            <label style={lbl}>Owner Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="rgba(255,255,255,.3)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input type="email" style={{ ...inp, paddingLeft: 38 }} placeholder="owner@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={lbl}>Initial Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="rgba(255,255,255,.3)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input type="password" style={{ ...inp, paddingLeft: 38 }} placeholder="Must be at least 8 chars" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{ ...btn, marginTop: 12, background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)' }}>
            {loading ? 'Creating...' : 'Create Account & Restaurant'}
          </button>
        </form>
      </div>
    </>
  );
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
