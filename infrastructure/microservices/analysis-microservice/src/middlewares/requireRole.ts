import { Request, Response, NextFunction } from "express";

export function requireRole(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.headers["x-user-role"] as string | undefined)?.toUpperCase();
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role." });
    }
    next();
  };
}
