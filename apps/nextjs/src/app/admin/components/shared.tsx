'use client';
import { useState, useCallback } from 'react';
import type { ToastType } from './types';

// ─── Toast ────────────────────────────────────────────────────────────────────
export const TC: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', icon: '✅' },
  error:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', icon: '❌' },
  info:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', icon: 'ℹ️' },
};
export function useToast() {
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; title: string; msg?: string }[]>([]);
  const add = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = crypto.randomUUID();
    setToasts(p => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), type === 'error' ? 6000 : 4000);
  }, []);
  return { toasts, success: (t: string, m?: string) => add('success', t, m), error: (t: string, m?: string) => add('error', t, m), info: (t: string, m?: string) => add('info', t, m) };
}

// ─── Style constants ──────────────────────────────────────────────────────────
export const BRAND = '#e67e22';
export const inp: React.CSSProperties  = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#f9fafb', color: 'var(--text-main)' };
export const btnP: React.CSSProperties = { padding: '10px 18px', background: BRAND, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
export const btnG: React.CSSProperties = { padding: '8px 14px', background: 'var(--bg-hover)', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
export const lbl: React.CSSProperties  = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

export const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

// ─── Shared helpers ───────────────────────────────────────────────────────────
export function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: BRAND, borderRadius: '50%', animation: 'admin-spin .7s linear infinite' }} /></div>;
}
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}><div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{icon}</div><p style={{ margin: 0 }}>{text}</p></div>;
}
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, width: '100%', maxWidth: wide ? 560 : 480, maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}><span style={{ fontSize: 24, lineHeight: 1 }}>&times;</span></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .f-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .f-modal-content { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; display: flex; flex-direction: column; max-height: 90vh; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .f-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .f-modal-body { padding: 24px; overflow-y: auto; flex: 1; }
        .f-modal-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 600px) {
          .f-modal-overlay { padding: 0; align-items: flex-end; }
          .f-modal-content { border-bottom-left-radius: 0; border-bottom-right-radius: 0; max-height: 95vh; animation: slideUpMobile 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
          .f-modal-footer { padding-bottom: calc(16px + env(safe-area-inset-bottom)); position: sticky; bottom: 0; }
        }
        @keyframes slideUpMobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
      <div className="f-modal-overlay" onMouseDown={onClose}>
        <div className="f-modal-content" onMouseDown={e => e.stopPropagation()}>
          <div className="f-modal-header">
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{title}</h2>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}><span style={{ fontSize: 28, lineHeight: 1 }}>&times;</span></button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────
export async function apiFetch(token: string, path: string, opts?: RequestInit) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (typeof window !== 'undefined') {
    const imp = localStorage.getItem('menuly_impersonate');
    if (imp) headers['x-impersonate-id'] = imp;
  }
  const res = await fetch(path, { ...opts, headers: { ...headers, ...(opts?.headers as Record<string,string> ?? {}) } });
  return res.json();
}
