import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Receipt } from "./Receipt";

@Entity("stavka_racuna")
export class ReceiptItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Receipt, (racun) => racun.stavke, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "racun_id" })
  racun!: Receipt;

  @Column()
  parfemId!: number;

  @Column()
  nazivParfema!: string;

  @Column()
  kolicina!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  jedinicnaCena!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  ukupno!: number;
}
