import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { ProductionLogType } from "../enums/ProductionLogType";

@Entity("production_logs")
export class ProductionLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ type: "enum", enum: ProductionLogType })
  type!: ProductionLogType;

  @Column({ type: "text" })
  message!: string;
}
