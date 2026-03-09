import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import * as orderApi from '../api/order.api';
import * as clientApi from '../api/client.api';

interface Client { id: string; name: string; }

interface ItemRow {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  net_amount: number;
  gross_amount: number;
}

const VAT_RATES = [0, 5, 8, 23];
const UNITS = ['szt.', 'usł.', 'godz.', 'dni', 'kg', 'l', 'm', 'm²', 'komplet'];

const emptyItem = (): ItemRow => ({
  name: '', quantity: 1, unit: 'szt.', unit_price: 0,
  vat_rate: 23, net_amount: 0, gross_amount: 0,
});

const calcItem = (item: ItemRow): ItemRow => {
  const net = Math.round(item.quantity * item.unit_price * 100) / 100;
  const gross = Math.round(net * (1 + item.vat_rate / 100) * 100) / 100;
  return { ...item, net_amount: net, gross_amount: gross };
};

const OrderForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    status: 'new',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    currency: 'PLN',
    notes: '',
  });
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  useEffect(() => {
    loadClients();
    if (isEdit) loadOrder();
  }, [id]);

  const loadClients = async () => {
    try {
      const res = await clientApi.getClients();
      setClients(res.clients || res);
    } catch (e) { console.error(e); }
  };

  const loadOrder = async () => {
    try {
      const order = await orderApi.getOrderById(id!);
      setFormData({
        title: order.title,
        description: order.description || '',
        client_id: order.client_id,
        status: order.status,
        order_date: order.order_date.split('T')[0],
        delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
        currency: order.currency,
        notes: order.notes || '',
      });
      setItems(order.items.length > 0 ? order.items : [emptyItem()]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleField = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleItem = (idx: number, field: keyof ItemRow, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({ ...updated[idx], [field]: value });
      return updated;
    });
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const totals = items.reduce(
    (acc, item) => ({
      net: acc.net + item.net_amount,
      vat: acc.vat + (item.gross_amount - item.net_amount),
      gross: acc.gross + item.gross_amount,
    }),
    { net: 0, vat: 0, gross: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) { alert('Wybierz kontrahenta'); return; }
    if (!formData.title.trim()) { alert('Podaj tytuł zamówienia'); return; }

    try {
      setIsSaving(true);
      const payload = { ...formData, items };
      if (isEdit) {
        await orderApi.updateOrder(id!, payload);
      } else {
        const created = await orderApi.createOrder(payload as any);
        navigate(`/orders/${created.id}`);
        return;
      }
      navigate(`/orders/${id}`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Nie udało się zapisać zamówienia');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title={isEdit ? 'Edytuj zamówienie' : 'Nowe zamówienie'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? 'Edytuj zamówienie' : 'Nowe zamówienie'}>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć do zamówień
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Informacje podstawowe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tytuł zamówienia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => handleField('title', e.target.value)}
                  placeholder="np. Usługi szkoleniowe – marzec 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kontrahent *
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={e => handleField('client_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Wybierz kontrahenta --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => handleField('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="new">Nowe</option>
                  <option value="in_progress">W realizacji</option>
                  <option value="completed">Zrealizowane</option>
                  <option value="cancelled">Anulowane</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data zamówienia *
                </label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={e => handleField('order_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Termin realizacji
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={e => handleField('delivery_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opis</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleField('description', e.target.value)}
                  rows={2}
                  placeholder="Opis zamówienia..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pozycje zamówienia</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <Plus className="w-4 h-4" />
                Dodaj pozycję
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left pb-2 pr-2">Nazwa</th>
                    <th className="text-center pb-2 px-2 w-20">Ilość</th>
                    <th className="text-center pb-2 px-2 w-20">Jed.</th>
                    <th className="text-right pb-2 px-2 w-28">Cena netto</th>
                    <th className="text-center pb-2 px-2 w-20">VAT</th>
                    <th className="text-right pb-2 px-2 w-28">Brutto</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleItem(idx, 'name', e.target.value)}
                          placeholder="Nazwa usługi / produktu"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={e => handleItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.unit}
                          onChange={e => handleItem(idx, 'unit', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-gray-400"
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={e => handleItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-gray-400"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.vat_rate}
                          onChange={e => handleItem(idx, 'vat_rate', parseInt(e.target.value))}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-gray-400"
                        >
                          {VAT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-gray-700 dark:text-gray-300">
                        {item.gross_amount.toFixed(2)}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Razem netto:</span>
                  <span>{totals.net.toFixed(2)} {formData.currency}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Razem VAT:</span>
                  <span>{totals.vat.toFixed(2)} {formData.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1">
                  <span>Razem brutto:</span>
                  <span>{totals.gross.toFixed(2)} {formData.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Uwagi</h2>
            <textarea
              value={formData.notes}
              onChange={e => handleField('notes', e.target.value)}
              rows={3}
              placeholder="Dodatkowe uwagi do zamówienia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Zapisz zmiany' : 'Utwórz zamówienie'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default OrderForm;
