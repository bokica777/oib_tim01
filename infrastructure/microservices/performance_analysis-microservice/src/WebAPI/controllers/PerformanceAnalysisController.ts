import { Router, Request, Response, NextFunction } from "express";
import { IPerformanceAnalysisService } from "../../Domain/services/IPerformanceAnalysisService";
import { RunSimulationDTO } from "../../Domain/DTOs/RunSimulationDTO";

export class PerformanceAnalysisController {
    private readonly router: Router;

    constructor(
        private readonly performanceService: IPerformanceAnalysisService
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {
        this.router.post(
            "/simulate",
            this.handleRunSimulation as (
                req: Request,
                res: Response,
                next: NextFunction
            ) => void
        );

        this.router.get(
            "/reports",
            this.handleGetAllReports as (
                req: Request,
                res: Response,
                next: NextFunction
            ) => void
        );

        this.router.get(
            "/reports/:id",
            this.handleGetReportById as (
                req: Request,
                res: Response,
                next: NextFunction
            ) => void
        );
    }

    private handleRunSimulation = async (
        req: Request<{}, any, RunSimulationDTO>,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { algorithmName } = req.body;

            if (!algorithmName || algorithmName.trim().length === 0) {
                return res.status(400).json({
                    message: "algorithmName is required",
                });
            }

            const report = await this.performanceService.runSimulation(algorithmName);
            return res.status(201).json(report);
        } catch (error) {
            next(error);
        }
    };

    private handleGetAllReports = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const reports = await this.performanceService.getAllReports();
            return res.status(200).json(reports);
        } catch (error) {
            next(error);
        }
    };

    private handleGetReportById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const id = Number(req.params.id);

            if (Number.isNaN(id)) {
                return res.status(400).json({
                    message: "Invalid report id",
                });
            }

            const report = await this.performanceService.getReportById(id);

            if (!report) {
                return res.status(404).json({
                    message: "Report not found",
                });
            }

            return res.status(200).json(report);
        } catch (error) {
            next(error);
        }
    };
}
