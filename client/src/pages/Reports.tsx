import { useState, useEffect, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout';
import * as reportApi from '../api/report.api';
import * as adminApi from '../api/admin.api';
import * as projectApi from '../api/project.api';
import * as taskApi from '../api/task.api';
import * as orderApi from '../api/order.api';
import * as invoiceApi from '../api/invoice.api';
import type { ReportFilters, TimeReportData } from '../api/report.api';
import type { AdminUser } from '../types/admin.types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Clock, FolderKanban, ShoppingCart, FileText, BarChart2,
  Download, RefreshCw, CheckCircle2, AlertCircle,
  Loader2,
} from 'lucide-react';

type TabId = 'time' | 'projects' | 'orders' | 'invoices' | 'tasks' | 'comparative';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'time', label: 'Czas pracy', icon: Clock },
  { id: 'projects', label: 'Projekty', icon: FolderKanban },
  { id: 'orders', label: 'Zamówienia', icon: ShoppingCart },
  { id: 'invoices', label: 'Faktury', icon: FileText },
  { id: 'tasks', label: 'Zadania', icon: CheckCircle2 },
  { id: 'comparative', label: 'Porównawczy', icon: BarChart2 },
];

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color} dark:text-white`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const SectionLoader = () => (
  <div className="flex flex-col items-center py-16">
    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
    <p className="text-sm text-gray-500">Ładowanie danych...</p>
  </div>
);

// ─── Tab: Czas pracy ────────────────────────────────────────────────────────

const TimeTab = ({ users }: { users: AdminUser[] }) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState<TimeReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    try {
      setLoading(true); setError(null);
      const filters: ReportFilters = { startDate, endDate, userId: userId || undefined, status: status || undefined };
      setData(await reportApi.getTimeReport(filters));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Nie udało się wygenerować raportu');
    } finally { setLoading(false); }
  };

  const exportFile = async (type: 'excel' | 'pdf') => {
    try {
      setExporting(type); setError(null);
      const filters: ReportFilters = { startDate, endDate, userId: userId || undefined, status: status || undefined };
      const blob = type === 'excel'
        ? await reportApi.exportTimeReportExcel(filters)
        : await reportApi.exportTimeReportPDF(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raport_czasu_pracy_${startDate}_${endDate}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Nie udało się wyeksportować');
    } finally { setExporting(null); }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filtry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data od</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400 focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data do</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400 focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pracownik</label>
            <select value={userId} onChange={e => setUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400">
              <option value="">Wszyscy</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400">
              <option value="">Wszystkie</option>
              <option value="in_progress">W trakcie</option>
              <option value="completed">Ukończony</option>
              <option value="approved">Zatwierdzony</option>
              <option value="rejected">Odrzucony</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generuj raport
          </button>
          <button onClick={() => exportFile('excel')} disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel
          </button>
          <button onClick={() => exportFile('pdf')} disabled={!data || exporting !== null}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Łączny czas pracy" value={`${data.summary.totalHours}h ${data.summary.totalMinutes}m`} />
            <StatCard label="Nadgodziny" value={`${data.summary.overtimeHours}h ${data.summary.overtimeMinutes}m`} color="text-amber-600" />
            <StatCard label="Spóźnienia" value={`${data.summary.lateArrivals}`} sub={`${data.summary.totalLateMinutes} min łącznie`} color="text-red-600" />
            <StatCard label="Dni przepracowane" value={data.summary.daysWorked} sub={`Śr. ${data.summary.averageHoursPerDay.toFixed(1)}h/dzień`} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Znaleziono <strong>{data.entries.length}</strong> wpisów w wybranym okresie.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Tab: Projekty ──────────────────────────────────────────────────────────

const ProjectsTab = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.getProjects().then(r => setData(r.projects)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    data.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    return byStatus;
  }, [data]);

  const statusLabels: Record<string, string> = {
    active: 'Aktywne', completed: 'Zakończone', on_hold: 'Wstrzymane',
    cancelled: 'Anulowane', planning: 'Planowanie',
  };

  const pieData = Object.entries(stats).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));
  const total = data.length;

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wszystkie projekty" value={total} />
        <StatCard label="Aktywne" value={stats.active ?? 0} color="text-blue-600" />
        <StatCard label="Zakończone" value={stats.completed ?? 0} color="text-green-600" />
        <StatCard label="Wstrzymane" value={stats.on_hold ?? 0} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statusy projektów</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Brak danych</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ostatnie projekty</h3>
          <div className="space-y-2">
            {data.slice(0, 8).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{p.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === 'active' ? 'bg-blue-100 text-blue-700' :
                  p.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{statusLabels[p.status] || p.status}</span>
              </div>
            ))}
            {data.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Brak projektów</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Zamówienia ────────────────────────────────────────────────────────

const OrdersTab = () => {
  const [data, setData] = useState<{ orders: any[]; stats: Record<string, number> }>({ orders: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getOrders().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v);

  const totalRevenue = data.orders.reduce((s, o) => s + (o.gross_total || 0), 0);
  const completedRevenue = data.orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.gross_total || 0), 0);

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    data.orders.forEach(o => {
      const m = o.order_date?.slice(0, 7);
      if (m) map[m] = (map[m] || 0) + (o.gross_total || 0);
    });
    return Object.entries(map).sort().slice(-6).map(([m, v]) => ({
      month: m.slice(5) + '/' + m.slice(2, 4),
      value: Math.round(v),
    }));
  }, [data.orders]);

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wszystkie zamówienia" value={data.stats.total ?? 0} />
        <StatCard label="Nowe" value={data.stats.new ?? 0} color="text-blue-600" />
        <StatCard label="W realizacji" value={data.stats.in_progress ?? 0} color="text-amber-600" />
        <StatCard label="Zrealizowane" value={data.stats.completed ?? 0} color="text-green-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard label="Łączna wartość brutto" value={formatCurrency(totalRevenue)} color="text-gray-900" />
        <StatCard label="Wartość zrealizowanych" value={formatCurrency(completedRevenue)} color="text-green-600" />
      </div>

      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Wartość zamówień wg miesiąca (PLN)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ostatnie zamówienia</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4">Numer</th>
                <th className="text-left py-2 pr-4">Tytuł</th>
                <th className="text-left py-2 pr-4">Klient</th>
                <th className="text-right py-2">Wartość</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.slice(0, 10).map((o: any) => (
                <tr key={o.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-400">{o.order_number}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{o.title}</td>
                  <td className="py-2 pr-4 text-gray-500">{o.client?.name ?? '-'}</td>
                  <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(o.gross_total)}</td>
                </tr>
              ))}
              {data.orders.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Brak zamówień</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Faktury ────────────────────────────────────────────────────────────

const InvoicesTab = () => {
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      invoiceApi.getInvoiceStatistics(),
      invoiceApi.getInvoices(),
    ]).then(([s, r]) => {
      setStats(s);
      setInvoices(r.invoices ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v || 0);

  const monthlyData = useMemo(() => {
    const map: Record<string, { issued: number; paid: number }> = {};
    invoices.forEach((inv: any) => {
      const m = (inv.issue_date || inv.created_at || '').slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { issued: 0, paid: 0 };
      map[m].issued += inv.gross_total || 0;
      if (inv.status === 'paid') map[m].paid += inv.gross_total || 0;
    });
    return Object.entries(map).sort().slice(-6).map(([m, v]) => ({
      month: m.slice(5) + '/' + m.slice(2, 4),
      Wystawione: Math.round(v.issued),
      Opłacone: Math.round(v.paid),
    }));
  }, [invoices]);

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Wystawione" value={stats.total_count ?? invoices.length} />
          <StatCard label="Łączna wartość brutto" value={formatCurrency(stats.total_gross)} color="text-blue-600" />
          <StatCard label="Opłacone" value={formatCurrency(stats.total_paid)} color="text-green-600" />
          <StatCard label="Do zapłaty" value={formatCurrency(stats.total_pending)} color="text-red-600" />
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Faktury wg miesiąca (PLN)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Wystawione" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Opłacone" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ostatnie faktury</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4">Numer</th>
                <th className="text-left py-2 pr-4">Klient</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-right py-2">Kwota</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 10).map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-400">{inv.invoice_number}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{inv.client?.name ?? '-'}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(inv.gross_total)}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Brak faktur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Zadania ────────────────────────────────────────────────────────────

const TasksTab = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getTasks().then(setTasks).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    tasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });
    return { byStatus, byPriority };
  }, [tasks]);

  const statusLabels: Record<string, string> = {
    todo: 'Do zrobienia', in_progress: 'W trakcie', review: 'W recenzji',
    done: 'Gotowe', cancelled: 'Anulowane',
  };
  const priorityLabels: Record<string, string> = {
    low: 'Niski', medium: 'Średni', high: 'Wysoki', urgent: 'Pilny',
  };

  const statusData = Object.entries(stats.byStatus).map(([k, v]) => ({ name: statusLabels[k] || k, value: v }));
  const priorityData = Object.entries(stats.byPriority).map(([k, v]) => ({ name: priorityLabels[k] || k, value: v }));

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wszystkie zadania" value={tasks.length} />
        <StatCard label="W trakcie" value={stats.byStatus.in_progress ?? 0} color="text-blue-600" />
        <StatCard label="Gotowe" value={stats.byStatus.done ?? 0} color="text-green-600" />
        <StatCard label="Pilne" value={stats.byPriority.urgent ?? 0} color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Wg statusu</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Brak danych</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Wg priorytetu</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Brak danych</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Porównawczy ────────────────────────────────────────────────────────

const ComparativeTab = ({ users }: { users: AdminUser[] }) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<TimeReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    try {
      setLoading(true);
      setData(await reportApi.getTimeReport({ startDate, endDate }));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const perUserData = useMemo(() => {
    if (!data) return [];
    const map: Record<string, { name: string; hours: number; days: number }> = {};
    data.entries.forEach((e: any) => {
      const uid = e.user_id || e.userId;
      const name = e.user
        ? `${e.user.first_name} ${e.user.last_name}`
        : (users.find(u => u.id === uid)
          ? `${users.find(u => u.id === uid)!.first_name} ${users.find(u => u.id === uid)!.last_name}`
          : uid);
      if (!map[uid]) map[uid] = { name, hours: 0, days: 0 };
      const dur = e.duration_minutes || e.durationMinutes || 0;
      map[uid].hours += dur / 60;
      map[uid].days += 1;
    });
    return Object.values(map).map(v => ({
      name: v.name,
      'Godziny': +v.hours.toFixed(1),
      'Dni': v.days,
    })).sort((a, b) => b['Godziny'] - a['Godziny']);
  }, [data, users]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Raport porównawczy pracowników</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data od</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data do</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Porównaj pracowników
        </button>
      </div>

      {perUserData.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Godziny pracy wg pracownika</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perUserData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit="h" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => `${v}h`} />
                <Bar dataKey="Godziny" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Zestawienie</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4">Pracownik</th>
                    <th className="text-right py-2 pr-4">Godziny</th>
                    <th className="text-right py-2 pr-4">Wpisy</th>
                    <th className="text-right py-2">Śr. h/wpis</th>
                  </tr>
                </thead>
                <tbody>
                  {perUserData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.name}</td>
                      <td className="py-2 pr-4 text-right font-medium">{row['Godziny']}h</td>
                      <td className="py-2 pr-4 text-right text-gray-500">{row['Dni']}</td>
                      <td className="py-2 text-right text-gray-500">
                        {row['Dni'] > 0 ? (row['Godziny'] / row['Dni']).toFixed(1) : '-'}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {data && perUserData.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-400 text-sm">Brak wpisów czasu pracy w wybranym okresie</p>
        </div>
      )}
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────

const Reports = () => {
  const [activeTab, setActiveTab] = useState<TabId>('time');
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(console.error);
  }, []);

  return (
    <MainLayout title="Raporty BI">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporty BI</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Centrum zarządzania danymi — analizy, porównania i eksport
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'time' && <TimeTab users={users} />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'comparative' && <ComparativeTab users={users} />}
    </MainLayout>
  );
};

export default Reports;
