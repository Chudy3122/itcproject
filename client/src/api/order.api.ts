import apiClient from './client';

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  net_amount: number;
  gross_amount: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  client_id: string;
  client: { id: string; name: string };
  order_date: string;
  delivery_date?: string;
  currency: string;
  items: OrderItem[];
  net_total: number;
  vat_total: number;
  gross_total: number;
  notes?: string;
  created_by: string;
  creator: { id: string; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  title: string;
  description?: string;
  client_id: string;
  status?: string;
  order_date: string;
  delivery_date?: string;
  currency?: string;
  items: Omit<OrderItem, 'net_amount' | 'gross_amount'>[];
  notes?: string;
}

export const getOrders = async (params?: { status?: string; client_id?: string; search?: string }) => {
  const res = await apiClient.get('/orders', { params });
  return res.data as { orders: Order[]; stats: Record<string, number> };
};

export const getOrderById = async (id: string) => {
  const res = await apiClient.get(`/orders/${id}`);
  return res.data as Order;
};

export const createOrder = async (data: CreateOrderData) => {
  const res = await apiClient.post('/orders', data);
  return res.data as Order;
};

export const updateOrder = async (id: string, data: Partial<CreateOrderData>) => {
  const res = await apiClient.put(`/orders/${id}`, data);
  return res.data as Order;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const res = await apiClient.patch(`/orders/${id}/status`, { status });
  return res.data as Order;
};

export const deleteOrder = async (id: string) => {
  await apiClient.delete(`/orders/${id}`);
};
