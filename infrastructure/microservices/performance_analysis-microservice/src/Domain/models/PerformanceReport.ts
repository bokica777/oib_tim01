import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity({ name: "performance_reports" })

export class PerformanceReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  algorithmName!: string;

  @Column("float")
  executionTime!: number;

  @Column("float")
  successRate!: number;

  @Column("float")
  resourceUsage!: number;

  @Column("text")
  summary!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

