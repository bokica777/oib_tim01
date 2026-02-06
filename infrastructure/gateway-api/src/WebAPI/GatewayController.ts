import { Request, Response, Router } from "express";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { authenticate } from "../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../Middlewares/authorization/AuthorizeMiddleware";
import { buildInternalHeaders } from "../utils/buildInternalHeaders";
import { validateDTO } from "../Middlewares/validation/ValidationMiddleware";
import { ProcessRequestDTO } from "../Domain/DTOs/processing/ProcessRequesstDTO";
import { CreateOrderDTO } from "../Domain/DTOs/sales/CreateOrderDTO";
import { SendRequestDTO } from "../Domain/DTOs/storage/SendRequestDTO";
import { StorePackageDTO } from "../Domain/DTOs/storage/StorePackageDTO";
import { RunSimulationDTO } from "../Domain/DTOs/performance-analysis/RunSimulationDTO";
import { CreateReceiptDTO } from "../Domain/DTOs/analysis/CreateReceiptDTO";
import { authenticateOrGatewayKey } from "../Middlewares/authentification/authenticateOrGatewayKey";

export class GatewayController {
  private readonly router: Router;

  constructor(private readonly gatewayService: IGatewayService) {
    console.log("✅ [GATEWAY] GatewayController LOADED");
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/auth/google", this.oauthGoogleStart.bind(this));
    this.router.get("/auth/google/callback", this.oauthGoogleCallback.bind(this));

    this.router.get("/auth/facebook", this.oauthFacebookStart.bind(this));
    this.router.get("/auth/facebook/callback", this.oauthFacebookCallback.bind(this));

    // ================= AUTH =================
    this.router.post("/login", this.login.bind(this));
    this.router.post("/register", this.register.bind(this));

    // ================= USERS =================
    this.router.get("/users", authenticate, authorize("admin"), this.getAllUsers.bind(this));
    this.router.get("/users/me", authenticate, this.getCurrentUser.bind(this));

    this.router.get("/users/search", authenticate, authorize("admin"), this.searchUsers.bind(this));

    this.router.get("/users/:id", authenticate, this.getUserById.bind(this));

    this.router.post("/users", authenticate, authorize("admin"), this.createUser.bind(this));
    this.router.put("/users/:id", authenticate, authorize("admin"), this.updateUser.bind(this));
    this.router.delete("/users/:id", authenticate, authorize("admin"), this.deleteUser.bind(this));

    // ================= PRODUCTION =================
    this.router.get("/production/plants", authenticate, this.getPlants.bind(this));
    this.router.post("/production/plant", authenticate, this.plantNew.bind(this));
    this.router.post("/production/balance", authenticate, this.plantAndScale.bind(this));
    this.router.post("/production/harvest", authenticate, this.harvestMany.bind(this));
    this.router.put("/production/adjust/:id", authenticate, this.adjustStrength.bind(this));
    this.router.get("/production/logs", authenticate, this.getProductionLogs.bind(this));

    // ================= PROCESSING =================
    this.router.post(
      "/processing/process",
      authenticate,
      validateDTO(ProcessRequestDTO),
      this.processPerfume.bind(this)
    );
    this.router.get("/processing/perfumes", authenticate, this.listPerfumes.bind(this));
    this.router.get("/processing/perfumes/:id", authenticate, this.getPerfumeById.bind(this));
    this.router.post("/processing/perfumes/request", authenticate, this.requestPerfumes.bind(this));
    this.router.get("/processing/catalog", authenticate, this.listPerfumes.bind(this));

    this.router.get("/perfumes/all", authenticate, this.listPerfumes.bind(this));
    this.router.get("/perfumes", authenticate, this.listPerfumes.bind(this));
    this.router.get("/perfumes/:id", authenticate, this.getPerfumeById.bind(this));

    this.router.get("/catalog/perfumes", authenticate, this.listPerfumes.bind(this));

    // ================= STORAGE =================
    this.router.post("/storage/store", authenticate, validateDTO(StorePackageDTO), this.storePackage.bind(this));
    this.router.post("/storage/send", authenticate, validateDTO(SendRequestDTO), this.sendPackages.bind(this));
    this.router.get("/storage/packages", authenticate, this.listPackages.bind(this));
    this.router.get("/storage/warehouses", authenticate, this.listWarehouses.bind(this));

    // ================= PACKAGING =================
    this.router.post("/packaging/pack", authenticate, this.requestPackaging.bind(this));

    // ================= SALES =================
    this.router.post(
      "/sales/order",
      authenticate,
      authorize("seller", "sales_manager"),
      validateDTO(CreateOrderDTO),
      this.createOrder.bind(this)
    );

    this.router.get(
      "/sales/order/:id",
      authenticate,
      authorize("admin", "sales_manager", "seller"),
      this.getOrderById.bind(this)
    );

    this.router.get(
      "/sales/orders",
      authenticate,
      authorize("admin", "sales_manager"),
      this.listOrders.bind(this)
    );

    this.router.get(
      "/sales/products",
      authenticate,
      authorize("seller", "sales_manager", "admin"),
      this.listSalePackages.bind(this)
    );

    // ================= PERFORMANCE =================
    this.router.post(
      "/performance/simulate",
      authenticate,
      authorize("admin"),
      validateDTO(RunSimulationDTO),
      this.runSimulation.bind(this)
    );
    this.router.get("/performance/reports", authenticate, authorize("admin"), this.listPerformanceReports.bind(this));
    this.router.get(
      "/performance/reports/:id",
      authenticate,
      authorize("admin"),
      this.getPerformanceReportById.bind(this)
    );
    this.router.get(
      "/performance/reports/:id/pdf",
      authenticate,
      authorize("admin"),
      this.getPerformanceReportPdf.bind(this)
    );

    // ================= ANALYTICS =================
    this.router.get("/analysis/top-perfumes", authenticate, this.getTopPerfumes.bind(this));
    this.router.post("/receipts", authenticate, validateDTO(CreateReceiptDTO), this.createReceipt.bind(this));
    this.router.get("/analysis/sales-summary", authenticate, this.getSalesSummary.bind(this));
    this.router.get("/analysis/sales-trend", authenticate, this.getSalesTrend.bind(this));
    this.router.get("/analysis/top10-revenue", authenticate, this.getTop10Revenue.bind(this));

    this.router.get("/analysis/reports", authenticate, this.getReports.bind(this));
    this.router.get("/analysis/reports/:id/pdf", authenticate, this.downloadReportPdf.bind(this));

    this.router.post("/analysis/sales-report", authenticate, this.createSalesReport.bind(this));

    // ================= AUDIT =================
    this.router.post("/audit", authenticateOrGatewayKey, this.createAudit.bind(this));
    this.router.get("/audit", this.getAuditLogs.bind(this));

    console.log(
      "✅ [GATEWAY] ROUTES REGISTERED:",
      this.router.stack
        .filter((l: any) => l.route)
        .map((l: any) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`)
    );
  }

  private oauthGoogleStart(req: Request, res: Response) {
    const authBase = process.env.AUTH_SERVICE_API;
    if (!authBase) return res.status(500).json({ message: "AUTH_SERVICE_API not configured" });
    return res.redirect(`${authBase}/auth/google`);
  }

  private oauthGoogleCallback(req: Request, res: Response) {
    const authBase = process.env.AUTH_SERVICE_API;
    if (!authBase) return res.status(500).json({ message: "AUTH_SERVICE_API not configured" });

    const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
    const target = qs ? `${authBase}/auth/google/callback?${qs}` : `${authBase}/auth/google/callback`;

    return res.redirect(target);
  }

  private oauthFacebookStart(req: Request, res: Response) {
    const authBase = process.env.AUTH_SERVICE_API;
    if (!authBase) return res.status(500).json({ message: "AUTH_SERVICE_API not configured" });
    return res.redirect(`${authBase}/auth/facebook`);
  }

  private oauthFacebookCallback(req: Request, res: Response) {
    const authBase = process.env.AUTH_SERVICE_API;
    if (!authBase) return res.status(500).json({ message: "AUTH_SERVICE_API not configured" });

    const qs = req.originalUrl.includes("?") ? req.originalUrl.split("?")[1] : "";
    const target = qs ? `${authBase}/auth/facebook/callback?${qs}` : `${authBase}/auth/facebook/callback`;

    return res.redirect(target);
  }

  private async login(req: Request, res: Response): Promise<void> {
    const data: LoginUserDTO = req.body;

    try {
      const result: any = await this.gatewayService.login(data);
      const returnedToken = result?.token ?? result?.accessToken;

      if (returnedToken) {
        try {
          const decoded: any = require("jsonwebtoken").decode(returnedToken) ?? {};
          const claims = {
            id: decoded.id ?? decoded.userId ?? decoded.sub ?? decoded.user?.id,
            username: decoded.username ?? decoded.user?.username ?? decoded.userName ?? decoded.email,
            role: decoded.role ?? decoded.roles ?? (decoded.authorities && decoded.authorities[0]) ?? "user",
          };

          const secret = process.env.JWT_SECRET ?? "";
          const expiresIn = process.env.JWT_EXPIRES_IN ?? "30m";
          const jwt = require("jsonwebtoken");
          const token = jwt.sign({ id: claims.id, username: claims.username, role: claims.role }, secret, {
            expiresIn,
          });

          res.status(200).json({
            success: true,
            token,
            message: result.message ?? "OK",
            userData: { id: claims.id, username: claims.username, role: claims.role },
          });
          return;
        } catch (e) {
          console.warn("[GatewayController] failed to re-sign token, falling back to original token", e);
          res.status(200).json({ success: true, token: returnedToken, message: result.message ?? "OK" });
          return;
        }
      }

      if (result && result.authenificated && result.userData) {
        const claims = result.userData;
        const secret = process.env.JWT_SECRET ?? "";
        const expiresIn = process.env.JWT_EXPIRES_IN ?? "30m";
        const token = require("jsonwebtoken").sign(
          { id: claims.id, username: claims.username, role: claims.role },
          secret,
          { expiresIn }
        );
        res.status(200).json({ success: true, token, message: "OK", userData: claims });
        return;
      }

      res.status(200).json({ success: false, message: result?.message ?? "Authentication failed" });
      return;
    } catch (err: any) {
      if (err?.response?.data) {
        res.status(err.response?.status ?? 500).json({ success: false, ...err.response.data });
        return;
      }
      res.status(500).json({ success: false, message: err.message ?? "Internal server error" });
      return;
    }
  }

  private async register(req: Request, res: Response) {
    const result = await this.gatewayService.register(req.body as RegistrationUserDTO);
    res.json(result);
  }

  // ================= USERS =================
private async getAllUsers(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const users = await this.gatewayService.getAllUsers(headers);
    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Failed to fetch users" });
  }
}

private async getUserById(req: Request, res: Response) {
  try {
    const idParam = req.params.id;
    if (idParam === "me") return this.getCurrentUser(req, res);

    const id = Number(idParam);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const tokenRole = String(req.user?.role ?? "").toLowerCase();
    const tokenId = Number(req.user?.id);

    if (tokenRole !== "admin" && tokenId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const headers = buildInternalHeaders(req);
    const user = await this.gatewayService.getUserById(id, headers);
    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Failed to fetch user" });
  }
}

private async createUser(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const created = await this.gatewayService.createUser(req.body, headers);
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Create user failed" });
  }
}

private async updateUser(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    const updated = await this.gatewayService.updateUser(id, req.body, headers);
    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Update user failed" });
  }
}

private async deleteUser(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

    await this.gatewayService.deleteUser(id, headers);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Delete user failed" });
  }
}

private async searchUsers(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);

    const username = req.query.username ? String(req.query.username) : undefined;
    const email = req.query.email ? String(req.query.email) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;

    const users = await this.gatewayService.searchUsers({ username, email, role }, headers);
    return res.status(200).json(users);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ message: err?.message ?? "Search failed" });
  }
}

private async getCurrentUser(req: Request, res: Response) {
  try {
    const id = Number(req.user?.id);
    if (!id) return res.status(400).json({ message: "No user in token" });

    // buildInternalHeaders već tipično nosi Authorization, ali ostavljam i ovaj merge jer ti radi
    const headers = {
      ...buildInternalHeaders(req),
      ...(req.headers.authorization ? { Authorization: String(req.headers.authorization) } : {}),
    };

    const user = await this.gatewayService.getUserById(id, headers);
    return res.status(200).json(user);
  } catch (err: any) {
    return res
      .status(err?.response?.status ?? err?.status ?? 500)
      .json({ message: err?.message ?? "Internal error" });
  }
}

  // ================= AUDIT =================
  private async getAuditLogs(req: Request, res: Response) {
    try {
      const source = req.query.source ? String(req.query.source) : undefined;
      const headers = buildInternalHeaders(req);

      const data = await this.gatewayService.getAudits(source, headers);
      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  private async createAudit(req: Request, res: Response) {
    try {
      const forwarded = req.headers.authorization ?? undefined;
      const data = await this.gatewayService.createAudit(req.body, forwarded as string | undefined);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  // ================= PRODUCTION =================
  private async getPlants(req: Request, res: Response) {
    const count = Number(req.query.count ?? 1);
    const headers = buildInternalHeaders(req);
    const data = await this.gatewayService.getPlants(count, headers);
    res.json(data);
  }

  private async plantNew(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.plantNew(req.body, headers);
    res.status(201).json(result);
  }

  private async plantAndScale(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const { sourceStrength, factor } = req.body;

    const f = Number.isFinite(Number(factor)) ? Number(factor) : 65;

    const result = await this.gatewayService.plantAndScale(sourceStrength, f, headers);
    res.status(201).json(result);
  }

  private async harvestMany(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const { commonName, count } = req.body;

      const result = await this.gatewayService.harvestMany(commonName, count, headers);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ message: err.message ?? "Harvest failed" });
    }
  }

  private async harvestPlants(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const { commonName, count } = req.body;

      const result = await this.gatewayService.harvestMany(commonName, count, headers);
      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({ message: err.message ?? "Harvest failed" });
    }
  }

  private async adjustStrength(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const plantId = Number(req.params.id);

    const { value, commonName, mode } = req.body;

    if (!Number.isFinite(plantId)) {
      return res.status(400).json({ message: "Invalid plant id" });
    }

    if (!Number.isFinite(value)) {
      return res.status(400).json({ message: "Invalid value" });
    }

    const result = await this.gatewayService.adjustStrength(
      plantId,
      value,
      headers,
      commonName,
      mode === "scale" ? "scale" : "inc"
    );

    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message ?? "Failed to adjust strength" });
  }
}


  private async getProductionLogs(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const auditLogs = await this.gatewayService.getAudits("production", headers);
      res.status(200).json(auditLogs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  // ================= PROCESSING =================
  private async processPerfume(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.processPerfume(req.body, headers);
    res.status(201).json(result);
  }

  private async listPerfumes(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const list = await this.gatewayService.listPerfumes(headers);
    res.json(list);
  }

  private async getPerfumeById(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid perfume id" });
    }
    const p = await this.gatewayService.getPerfumeById(id, headers);
    res.json(p);
  }

  private async requestPerfumes(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.requestPerfumes(req.body.name, req.body.count, headers);
    res.json(result);
  }

  // ================= STORAGE =================
  private async storePackage(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);

      const body: any = req.body ?? {};

      if (!Array.isArray(body.perfumeIds) && body.perfumeId != null) {
        const pid = Number(body.perfumeId);
        body.perfumeIds = Number.isFinite(pid) ? [pid] : [];
      }
      delete body.perfumeId;

      const result = await this.gatewayService.storePackage(body, headers);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err?.status ?? 500).json({ message: err?.message ?? "Error" });
    }
  }


  private async sendPackages(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.sendPackages(req.user?.role, req.body.count, headers);
    res.json(result);
  }

  private async listPackages(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const list = await this.gatewayService.listPackages(headers);
    res.json(list);
  }

  private async listWarehouses(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const data = await this.gatewayService.listWarehouses(headers);
      res.status(200).json(data);
    } catch (err: any) {
      console.error("Gateway listWarehouses error:", err);
      res.status(err?.status ?? 500).json({ message: err?.message ?? "Failed to fetch warehouses" });
    }
  }

  // ================= PACKAGING =================
  private async requestPackaging(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    await this.gatewayService.requestPackaging(req.body.count, headers);
    res.status(204).send();
  }

  // ================= SALES =================
  private async createOrder(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const body = req.body || {};

      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ message: "Items array is required" });
      }

      for (const item of body.items) {
        if (typeof item.price !== "number" || !Number.isFinite(item.price)) {
          return res.status(400).json({
            message: `Item perfumeId ${item.perfumeId} is missing/invalid price. Ensure price is fetched from backend.`,
          });
        }
      }

      if (typeof body.totalPrice !== "number" || !Number.isFinite(body.totalPrice)) {
        return res.status(400).json({ message: "Total price is required" });
      }

      const sanitized = {
        customerName: String(body.customerName || ""),
        deliveryAddress: String(body.deliveryAddress || ""),
        items: body.items.map((it: any) => ({
          perfumeId: Number(it.perfumeId),
          price: Number(it.price),
          quantity: Number(it.quantity ?? 1),
          name: typeof it.name === "string" ? it.name : undefined,
        })),
        paymentType: String(body.paymentType || "GOTOVINA"),
        totalPrice: Number(body.totalPrice),
      };

      const order = await this.gatewayService.createOrder(sanitized, headers);

      const normalizePerfumeName = (name: string) => {
        return String(name ?? "")
          .replace(/\(?\s*\d+\s*ml\s*\)?/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const nameCache = new Map<number, string>();

      const getNameByPerfumeId = async (perfumeId: number): Promise<string> => {
        if (nameCache.has(perfumeId)) return nameCache.get(perfumeId)!;

        try {
          const p = await this.gatewayService.getProcessingPerfumeById(perfumeId, headers);
          const name = normalizePerfumeName(String(p?.name ?? `Perfume ${perfumeId}`));
          nameCache.set(perfumeId, name);
          return name;
        } catch (e) {
          const fallback = `Perfume ${perfumeId}`;
          nameCache.set(perfumeId, fallback);
          return fallback;
        }
      };

      const stavke = await Promise.all(
        sanitized.items.map(async (it: any) => {
          const perfumeId = Number(it.perfumeId);
          const nazivParfema = await getNameByPerfumeId(perfumeId);

          return {
            parfemId: perfumeId,
            nazivParfema,
            kolicina: Number(it.quantity ?? 1),
            jedinicnaCena: Number(it.price ?? 0),
          };
        })
      );

      const totalQty = sanitized.items.reduce(
        (sum: number, it: any) => sum + Number(it.quantity ?? 1), 0
      );

      const tipProdaje = totalQty > 3 ? "VELEPRODAJA" : "MALOPRODAJA";

      const receiptDto = {
        tipProdaje,
        nacinPlacanja: sanitized.paymentType as "GOTOVINA" | "RACUN" | "KARTICA",
        stavke,
      };

      console.log("[GATEWAY] receiptDto.stavke =", stavke.map((s) => s.nazivParfema));

      try {
        await this.gatewayService.createReceipt(receiptDto, headers);
      } catch (e: any) {
        console.warn("[Gateway] Receipt creation failed (order created OK):", e?.message ?? e);
      }

      res.status(201).json(order);
    } catch (err: any) {
      console.error("Gateway createOrder error:", err);
      res.status(err?.status ?? 500).json({ message: err?.message ?? "Failed to create order" });
    }
  }

  private async getOrderById(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const order = await this.gatewayService.getOrderById(Number(req.params.id), headers);
    res.json(order);
  }

  private async listOrders(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const list = await this.gatewayService.listOrders(headers);
    res.json(list);
  }

  private async listSalePackages(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const packages = await this.gatewayService.getSalePackages(headers);
      res.json(packages);
    } catch (err: any) {
      console.error("Error fetching sale packages:", err);
      res.status(err?.status ?? 500).json({ message: err?.message ?? "Failed to fetch sale packages" });
    }
  }

  // ================= PERFORMANCE =================
  private async runSimulation(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.runSimulation(req.body.algorithmName, headers);
    res.status(201).json(result);
  }

  private async listPerformanceReports(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.listPerformanceReports(headers);
    res.json(result);
  }

  private async getPerformanceReportById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid report id" });

    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getPerformanceReportById(id, headers);
    res.json(result);
  }

  private async getPerformanceReportPdf(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid report id" });

    const headers = buildInternalHeaders(req);
    const { buffer, contentType, filename } = await this.gatewayService.getPerformanceReportPdf(id, headers);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ================= ANALYTICS =================
  private async getTopPerfumes(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getTopPerfumes(req.query, headers);
    res.json(result);
  }

  private async createReceipt(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.createReceipt(req.body, headers);
    res.status(201).json(result);
  }

  private async getTop10Revenue(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getTop10Revenue(req.query, headers);
    res.json(result);
  }

  private async getSalesSummary(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getSalesSummary(req.query, headers);
    res.json(result);
  }

  private async getSalesTrend(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getSalesTrend(req.query, headers);
    res.json(result);
  }

  private async getReports(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.getReports(req.query, headers);
    res.json(result);
  }

  private async downloadReportPdf(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const id = Number(req.params.id);

      const fileBuffer = await this.gatewayService.downloadReportPdf(id, headers);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="izvestaj-${id}.pdf"`);
      res.send(fileBuffer);
    } catch (err: any) {
      return res.status(500).json({
        message: "Gateway PDF download failed",
        error: err?.message ?? String(err),
      });
    }
  }

  private async createSalesReport(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.createSalesReport(req.body, headers);
    res.status(201).json(result);
  }

  public getRouter(): Router {
    return this.router;
  }
}
