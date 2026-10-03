import React, { ReactNode, useState } from 'react';
import { useAuth } from './AuthContext';
import { Restaurant } from '@qr-menu/types';
import { VyomaBrand } from '../components/VyomaBrand';

interface AdminLayoutProps {
  restaurant: Restaurant | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

const TABS = [
  { id: 'categories', label: 'Categories', icon: '📋' },
  { id: 'items', label: 'Menu Items', icon: '🍽️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'billing', label: 'Billing', icon: '💳' },
];

export function AdminLayout({ restaurant, activeTab, onTabChange, children }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-root admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'admin-sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">
            {restaurant?.logo_url ? (
              <img 
                src={restaurant.logo_url} 
                alt={`${restaurant.name} logo`} 
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', display: 'block' }} 
              />
            ) : (
              '🍽️'
            )}
          </span>
          <div>
            <div className="admin-sidebar__app-name">QR Menu</div>
            <div className="admin-sidebar__restaurant">{restaurant?.name ?? '…'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav" aria-label="Admin navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`admin-nav__item ${activeTab === tab.id ? 'admin-nav__item--active' : ''}`}
              onClick={() => { onTabChange(tab.id); setMobileNavOpen(false); }}
            >
              <span className="admin-nav__icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <button className="admin-signout" onClick={signOut}>
          <span>↩</span> Sign Out
        </button>

        <div style={{ marginTop: 'auto' }}>
          <VyomaBrand className="admin-vyoma-brand" />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div className="admin-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Main */}
      <div className="admin-main">
        {/* Mobile header */}
        <header className="admin-mobile-header">
          <button
            className="admin-hamburger"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="admin-mobile-title">{restaurant?.name ?? 'Admin'}</span>
          <div style={{ width: 36 }} />
        </header>

        {/* Page content */}
        <div className="admin-content">
          {children}
        </div>
      </div>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100dvh;
          background: #f0f2f8;
        }
        .admin-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          gap: 8px;
        }
        .admin-sidebar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 8px 24px;
          border-bottom: 1px solid #f0f2f8;
          margin-bottom: 16px;
        }
        .admin-sidebar__logo {
          font-size: 28px;
          flex-shrink: 0;
        }
        .admin-sidebar__app-name {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #9ca3af;
        }
        .admin-sidebar__restaurant {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 140px;
        }
        .admin-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .admin-nav__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #5f6380;
          font-family: inherit;
          text-align: left;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .admin-nav__item:hover {
          background: #f0f2f8;
          color: #1a1a2e;
        }
        .admin-nav__item--active {
          background: color-mix(in srgb, var(--brand) 12%, transparent);
          color: var(--brand);
        }
        .admin-nav__item--active:hover {
          background: color-mix(in srgb, var(--brand) 18%, transparent);
          color: var(--brand);
        }
        .admin-nav__icon { font-size: 16px; }
        .admin-signout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #9ca3af;
          font-family: inherit;
          transition: color 0.15s ease, background 0.15s ease;
          margin-top: 8px;
        }
        .admin-signout:hover { color: #dc2626; background: #fef2f2; }
        .admin-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .admin-content {
          flex: 1;
          padding: 32px;
          max-width: 900px;
        }
        .admin-mobile-header {
          display: none;
        }
        .admin-overlay { display: none; }

        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 4px 0 32px rgba(0,0,0,0.15);
          }
          .admin-sidebar--open {
            transform: translateX(0);
          }
          .admin-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 199;
          }
          .admin-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: #fff;
            border-bottom: 1px solid #e5e7eb;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .admin-hamburger {
            font-size: 20px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #f0f2f8;
            font-family: inherit;
          }
          .admin-mobile-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a2e;
          }
          .admin-content {
            padding: 20px 16px;
          }
        }
      `}</style>
    </div>
  );
}
