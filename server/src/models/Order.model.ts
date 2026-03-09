import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { User } from './User.model';
import { Client } from './Client.model';

export enum OrderStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  net_amount: number;
  gross_amount: number;
}

@Entity('orders')
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  order_number: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  status: OrderStatus;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'date' })
  order_date: Date;

  @Column({ type: 'date', nullable: true })
  delivery_date: Date;

  @Column({ length: 3, default: 'PLN' })
  currency: string;

  @Column({ type: 'jsonb', default: '[]' })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  net_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  vat_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gross_total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
