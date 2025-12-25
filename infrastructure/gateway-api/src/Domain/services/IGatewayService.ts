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

  // Audit
  logAudit(message: string, type?: string, source?: string, meta?: any): Promise<boolean>;
}
