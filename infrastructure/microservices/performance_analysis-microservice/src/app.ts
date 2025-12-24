import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { Repository } from "typeorm";
import { PerformanceReport } from "./Domain/models/PerformanceReport";
import { IPerformanceAnalysisService } from "./Domain/services/IPerformanceAnalysisService";
import { PerformanceAnalysisController } from "./WebAPI/controllers/PerformanceAnalysisController";
import { PerformanceAnalysisService } from "./Services/PerfomanceAnalysisService";

dotenv.config({ quiet: true });

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map((m) => m.trim()) ?? [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ];

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
  })
);

app.use(express.json());

initialize_database();

const performanceReportRepository: Repository<PerformanceReport> = Db.getRepository(PerformanceReport);

const performanceService: IPerformanceAnalysisService = new PerformanceAnalysisService(performanceReportRepository);

const performanceController = new PerformanceAnalysisController( performanceService );

app.use("/api/v1/performance", performanceController.getRouter());

export default app;
