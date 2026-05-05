import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useAppConfig } from '../../hooks/useAppConfig';
import { AdminHeaderControls } from '../../components/admin/AdminHeaderControls';
import { Seo } from '../../components/common/Seo';

export default function AdminLayout() {
  const { logout } = useAuth();
  const { theme, toggleTheme, lang, setLang, t } = useAppConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    await logout();
    navigate('/manage/login');
  };

  const navItems = [
    { path: '/manage', icon: LayoutDashboard, label: t.admin.layout.dashboard },
    { path: '/manage/orders', icon: Package, label: t.admin.layout.orders },
    { path: '/manage/products', icon: Package, label: t.admin.layout.products },
    { path: '/manage/settings', icon: Settings, label: t.admin.layout.settings },
  ];

  return (
    <div className={`min-h-screen font-['Montserrat'] flex ${isDark ? 'dark bg-[#111111] text-[#E8E8E8]' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
      <Seo
        title={`${t.admin.common.brand} — ${t.admin.layout.dashboard}`}
        description="Arateki admin panel."
        path={location.pathname}
        lang={lang}
        noindex
      />
      {/* Sidebar */}
      <aside className={`w-64 border-r flex-col hidden md:flex ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-[#2A2A2A]' : 'border-[#E0E0E0]'}`}>
          <Link to="/manage" className="text-2xl font-black uppercase tracking-tighter">
            Arateki <span className="font-light">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/manage' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors ${
                  isActive
                    ? isDark ? 'bg-[#2A2A2A] text-white' : 'bg-[#E0E0E0] text-[#181818]'
                    : isDark ? 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white' : 'text-gray-600 hover:bg-[#F0F0F0] hover:text-[#181818]'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-[#E0E0E0]'}`}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-red-500/10 hover:text-red-500 rounded-sm transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">{t.admin.layout.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className={`border-b px-4 md:px-8 py-3 flex justify-between items-center ${isDark ? 'bg-[#111111]/80 border-[#2A2A2A]' : 'bg-[#F5F5F5]/80 border-[#E0E0E0]'} backdrop-blur-md`}>
          <Link to="/manage" className="md:hidden text-xl font-black uppercase tracking-tighter">
            Arateki
          </Link>
          <div className="hidden md:block text-xs uppercase tracking-[0.2em] font-semibold opacity-70">
            {t.admin.common.brand}
          </div>
          <div className="flex items-center gap-4">
            <AdminHeaderControls theme={theme} toggleTheme={toggleTheme} lang={lang} setLang={setLang} t={t} />
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" aria-label={t.admin.layout.logout}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
