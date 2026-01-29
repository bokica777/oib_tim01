import express from "express";
import cors from "cors";
import "reflect-metadata";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Repository } from "typeorm";

import { initialize_database } from "./Database/InitializeConnection";
import { User } from "./Domain/models/User";
import { Db } from "./Database/DbConnectionPool";
import { IAuthService } from "./Domain/services/IAuthService";
import { AuthService } from "./Services/AuthService";
import { AuthController } from "./WebAPI/controllers/AuthController";
import { ILogerService } from "./Domain/services/ILogerService";
import { LogerService } from "./Services/LogerService";
import { configurePassport } from "./WebAPI/auth/passport";

dotenv.config({ quiet: true });

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods =
  process.env.CORS_METHODS?.split(",").map((m) => m.trim()) ?? ["POST"];

app.use(
  cors({
    origin: corsOrigin,
    methods: corsMethods,
    credentials: true,
  })
);

app.use(express.json());

initialize_database();

const userRepository: Repository<User> = Db.getRepository(User);

configurePassport(userRepository);

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev_session_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authService: IAuthService = new AuthService(userRepository);
const logerService: ILogerService = new LogerService();

const authController = new AuthController(authService, logerService);

app.use("/api/v1", authController.getRouter());

export default app;
