import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { orders } from "./orders.entity";

@Entity()
export class OrdersItems{
    @PrimaryGeneratedColumn('uuid')
    id : string;

    @Column({ type: 'int' })
    quantity : number;

    @Column({ type: 'varchar' })
    productId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price : number;

    // esto no permite tener la relacion de muchos a muchos juntando 
    // la entidad de orders y ordersitems
    @ManyToOne(() =>orders,(order)=> order.OrdersItems)
    @JoinColumn({ name: 'orderId' })
    orders: orders;


}