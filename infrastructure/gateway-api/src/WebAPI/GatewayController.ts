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
import { CreateAuditLogDTO } from "../Domain/DTOs/event-log/CreateAuditLog";
import { CreateReceiptDTO } from "../Domain/DTOs/analysis/CreateReceiptDTO";

export class GatewayController {
  private readonly router: Router;

  constructor(private readonly gatewayService: IGatewayService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // ================= AUTH =================
    this.router.post("/login", this.login.bind(this));
    this.router.post("/register", this.register.bind(this));

    // ================= USERS =================
    this.router.get(
      "/users",
      authenticate,
      authorize("admin"),
      this.getAllUsers.bind(this)
    );

    this.router.get(
      "/users/:id",
      authenticate,
      authorize("admin", "seller"),
      this.getUserById.bind(this)
    );

    // ================= PRODUCTION =================
    this.router.get(
      "/production/plants",
      authenticate,
      authorize("admin", "sales_manager", "seller"),
      this.getPlants.bind(this)
    );

    // frontend "zasadi biljku"
    this.router.post(
      "/production/plant",
      authenticate,
      authorize("admin", "sales_manager", "seller"),
      this.plantNew.bind(this)
    );

    // balans aroma
    this.router.post(
      "/production/balance",
      authenticate,
      authorize("admin", "sales_manager", "seller"),
      this.plantAndScale.bind(this)
    );

    this.router.post(
    "/production/harvest",
    authenticate,
    authorize("admin", "sales_manager", "seller"),
    this.harvestMany.bind(this)
  );


    this.router.get(
      "/production/logs",
      authenticate,
      authorize("admin", "sales_manager", "seller"),
      this.getProductionLogs.bind(this)
);

    this.router.post(
      "/production/harvest",
      authenticate,
      authorize("sales_manager", "seller"),
      this.harvestPlants.bind(this)
);



    // ================= PROCESSING =================
    this.router.post(
      "/processing/process",
      authenticate,
      authorize("sales_manager", "seller", "admin"),
      validateDTO(ProcessRequestDTO),
      this.processPerfume.bind(this)
    );

    this.router.get(
      "/processing/perfumes",
      authenticate,
      authorize("sales_manager", "seller", "admin"),
      this.listPerfumes.bind(this)
    );

    this.router.get(
      "/processing/perfumes/:id",
      authenticate,
      authorize("sales_manager", "seller", "admin"),
      this.getPerfumeById.bind(this)
    );

    this.router.post(
      "/processing/perfumes/request",
      authenticate,
      authorize("sales_manager", "seller", "admin"),
      this.requestPerfumes.bind(this)
    );

    // ================= STORAGE =================
    this.router.post(
      "/storage/store",
      authenticate,
      authorize("seller", "sales_manager"),
      validateDTO(StorePackageDTO),
      this.storePackage.bind(this)
    );

    this.router.post(
      "/storage/send",
      authenticate,
      authorize("sales_manager", "seller"),
      validateDTO(SendRequestDTO),
      this.sendPackages.bind(this)
    );

    this.router.get(
      "/storage/packages",
      authenticate,
      authorize("sales_manager", "seller", "admin"),
      this.listPackages.bind(this)
    );

    // ================= PACKAGING =================
    this.router.post(
      "/packaging/pack",
      authenticate,
      authorize("sales_manager", "seller"),
      this.requestPackaging.bind(this)
    );

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

    // ================= PERFORMANCE =================
    this.router.post(
      "/performance/simulate",
      authenticate,
      authorize("admin", "sales_manager"),
      validateDTO(RunSimulationDTO),
      this.runSimulation.bind(this)
    );

    // ================= ANALYTICS =================
    this.router.get(
      "/analysis/top-perfumes",
      authenticate,
      authorize("admin", "sales_manager"),
      this.getTopPerfumes.bind(this)
    );

    this.router.post(
      "/receipts",
      authenticate,
      authorize("seller", "sales_manager", "admin"),
      validateDTO(CreateReceiptDTO),
      this.createReceipt.bind(this)
    );
  }

