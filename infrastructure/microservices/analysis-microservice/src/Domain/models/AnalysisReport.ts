import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("izvestaj_analize")
export class AnalysisReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  tipIzvestaja!: string; // npr. "UKUPNA_PRODAJA", "TREND", "TOP_10"

  @Column("json")
  parametri!: any; // period, filteri...

  @Column("json")
  rezultat!: any; // gotovi podaci za frontend

  @CreateDateColumn()
  datumKreiranja!: Date;
}
