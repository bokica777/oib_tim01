import { Request, Response, NextFunction } from "express";

export function requireGateway(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const gatewayKey = req.headers["x-gateway-key"];

    if (!gatewayKey || gatewayKey !== process.env.GATEWAY_SECRET) {
        return res.status(401).json({ message: "Unauthorized (not from gateway)" });
    }

    next();
}

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const role = String(req.headers["x-user-role"] || "").toUpperCase();

    if (role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden (admin only)" });
    }

    next();
}
