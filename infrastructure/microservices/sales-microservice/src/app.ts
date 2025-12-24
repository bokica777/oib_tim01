import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initialize_database } from "./Database/InitializeConnection";
import { SalesController } from "./WebAPI/controllers/SalesController";
import { gatewayAuth } from "./middleware/GatewayAuth";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: process.env.GATEWAY_ORIGIN ?? process.env.CORS_ORIGIN,
  methods: process.env.CORS_METHODS?.split(",")
}));

initialize_database();

app.use("/api/v1", gatewayAuth, new SalesController().router);

app.get("/health", (_, res) => res.json({ ok: true }));

export default app;