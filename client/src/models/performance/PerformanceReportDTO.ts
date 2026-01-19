export type PerformanceReportDTO = {
  id: number;
  algorithmName: string;

  executionTime: number;
  successRate: number;
  resourceUsage: number;

  summary: string;
  createdAt: string;
};
