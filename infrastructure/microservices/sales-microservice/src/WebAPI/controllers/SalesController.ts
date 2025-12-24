import { Router, Request, Response } from "express";
import { Db } from "../../Database/DbConnectionPool";
import { SalesService } from "../../Services/SalesService";
import { SaleOrder } from "../../Domain/models/SaleOrder";
import { validateDTO } from "../../middleware/ValidationMiddleware";
import { CreateOrderDTO } from "../../Domain/DTOs/CreateOrderDTO";
import { LogerService } from "../../Services/LogerService";

export class SalesController {
  public router = Router();
  private service: SalesService;
  private logger = new LogerService();

  constructor() {
    const repo = Db.getRepository(SaleOrder);
    this.service = new SalesService(repo);
    this.routes();
  }

  private routes() {
    this.router.post("/order", validateDTO(CreateOrderDTO), this.createOrder.bind(this));
    this.router.get("/order/:id", this.getOrder.bind(this));
    this.router.get("/orders", this.getAll.bind(this));
  }

  private async createOrder(req: Request, res: Response) {
    try {
      const { customerName, deliveryAddress, count } = req.body;
      const role = req.user?.role;

      const order = await this.service.createOrder(customerName, deliveryAddress, count, role);

      await this.logger.log(
        `Order created id=${order.id} for ${customerName}`, 
        "INFO"
      );

      res.status(201).json(order);
    } catch (err: any) {
      await this.logger.log(err.message, "ERROR");
      res.status(400).json({ message: err.message });
    }
  }

  private async getOrder(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const order = await this.service.getOrderById(id);
      res.status(200).json(order);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  private async getAll(req: Request, res: Response) {
    const list = await this.service.listOrders();
    res.status(200).json(list);
  }
}
