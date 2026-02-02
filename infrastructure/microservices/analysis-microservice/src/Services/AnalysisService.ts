import { Repository } from "typeorm";
import { IAnalysisService, ListReportsQuery, TopPerfumesQuery, SalesSummaryQuery, SalesTrendQuery, DateRangeQuery } from "../Domain/services/IAnalysisService";
import { ReceiptItem } from "../Domain/models/ReceiptItem";
import { AnalysisReport } from "../Domain/models/AnalysisReport";
import { Receipt } from "../Domain/models/Receipt";

export class AnalysisService implements IAnalysisService {
  constructor(
    private readonly receiptItemRepository: Repository<ReceiptItem>,
    private readonly reportRepository: Repository<AnalysisReport>,
    private readonly receiptRepository: Repository<Receipt>
  ) {}

  public async getTopPerfumes(query: TopPerfumesQuery): Promise<AnalysisReport> {
    const limit = Number.isFinite(Number(query.limit)) ? Math.max(1, Number(query.limit)) : 10;
    const type = query.type ?? "revenue";
    const from = query.from;
    const to = query.to;

    const qb = this.receiptItemRepository
      .createQueryBuilder("s")
      .leftJoin("s.racun", "r");

    if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
    if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

    qb.select("s.nazivParfema", "nazivParfema")
      .addSelect("SUM(s.kolicina)", "kolicina")
      .addSelect("SUM(s.ukupno)", "prihod")
      .groupBy("s.nazivParfema");

    if (type === "quantity") {
      qb.orderBy("kolicina", "DESC");
    } else {
      qb.orderBy("prihod", "DESC");
    }

    qb.limit(limit);

    const rows = await qb.getRawMany();

    const report = new AnalysisReport();
    report.tipIzvestaja = "TOP_PERFUMES";
    report.parametri = { limit, type, from: from ?? null, to: to ?? null };
    report.rezultat = rows;

    const saved = await this.reportRepository.save(report);
    return saved;
  }

  public async getSalesSummary(query: SalesSummaryQuery): Promise<AnalysisReport> {
  const from = query.from;
  const to = query.to;
  const groupBy = query.groupBy ?? "total";

  const qb = this.receiptRepository.createQueryBuilder("r");

  if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

  qb.select("SUM(r.ukupanIznos)", "prihod")
    .addSelect("COUNT(r.id)", "brojRacuna");

  if (groupBy === "month") {
    qb.addSelect("DATE_FORMAT(r.datumVreme, '%Y-%m')", "period")
      .groupBy("period")
      .orderBy("period", "ASC");
  } else if (groupBy === "year") {
    qb.addSelect("YEAR(r.datumVreme)", "period")
      .groupBy("period")
      .orderBy("period", "ASC");
  } else if (groupBy === "week") {
    qb.addSelect("DATE_FORMAT(r.datumVreme, '%x-%v')", "period")
      .groupBy("period")
      .orderBy("period", "ASC");
  }

  const rows = groupBy === "total" ? [await qb.getRawOne()] : await qb.getRawMany();

  return await this.saveReport(
    "SALES_SUMMARY",
    { groupBy, from: from ?? null, to: to ?? null },
    rows
  );
}

public async getSalesTrend(query: SalesTrendQuery): Promise<AnalysisReport> {
  const from = query.from;
  const to = query.to;
  const granularity = query.granularity ?? "day";

  const qb = this.receiptRepository.createQueryBuilder("r")
    .leftJoin("r.stavke", "i"); 

  if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

  qb.select("COALESCE(SUM(i.ukupno), 0)", "prihod")         
    .addSelect("COUNT(DISTINCT r.id)", "brojRacuna")          
    .addSelect("COALESCE(SUM(i.kolicina), 0)", "kolicina");     

  if (granularity === "month") {
    qb.addSelect("DATE_FORMAT(r.datumVreme, '%Y-%m')", "t")
      .groupBy("t")
      .orderBy("t", "ASC");
  } else if (granularity === "week") {
    qb.addSelect("DATE_FORMAT(r.datumVreme, '%x-%v')", "t")
      .groupBy("t")
      .orderBy("t", "ASC");
  } else {
    qb.addSelect("DATE(r.datumVreme)", "t")
      .groupBy("t")
      .orderBy("t", "ASC");
  }

  const rows = await qb.getRawMany();

  return await this.saveReport(
    "SALES_TREND",
    { granularity, from: from ?? null, to: to ?? null },
    rows
  );
}

  public async getTop10RevenueSummary(query: DateRangeQuery): Promise<AnalysisReport> {
  const from = query.from;
  const to = query.to;

  const qb = this.receiptItemRepository
    .createQueryBuilder("s")
    .leftJoin("s.racun", "r");

  if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

  const top10 = await qb
    .select("s.nazivParfema", "nazivParfema")
    .addSelect("SUM(s.kolicina)", "kolicina")
    .addSelect("SUM(s.ukupno)", "prihod")
    .groupBy("s.nazivParfema")
    .orderBy("kolicina", "DESC")
    .limit(10)
    .getRawMany();

  const totalRevenueTop10 = top10.reduce((sum, r) => sum + Number(r.prihod ?? 0), 0);

  const result = { top10, totalRevenueTop10 };

  return await this.saveReport(
    "TOP10_REVENUE_SUMMARY",
    { from: from ?? null, to: to ?? null },
    result
  );
}
  
