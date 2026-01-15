import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { OrderItem } from "./OrderItem";

@Entity({ name: "orders" })
export class SaleOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column()
  deliveryAddress!: string;

  @Column({ type: "simple-json" })
  items!: OrderItem[];

  @Column({ type: "int", default: 0 })
  totalItems!: number;

  @Column({ type: "varchar", length: 64, nullable: true })
  serial!: string; 

  @CreateDateColumn()
  createdAt!: Date;
}
