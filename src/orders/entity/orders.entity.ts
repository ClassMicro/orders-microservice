import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from '../enum/status';
import { OrdersItems } from './orders-items.entity';
// tener en cuenta que la entidad de control debe bases datos tiene que estar muy bien definida
@Entity()
export class orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'int' })
  totalItems: number;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP(0)',
  })
  updatedAt: Date;

  @OneToMany(() => OrdersItems ,(ordersitems) => ordersitems.orders )
  OrdersItems: OrdersItems[]
}
