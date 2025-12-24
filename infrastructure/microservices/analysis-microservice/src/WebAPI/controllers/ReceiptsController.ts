// src/WebAPI/controllers/ReceiptsController.ts
import { Router, Request, Response } from "express";
import { IReceiptService } from "../../Domain/services/IReceiptService";
import { CreateReceiptDto } from "../../Domain/DTOs/ReceiptDTO";

export class ReceiptsController {
  private router: Router;
  private receiptService: IReceiptService;

  constructor(receiptService: IReceiptService) {
    this.receiptService = receiptService;
    this.router = Router();
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private initializeRoutes() {
    // POST /api/v1/receipts
    this.router.post("/", this.createReceipt.bind(this));
    // GET /api/v1/receipts
    this.router.get("/", this.getAll.bind(this));
    this.router.get("/daily", this.getDaily.bind(this));
    this.router.get("/sales-by-product", this.getSalesByProduct.bind(this));
  }

  private async createReceipt(req: Request, res: Response) {
    try {
      const dto = req.body as CreateReceiptDto;

      if (!dto || !dto.stavke || dto.stavke.length === 0) {
        return res.status(400).json({ message: "Nema stavki u računu." });
      }

      const receipt = await this.receiptService.createReceipt(dto);
      return res.status(201).json(receipt);
    } catch (error) {
      console.error("[ReceiptsController] Error creating receipt:", error);
      return res
        .status(500)
        .json({ message: "Greška prilikom kreiranja računa." });
    }
  }
  private async getAll(req: Request, res: Response) {
    const data = await this.receiptService.getAllReceipts();
    res.json(data);
    }   

    private async getDaily(req: Request, res: Response) {
        const date = String(req.query.date);

        if (!date) {
            return res.status(400).json({ message: "Date query parameter required." });
        }

        const total = await this.receiptService.getDailyRevenue(date);
        res.json({ date, total });
    }

    private async getSalesByProduct(req: Request, res: Response) {
        const data = await this.receiptService.getSalesByProduct();
        res.json(data);
    }

}
