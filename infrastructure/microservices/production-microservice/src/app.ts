// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "reflect-metadata";
import { initialize_database } from "./Database/InitializeConnection";
import { Db } from "./Database/DbConnectionPool";
import { ProductionService } from "./Services/ProductionService";
import { LogerService } from "./Services/LogerService";
import { ProductionController } from "./WebAPI/controllers/ProductionController";
import { Plant } from "./Domain/models/Plant";
import { gatewayAuth } from "./middleware/GatewayAuth";
import { validateDTO } from "./middleware/ValidationMiddleware";
import { PlantDTO } from "./Domain/DTOs/PlantDTO";

dotenv.config();
const app = express();
app.use(express.json());

const corsOrigin = process.env.GATEWAY_ORIGIN ?? process.env.CORS_ORIGIN ?? "http://localhost:4000";
const corsMethods = (process.env.CORS_METHODS ?? "GET,POST,PUT,DELETE").split(",").map(s => s.trim());
app.use(cors({ origin: corsOrigin, methods: corsMethods }));

initialize_database();

const plantRepo = Db.getRepository(Plant);
const logger = new LogerService();
const productionService = new ProductionService(plantRepo);
const productionController = new ProductionController(productionService, logger);

// Attach middleware: all /api/v1 routes must come from gateway
app.use("/api/v1", gatewayAuth, productionController.getRouter());

// Example: protect client facing health
app.get("/health", (req, res) => res.json({ ok: true }));

export default app;
