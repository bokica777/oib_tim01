import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { UserRole } from "../enums/UserRole";

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

@Entity("users")
@Index(["provider", "providerUserId"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true, length: 100 })
  username!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.SELLER })
  role!: UserRole;

  @Column({ type: "varchar", length: 255, nullable: true })
  password!: string | null;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: "longtext", nullable: true })
  profileImage!: string | null;

  @Column({ type: "enum", enum: AuthProvider, default: AuthProvider.LOCAL })
  provider!: AuthProvider;

  @Column({ type: "varchar", length: 255, nullable: true })
  providerUserId!: string | null;
}
