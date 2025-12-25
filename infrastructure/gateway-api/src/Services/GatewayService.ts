import axios, { AxiosInstance } from "axios";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO"; 
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { UserDTO } from "../Domain/DTOs/user/UserDTO"; 

export class GatewayService implements IGatewayService {
  private authClient: AxiosInstance;
  private userClient: AxiosInstance;
  private productionClient?: AxiosInstance;
  private processingClient?: AxiosInstance;
  private storageClient?: AxiosInstance;
  private packagingClient?: AxiosInstance;
  private salesClient?: AxiosInstance;
  private auditClient?: AxiosInstance;
  private performanceClient?: AxiosInstance;
  private analyticsClient?: AxiosInstance;

  constructor() {
    this.authClient = axios.create({
      baseURL: process.env.AUTH_SERVICE_API,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.userClient = axios.create({
      baseURL: process.env.USER_SERVICE_API,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

        if (process.env.PRODUCTION_URL) {
      this.productionClient = axios.create({ baseURL: process.env.PRODUCTION_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
    if (process.env.PROCESSING_URL) {
      this.processingClient = axios.create({ baseURL: process.env.PROCESSING_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
    if (process.env.STORAGE_URL) {
      this.storageClient = axios.create({ baseURL: process.env.STORAGE_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
    if (process.env.PACKAGING_URL) {
      this.packagingClient = axios.create({ baseURL: process.env.PACKAGING_URL, headers: { "Content-Type": "application/json" }, timeout: 8000 });
    }
    if (process.env.SALES_URL) {
      this.salesClient = axios.create({ baseURL: process.env.SALES_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
    if (process.env.AUDIT_URL) {
      this.auditClient = axios.create({ baseURL: process.env.AUDIT_URL, headers: { "Content-Type": "application/json" }, timeout: 5000 });
    }
    if (process.env.PERFORMANCE_URL) {
      this.performanceClient = axios.create({ baseURL: process.env.PERFORMANCE_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
    // Analytics/Receipts (your analytics + receipts microservice listens on 6754 in code)
    if (process.env.ANALYTICS_URL) {
      this.analyticsClient = axios.create({ baseURL: process.env.ANALYTICS_URL, headers: { "Content-Type": "application/json" }, timeout: 10000 });
    }
  }

  // Auth
  async login(data: LoginUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/auth/login", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  async register(data: RegistrationUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/auth/register", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  // Users
  async getAllUsers(): Promise<UserDTO[]> {
    const response = await this.userClient.get<UserDTO[]>("/users");
    return response.data;
  }

  async getUserById(id: number): Promise<UserDTO> {
    const response = await this.userClient.get<UserDTO>(`/users/${id}`);
    return response.data;
  }

  // Production
  async getPlants(count: number, headers: Record<string,string>) {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");
    const resp = await this.productionClient.get(`/plants?count=${count}`, { headers });
    return resp.data;
  }

  async plantAndScale(sourceStrength: number, factorPercent: number, headers: Record<string,string>) {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");
    const resp = await this.productionClient.post("/balance", { sourceStrength, factor: factorPercent }, { headers });
    return resp.data;
  }

  // Processing
  async processPerfume(dto: any, headers: Record<string,string>) {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    const resp = await this.processingClient.post("/process", dto, { headers });
    return resp.data;
  }

  async listPerfumes(headers: Record<string,string>) {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    const resp = await this.processingClient.get("/perfumes", { headers });
    return resp.data;
  }

  async getPerfumeById(id: number, headers: Record<string,string>) {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    const resp = await this.processingClient.get(`/perfumes/${id}`, { headers });
    return resp.data;
  }

  async requestPerfumes(name: string, count: number, headers: Record<string,string>) {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    const resp = await this.processingClient.post("/perfumes/request", { name, count }, { headers });
    return resp.data;
  }

  // Storage
  async storePackage(dto: any, headers: Record<string,string>) {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    const resp = await this.storageClient.post("/store", dto, { headers });
    return resp.data;
  }

  async sendPackages(role: string | undefined, count: number, headers: Record<string,string>) {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    const h = { ...headers, "x-user-role": role ?? "" };
    const resp = await this.storageClient.post("/send", { count }, { headers: h, timeout: 15000 });
    return resp.data;
  }

  async listPackages(headers: Record<string,string>) {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    const resp = await this.storageClient.get("/packages", { headers });
    return resp.data;
  }

  // Packaging
  async requestPackaging(count: number, headers: Record<string,string>) {
    if (!this.packagingClient) throw new Error("PACKAGING_URL not configured");
    await this.packagingClient.post("/pack", { count }, { headers });
  }

  // Sales
  async createOrder(dto: any, headers: Record<string,string>) {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    const resp = await this.salesClient.post("/order", dto, { headers });
    return resp.data;
  }

  async getOrderById(id: number, headers: Record<string,string>) {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    const resp = await this.salesClient.get(`/order/${id}`, { headers });
    return resp.data;
  }

  async listOrders(headers: Record<string,string>) {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    const resp = await this.salesClient.get("/orders", { headers });
    return resp.data;
  }

  // Performance analysis
  async runSimulation(algorithmName: string, headers: Record<string,string>) {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    const resp = await this.performanceClient.post("/simulate", { algorithmName }, { headers });
    return resp.data;
  }
  async getAllPerformanceReports(headers: Record<string,string>) {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    const resp = await this.performanceClient.get("/reports", { headers });
    return resp.data;
  }
  async getPerformanceReportById(id: number, headers: Record<string,string>) {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    const resp = await this.performanceClient.get(`/reports/${id}`, { headers });
    return resp.data;
  }

  // Audit logs 
  async createAuditLog(dto: any) {
    if (!this.auditClient) throw new Error("AUDIT_URL not configured");
    // audit microservice expects POST /  (but some clients call /log). Try both.
    try {
      const resp = await this.auditClient.post("/log", dto);
      return resp.data;
    } catch {
      const resp = await this.auditClient.post("/", dto);
      return resp.data;
    }
  }

  async getAuditLogs() {
    if (!this.auditClient) throw new Error("AUDIT_URL not configured");
    const resp = await this.auditClient.get("/");
    return resp.data;
  }

  // Analytics & Receipts 
  async getTopPerfumes(query: Record<string,any>, headers: Record<string,string>) {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    const q = new URLSearchParams();
    Object.entries(query ?? {}).forEach(([k,v]) => { if (v !== undefined && v !== null) q.append(k, String(v)); });
    const resp = await this.analyticsClient.get(`/analysis/top-perfumes?${q.toString()}`, { headers });
    return resp.data;
  }

  async createReceipt(dto: any, headers: Record<string,string>) {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    const resp = await this.analyticsClient.post("/receipts", dto, { headers });
    return resp.data;
  }

  async listReceipts(headers: Record<string,string>) {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    const resp = await this.analyticsClient.get("/receipts", { headers });
    return resp.data;
  }

  async getDailyRevenue(date: string, headers: Record<string,string>) {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    const resp = await this.analyticsClient.get(`/receipts/daily?date=${encodeURIComponent(date)}`, { headers });
    return resp.data;
  }

  async getSalesByProduct(headers: Record<string,string>) {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    const resp = await this.analyticsClient.get("/receipts/sales-by-product", { headers });
    return resp.data;
  }

  // Generic audit helper used by gateway to log its own events
  async logAudit(message: string, type = "INFO", source = "gateway", meta?: any) {
    if (!this.auditClient) return false;
    const payload = { type, message, meta };
    // try /log then fallback /
    try {
      await this.auditClient.post("/log", payload);
      return true;
    } catch {
      try {
        await this.auditClient.post("/", payload);
        return true;
      } catch {
        return false;
      }
    }
  }
}
