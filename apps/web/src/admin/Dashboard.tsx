import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { adminApi } from '../lib/api';
import { AdminLayout } from './AdminLayout';
import { CategoriesPanel } from './CategoriesPanel';
import { ItemsPanel } from './ItemsPanel';
import { SettingsPanel } from './SettingsPanel';
import { BillingPanel } from './BillingPanel';
import { Restaurant } from '@qr-menu/types';

export function Dashboard() {
  const { token } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeTab, setActiveTab] = useState('categories');

  useEffect(() => {
    if (!token) return;
    adminApi.getRestaurant(token)
      .then(setRestaurant)
      .catch(console.error);
  }, [token]);

  const renderPanel = () => {
    switch (activeTab) {
      case 'categories': return <CategoriesPanel />;
      case 'items':      return <ItemsPanel />;
      case 'settings':   return <SettingsPanel />;
      case 'billing':    return <BillingPanel />;
      default:           return <CategoriesPanel />;
    }
  };

  return (
    <AdminLayout
      restaurant={restaurant}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderPanel()}
    </AdminLayout>
  );
}
