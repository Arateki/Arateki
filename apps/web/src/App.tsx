import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
