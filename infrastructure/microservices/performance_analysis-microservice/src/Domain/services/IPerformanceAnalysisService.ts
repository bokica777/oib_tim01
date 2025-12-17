import { PerformanceReport } from "../models/PerformanceReport";

export interface IPerformanceAnalysisService {
    runSimulation(algorithmName: string): Promise<PerformanceReport>;
    getAllReports(): Promise<PerformanceReport[]>;
    getReportById(id: number): Promise<PerformanceReport | null>;
}
