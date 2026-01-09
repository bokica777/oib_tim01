import { Router, Request, Response } from "express";
import { IAnalysisService } from "../../Domain/services/IAnalysisService";
import { PdfReportFormatter } from "../../Services/PdfReportFormatter";

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
    this.router.get("/sales-summary", this.getSalesSummary.bind(this));
    this.router.get("/sales-trend", this.getSalesTrend.bind(this));
    this.router.get("/top10-revenue", this.getTop10Revenue.bind(this));

    // pregled izvestaja
    this.router.get("/reports", this.listReports.bind(this));
    this.router.get("/reports/:id", this.getReportById.bind(this));
    this.router.get("/reports/:id/pdf", this.getReportPdf.bind(this));
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
  
  private async getSalesSummary(req: Request, res: Response) {
    try {
      const groupBy = req.query.groupBy ? String(req.query.groupBy) as any : undefined;
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      const report = await this.analysisService.getSalesSummary({ groupBy, from, to });
      return res.json(report);
    } catch (err) {
      console.error("[AnalysisController] getSalesSummary error:", err);
      return res.status(500).json({ message: "Greška prilikom generisanja sales summary." });
    }
  }

private async getSalesTrend(req: Request, res: Response) {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const granularity = req.query.granularity ? String(req.query.granularity) as any : undefined;

    const report = await this.analysisService.getSalesTrend({ from, to, granularity });
    return res.json(report);
  } catch (err) {
    console.error("[AnalysisController] getSalesTrend error:", err);
    return res.status(500).json({ message: "Greška prilikom generisanja izveštaja." });
  }
}

private async getTop10Revenue(req: Request, res: Response) {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    const report = await this.analysisService.getTop10RevenueSummary({ from, to });
    return res.json(report);
  } catch (err) {
    console.error("[AnalysisController] getTop10Revenue error:", err);
    return res.status(500).json({ message: "Greška prilikom generisanja izveštaja." });
  }
}

private async listReports(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const tipIzvestaja = req.query.tipIzvestaja ? String(req.query.tipIzvestaja) : undefined;

    const reports = await this.analysisService.listReports({ limit, offset, tipIzvestaja });
    return res.json(reports);
  } catch (err) {
    console.error("[AnalysisController] listReports error:", err);
    return res.status(500).json({ message: "Greška prilikom preuzimanja izveštaja." });
  }
}

private async getReportById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Nevalidan id." });

      const report = await this.analysisService.getReportById(id);
      if (!report) return res.status(404).json({ message: "Izveštaj nije pronađen." });

      return res.json(report);
    } catch (err) {
      console.error("[AnalysisController] getReportById error:", err);
      return res.status(500).json({ message: "Greška prilikom čitanja izveštaja." });
    }
  }
 private async getReportPdf(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Neispravan id." });

    const rep = await (this.analysisService as any).getReportById(id);
    if (!rep) return res.status(404).json({ message: "Izveštaj nije pronađen." });

    const pdfDoc = PdfReportFormatter.toPdfDocument(rep);
    return res.json(pdfDoc);
  } catch (err) {
    console.error("[AnalysisController] getReportPdf error:", err);
    return res.status(500).json({ message: "Greška prilikom pripreme PDF formata." });
  }
 }  
}
