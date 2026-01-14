// src/Middlewares/authentification/authenticateOrGatewayKey.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateOrGatewayKey = (req: Request, res: Response, next: NextFunction) => {
  const gatewayKey = (req.headers["x-gateway-key"] as string | undefined) ?? "";
  const expected = process.env.GATEWAY_SECRET ?? "";

  if (gatewayKey && expected && gatewayKey === expected) {
    // allow internal call; set req.user from forwarded x-user-* headers if present
    const id = Number(req.headers["x-user-id"] as string | undefined) || undefined;
    const role = (req.headers["x-user-role"] as string | undefined) || undefined;
    const username = (req.headers["x-user-name"] as string | undefined) || undefined;
    (req as any).user = { id, role, username };
    return next();
  }

  // fallback: normal JWT auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");
    (req as any).user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
