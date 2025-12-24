import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Plant } from "../Domain/models/Plant";
dotenv.config();

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "plants_db",
  ssl: process.env.DB_SSL_MODE === "REQUIRED" ? { rejectUnauthorized: false } : false,
  // synchronize only in development
  synchronize: process.env.NODE_ENV === "development",
  logging: false,
  entities: [Plant],
});
