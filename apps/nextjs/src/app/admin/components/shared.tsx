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
export const inp: React.CSSProperties  = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#f9fafb', color: '#1a1a2e' };
export const btnP: React.CSSProperties = { padding: '10px 18px', background: BRAND, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
export const btnG: React.CSSProperties = { padding: '8px 14px', background: '#f0f2f8', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
export const lbl: React.CSSProperties  = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

export const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

// ─── Shared helpers ───────────────────────────────────────────────────────────
export function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: BRAND, borderRadius: '50%', animation: 'admin-spin .7s linear infinite' }} /></div>;
}
export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}><div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{icon}</div><p style={{ margin: 0 }}>{text}</p></div>;
}
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: wide ? 560 : 480, maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────
export async function apiFetch(token: string, path: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) } });
  return res.json();
}
