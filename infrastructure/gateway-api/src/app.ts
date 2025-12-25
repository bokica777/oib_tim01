import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "reflect-metadata";
import { IGatewayService } from "./Domain/services/IGatewayService";
import { GatewayService } from "./Services/GatewayService";
import { GatewayController } from "./WebAPI/GatewayController";

dotenv.config({ quiet: true });

const app = express();
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["POST"];

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

// Services
const gatewayService: IGatewayService = new GatewayService();

// Controller
const gatewayController = new GatewayController(gatewayService);
app.use('/api/v1', gatewayController.getRouter());

// Basic health
app.get('/health', (req, res) => res.json({ ok: true }));

export default app;
