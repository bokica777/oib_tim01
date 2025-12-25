import { Request } from "express";

export function buildInternalHeaders(req: Request): Record<string,string> {
  const gatewayKey = process.env.GATEWAY_SECRET ?? "";
  const id = req.user?.id;
  const role = req.user?.role;
  const username = req.user?.username;
  const headers: Record<string,string> = {
    "x-gateway-key": gatewayKey
  };
  if (id !== undefined) headers["x-user-id"] = String(id);
  if (role !== undefined) headers["x-user-role"] = String(role);
  if (username !== undefined) headers["x-user-name"] = String(username);
  return headers;
}
