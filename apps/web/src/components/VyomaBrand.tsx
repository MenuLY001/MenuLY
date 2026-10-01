import React from 'react';

export function VyomaBrand({ className = '' }: { className?: string }) {
  return (
    <div className={`vyoma-brand ${className}`}>
      <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer">
        <img src="/vyoma-logo.jpg" alt="Vyoma" className="vyoma-brand__logo" />
        <span className="vyoma-brand__text">powered by <strong>vyoma.world</strong></span>
      </a>
      <style>{`
        .vyoma-brand {
          padding: 24px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          opacity: 0.6;
          transition: opacity 0.2s ease;
          background: transparent;
          z-index: 10;
        }
        .vyoma-brand:hover {
          opacity: 1;
        }
        .vyoma-brand a {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: inherit;
          font-size: 13px;
          letter-spacing: 0.5px;
        }
        .vyoma-brand__logo {
          width: 20px;
          height: 20px;
          object-fit: contain;
          border-radius: 4px;
        }
        .vyoma-brand__text {
          color: currentColor;
          opacity: 0.7;
        }
        .vyoma-brand__text strong {
          opacity: 1;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
