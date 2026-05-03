import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useAppConfig } from '../../hooks/useAppConfig';
import { authService } from '../../services/authService';
import { AdminHeaderControls } from '../../components/admin/AdminHeaderControls';

export default function AdminLogin() {
  const { theme, toggleTheme, lang, setLang, t } = useAppConfig();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await authService.login(loginId, password);
      login(token);
      navigate('/manage');
    } catch {
      setError(t.admin.login.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center font-['Montserrat'] px-6 ${theme === 'dark' ? 'dark bg-[#111111] text-[#E8E8E8]' : 'bg-[#F5F5F5] text-[#1A1A1A]'}`}>
      <div className="fixed right-6 top-4">
        <AdminHeaderControls theme={theme} toggleTheme={toggleTheme} lang={lang} setLang={setLang} t={t} />
      </div>
      <div className={`max-w-md w-full p-8 border rounded-lg ${theme === 'dark' ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-center">
          {t.admin.login.title}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-sm mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-80 font-semibold mb-2">
              {t.admin.login.login}
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              className={`w-full border rounded-sm px-4 py-3 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#111111] border-[#2A2A2A] focus:border-white/40' : 'bg-[#F5F5F5] border-[#D0D0D0] focus:border-black/40'}`}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest opacity-80 font-semibold mb-2">
              {t.admin.login.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full border rounded-sm px-4 py-3 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#111111] border-[#2A2A2A] focus:border-white/40' : 'bg-[#F5F5F5] border-[#D0D0D0] focus:border-black/40'}`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E0E0E0] text-[#181818] py-4 rounded-sm text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#CACACA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.admin.login.submitting : t.admin.login.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
