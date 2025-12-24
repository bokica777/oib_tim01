import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { Receipt } from "../Domain/models/Receipt";
import { ReceiptItem } from "../Domain/models/ReceiptItem";
import { AnalysisReport } from "../Domain/models/AnalysisReport";

dotenv.config();

export const Db = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // ako ti pravi problem SSL, izbaci skroz ovu liniju
  ssl:
    process.env.DB_SSL_MODE === "REQUIRED"
      ? { rejectUnauthorized: false }
      : false,

  synchronize: true, // u dev-u: automatski pravi tabele
  logging: false,

  entities: [Receipt, ReceiptItem, AnalysisReport],
});

