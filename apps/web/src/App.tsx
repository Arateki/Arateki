import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
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
import { isLangCode, pickPreferredLang } from './lib/seo';
import montserratRegularUrl from './assets/fonts/Montserrat-Regular.ttf';

function AdminSettingsPlaceholder() {
  const { t } = useAppConfig();
  return <div className="text-gray-400">{t.admin.layout.comingSoon}</div>;
}

function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));
    const scrollToTarget = (behavior: ScrollBehavior, tolerance = 0) => {
      const target = document.getElementById(id);
      if (!target) return;

      const headerHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
      if (Math.abs(target.getBoundingClientRect().top - headerHeight) <= tolerance) return;

      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior });
    };

    const frameId = window.requestAnimationFrame(() => {
      scrollToTarget('smooth');
    });
    const settleIds = [180, 650].map(delay => window.setTimeout(() => scrollToTarget('smooth', 2), delay));

    return () => {
      window.cancelAnimationFrame(frameId);
      settleIds.forEach(id => window.clearTimeout(id));
    };
  }, [location.pathname, location.hash]);

  return null;
}

function RootRedirect() {
  const lang = pickPreferredLang();
  const { search, hash } = useLocation();
  return <Navigate to={`/${lang}${search}${hash}`} replace />;
}

function LangGuard() {
  const { lang } = useParams<{ lang: string }>();
  const { pathname, search, hash } = useLocation();

  if (!isLangCode(lang)) {
    const fallback = pickPreferredLang();
    const remainder = pathname.replace(/^\/[^/]+/, '') || '/';
    return <Navigate to={`/${fallback}${remainder === '/' ? '' : remainder}${search}${hash}`} replace />;
  }

  return <Outlet />;
}

function LegacyPathRedirect() {
  const lang = pickPreferredLang();
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/${lang}${pathname}${search}${hash}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <link
        rel="preload"
        href={montserratRegularUrl}
        as="font"
        type="font/ttf"
        crossOrigin=""
      />
      <CartProvider>
        <ScrollToHash />
        <Routes>
          {/* Root → preferred language */}
          <Route index element={<RootRedirect />} />

          {/* Public lang-prefixed routes */}
          <Route path="/:lang" element={<LangGuard />}>
            <Route index element={<Home />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/:productId" element={<Sales />} />
            <Route path="checkout" element={<Checkout />} />
          </Route>

          {/* Legacy routes without lang → redirect to preferred lang */}
          <Route path="/sales" element={<LegacyPathRedirect />} />
          <Route path="/sales/:productId" element={<LegacyPathRedirect />} />
          <Route path="/checkout" element={<LegacyPathRedirect />} />

          {/* Admin routes (no lang prefix) */}
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
