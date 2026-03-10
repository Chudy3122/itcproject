import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import {
  Plus, Search, ShoppingCart, Clock,
  ChevronRight, Loader2, Calendar, Building2, ChevronDown,
} from 'lucide-react';
import * as orderApi from '../api/order.api';
import { Order } from '../api/order.api';

type StatusFilter = 'all' | 'new' | 'in_progress' | 'completed' | 'cancelled';

const statusConfig = {
  new: { label: 'Nowe', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  in_progress: { label: 'W realizacji', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  completed: { label: 'Zrealizowane', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  cancelled: { label: 'Anulowane', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const result = await orderApi.getOrders();
      setOrders(result.orders);
      setStats(result.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setChangingStatus(id);
      const updated = await orderApi.updateOrderStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
      setOpenStatusDropdown(null);
    } catch (e) {
      console.error(e);
    } finally {
      setChangingStatus(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!o.title.toLowerCase().includes(q) &&
            !o.order_number.toLowerCase().includes(q) &&
            !o.client?.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatCurrency = (amount: number, currency = 'PLN') =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(amount);

  const allStatuses: Array<'new' | 'in_progress' | 'completed' | 'cancelled'> =
    ['new', 'in_progress', 'completed', 'cancelled'];

  return (
    <MainLayout title="Zamówienia">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zamówienia</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Zarządzaj zamówieniami klientów i procesami sprzedażowymi
            </p>
          </div>
          <button
            onClick={() => navigate('/orders/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nowe zamówienie
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {([
            ['all', stats.total ?? 0, 'Wszystkie', 'bg-white border-gray-200', 'text-gray-900'],
            ['new', stats.new ?? 0, 'Nowe', 'bg-white border-gray-200', 'text-blue-600'],
            ['in_progress', stats.in_progress ?? 0, 'W realizacji', 'bg-white border-gray-200', 'text-yellow-600'],
            ['completed', stats.completed ?? 0, 'Zrealizowane', 'bg-white border-gray-200', 'text-green-600'],
            ['cancelled', stats.cancelled ?? 0, 'Anulowane', 'bg-white border-gray-200', 'text-red-600'],
          ] as const).map(([key, count, label, bg, textColor]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as StatusFilter)}
              className={`p-3 rounded-lg border transition-all dark:bg-gray-800 dark:border-gray-700 ${
                statusFilter === key ? 'ring-2 ring-gray-800 dark:ring-gray-400' : 'hover:border-gray-300'
              } ${bg}`}
            >
              <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj zamówień..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Ładowanie zamówień...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Brak zamówień</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {searchQuery || statusFilter !== 'all'
                ? 'Nie znaleziono zamówień pasujących do filtrów'
                : 'Utwórz pierwsze zamówienie'}
            </p>
            {statusFilter === 'all' && !searchQuery && (
              <button
                onClick={() => navigate('/orders/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nowe zamówienie
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredOrders.map(order => {
              const sc = statusConfig[order.status];
              return (
                <div key={order.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-0.5 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      <ShoppingCart className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{order.order_number}</span>
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700">
                            {order.title}
                          </h3>
                        </div>

                        {/* Status dropdown */}
                        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenStatusDropdown(openStatusDropdown === order.id ? null : order.id)}
                            disabled={changingStatus === order.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${sc.color} hover:opacity-80`}
                          >
                            {changingStatus === order.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />}
                            {sc.label}
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {openStatusDropdown === order.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenStatusDropdown(null)} />
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                {allStatuses.map(s => {
                                  const cfg = statusConfig[s];
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(order.id, s)}
                                      disabled={order.status === s}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                                        order.status === s
                                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-default'
                                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                      {cfg.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {order.client && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {order.client.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.order_date)}
                        </span>
                        {order.delivery_date && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Clock className="w-3 h-3" />
                            Dostawa: {formatDate(order.delivery_date)}
                          </span>
                        )}
                        <span className="ml-auto font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {formatCurrency(order.gross_total, order.currency)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mt-1 flex-shrink-0"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
            Wyświetlono {filteredOrders.length} z {orders.length} zamówień
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders;
