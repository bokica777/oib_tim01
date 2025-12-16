import { Request, Response, NextFunction } from "express";

export interface GatewayUser {
  id?: number;
  username?: string;
  role?: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

export function gatewayAuth(req: Request, res: Response, next: NextFunction) {
  const gatewayKey = (req.headers["x-gateway-key"] as string | undefined) ?? "";
  const expected = process.env.GATEWAY_SECRET ?? "";
  if (!expected) {
    return res.status(500).json({ message: "GATEWAY_SECRET not configured" });
  }
  if (!gatewayKey || gatewayKey !== expected) {
    return res.status(401).json({ message: "Unauthorized - invalid gateway key" });
  }

  const id = Number(req.headers["x-user-id"] as string | undefined) || undefined;
  const role = (req.headers["x-user-role"] as string | undefined) || undefined;
  const username = (req.headers["x-user-name"] as string | undefined) || undefined;
  req.user = { id, role, username };
  next();
}

export function requireRoles(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return res.status(403).json({ message: "Forbidden - role missing" });
    if (!allowed.includes(role)) return res.status(403).json({ message: "Forbidden - role not allowed" });
    next();
  };
}
