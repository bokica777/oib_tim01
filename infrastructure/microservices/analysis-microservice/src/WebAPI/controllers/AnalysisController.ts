import { Router, Request, Response } from "express";
import { IAnalysisService } from "../../Domain/services/IAnalysisService";

export class AnalysisController {
  private router: Router;

  constructor(private readonly analysisService: IAnalysisService) {
    this.router = Router();
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private initializeRoutes(): void {
    // GET /api/v1/analysis/top-perfumes?limit=10&from=YYYY-MM-DD&to=YYYY-MM-DD&type=quantity|revenue
    this.router.get("/top-perfumes", this.getTopPerfumes.bind(this));
  }

  private async getTopPerfumes(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;
      const type = req.query.type ? String(req.query.type) as any : undefined;

      const report = await this.analysisService.getTopPerfumes({ limit, from, to, type });
      return res.json(report);
    } catch (err) {
      console.error("[AnalysisController] getTopPerfumes error:", err);
      return res.status(500).json({ message: "Greška prilikom generisanja izveštaja." });
    }
  }
}
