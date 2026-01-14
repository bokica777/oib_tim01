import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { AuditLogType } from "../enums/AuditLogType";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: AuditLogType })
  type!: AuditLogType;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  source?: string;

  @Column("json", { nullable: true })
  meta?: any;

  @CreateDateColumn()
  createdAt!: Date;
}
