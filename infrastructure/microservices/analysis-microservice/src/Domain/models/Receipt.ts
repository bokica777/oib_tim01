import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { ReceiptItem } from "./ReceiptItem";

export enum SaleType {
  RETAIL = "MALOPRODAJA",
  WHOLESALE = "VELEPRODAJA",
}

export enum PaymentType {
  CASH = "GOTOVINA",
  INVOICE = "RACUN",
  CARD = "KARTICA",
}

@Entity("fiskalni_racun")
export class Receipt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  brojRacuna!: string;

  @Column({ type: "enum", enum: SaleType, })
  tipProdaje!: SaleType;

  @Column({
    type: "enum",
    enum: PaymentType,
  })
  nacinPlacanja!: PaymentType;

  @Column("decimal", { precision: 10, scale: 2 })
  ukupanIznos!: number;

  @CreateDateColumn()
  datumVreme!: Date;

  @OneToMany(() => ReceiptItem, (item: ReceiptItem) => item.racun, {
    cascade: true,
  })
  stavke!: ReceiptItem[];
}
