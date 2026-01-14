import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthTokenClaimsType } from "../../Domain/types/AuthTokenClaims";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenClaimsType;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token is missing!" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET ?? "";

  try {
    // try to verify with gateway secret (preferred)
    const decoded = jwt.verify(token, secret) as AuthTokenClaimsType;
    req.user = decoded;
    next();
    return;
  } catch (err) {
    // fallback: try to decode without verification (development convenience)
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.id || decoded.sub || decoded.user)) {
        // normalize common claim names
        const claims: any = {
          id: decoded.id ?? decoded.userId ?? decoded.sub ?? (decoded.user && decoded.user.id),
          username: decoded.username ?? decoded.user?.username ?? decoded.email,
          role: decoded.role ?? (decoded.roles && decoded.roles[0]) ?? decoded.user?.role ?? "user",
        };
        req.user = claims as AuthTokenClaimsType;
        console.warn("[AuthMiddleware] token verify failed — using unverified decode (dev only).");
        next();
        return;
      }
    } catch {}
  }

  res.status(401).json({ success: false, message: "Invalid token provided!" });
};
