import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Sales from './pages/Sales';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import { useAppConfig } from './hooks/useAppConfig';

function AdminSettingsPlaceholder() {
  const { t } = useAppConfig();
  return <div className="text-gray-400">{t.admin.layout.comingSoon}</div>;
}

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));
    const scrollToTarget = (behavior: ScrollBehavior) => {
      const target = document.getElementById(id);
      if (!target) return;

      const headerHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior });
    };

    const frameId = window.requestAnimationFrame(() => {
      scrollToTarget('smooth');
    });
    const settleId = window.setTimeout(() => scrollToTarget('auto'), 180);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleId);
    };
  }, [location.pathname, location.hash]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToHash />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Admin Routes */}
          <Route path="/manage/login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/manage" element={<AdminDashboard />} />
              <Route path="/manage/orders" element={<AdminOrders />} />
              <Route path="/manage/products" element={<AdminProducts />} />
              <Route path="/manage/products/new" element={<AdminProductForm />} />
              <Route path="/manage/products/:id/edit" element={<AdminProductForm />} />
              <Route path="/manage/settings" element={<AdminSettingsPlaceholder />} />
            </Route>
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
