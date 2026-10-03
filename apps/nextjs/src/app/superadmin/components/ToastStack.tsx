'use client';
import type { Toast, ToastType } from './types';

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.3)', color: '#4ade80', icon: '✓' },
  error:   { bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.3)',  color: '#f87171', icon: '✕' },
  info:    { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.3)', color: '#a5b4fc', icon: 'i' },
};

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type];
        return (
          <div key={t.id} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,.4)', backdropFilter: 'blur(12px)', animation: 'saFadeIn .2s ease' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: s.border, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: s.color }}>{t.title}</div>
              {t.msg && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{t.msg}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
