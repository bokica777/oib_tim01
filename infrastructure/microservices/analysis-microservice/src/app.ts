import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Repository } from "typeorm";

import { Db } from "./Database/DbConnectionPool";

import { Receipt } from "./Domain/models/Receipt";
import { IReceiptService } from "./Domain/services/IReceiptService";
import { ReceiptService } from "./Services/ReceiptService";
import { ReceiptsController } from "./WebAPI/controllers/ReceiptsController";
import { ReceiptItem } from "./Domain/models/ReceiptItem";
import { AnalysisReport } from "./Domain/models/AnalysisReport";
import { AnalysisService } from "./Services/AnalysisService";
import { IAnalysisService } from "./Domain/services/IAnalysisService";
import { AnalysisController } from "./WebAPI/controllers/AnalysisController";

dotenv.config({ quiet: true });

const app = express();


// CORS iz .env
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map((m) => m.trim()) ??
  ["GET", "POST", "PUT", "DELETE"];

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
  })
);

app.use(express.json());


// ❌ Više ne zovemo initialize_database() ovde
// DB se inicijalizuje u index.ts preko Db.initialize()

// ORM Repositories
const receiptRepository: Repository<Receipt> = Db.getRepository(Receipt);
const receiptItemRepository = Db.getRepository(ReceiptItem);
const reportRepository = Db.getRepository(AnalysisReport);

// Services
const receiptService: IReceiptService = new ReceiptService(
  receiptRepository
);
const analysisService: IAnalysisService = new AnalysisService(
  receiptItemRepository, reportRepository
);



// WebAPI controllers
const receiptsController = new ReceiptsController(receiptService);
const analysisController = new AnalysisController(analysisService);

// Registering routes
app.use("/api/v1/receipts", receiptsController.getRouter());
app.use("/api/v1/analysis", analysisController.getRouter());

export default app;
