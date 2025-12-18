// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "reflect-metadata";
import { initialize_database } from "./Database/InitializeConnection";
import { StorageController } from "./WebAPI/controllers/StorageController";
import { gatewayAuth } from "./middleware/GatewayAuth";

dotenv.config();
const app = express();
app.use(express.json());

const corsOrigin = process.env.GATEWAY_ORIGIN ?? process.env.CORS_ORIGIN ?? "http://localhost:4000";
const corsMethods = (process.env.CORS_METHODS ?? "GET,POST,PUT,DELETE").split(",").map(s => s.trim());
app.use(cors({ origin: corsOrigin, methods: corsMethods }));

initialize_database();

const storageController = new StorageController();
app.use("/api/v1", gatewayAuth, storageController.router);

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

export default app;