  public async listReports(query: ListReportsQuery): Promise<AnalysisReport[]> {
  const limit = Number.isFinite(Number(query.limit)) ? Math.min(200, Math.max(1, Number(query.limit))) : 50;
  const offset = Number.isFinite(Number(query.offset)) ? Math.max(0, Number(query.offset)) : 0;

  const qb = this.reportRepository.createQueryBuilder("rep")
    .orderBy("rep.datumKreiranja", "DESC")
    .take(limit)
    .skip(offset);

  if (query.tipIzvestaja) {
    qb.where("rep.tipIzvestaja = :t", { t: query.tipIzvestaja });
  }

  return await qb.getMany();
  }

  public async getReportById(id: number): Promise<AnalysisReport | null> {
  return await this.reportRepository.findOne({ where: { id } });
  }

   async getReportPdf(id: number): Promise<Buffer> {
    throw new Error("Not implemented here");
  }

  private async saveReport(tipIzvestaja: string, parametri: any, rezultat: any) {
    const report = new AnalysisReport();
    report.tipIzvestaja = tipIzvestaja;
    report.parametri = parametri;
    report.rezultat = rezultat;
    return await this.reportRepository.save(report);
  }

  public async createSalesReport(dto: { groupBy: string; from: string; to: string }) {
  const from = dto?.from ?? null;
  const to = dto?.to ?? null;
  const groupBy = dto?.groupBy ?? "day";

  const summaryQb = this.receiptRepository
    .createQueryBuilder("r")
    .select("SUM(r.ukupanIznos)", "prihod")
    .addSelect("COUNT(r.id)", "brojRacuna");

  if (from) summaryQb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) summaryQb.andWhere("DATE(r.datumVreme) <= :to", { to });

  const summaryRow = await summaryQb.getRawOne();

  let groupExpr = "DATE(r.datumVreme)";
  if (groupBy === "month") groupExpr = "DATE_FORMAT(r.datumVreme, '%Y-%m')";
  if (groupBy === "year") groupExpr = "YEAR(r.datumVreme)";

  const trendQb = this.receiptRepository
    .createQueryBuilder("r")
    .leftJoin("r.stavke", "i")
    .select(groupExpr, "t")
    .addSelect("SUM(i.kolicina)", "kolicina")
    .addSelect("SUM(i.ukupno)", "prihod")
    .groupBy("t")
    .orderBy("t", "ASC");

  if (from) trendQb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) trendQb.andWhere("DATE(r.datumVreme) <= :to", { to });

  const trendRowsRaw = await trendQb.getRawMany();

  const trendRows = (trendRowsRaw ?? []).map((x: any) => ({
    t: x.t,
    kolicina: Number(x.kolicina ?? 0),
    prihod: Number(x.prihod ?? 0),
  }));

  const top10Qb = this.receiptRepository
    .createQueryBuilder("r")
    .leftJoin("r.stavke", "i")
    .select("i.nazivParfema", "naziv")
    .addSelect("SUM(i.kolicina)", "kolicina")
    .addSelect("SUM(i.ukupno)", "prihod")
    .groupBy("i.nazivParfema")
    .orderBy("prihod", "DESC")
    .limit(10);

  if (from) top10Qb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) top10Qb.andWhere("DATE(r.datumVreme) <= :to", { to });

  const top10Raw = await top10Qb.getRawMany();

  const top10 = (top10Raw ?? []).map((x: any) => ({
    naziv: x.naziv,
    kolicina: Number(x.kolicina ?? 0),
    prihod: Number(x.prihod ?? 0),
  }));

  const totalSoldAll = trendRows.reduce((acc, x) => acc + x.kolicina, 0);
  const avgDailySold = trendRows.length ? totalSoldAll / trendRows.length : 0;

  const best = trendRows.reduce((b: any, x: any) => {
    if (!b) return x;
    return x.kolicina > b.kolicina ? x : b;
  }, null);

  const payload = {
    meta: { groupBy, from, to, createdAt: new Date().toISOString() },
    kpis: {
      totalRevenue: Number(summaryRow?.prihod ?? 0),
      totalReceipts: Number(summaryRow?.brojRacuna ?? 0),
      totalSoldAll,
      avgDailySold,
      bestDay: best ? { date: best.t, qty: Number(best.kolicina ?? 0) } : null,
    },
    trend: trendRows,
    top10,
  };

  return await this.saveReport("SALES_ANALYSIS_REPORT", { from, to, groupBy }, payload);
}


  

}
