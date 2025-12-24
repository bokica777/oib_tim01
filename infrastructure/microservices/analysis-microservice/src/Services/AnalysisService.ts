import { Repository } from "typeorm";
import { IAnalysisService, TopPerfumesQuery } from "../Domain/services/IAnalysisService";
import { ReceiptItem } from "../Domain/models/ReceiptItem";
import { AnalysisReport } from "../Domain/models/AnalysisReport";

export class AnalysisService implements IAnalysisService {
  constructor(
    private readonly receiptItemRepository: Repository<ReceiptItem>,
    private readonly reportRepository: Repository<AnalysisReport>
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
}
