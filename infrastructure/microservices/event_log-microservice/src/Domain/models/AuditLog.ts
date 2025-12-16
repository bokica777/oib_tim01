import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { AuditLogType } from "../enums/AuditLogType";

@Entity({ name: "audit_logs" })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: AuditLogType,
  })
  type!: AuditLogType;

  @Column({ type: "text" })
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

