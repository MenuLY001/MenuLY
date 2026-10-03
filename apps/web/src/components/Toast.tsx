import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000; 0 = sticky
}

interface ToastCtx {
  toasts: Toast[];
  showToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// Convenience helpers
export function useToastHelpers() {
  const { showToast } = useToast();
  return {
    success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
    error:   (title: string, message?: string) => showToast({ type: 'error',   title, message, duration: 6000 }),
    warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    info:    (title: string, message?: string) => showToast({ type: 'info',    title, message }),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    const dur = t.duration ?? 4000;
    if (dur > 0) {
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), dur);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Single toast item ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const COLORS: Record<ToastType, { bg: string; border: string; title: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', title: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fca5a5', title: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fcd34d', title: '#b45309' },
  info:    { bg: '#eff6ff', border: '#93c5fd', title: '#1d4ed8' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const c = COLORS[toast.type];

  return (
    <div
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: c.bg, border: `1.5px solid ${c.border}`,
        borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 300, maxWidth: 420,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: c.title }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: 13, color: '#374151', marginTop: 3, lineHeight: 1.4 }}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: 16, padding: '0 2px', flexShrink: 0,
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  );
}

// ─── Container (portal) ───────────────────────────────────────────────────────

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, onConfirm, onCancel,
}: ConfirmModalProps) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 28,
          maxWidth: 420, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalIn 0.2s cubic-bezier(.34,1.56,.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb',
              background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: danger ? '#dc2626' : '#e67e22',
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{confirmLabel}</button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>,
    document.body
  );
}
