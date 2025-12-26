import { LoginUserDTO } from "../DTOs/user/LoginUserDTO"; 
import { RegistrationUserDTO } from "../DTOs/user/RegistrationUserDTO";
import { UserDTO } from "../DTOs/user/UserDTO"; 
import { AuthResponseType } from "../types/AuthResponse";

export interface IGatewayService {
  // Auth
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // Users
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;

  // Production
  plantNew(seedData: any, internalHeaders: Record<string,string>): Promise<any>;
  getPlants(count: number, internalHeaders: Record<string,string>): Promise<any[]>;
  plantAndScale(sourceStrength: number, factorPercent: number, internalHeaders: Record<string,string>): Promise<any>;

  // Processing
  processPerfume(dto: any, internalHeaders: Record<string,string>): Promise<any[]>;
  listPerfumes(internalHeaders: Record<string,string>): Promise<any[]>;
  getPerfumeById(id: number, internalHeaders: Record<string,string>): Promise<any>;
  requestPerfumes(name: string, count: number, internalHeaders: Record<string,string>): Promise<any[]>;

  // Storage
  storePackage(dto: any, internalHeaders: Record<string,string>): Promise<any>;
  sendPackages(role: string | undefined, count: number, internalHeaders: Record<string,string>): Promise<any[]>;
  listPackages(internalHeaders: Record<string,string>): Promise<any[]>;

  // Packaging
  requestPackaging(count: number, internalHeaders: Record<string,string>): Promise<void>;

  // Sales
  createOrder(dto: any, internalHeaders: Record<string,string>): Promise<any>;
  getOrderById(id: number, internalHeaders: Record<string,string>): Promise<any>;
  listOrders(internalHeaders: Record<string,string>): Promise<any[]>;

  // Performance analysis
  runSimulation(algorithmName: string, internalHeaders: Record<string,string>): Promise<any>;
  getAllPerformanceReports(internalHeaders: Record<string,string>): Promise<any[]>;
  getPerformanceReportById(id: number, internalHeaders: Record<string,string>): Promise<any>;

  // Audit logs
  createAuditLog(dto: any): Promise<any>;
  getAuditLogs(): Promise<any[]>;

  // Analytics & Receipts
  getTopPerfumes(query: Record<string,any>, internalHeaders: Record<string,string>): Promise<any>;
  createReceipt(dto: any, internalHeaders: Record<string,string>): Promise<any>;
  listReceipts(internalHeaders: Record<string,string>): Promise<any[]>;
  getDailyRevenue(date: string, internalHeaders: Record<string,string>): Promise<any>;
  getSalesByProduct(internalHeaders: Record<string,string>): Promise<any[]>;

  // Audit helper (generic)
  logAudit(message: string, type?: string, source?: string, meta?: any): Promise<boolean>;
}
