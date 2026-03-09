import { AppDataSource } from '../config/database';
import { Order, OrderStatus, OrderItem } from '../models/Order.model';
import { ILike, FindManyOptions } from 'typeorm';
import { format } from 'date-fns';

const orderRepo = () => AppDataSource.getRepository(Order);

const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `ZAM/${year}/`;

  const last = await orderRepo()
    .createQueryBuilder('o')
    .where('o.order_number LIKE :prefix', { prefix: `${prefix}%` })
    .orderBy('o.order_number', 'DESC')
    .getOne();

  let seq = 1;
  if (last) {
    const parts = last.order_number.split('/');
    seq = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
};

const calcTotals = (items: OrderItem[]) => {
  let net = 0, vat = 0, gross = 0;
  for (const item of items) {
    const net_amount = parseFloat(item.quantity as any) * parseFloat(item.unit_price as any);
    const gross_amount = net_amount * (1 + parseFloat(item.vat_rate as any) / 100);
    item.net_amount = Math.round(net_amount * 100) / 100;
    item.gross_amount = Math.round(gross_amount * 100) / 100;
    net += item.net_amount;
    vat += gross_amount - net_amount;
    gross += item.gross_amount;
  }
  return {
    net_total: Math.round(net * 100) / 100,
    vat_total: Math.round(vat * 100) / 100,
    gross_total: Math.round(gross * 100) / 100,
  };
};

export default {
  async getAll(filters: { status?: OrderStatus; client_id?: string; search?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.client_id) where.client_id = filters.client_id;
    if (filters.search) where.title = ILike(`%${filters.search}%`);

    const orders = await orderRepo().find({
      where,
      relations: ['client', 'creator'],
      order: { created_at: 'DESC' },
    });

    const stats = {
      total: orders.length,
      new: orders.filter((o) => o.status === OrderStatus.NEW).length,
      in_progress: orders.filter((o) => o.status === OrderStatus.IN_PROGRESS).length,
      completed: orders.filter((o) => o.status === OrderStatus.COMPLETED).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    };

    return { orders, stats };
  },

  async getById(id: string) {
    const order = await orderRepo().findOne({ where: { id }, relations: ['client', 'creator'] });
    if (!order) throw new Error('Zamówienie nie znalezione');
    return order;
  },

  async create(data: any, userId: string) {
    const order_number = await generateOrderNumber();
    const items: OrderItem[] = data.items || [];
    const totals = calcTotals(items);

    const order = orderRepo().create({
      order_number,
      title: data.title,
      description: data.description,
      status: data.status || OrderStatus.NEW,
      client_id: data.client_id,
      order_date: data.order_date || new Date(),
      delivery_date: data.delivery_date || null,
      currency: data.currency || 'PLN',
      items,
      ...totals,
      notes: data.notes,
      created_by: userId,
    });

    return orderRepo().save(order);
  },

  async update(id: string, data: any, userId: string) {
    const order = await orderRepo().findOne({ where: { id } });
    if (!order) throw new Error('Zamówienie nie znalezione');

    const items: OrderItem[] = data.items ?? order.items;
    const totals = calcTotals(items);

    Object.assign(order, {
      title: data.title ?? order.title,
      description: data.description ?? order.description,
      status: data.status ?? order.status,
      client_id: data.client_id ?? order.client_id,
      order_date: data.order_date ?? order.order_date,
      delivery_date: data.delivery_date ?? order.delivery_date,
      currency: data.currency ?? order.currency,
      items,
      ...totals,
      notes: data.notes ?? order.notes,
    });

    return orderRepo().save(order);
  },

  async updateStatus(id: string, status: OrderStatus) {
    const order = await orderRepo().findOne({ where: { id } });
    if (!order) throw new Error('Zamówienie nie znalezione');
    order.status = status;
    return orderRepo().save(order);
  },

  async delete(id: string) {
    const order = await orderRepo().findOne({ where: { id } });
    if (!order) throw new Error('Zamówienie nie znalezione');
    await orderRepo().remove(order);
  },
};
