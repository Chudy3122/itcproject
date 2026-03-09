import { Request, Response } from 'express';
import orderService from '../services/order.service';
import { OrderStatus } from '../models/Order.model';

export class OrderController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as OrderStatus,
        client_id: req.query.client_id as string,
        search: req.query.search as string,
      };
      const result = await orderService.getAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const order = await orderService.getById(req.params.id);
      res.json(order);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const order = await orderService.create(req.body, req.user!.userId);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const order = await orderService.update(req.params.id, req.body, req.user!.userId);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body.status);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await orderService.delete(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }
}

export default new OrderController();
