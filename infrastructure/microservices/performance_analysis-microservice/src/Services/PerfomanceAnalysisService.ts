import { Repository } from "typeorm";
import { PerformanceReport } from "../Domain/models/PerformanceReport";
import { IPerformanceAnalysisService } from "../Domain/services/IPerformanceAnalysisService";

export class PerformanceAnalysisService implements IPerformanceAnalysisService {
    private readonly repo: Repository<PerformanceReport>;

    constructor(repo: Repository<PerformanceReport>) {
        this.repo = repo;
    }

    async runSimulation(algorithmName: string): Promise<PerformanceReport> {
        const seed = this.hashString(algorithmName);

        const executionTime = 100 + (seed % 1900);
        const successRate = 80 + (seed % 20);
        const resourceUsage = 20 + (seed % 70);

        const summary = `Simulacija algoritma ${algorithmName} završena.
            Vreme izvršavanja: ${executionTime} ms.
            Stopa uspeha: ${successRate}%.
            Iskorišcenje resursa: ${resourceUsage}%.`;

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

    private hashString(value: string): number {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = (hash << 5) - hash + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
}
