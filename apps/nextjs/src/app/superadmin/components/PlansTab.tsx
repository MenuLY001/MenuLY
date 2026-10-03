import { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_paise: number;
  currency: string;
  interval: string;
  razorpay_plan_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function PlansTab({ token, isActive }: { token: string; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_paise: 29900,
    interval: 'monthly',
    razorpay_plan_id: '',
    is_active: true
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/plans', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setPlans(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editPlan ? `/api/superadmin/plans/${editPlan.id}` : '/api/superadmin/plans';
      const method = editPlan ? 'PATCH' : 'POST';
      
      const payload = { ...formData, razorpay_plan_id: formData.razorpay_plan_id || null };
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        void load();
      } else {
        alert('Failed to save plan');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving plan');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this plan? Existing subscriptions might not be affected, but no new users can subscribe to it.')) return;
    try {
      const res = await fetch(`/api/superadmin/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) void load();
      else alert('Failed to deactivate plan');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isActive) return null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: '#1a1a24', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Tag size={18} color="#a5b4fc" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f2f2f5' }}>Pricing Plans</h2>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setEditPlan(null); setFormData({ name: '', description: '', price_paise: 29900, interval: 'monthly', razorpay_plan_id: '', is_active: true }); setShowModal(true); }}
            style={{ padding: '6px 12px', background: 'rgba(165,180,252,.1)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,.2)', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Plan
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20, color: 'rgba(255,255,255,.4)' }}>Loading plans...</div>
        ) : plans.length === 0 ? (
          <div style={{ padding: 20, color: 'rgba(255,255,255,.4)' }}>No plans configured.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.2)' }}>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Plan Name</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Price</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Interval</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Razorpay ID</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Status</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#f2f2f5' }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{plan.description || 'No description'}</div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: 14, color: '#4ade80' }}>
                      ₹{(plan.price_paise / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
                      {plan.interval}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                      {plan.razorpay_plan_id || '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {plan.is_active ? (
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,.15)', color: '#4ade80' }}>Active</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.08)', color: '#a1a1aa' }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditPlan(plan); setFormData({ name: plan.name, description: plan.description || '', price_paise: plan.price_paise, interval: plan.interval, razorpay_plan_id: plan.razorpay_plan_id || '', is_active: plan.is_active }); setShowModal(true); }}
                          style={{ padding: 6, background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 6, color: '#f2f2f5', cursor: 'pointer' }}>
                          <Edit size={14} />
                        </button>
                        {plan.is_active && (
                          <button onClick={() => handleDeactivate(plan.id)}
                            style={{ padding: 6, background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <div style={{ background: '#1a1a24', width: '100%', maxWidth: 440, borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f2f2f5' }}>{editPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Plan Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f2f2f5', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f2f2f5', fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Price (Paise)</label>
                  <input required type="number" min="0" value={formData.price_paise} onChange={e => setFormData({ ...formData, price_paise: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f2f2f5', fontSize: 14 }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>₹{(formData.price_paise / 100).toFixed(2)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Interval</label>
                  <select value={formData.interval} onChange={e => setFormData({ ...formData, interval: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f2f2f5', fontSize: 14 }}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 6 }}>Razorpay Plan ID (Optional)</label>
                <input type="text" value={formData.razorpay_plan_id} onChange={e => setFormData({ ...formData, razorpay_plan_id: e.target.value })}
                  placeholder="plan_XXXXXXXXXXXXXX"
                  style={{ width: '100%', padding: '10px 14px', background: '#0f0f13', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#f2f2f5', fontSize: 14 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                <span style={{ fontSize: 14, color: '#f2f2f5' }}>Plan is active</span>
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', background: 'transparent', color: '#f2f2f5', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '10px', background: '#a5b4fc', color: '#0f0f13', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {editPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
