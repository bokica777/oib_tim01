import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { Repository } from "typeorm";
import { AuditLog } from "./Domain/models/AuditLog";
import { AuditLogController  } from "./WebAPI/controllers/AuditLogController";
import { AuditLogService} from "./Services/AuditLogService";

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: process.env.CORS_METHODS?.split(",") ?? ["GET", "POST"],
  })
);

initialize_database();

const auditRepo: Repository<AuditLog> = Db.getRepository(AuditLog);
const auditService = new AuditLogService(auditRepo);
const auditController = new AuditLogController(auditService);
 
app.use("/api/v1/audit", auditController.getRouter());

export default app;
