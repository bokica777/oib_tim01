import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { PackageStatus } from "../enums/PackageStatus";

@Entity({ name: "packages" })
export class StoragePackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string; 

  @Column({ type: "varchar", length: 250 })
  senderAddress!: string;

  @Column({ type: "int" })
  warehouseId!: number;

  @Column({ type: "int", nullable: true })
  perfumeId?: number;

  @Column({ type: "enum", enum: PackageStatus, default: PackageStatus.PACKED })
  status!: PackageStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", length: 64, nullable: true, unique: true })
  serialNumber?: string; 
}
