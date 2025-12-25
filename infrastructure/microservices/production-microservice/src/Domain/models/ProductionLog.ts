import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum ProductionLogType {
  INFO = "INFO",
  WARNING = "WARNING",
  ACTION = "ACTION",
}

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
