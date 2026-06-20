import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { AdminProvider, AdminRoute } from './contexts/AdminContext';

// Customer Pages
import WelcomeScreen from './pages/customer/WelcomeScreen';
import CatalogGrid from './pages/customer/CatalogGrid';
import ItemDetail from './pages/customer/ItemDetail';
import Shortlist from './pages/customer/Shortlist';
import SizeGuide from './pages/customer/SizeGuide';
import SessionExpired from './pages/customer/SessionExpired';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import CustomerShortlists from './pages/admin/CustomerShortlists';
import InventoryList from './pages/admin/InventoryList';
import AdminItemDetail from './pages/admin/AdminItemDetail';
import AddNewItem from './pages/admin/AddNewItem';
import BulkUpload from './pages/admin/BulkUpload';
import Settings from './pages/admin/Settings';

export default function App() {
  const appMode = import.meta.env.VITE_APP_MODE || 'both'; // 'customer', 'admin', or 'both'

  // Temporary utility to clear cache if needed
  useEffect(() => {
    if (window.location.search.includes('clear=true')) {
      localStorage.clear();
      window.location.href = window.location.pathname; // strip query params
    }
  }, []);

  return (
    <SessionProvider>
      <AdminProvider>
        <Routes>
          {/* Customer Portal */}
          {appMode !== 'admin' && (
            <>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/catalog" element={<CatalogGrid />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="/size-guide" element={<SizeGuide />} />
              <Route path="/expired" element={<SessionExpired />} />
            </>
          )}

          {/* Admin Portal */}
          {appMode !== 'customer' && (
            <>
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/shortlists" element={<AdminRoute><CustomerShortlists /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><InventoryList /></AdminRoute>} />
              <Route path="/admin/item/:id" element={<AdminRoute><AdminItemDetail /></AdminRoute>} />
              <Route path="/admin/add-item" element={<AdminRoute><AddNewItem /></AdminRoute>} />
              <Route path="/admin/bulk-upload" element={<AdminRoute><BulkUpload /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
            </>
          )}

          {/* Catch-all */}
          {appMode === 'admin' ? (
            <Route path="*" element={<Navigate to="/admin" replace />} />
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </AdminProvider>
    </SessionProvider>
  );
}
