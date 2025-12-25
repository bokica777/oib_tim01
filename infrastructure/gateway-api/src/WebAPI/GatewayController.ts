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

export class GatewayController {
  private readonly router: Router;

  constructor(private readonly gatewayService: IGatewayService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Auth
    this.router.post("/login", this.login.bind(this));
    this.router.post("/register", this.register.bind(this));

    // Users
    this.router.get("/users", authenticate, authorize("admin"), this.getAllUsers.bind(this));
    this.router.get("/users/:id", authenticate, authorize("admin","seller"), this.getUserById.bind(this));

    // Production
    this.router.get("/production/plants", authenticate, authorize("admin","sales_manager","seller"), this.getPlants.bind(this));
    this.router.post("/production/balance", authenticate, authorize("admin","sales_manager"), this.plantAndScale.bind(this));

    // Processing
    this.router.post("/processing/process", authenticate, authorize("sales_manager","seller","admin"), validateDTO(ProcessRequestDTO), this.processPerfume.bind(this));
    this.router.get("/processing/perfumes", authenticate, authorize("sales_manager","seller","admin"), this.listPerfumes.bind(this));
    this.router.get("/processing/perfumes/:id", authenticate, authorize("sales_manager","seller","admin"), this.getPerfumeById.bind(this));
    this.router.post("/processing/perfumes/request", authenticate, authorize("sales_manager","seller","admin"), this.requestPerfumes.bind(this));

    // Storage
    this.router.post("/storage/store", authenticate, authorize("seller","sales_manager"), validateDTO(StorePackageDTO), this.storePackage.bind(this));
    this.router.post("/storage/send", authenticate, authorize("sales_manager","seller"), validateDTO(SendRequestDTO), this.sendPackages.bind(this));
    this.router.get("/storage/packages", authenticate, authorize("sales_manager","seller","admin"), this.listPackages.bind(this));

    // Packaging
    this.router.post("/packaging/pack", authenticate, authorize("sales_manager","seller"), this.requestPackaging.bind(this));

    // Sales
    this.router.post("/sales/order", authenticate, authorize("seller","sales_manager"), validateDTO(CreateOrderDTO), this.createOrder.bind(this));
    this.router.get("/sales/order/:id", authenticate, authorize("admin","sales_manager","seller"), this.getOrderById.bind(this));
    this.router.get("/sales/orders", authenticate, authorize("admin","sales_manager"), this.listOrders.bind(this));
  }

  // Auth handlers
  private async login(req: Request, res: Response): Promise<void> {
    const data: LoginUserDTO = req.body;
    const result = await this.gatewayService.login(data);
    res.status(200).json(result);
  }

  private async register(req: Request, res: Response): Promise<void> {
    const data: RegistrationUserDTO = req.body;
    const result = await this.gatewayService.register(data);
    res.status(200).json(result);
  }

  // Users
  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.gatewayService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (!req.user || req.user.id !== id) {
        res.status(401).json({ message: "You can only access your own data!" });
        return;
      }

      const user = await this.gatewayService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  // Production
  private async getPlants(req: Request, res: Response) {
    try {
      const count = Number(req.query.count ?? 1);
      if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: "Invalid count" });
      const headers = buildInternalHeaders(req);
      const data = await this.gatewayService.getPlants(count, headers);
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async plantAndScale(req: Request, res: Response) {
    try {
      const { sourceStrength, factor } = req.body;
      if (!Number.isFinite(sourceStrength)) return res.status(400).json({ message: "Invalid sourceStrength" });
      const f = Number.isFinite(Number(factor)) ? Number(factor) : 65;
      const headers = buildInternalHeaders(req);
      const data = await this.gatewayService.plantAndScale(sourceStrength, f, headers);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  // Processing
  private async processPerfume(req: Request, res: Response) {
    try {
      const dto = req.body;
      const headers = buildInternalHeaders(req);
      const produced = await this.gatewayService.processPerfume(dto, headers);
      res.status(201).json(produced);
    } catch (err) {
      await this.gatewayService.logAudit((err as Error).message, "ERROR", "gateway", { route: "/processing/process" });
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async listPerfumes(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const list = await this.gatewayService.listPerfumes(headers);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPerfumeById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const headers = buildInternalHeaders(req);
      const p = await this.gatewayService.getPerfumeById(id, headers);
      res.status(200).json(p);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async requestPerfumes(req: Request, res: Response) {
    try {
      const { name, count } = req.body;
      if (!name || !Number.isInteger(count) || count <= 0) return res.status(400).json({ message: "Invalid payload" });
      const headers = buildInternalHeaders(req);
      const reserved = await this.gatewayService.requestPerfumes(name, count, headers);
      res.status(200).json(reserved);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  // Storage
  private async storePackage(req: Request, res: Response) {
    try {
      const dto = req.body;
      const headers = buildInternalHeaders(req);
      const saved = await this.gatewayService.storePackage(dto, headers);
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async sendPackages(req: Request, res: Response) {
    try {
      const { count } = req.body;
      if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: "Invalid payload" });
      const role = req.user?.role;
      const headers = buildInternalHeaders(req);
      const sent = await this.gatewayService.sendPackages(role, count, headers);
      if (!sent || sent.length === 0) return res.status(404).json({ message: "No packages available" });
      res.status(200).json(sent);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async listPackages(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const list = await this.gatewayService.listPackages(headers);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  // Packaging
  private async requestPackaging(req: Request, res: Response) {
    try {
      const { count } = req.body;
      if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: "Invalid payload" });
      const headers = buildInternalHeaders(req);
      await this.gatewayService.requestPackaging(count, headers);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  // Sales
  private async createOrder(req: Request, res: Response) {
    try {
      const dto = req.body;
      const headers = buildInternalHeaders(req);
      const order = await this.gatewayService.createOrder(dto, headers);
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getOrderById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const headers = buildInternalHeaders(req);
      const order = await this.gatewayService.getOrderById(id, headers);
      res.status(200).json(order);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async listOrders(req: Request, res: Response) {
    try {
      const headers = buildInternalHeaders(req);
      const list = await this.gatewayService.listOrders(headers);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