  // Auth handlers
private async login(req: Request, res: Response): Promise<void> {
  const data: LoginUserDTO = req.body;
  try {
    const result: any = await this.gatewayService.login(data);

   if (result && (result.token || result.accessToken)) {
      const token = result.token ?? result.accessToken;
      res.status(200).json({ success: true, token, message: result.message ?? "OK" });
      return;
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
    const result = await this.gatewayService.register(req.body);
    res.json(result);
  }

  // ================= USERS =================
  private async getAllUsers(req: Request, res: Response) {
    const users = await this.gatewayService.getAllUsers();
    res.json(users);
  }

  private async getUserById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await this.gatewayService.getUserById(id);
    res.json(user);
  }

  // ================= PRODUCTION =================
  private async getPlants(req: Request, res: Response) {
    const count = Number(req.query.count ?? 1);
    const headers = buildInternalHeaders(req);
    const data = await this.gatewayService.getPlants(count, headers);
    res.json(data);
  }

  /**
   * FRONTEND: POST /production/plant
   * Interno mapirano na plantAndScale
   */
 private async plantNew(req: Request, res: Response) {
  const headers = buildInternalHeaders(req);

  const result = await this.gatewayService.plantNew(
    req.body,
    headers
  );

  res.status(201).json(result);
}

  private async plantAndScale(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const { sourceStrength, factor } = req.body;

    const f = Number.isFinite(Number(factor)) ? Number(factor) : 65;

    const result = await this.gatewayService.plantAndScale(
      sourceStrength,
      f,
      headers
    );

    res.status(201).json(result);
  }

  private async harvestMany(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const { commonName, count } = req.body;

      const result = await this.gatewayService.harvestMany(
        commonName,
        count,
        headers
      );

      res.json(result);
    } catch (err: any) {
      res.status(err.status ?? 500).json({
        message: err.message ?? "Harvest failed",
      });
    }
 }

 private async harvestPlants(req: Request, res: Response) {
  try {
    const headers = buildInternalHeaders(req);
    const { commonName, count } = req.body;

    const result = await this.gatewayService.harvestMany(
      commonName,
      count,
      headers
    );

    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({
      message: err.message ?? "Harvest failed",
    });
  }
}

  // ================= PRODUCTION LOGS =================
  private async getProductionLogs(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const logs = await this.gatewayService.getProductionLogs(headers);
      res.json(logs);
    } catch (err: any) {
      res.status(err.status ?? 500).json({
        message: err.message ?? "Failed to fetch production logs",
      });
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
    const p = await this.gatewayService.getPerfumeById(
      Number(req.params.id),
      headers
    );
    res.json(p);
  }

  private async requestPerfumes(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.requestPerfumes(
      req.body.name,
      req.body.count,
      headers
    );
    res.json(result);
  }

  // ================= STORAGE =================
  private async storePackage(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.storePackage(req.body, headers);
    res.status(201).json(result);
  }

  private async sendPackages(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.sendPackages(
      req.user?.role,
      req.body.count,
      headers
    );
    res.json(result);
  }

  private async listPackages(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const list = await this.gatewayService.listPackages(headers);
    res.json(list);
  }

  // ================= PACKAGING =================
  private async requestPackaging(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    await this.gatewayService.requestPackaging(req.body.count, headers);
    res.status(204).send();
  }

  // ================= SALES =================
  private async createOrder(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const order = await this.gatewayService.createOrder(req.body, headers);
    res.status(201).json(order);
  }

  private async getOrderById(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const order = await this.gatewayService.getOrderById(
      Number(req.params.id),
      headers
    );
    res.json(order);
  }

  private async listOrders(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const list = await this.gatewayService.listOrders(headers);
    res.json(list);
  }

  // ================= PERFORMANCE =================
  private async runSimulation(req: Request, res: Response) {
    const headers = buildInternalHeaders(req);
    const result = await this.gatewayService.runSimulation(
      req.body.algorithmName,
      headers
    );
    res.status(201).json(result);
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

  public getRouter(): Router {
    return this.router;
  }
}
