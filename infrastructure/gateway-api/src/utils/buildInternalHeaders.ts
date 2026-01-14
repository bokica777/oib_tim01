import { Request } from "express";

export function buildInternalHeaders(req: Request): Record<string, string> {
  const gatewayKey = process.env.GATEWAY_SECRET;
  if (!gatewayKey) {
    console.error("[Gateway] GATEWAY_SECRET is not configured!");
    throw new Error("GATEWAY_SECRET not configured");
  }

  const headers: Record<string, string> = {
    "x-gateway-key": gatewayKey,
  };

  const id = req.user?.id;
  const role = req.user?.role;
  const username = req.user?.username;

  if (id !== undefined && id !== null) headers["x-user-id"] = String(id);
  if (role) headers["x-user-role"] = String(role);
  if (username) headers["x-user-name"] = String(username);

  // ***** NOVO: prosledjujemo i originalni Authorization ako postoji *****
  if (req.headers && req.headers.authorization) {
    const auth = String(req.headers.authorization);
    // forward raw bearer token so internal services can verify user identity if needed
    headers["authorization"] = auth;
  }

  return headers;
}

export default buildInternalHeaders;
