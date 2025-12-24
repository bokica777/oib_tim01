import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { PerformanceReport } from "../Domain/models/PerformanceReport";

dotenv.config({ quiet: true });

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [PerformanceReport],
});
