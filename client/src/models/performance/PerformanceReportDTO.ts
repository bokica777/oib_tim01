export type PerformanceReportDTO = {
  id: number;
  algorithmName: string;

  executionTime: number;   // seconds
  successRate: number;     // percent (0-100)
  resourceUsage: number;   // percent (0-100)

  summary: string;
  createdAt: string;       // ISO string
};
