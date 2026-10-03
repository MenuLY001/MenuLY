'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, Mail, Link as LinkIcon, Lock, IndianRupee, Edit } from 'lucide-react';
import { fullDate, relativeDate } from '../../components/helpers';
import type { RestaurantRow } from '../../components/types';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<{ restaurant: RestaurantRow, adminEmail?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) return router.push('/superadmin');

        // We fetch from the single endpoint which we will create
        const apiRes = await fetch(`/api/superadmin/restaurants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!apiRes.ok) throw new Error('Failed to load');
        setData(d);
        setEditName(d.restaurant.name);
        setEditSlug(d.restaurant.slug);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleSaveDetails() {
    setSavingDetails(true);
    try {
      const token = localStorage.getItem('sb-access-token') || (await (await import('@/lib/supabase-client')).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/superadmin/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, slug: editSlug }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      setIsEditing(false);
      alert('Details updated successfully!');
      // Reload page to get fresh data
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) return alert('Password must be at least 8 characters');
    setSavingPassword(true);
    try {
      const token = localStorage.getItem('sb-access-token') || (await (await import('@/lib/supabase-client')).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/superadmin/restaurants/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to reset password');
      setNewPassword('');
      setPwdMsg('Password updated successfully!');
      setTimeout(() => setPwdMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#fff', textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, color: '#fff', textAlign: 'center' }}>Restaurant not found</div>;

  const r = data.restaurant;

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f13', color: '#f2f2f5', fontFamily: 'Inter,sans-serif', padding: 32 }}>
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', marginBottom: 24, fontSize: 14, fontWeight: 600, padding: 0 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ background: '#1a1a24', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', maxWidth: 800, margin: '0 auto', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: 32, borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {r.name}
              <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: r.status === 'active' ? 'rgba(34,197,94,.15)' : r.status === 'trialing' ? 'rgba(234,179,8,.15)' : 'rgba(239,68,68,.15)', color: r.status === 'active' ? '#4ade80' : r.status === 'trialing' ? '#facc15' : '#f87171', textTransform: 'capitalize' }}>
                {r.status}
              </span>
            </h1>
            <a href={`https://menuly.shop/menu/${r.slug}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e67e22', textDecoration: 'none', fontSize: 14 }}>
              menuly.shop/menu/{r.slug} <ExternalLink size={14} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setIsEditing(!isEditing)} style={{ padding: '8px 16px', background: 'transparent', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit size={14} /> Edit
            </button>
            <button onClick={() => { localStorage.setItem('menuly_impersonate', r.id); router.push('/admin'); }} style={{ padding: '8px 16px', background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} /> Impersonate
            </button>
          </div>
        </div>

        {isEditing && (
          <div style={{ padding: 32, borderBottom: '1px solid rgba(255,255,255,.06)', background: '#13131a' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Edit Details</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: '#1a1a24', color: '#fff', fontSize: 14 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>Slug</label>
                <input value={editSlug} onChange={e => setEditSlug(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: '#1a1a24', color: '#fff', fontSize: 14 }} />
              </div>
            </div>
            <button onClick={handleSaveDetails} disabled={savingDetails} style={{ padding: '8px 20px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {savingDetails ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Created</div>
            <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#a5b4fc" />
              <div>
                <div>{fullDate(r.created_at)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{relativeDate(r.created_at)}</div>
              </div>
            </div>
          </div>
          
          {data.adminEmail && (
            <div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Owner Email</div>
              <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} color="#a5b4fc" /> {data.adminEmail}
              </div>
            </div>
          )}

          <div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Links</div>
            <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={`https://menuly.shop/menu/${r.slug}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f2f2f5', textDecoration: 'none' }}>
                <LinkIcon size={14} color="#a5b4fc" /> Live Menu
              </a>
            </div>
          </div>
        </div>

        {/* Subscription details */}
        <div style={{ padding: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><IndianRupee size={18} color="#4ade80" /> Plan & Billing</h2>
          <div style={{ background: '#13131a', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,.05)' }}>
            {r.subscription ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#4ade80' }}>Active Premium</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Renews On</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fullDate(r.subscription.current_period_end)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>₹299/mo</div>
                </div>
              </div>
            ) : r.status === 'trialing' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#facc15' }}>Free Trial</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>Ends On</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.trial_ends_at ? fullDate(r.trial_ends_at) : '—'}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>No active plan or trial.</div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ padding: 32, borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} color="#ef4444" /> Security</h2>
          <div style={{ background: 'rgba(239,68,68,.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(239,68,68,.2)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: '#ef4444' }}>Reset Owner Password</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: '0 0 16px' }}>Set a new password for the owner account. They will be able to log in immediately with the new password.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="text" placeholder="New Password (min 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: 240, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: '#13131a', color: '#fff', fontSize: 14 }} />
              <button onClick={handleResetPassword} disabled={savingPassword || newPassword.length < 8} style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: (savingPassword || newPassword.length < 8) ? 0.5 : 1 }}>
                {savingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
              {pwdMsg && <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>{pwdMsg}</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
