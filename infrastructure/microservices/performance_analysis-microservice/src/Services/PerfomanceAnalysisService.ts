import { Repository } from "typeorm";
import { PerformanceReport } from "../Domain/models/PerformanceReport";
import { IPerformanceAnalysisService } from "../Domain/services/IPerformanceAnalysisService";

export class PerformanceAnalysisService implements IPerformanceAnalysisService {
    private readonly repo: Repository<PerformanceReport>;

    constructor(repo: Repository<PerformanceReport>) {
        this.repo = repo;
    }

    async runSimulation(algorithmName: string): Promise<PerformanceReport> {
        // Za sada fake logika – možeš kasnije da je pametno prilagodiš
        const executionTime = Math.random() * 10; // 0–10 sekundi
        const successRate = 70 + Math.random() * 30; // 70–100%
        const resourceUsage = Math.random() * 100; // 0–100%

        const summary = `Simulacija algoritma ${algorithmName} završena.
Vreme: ${executionTime.toFixed(2)}s, uspeh: ${successRate.toFixed(
            2
        )}%, resursi: ${resourceUsage.toFixed(2)}%.`;

        const report = this.repo.create({
            algorithmName,
            executionTime,
            successRate,
            resourceUsage,
            summary,
        });

        return await this.repo.save(report);
    }

    async getAllReports(): Promise<PerformanceReport[]> {
        return await this.repo.find({
            order: { createdAt: "DESC" },
        });
    }

    async getReportById(id: number): Promise<PerformanceReport | null> {
        return await this.repo.findOne({ where: { id } });
    }
}
