// src/Domain/services/IGatewayService.ts
import { LoginUserDTO } from "../DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../DTOs/user/RegistrationUserDTO";
import { UserDTO } from "../DTOs/user/UserDTO";
import { AuthResponseType } from "../types/AuthResponse";

export interface IGatewayService {
  // ================= AUTH =================
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // ================= USERS =================
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number, headers?: Record<string, string>): Promise<UserDTO>


  // ================= PRODUCTION =================
  plantNew(seedData: any, headers: Record<string, string>): Promise<any>;
  getPlants(count: number, headers: Record<string, string>): Promise<any[]>;
  plantAndScale(
    sourceStrength: number,
    factorPercent: number,
    headers: Record<string, string>
  ): Promise<any>;
  harvestMany(
    commonName: string,
    count: number,
    headers: Record<string, string>
  ): Promise<any[]>;
  adjustStrength(
    plantId: number,
    value: number,
    headers: Record<string, string>
  ): Promise<any>;
  getProductionLogs(headers: Record<string, string>): Promise<any[]>;

  // ================= PROCESSING =================
  processPerfume(dto: any, headers: Record<string, string>): Promise<any[]>;
  listPerfumes(headers: Record<string, string>): Promise<any[]>;
  getPerfumeById(id: number, headers: Record<string, string>): Promise<any>;
  requestPerfumes(name: string, count: number, headers: Record<string, string>): Promise<any[]>;

  // ================= STORAGE =================
  storePackage(dto: any, headers: Record<string, string>): Promise<any>;
  sendPackages(role: string | undefined, count: number, headers: Record<string, string>): Promise<any[]>;
  listPackages(headers: Record<string, string>): Promise<any[]>;
  listWarehouses(headers: Record<string, string>): Promise<any[]>;

  // ================= PACKAGING =================
  requestPackaging(count: number, headers: Record<string, string>): Promise<void>;

  // ================= SALES =================
  createOrder(dto: any, headers: Record<string, string>): Promise<any>;
  getOrderById(id: number, headers: Record<string, string>): Promise<any>;
  listOrders(headers: Record<string, string>): Promise<any[]>;

  // ================= PERFORMANCE =================
  runSimulation(algorithmName: string, headers: Record<string, string>): Promise<any>;
  listPerformanceReports(headers: Record<string, string>): Promise<any[]>;
  getPerformanceReportById(id: number, headers: Record<string, string>): Promise<any>;
  getPerformanceReportPdf(
    id: number,
    headers: Record<string, string>
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }>;

  // ================= AUDIT =================
 getAudits(source?: string, forwardedHeaders?: string | Record<string,string>): Promise<any[]>;
createAudit(data: any, forwardedHeaders?: string | Record<string,string>): Promise<any>;

  // ================= ANALYTICS =================
  getTopPerfumes(query: Record<string, any>, headers: Record<string, string>): Promise<any>;
  createReceipt(dto: any, headers: Record<string, string>): Promise<any>;
  listReceipts(headers: Record<string, string>): Promise<any[]>;
  getDailyRevenue(date: string, headers: Record<string, string>): Promise<any>;
  getSalesByProduct(headers: Record<string, string>): Promise<any[]>;

  // ================= GENERIC AUDIT =================
  logAudit(message: string, type?: string, source?: string, meta?: any): Promise<boolean>;
}
