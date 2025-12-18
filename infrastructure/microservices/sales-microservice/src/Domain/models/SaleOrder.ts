import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { OrderStatus } from "../enums/OrderStatus";

@Entity({ name: "orders" })
export class SaleOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column()
  deliveryAddress!: string;

  @Column({ type: "int" })
  packagesRequested!: number;

  @Column({ type: "simple-json", nullable: true })
  packageIds?: number[];

  @Column({ type: "varchar", length: 64, nullable: true })
  serial!: string; 

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.CREATED
  })
  status!: OrderStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
