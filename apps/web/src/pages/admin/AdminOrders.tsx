import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useAppConfig } from '../../hooks/useAppConfig';
import { adminOrderService, type AdminOrder } from '../../services/adminOrderService';
import type { OrderStatus } from '../../types/checkout';

const statusColorMap: Record<OrderStatus, string> = {
  pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  paid: 'text-green-500 bg-green-500/10 border-green-500/20',
  processing: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  shipped: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const localeMap = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  zh: 'zh-CN',
  ja: 'ja-JP',
} as const;

export default function AdminOrders() {
  const { token } = useAuth();
  const { theme, lang, t } = useAppConfig();
  const isDark = theme === 'dark';
  const loadErrorMessage = t.admin.orders.loadError;
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const data = await adminOrderService.getOrders(token);
        setOrders(data);
        setError('');
      } catch {
        setError(loadErrorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrders();
  }, [token, loadErrorMessage]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    try {
      await adminOrderService.updateOrderStatus(token, orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setFeedback({ kind: 'success', msg: t.admin.orders.updated });
    } catch {
      setFeedback({ kind: 'error', msg: t.admin.orders.updateError });
    } finally {
      setOpenStatusId(null);
    }
  };

  const formatMoney = (cents: number, currency: string) => {
    return new Intl.NumberFormat(localeMap[lang], { style: 'currency', currency }).format(cents / 100);
  };

  if (isLoading) {
    return <div className="text-center py-20">{t.admin.orders.loading}</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-20">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t.admin.orders.title}</h1>

      {feedback && (
        <div className={`px-4 py-3 rounded-sm border text-sm ${
          feedback.kind === 'error'
            ? 'bg-red-500/10 border-red-500/50 text-red-500'
            : 'bg-green-500/10 border-green-500/50 text-green-500'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b ${isDark ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#F0F0F0] border-[#E0E0E0]'}`}>
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400">{t.admin.orders.customer}</th>
                <th className="px-6 py-4 font-semibold text-gray-400">{t.admin.orders.date}</th>
                <th className="px-6 py-4 font-semibold text-gray-400">{t.admin.orders.status}</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-right">{t.admin.orders.total}</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-[#2A2A2A]' : 'divide-y divide-[#E0E0E0]'}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {t.admin.orders.empty}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={isDark ? 'hover:bg-[#2A2A2A]/50 transition-colors' : 'hover:bg-[#F0F0F0] transition-colors'}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.contact.name}</div>
                      <div className="text-xs text-gray-500">{order.contact.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString(localeMap[lang])}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          aria-haspopup="listbox"
                          aria-expanded={openStatusId === order.id}
                          onClick={() => setOpenStatusId(openStatusId === order.id ? null : order.id)}
                          className={`text-xs font-semibold px-2 py-1 rounded-sm border focus:outline-none cursor-pointer flex items-center gap-2 ${statusColorMap[order.status]}`}
                        >
                          {t.admin.orders.statuses[order.status]}
                          <ChevronDown size={12} />
                        </button>
                        {openStatusId === order.id && (
                          <div
                            role="listbox"
                            className={`absolute z-20 mt-2 min-w-40 border rounded-sm shadow-xl p-1 ${isDark ? 'bg-[#1C1C1C] border-[#2A2A2A]' : 'bg-white border-[#E0E0E0]'}`}
                          >
                            {(Object.keys(statusColorMap) as OrderStatus[]).map((status) => (
                              <button
                                key={status}
                                type="button"
                                role="option"
                                aria-selected={order.status === status}
                                onClick={() => void handleStatusChange(order.id, status)}
                                className={`w-full text-left text-xs font-semibold px-3 py-2 rounded-sm ${isDark ? 'hover:bg-[#2A2A2A]' : 'hover:bg-[#F0F0F0]'} ${order.status === status ? statusColorMap[status] : isDark ? 'text-[#E8E8E8]' : 'text-[#1A1A1A]'}`}
                              >
                                {t.admin.orders.statuses[status]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatMoney(order.totalCents, order.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
