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
import { requireRole } from "./middlewares/requireRole";


dotenv.config({ quiet: true });

const app = express();


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

const receiptRepository: Repository<Receipt> = Db.getRepository(Receipt);
const receiptItemRepository = Db.getRepository(ReceiptItem);
const reportRepository = Db.getRepository(AnalysisReport);


const receiptService: IReceiptService = new ReceiptService(
  receiptRepository
);
const analysisService: IAnalysisService = new AnalysisService(
  receiptItemRepository,
  reportRepository,
  receiptRepository
);



const receiptsController = new ReceiptsController(receiptService);
const analysisController = new AnalysisController(analysisService);


app.use(
  "/api/v1/receipts",
  requireRole(["ADMIN", "SELLER", "SALES_MANAGER"]),
  receiptsController.getRouter()
);
app.use("/api/v1/analysis",
  (req, _res, next) => {
    console.log("[ANALYSIS CHAIN HIT]", req.method, req.originalUrl);
    next();
  },
  requireRole(["ADMIN"]),
  analysisController.getRouter()
);


export default app;
