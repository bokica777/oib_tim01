import axios, { AxiosError, AxiosInstance } from "axios";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { UserDTO } from "../Domain/DTOs/user/UserDTO";

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  // ukloni trailing slash
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status ?? 500;

    // pokušaj izvući poruku iz microservisa
    const message =
      (ax.response?.data && (ax.response.data.message || ax.response.data.error)) ||
      ax.message ||
      "Request failed";

    // Ubaci i detalje ako postoje (npr validation errors)
    const details = ax.response?.data?.errors ?? ax.response?.data;

    const e = new Error(typeof message === "string" ? message : "Request failed");
    (e as any).status = status;
    (e as any).details = details;
    throw e;
  }

  throw err instanceof Error ? err : new Error("Unknown error");
}

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
    const AUTH_SERVICE_API = normalizeUrl(process.env.AUTH_SERVICE_API);
    const USER_SERVICE_API = normalizeUrl(process.env.USER_SERVICE_API);

    const PRODUCTION_URL = normalizeUrl(process.env.PRODUCTION_URL);
    const PROCESSING_URL = normalizeUrl(process.env.PROCESSING_URL);
    const STORAGE_URL = normalizeUrl(process.env.STORAGE_URL);
    const PACKAGING_URL = normalizeUrl(process.env.PACKAGING_URL);
    const SALES_URL = normalizeUrl(process.env.SALES_URL);
    const AUDIT_URL = normalizeUrl(process.env.AUDIT_URL);
    const PERFORMANCE_URL = normalizeUrl(process.env.PERFORMANCE_URL);
    const ANALYTICS_URL = normalizeUrl(process.env.ANALYTICS_URL);

    this.authClient = axios.create({
      baseURL: AUTH_SERVICE_API,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.userClient = axios.create({
      baseURL: USER_SERVICE_API,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    if (PRODUCTION_URL) {
      this.productionClient = axios.create({
        baseURL: PRODUCTION_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }

    if (PROCESSING_URL) {
      this.processingClient = axios.create({
        baseURL: PROCESSING_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }

    if (STORAGE_URL) {
      this.storageClient = axios.create({
        baseURL: STORAGE_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }

    if (PACKAGING_URL) {
      this.packagingClient = axios.create({
        baseURL: PACKAGING_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      });
    }

    if (SALES_URL) {
      this.salesClient = axios.create({
        baseURL: SALES_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }

    if (AUDIT_URL) {
      this.auditClient = axios.create({
        baseURL: AUDIT_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });
    }

    if (PERFORMANCE_URL) {
      this.performanceClient = axios.create({
        baseURL: PERFORMANCE_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }

    if (ANALYTICS_URL) {
      this.analyticsClient = axios.create({
        baseURL: ANALYTICS_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }
  }

  

  // ================= AUTH =================
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

  // ================= USERS =================
  async getAllUsers(): Promise<UserDTO[]> {
    const response = await this.userClient.get<UserDTO[]>("/users");
    return response.data;
  }

  async getUserById(id: number): Promise<UserDTO> {
    const response = await this.userClient.get<UserDTO>(`/users/${id}`);
    return response.data;
  }

  // ================= PRODUCTION =================

  async getPlants(count: number, headers: Record<string, string>): Promise<any[]> {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");
    try {
      const resp = await this.productionClient.get(`/plants?count=${count}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async plantNew(seedData: any, headers: Record<string, string>): Promise<any> {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");
    try {
      const resp = await this.productionClient.post(`/plant`, seedData ?? {}, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async plantAndScale(
    sourceStrength: number,
    factorPercent: number,
    headers: Record<string, string>
  ): Promise<any> {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");

    // normalizacija: ako je 65 → 0.65, ako je 0.65 ostaje 0.65
    const factor = factorPercent > 1 ? Number((factorPercent / 100).toFixed(4)) : factorPercent;

    try {
      const resp = await this.productionClient.post(
        "/balance",
        { sourceStrength, factor },
        { headers }
      );
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async harvestMany(
  commonName: string,
  count: number,
  headers: Record<string, string>
): Promise<any[]> {
  if (!this.productionClient) {
    throw new Error("PRODUCTION_URL not configured");
  }

  try {
    const resp = await this.productionClient.post(
      "/harvest",
      { commonName, count },
      { headers }
    );
    return resp.data;
  } catch (err) {
    handleAxiosError(err);
  }
}

// ================= PRODUCTION =================
async adjustStrength(
  plantId: number,
  value: number,
  headers: Record<string, string>
): Promise<any> {
  if (!this.productionClient) {
    throw new Error("PRODUCTION_URL not configured");
  }

  try {
    const resp = await this.productionClient.put(
      `/adjust/${plantId}`,
      { value, mode: "inc" },
      { headers }
    );

    return resp.data;
  } catch (err) {
    handleAxiosError(err);
  }
}




  // ================= PRODUCTION LOGS =================
  async getProductionLogs(headers: Record<string, string>): Promise<any[]> {
    if (!this.productionClient) throw new Error("PRODUCTION_URL not configured");

    try {
      const resp = await this.productionClient.get("/logs", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }


  // ================= PROCESSING =================
  async processPerfume(dto: any, headers: Record<string, string>): Promise<any[]> {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    try {
      const resp = await this.processingClient.post("/process", dto, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async listPerfumes(headers: Record<string, string>): Promise<any[]> {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    try {
      const resp = await this.processingClient.get("/perfumes", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getPerfumeById(id: number, headers: Record<string, string>): Promise<any> {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    try {
      const resp = await this.processingClient.get(`/perfumes/${id}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async requestPerfumes(name: string, count: number, headers: Record<string, string>): Promise<any[]> {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    try {
      const resp = await this.processingClient.post("/perfumes/request", { name, count }, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= STORAGE =================
  async storePackage(dto: any, headers: Record<string, string>): Promise<any> {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    try {
      const resp = await this.storageClient.post("/store", dto, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async sendPackages(role: string | undefined, count: number, headers: Record<string, string>): Promise<any[]> {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    try {
      const h = { ...headers, "x-user-role": role ?? "" };
      const resp = await this.storageClient.post("/send", { count }, { headers: h, timeout: 15000 });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async listPackages(headers: Record<string, string>): Promise<any[]> {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    try {
      const resp = await this.storageClient.get("/packages", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= PACKAGING =================
  async requestPackaging(count: number, headers: Record<string, string>): Promise<void> {
    if (!this.packagingClient) throw new Error("PACKAGING_URL not configured");
    try {
      await this.packagingClient.post("/pack", { count }, { headers });
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= SALES =================
  async createOrder(dto: any, headers: Record<string, string>): Promise<any> {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    try {
      const resp = await this.salesClient.post("/order", dto, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getOrderById(id: number, headers: Record<string, string>): Promise<any> {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    try {
      const resp = await this.salesClient.get(`/order/${id}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async listOrders(headers: Record<string, string>): Promise<any[]> {
    if (!this.salesClient) throw new Error("SALES_URL not configured");
    try {
      const resp = await this.salesClient.get("/orders", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= PERFORMANCE =================
  async runSimulation(algorithmName: string, headers: Record<string, string>): Promise<any> {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    try {
      const resp = await this.performanceClient.post("/simulate", { algorithmName }, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getAllPerformanceReports(headers: Record<string, string>): Promise<any[]> {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    try {
      const resp = await this.performanceClient.get("/reports", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getPerformanceReportById(id: number, headers: Record<string, string>): Promise<any> {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    try {
      const resp = await this.performanceClient.get(`/reports/${id}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= AUDIT =================
  async createAuditLog(dto: any): Promise<any> {
    if (!this.auditClient) throw new Error("AUDIT_URL not configured");
    try {
      try {
        const resp = await this.auditClient.post("/log", dto);
        return resp.data;
      } catch {
        const resp = await this.auditClient.post("/", dto);
        return resp.data;
      }
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getAuditLogs(): Promise<any[]> {
    if (!this.auditClient) throw new Error("AUDIT_URL not configured");
    try {
      const resp = await this.auditClient.get("/");
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= ANALYTICS & RECEIPTS =================
  async getTopPerfumes(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    try {
      const q = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const resp = await this.analyticsClient.get(`/analysis/top-perfumes?${q.toString()}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async createReceipt(dto: any, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    try {
      const resp = await this.analyticsClient.post("/receipts", dto, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async listReceipts(headers: Record<string, string>): Promise<any[]> {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    try {
      const resp = await this.analyticsClient.get("/receipts", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getDailyRevenue(date: string, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    try {
      const resp = await this.analyticsClient.get(`/receipts/daily?date=${encodeURIComponent(date)}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getSalesByProduct(headers: Record<string, string>): Promise<any[]> {
    if (!this.analyticsClient) throw new Error("ANALYTICS_URL not configured");
    try {
      const resp = await this.analyticsClient.get("/receipts/sales-by-product", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= GENERIC AUDIT HELPER =================
  async logAudit(message: string, type = "INFO", source = "gateway", meta?: any): Promise<boolean> {
    if (!this.auditClient) return false;
    const payload = { type, message, meta, source };

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
