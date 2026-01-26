import { Request, Response, NextFunction } from "express";

function normalizeRole(r: string) {
  return r.replace(/^ROLE_/i, "").trim().toUpperCase();
}

export function requireRole(allowed: string[]) {
  const allowedNorm = allowed.map((x) => normalizeRole(String(x)));

  return (req: Request, res: Response, next: NextFunction) => {
    const raw = String(req.headers["x-user-role"] ?? "");
    const role = normalizeRole(raw);

    if (!role || !allowedNorm.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role." });
    }

    next();
  };
}
