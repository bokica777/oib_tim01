import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "reflect-metadata";

import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";

import { ProductionService } from "./Services/ProductionService";
import { IProductionService } from "./Domain/services/IProductionService";

import { LogerService } from "./Services/LogerService";
import { ILogerService } from "./Domain/services/ILogerService";

import { Plant } from "./Domain/models/Plant";
import { Repository } from "typeorm";

import { ProductionController } from "./WebAPI/controllers/ProductionController";

dotenv.config();

const app = express();
app.use(express.json());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: (process.env.CORS_METHODS ?? "GET,POST,PUT,DELETE")
      .split(",")
      .map(m => m.trim()),
  })
);

// DB init
initialize_database();

// Repository
const plantRepo: Repository<Plant> = Db.getRepository(Plant);

// Services
const logger: ILogerService = new LogerService();
const productionService: IProductionService = new ProductionService(plantRepo);

// Controller
const productionController = new ProductionController(productionService, logger);

// Routes
app.use("/api/v1", productionController.getRouter());

export default app;
