import { Request, Response, NextFunction } from "express";

export const authorize = (...dozvoljeneUloge: string[]) => {
  const allowed = dozvoljeneUloge.map(r => r.toLowerCase());
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    if (!allowed.includes(role.toLowerCase())) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    next();
  };
};
