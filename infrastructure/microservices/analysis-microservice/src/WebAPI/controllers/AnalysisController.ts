import { Router, Request, Response } from "express";
import { IAnalysisService } from "../../Domain/services/IAnalysisService";
import { PdfReportFormatter } from "../../Services/PdfReportFormatter";
import { generateSalesAnalysisReportPdf } from "../../Services/SalesAnalysisReportPDF";
import PDFDocument from "pdfkit";

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

    // kreiranje PDF izveštaja (sales report)
    this.router.post("/sales-report", this.createSalesReport.bind(this));
    
  }

  private async getTopPerfumes(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;
      const type = req.query.type ? (String(req.query.type) as any) : undefined;

      const report = await this.analysisService.getTopPerfumes({ limit, from, to, type });
      return res.json(report);
    } catch (err) {
      console.error("[AnalysisController] getTopPerfumes error:", err);
      return res.status(500).json({ message: "Greška prilikom generisanja izveštaja." });
    }
  }

  private async getSalesSummary(req: Request, res: Response) {
    try {
      const groupBy = req.query.groupBy ? (String(req.query.groupBy) as any) : undefined;
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
      const granularity = req.query.granularity ? (String(req.query.granularity) as any) : undefined;

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

  /**
   * ✅ PDF download endpoint
   * Frontend očekuje Blob => ovde mora da bude application/pdf + Buffer
   */
private async getReportPdf(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Neispravan id." });

    const rep: any = await this.analysisService.getReportById(id);
    if (!rep) return res.status(404).json({ message: "Izveštaj nije pronađen." });

    // Ako JSON polja stignu kao string
    if (typeof rep.parametri === "string") {
      try { rep.parametri = JSON.parse(rep.parametri); } catch {}
    }
    if (typeof rep.rezultat === "string") {
      try { rep.rezultat = JSON.parse(rep.rezultat); } catch {}
    }

    // ---------- PDF helpers ----------
    const safeText = (v: any): string => {
      if (v === null || v === undefined) return "N/A";
      const s = String(v).trim();
      return s.length ? s : "N/A";
    };

    const fmtInt = (v: any): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "0";
      return String(Math.round(n));
    };

    const fmtNumber = (v: any, digits = 2): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "0";
      return n.toFixed(digits);
    };

    const fmtCurrency = (v: any): string => {
      const n = Number(v);
      if (!Number.isFinite(n)) return "0.00";
      return n.toFixed(2);
    };

    const pageBreakIfNeeded = (doc: any, minSpace = 80) => {
      // A4 height ~842, margin 50 => bottom around 792
      if (doc.y > 792 - minSpace) doc.addPage();
    };

    const rezultat = rep.rezultat ?? {};
    const meta = rezultat.meta ?? {};
    const kpis = rezultat.kpis ?? {};
    const trend = Array.isArray(rezultat.trend) ? rezultat.trend : [];
    const top10 = Array.isArray(rezultat.top10) ? rezultat.top10 : [];

    // ---------- Generate PDF (like performance microservice) ----------
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        const createdAt = rep.datumKreiranja ? new Date(rep.datumKreiranja) : null;
        const createdAtStr = createdAt ? createdAt.toLocaleString() : "N/A";

        // Header
        doc.fontSize(20).text("Sales Analysis Report", { align: "center" });
        doc.moveDown(0.4);
        doc.fontSize(10).text("Parfimerija O'Sinel De Or", { align: "center" });
        doc.moveDown(1.2);

        // Details
        doc.fontSize(12).text("Report Details", { underline: true });
        doc.moveDown(0.6);
        doc.fontSize(11).text(`Report ID: ${safeText(rep.id)}`);
        doc.text(`Type: ${safeText(rep.tipIzvestaja)}`);
        doc.text(`Created at: ${createdAtStr}`);
        doc.text(
          `Period: from ${safeText(meta.from)} to ${safeText(meta.to)} (groupBy: ${safeText(meta.groupBy)})`
        );
        doc.moveDown(1.2);

        // KPIs
        doc.fontSize(12).text("KPIs", { underline: true });
        doc.moveDown(0.6);
        doc.fontSize(11).text(`Total revenue: ${fmtCurrency(kpis.totalRevenue)}`);
        doc.text(`Total receipts: ${fmtInt(kpis.totalReceipts)}`);
        doc.text(`Total sold (all): ${fmtInt(kpis.totalSoldAll)}`);
        doc.text(`Avg daily sold: ${fmtNumber(kpis.avgDailySold, 2)}`);

        const bestDay = kpis.bestDay;
        if (bestDay) doc.text(`Best day: ${safeText(bestDay.date)} (qty: ${fmtInt(bestDay.qty)})`);
        else doc.text("Best day: N/A");

        doc.moveDown(1.2);

        // Trend table
        doc.fontSize(12).text("Trend", { underline: true });
        doc.moveDown(0.6);

        doc.fontSize(10);
        doc.text("Period", 50, doc.y, { continued: true });
        doc.text("Qty", 260, doc.y, { continued: true });
        doc.text("Revenue", 330, doc.y);
        doc.moveDown(0.3);

        for (const row of trend) {
          pageBreakIfNeeded(doc, 60);
          doc.text(safeText(row.t), 50, doc.y, { continued: true });
          doc.text(fmtInt(row.kolicina), 260, doc.y, { continued: true });
          doc.text(fmtCurrency(row.prihod), 330, doc.y);
        }

        doc.moveDown(1.2);

        // Top10 table
        doc.fontSize(12).text("Top 10 by Revenue", { underline: true });
        doc.moveDown(0.6);

        doc.fontSize(10);
        doc.text("Perfume", 50, doc.y, { continued: true });
        doc.text("Qty", 300, doc.y, { continued: true });
        doc.text("Revenue", 380, doc.y);
        doc.moveDown(0.3);

        for (const row of top10) {
          pageBreakIfNeeded(doc, 60);
          doc.text(safeText(row.naziv), 50, doc.y, { continued: true });
          doc.text(fmtInt(row.kolicina), 300, doc.y, { continued: true });
          doc.text(fmtCurrency(row.prihod), 380, doc.y);
        }

        doc.moveDown(1.4);
        doc.fontSize(9).text("Generated by Analysis Microservice", { align: "center" });

        doc.end();
      } catch (e) {
        reject(e);
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="analysis-report-${id}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err: any) {
    console.error("[AnalysisController] getReportPdf error:", err);
    return res.status(500).json({
      message: "Greška prilikom pripreme PDF formata.",
      error: err?.message ?? String(err),
    });
  }
}



  /**
   * ✅ Kreira novi Sales report (snima u bazu)
   * FIX: koristi this.analysisService umesto this.service
   */
  async createSalesReport(req: Request, res: Response) {
    try {
      const dto = req.body;

      // Kreira + snimi report u bazi i vrati ga (sa id)
      const created = await this.analysisService.createSalesReport(dto);

      return res.status(201).json(created);
    } catch (err: any) {
      return res.status(500).json({
        message: "Failed to create sales report",
        error: err?.message ?? String(err),
      });
    }
  }
}
