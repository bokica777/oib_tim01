export type RunSimulationDTO = {
    algorithmName: string;
};

export interface IPerformanceAPI {
    runSimulation(dto: RunSimulationDTO): Promise<any>;
    getReports(): Promise<any[]>;
    getReportById(id: number): Promise<any>;
    downloadPdf(id: number): Promise<Blob>;
}
