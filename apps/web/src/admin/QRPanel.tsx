import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAuth } from './AuthContext';
import { adminApi } from '../lib/api';
import { Restaurant } from '@qr-menu/types';
import { AdminPanelStyles } from './CategoriesPanel';

const MAX_TABLES = 50;

export function QRPanel() {
  const { token } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tableCount, setTableCount] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!token) return;
    adminApi.getRestaurant(token)
      .then(setRestaurant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const getMenuUrl = (tableNo: number) => {
    const base = window.location.origin;
    return `${base}/menu/${restaurant?.slug}?table=${tableNo}`;
  };

  const generateQR = async (tableNo: number) => {
    if (!restaurant) return;
    setGenerating(true);
    setSelectedTable(tableNo);
    try {
      const url = getMenuUrl(tableNo);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl || selectedTable === null || !restaurant) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${restaurant.slug}-table-${selectedTable}-qr.png`;
    link.click();
  };

  if (loading) {
    return <div className="panel"><div className="panel__title" style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>QR Codes</div></div>;
  }

  if (!restaurant) return null;

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <h1 className="panel__title">QR Codes</h1>
          <p className="panel__subtitle">Generate per-table QR codes for {restaurant.name}</p>
        </div>
      </div>

      <div className="qr-layout">
        {/* Table selector */}
        <div className="qr-selector">
          <div className="qr-count-ctrl">
            <label className="field__label" htmlFor="table-count">Number of tables</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="table-count"
                type="number"
                className="field__input"
                min="1"
                max={MAX_TABLES}
                value={tableCount}
                onChange={(e) => setTableCount(Math.min(MAX_TABLES, Math.max(1, +e.target.value)))}
                style={{ width: 80 }}
              />
              <span className="field__label" style={{ margin: 0, color: '#9ca3af' }}>max {MAX_TABLES}</span>
            </div>
          </div>
          <div className="qr-table-grid">
            {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`qr-table-btn ${selectedTable === n ? 'qr-table-btn--active' : ''}`}
                onClick={() => generateQR(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* QR Preview */}
        <div className="qr-preview">
          {generating && (
            <div className="qr-loading">
              <div className="qr-loading__spinner" />
              <p>Generating…</p>
            </div>
          )}
          {!generating && qrDataUrl && selectedTable !== null && (
            <div className="qr-result">
              <div className="qr-result__card">
                <div className="qr-result__header">
                  <div className="qr-result__restaurant">{restaurant.name}</div>
                  <div className="qr-result__table">Table {selectedTable}</div>
                </div>
                <img
                  src={qrDataUrl}
                  alt={`QR code for table ${selectedTable}`}
                  className="qr-result__img"
                />
                <div className="qr-result__url">{getMenuUrl(selectedTable)}</div>
              </div>
              <button className="btn-primary qr-download" onClick={downloadQR}>
                ↓ Download QR — Table {selectedTable}
              </button>
            </div>
          )}
          {!generating && !qrDataUrl && (
            <div className="qr-placeholder">
              <div className="qr-placeholder__icon">📱</div>
              <p>Select a table number to generate its QR code</p>
              <p className="qr-placeholder__sub">Each QR links to<br /><code>/menu/{restaurant.slug}?table=N</code></p>
            </div>
          )}
        </div>
      </div>

      <AdminPanelStyles />
      <style>{`
        .qr-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 640px) { .qr-layout { grid-template-columns: 1fr; } }
        .qr-selector { background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .qr-count-ctrl { display: flex; flex-direction: column; gap: 8px; }
        .qr-table-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-height: 320px; overflow-y: auto; }
        .qr-table-btn { padding: 10px 0; background: #f0f2f8; border-radius: 8px; font-size: 14px; font-weight: 700; color: #374151; font-family: inherit; transition: all 0.15s; }
        .qr-table-btn:hover { background: #e5e7eb; }
        .qr-table-btn--active { background: var(--brand); color: #fff; }
        .qr-preview { display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 24px; min-height: 360px; }
        .qr-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #9ca3af; }
        .qr-loading__spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: var(--brand); border-radius: 50%; animation: spin 0.7s linear infinite; }
        .qr-result { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
        .qr-result__card { background: #f8f9fc; border-radius: 12px; padding: 16px; width: 100%; max-width: 260px; text-align: center; }
        .qr-result__header { margin-bottom: 12px; }
        .qr-result__restaurant { font-size: 13px; font-weight: 700; color: #5f6380; text-transform: uppercase; letter-spacing: 0.5px; }
        .qr-result__table { font-size: 22px; font-weight: 800; color: #1a1a2e; }
        .qr-result__img { width: 100%; border-radius: 8px; }
        .qr-result__url { font-size: 11px; color: #9ca3af; margin-top: 10px; word-break: break-all; }
        .qr-download { width: 100%; max-width: 260px; text-align: center; padding: 12px; }
        .qr-placeholder { text-align: center; color: #9ca3af; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .qr-placeholder__icon { font-size: 48px; opacity: 0.4; }
        .qr-placeholder__sub { font-size: 13px; line-height: 1.6; margin-top: 4px; }
        .qr-placeholder__sub code { background: #f0f2f8; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--brand); }
      `}</style>
    </div>
  );
}
