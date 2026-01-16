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

    // Base query: ReceiptItem + join Receipt (zbog datuma)
    const qb = this.receiptItemRepository
      .createQueryBuilder("s")
      .leftJoin("s.racun", "r");

    // Filter po datumu (opciono)
    // Napomena: koristi DATE(r.datumVreme) da radi sa "YYYY-MM-DD"
    if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
    if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

    // Grupisanje po parfemu (naziv + id)
    qb.select("s.parfemId", "parfemId")
      .addSelect("s.nazivParfema", "nazivParfema")
      .addSelect("SUM(s.kolicina)", "kolicina")
      .addSelect("SUM(s.ukupno)", "prihod")
      .groupBy("s.parfemId")
      .addGroupBy("s.nazivParfema");

    // Sort
    if (type === "quantity") {
      qb.orderBy("kolicina", "DESC");
    } else {
      qb.orderBy("prihod", "DESC");
    }

    qb.limit(limit);

    const rows = await qb.getRawMany();

    // Napravi izvestaj koji cuvamo u bazi
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

  const qb = this.receiptRepository
  .createQueryBuilder("r")
  .leftJoin("r.stavke", "i");

  if (from) qb.andWhere("DATE(r.datumVreme) >= :from", { from });
  if (to) qb.andWhere("DATE(r.datumVreme) <= :to", { to });

  // reset select
  qb.select("SUM(r.ukupanIznos)", "prihod")
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
    .select("s.parfemId", "parfemId")
    .addSelect("s.nazivParfema", "nazivParfema")
    .addSelect("SUM(s.kolicina)", "kolicina")
    .addSelect("SUM(s.ukupno)", "prihod")
    .groupBy("s.parfemId")
    .addGroupBy("s.nazivParfema")
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

  private async saveReport(tipIzvestaja: string, parametri: any, rezultat: any) {
    const report = new AnalysisReport();
    report.tipIzvestaja = tipIzvestaja;
    report.parametri = parametri;
    report.rezultat = rezultat;
    return await this.reportRepository.save(report);
  }
}
