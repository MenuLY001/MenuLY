'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar, Mail, Link as LinkIcon, Lock, IndianRupee } from 'lucide-react';
import { fullDate, relativeDate } from '../../components/helpers';
import type { RestaurantRow } from '../../components/types';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<{ restaurant: RestaurantRow, adminEmail?: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
        setData(await apiRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

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
            <button onClick={() => { localStorage.setItem('menuly_impersonate', r.id); router.push('/admin'); }} style={{ padding: '8px 16px', background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} /> Impersonate
            </button>
          </div>
        </div>

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
      </div>
    </div>
  );
}
