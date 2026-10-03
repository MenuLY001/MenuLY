import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MenuPage } from './modules/menu/MenuPage';
import { Dashboard } from './admin/Dashboard';
import { LoginPage } from './admin/LoginPage';
import { AuthProvider, useAuth } from './admin/AuthContext';
import { RegisterPage } from './pages/RegisterPage';

function AdminRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f8',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #e5e7eb',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  return session ? <Dashboard /> : <LoginPage />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              {/* Public menu route — no auth */}
              <Route path="/menu/:slug" element={<MenuPage />} />

              {/* Self-serve registration + payment setup */}
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin routes — auth-gated */}
              <Route path="/admin" element={<AdminRoute />} />

              {/* /login is an alias for /admin */}
              <Route path="/login" element={<Navigate to="/admin" replace />} />

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/admin" replace />} />

              {/* 404 */}
              <Route path="*" element={
                <div style={{
                  minHeight: '100dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  textAlign: 'center',
                  padding: 20,
                }}>
                  <div style={{ fontSize: 64 }}>🍽️</div>
                  <h1 style={{ fontSize: 24, fontWeight: 700 }}>Page Not Found</h1>
                  <p style={{ color: 'var(--text-secondary)' }}>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
