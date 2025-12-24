import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "warehouses" })
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 250 })
  location!: string;

  @Column({ type: "int", default: 1000 })
  capacity!: number;
}
