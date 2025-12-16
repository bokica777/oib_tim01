import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { PerfumeType } from "../enums/PerfumeType";
import { PerfumeStatus } from "../enums/PerfumeStatus"; 

@Entity({ name: "perfumes" })
export class Perfume {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "enum", enum: PerfumeType })
  type!: PerfumeType;

  @Column({ type: "int" })
  netVolumeMl!: number;

  // serial like PP-2025-<id>
  @Column({ type: "varchar", length: 64, nullable: true, unique: true })
  serialNumber?: string;

  // store array of source plant ids as json
  @Column({ type: "simple-json", nullable: true })
  sourcePlantIds?: number[];

  @Column({ type: "datetime", nullable: true })
  expirationDate?: Date;

  @Column({ type: "enum", enum: PerfumeStatus, default: PerfumeStatus.AVAILABLE })
  status!: PerfumeStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
