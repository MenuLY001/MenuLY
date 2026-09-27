import React from 'react';

export function MenuSkeleton() {
  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {[1, 2].map((section) => (
        <div key={section}>
          <div className="skeleton" style={{ width: 160, height: 24, marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  height: 100,
                }}
              >
                <div className="skeleton" style={{ width: 100, flexShrink: 0, borderRadius: 0 }} />
                <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ width: '60%', height: 16 }} />
                  <div className="skeleton" style={{ width: '80%', height: 12 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 52, borderRadius: 'var(--radius-md)' }}
        />
      ))}
    </div>
  );
}
