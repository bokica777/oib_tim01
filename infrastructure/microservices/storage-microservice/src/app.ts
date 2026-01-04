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

// ================= CORS =================
const corsOrigin = process.env.GATEWAY_ORIGIN ?? process.env.CORS_ORIGIN ?? "http://localhost:5173";
const corsMethods = (process.env.CORS_METHODS ?? "GET,POST,PUT,DELETE,OPTIONS").split(",").map(s => s.trim());

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ================= DATABASE =================
initialize_database();

// ================= ROUTES =================
const storageController = new StorageController();

app.use("/api/v1", gatewayAuth, storageController.router);

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

export default app;
