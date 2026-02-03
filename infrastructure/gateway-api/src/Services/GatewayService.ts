import axios, { AxiosError, AxiosInstance } from "axios";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/user/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { UserDTO } from "../Domain/DTOs/user/UserDTO";
import { Request, Response } from "express";

import dotenv from "dotenv";
dotenv.config();
import { StorePackageDTO } from "../Domain/DTOs/storage/StorePackageDTO";
import { PerfumeDTO } from "../Domain/DTOs/processing/PerfumeDTO";

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;

    console.error("[Gateway] upstream failed", {
      baseURL: ax.config?.baseURL,
      url: ax.config?.url,
      method: ax.config?.method,
      status: ax.response?.status,
      data: ax.response?.data,
    });

    const status = ax.response?.status ?? 500;
    const message =
      (ax.response?.data && (ax.response.data.message || ax.response.data.error)) ||
      ax.message ||
      "Request failed";

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
    const AUDIT_SERVICE_API = normalizeUrl(process.env.AUDIT_URL);
    const PERFORMANCE_URL = normalizeUrl(process.env.PERFORMANCE_URL);
    const ANALYSIS_URL = normalizeUrl(process.env.ANALYSIS_URL);

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

    if (AUDIT_SERVICE_API) {
      this.auditClient = axios.create({
        baseURL: AUDIT_SERVICE_API,
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      });
    }

    if (PERFORMANCE_URL) {
      this.performanceClient = axios.create({
        baseURL: `${PERFORMANCE_URL}/performance`,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }


    if (ANALYSIS_URL) {
      this.analyticsClient = axios.create({
        baseURL: ANALYSIS_URL,
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
    }
  }

  // ================= AUTH =================
  async login(data: LoginUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>(
        "/auth/login",
        data
      );
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  async register(data: RegistrationUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>(
        "/auth/register",
        data
      );
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

  async getUserById(id: number, headers?: Record<string, string>): Promise<UserDTO> {
    const response = await this.userClient.get<UserDTO>(`/users/${id}`, { headers });
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
    headers: Record<string, string>,
    commonName?: string,
    mode: "inc" | "scale" = "inc"
  ): Promise<any>{
    if (!this.productionClient) {
      throw new Error("PRODUCTION_URL not configured");
    }

    try {
      const resp = await this.productionClient.put(
        `/adjust/${plantId}`,
        { value, commonName, mode },
        { headers }
      );

      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }
  async getProductionLogs(headers: Record<string, string>): Promise<any[]> {
    if (!this.auditClient) throw new Error("AUDIT_URL not configured");
    const resp = await this.auditClient.get(`/audit`, { headers, params: { source: "production" } });
    return resp.data;
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

  async getProcessingPerfumeById(id: number, headers: Record<string, string>): Promise<any> {
    if (!this.processingClient) throw new Error("PROCESSING_URL not configured");
    const resp = await this.processingClient.get(`/perfumes/${id}`, { headers });
    return resp.data;
  }


  // ================= STORAGE =================

private async getStoragePackages(
  headers: Record<string, string>,
  status?: "PACKED" | "SENT" | "STORED"
): Promise<any[]> {
  if (!this.storageClient) throw new Error("STORAGE_URL not configured");

  const candidates = ["/packages", "/storage/packages"];

  for (const path of candidates) {
    try {
      const resp = await this.storageClient.get(path, {
        headers,
        timeout: 10000,
        params: status ? { status } : undefined,
      });

      return Array.isArray(resp.data) ? resp.data : [];
    } catch (err: any) {
      const code = err?.response?.status;
      if (code === 404) continue;
      handleAxiosError(err);
    }
  }

  const e = new Error("Packages endpoint not found on storage service (tried /packages and /storage/packages)");
  (e as any).status = 404;
  throw e;
}

  async listWarehouses(headers: Record<string, string>): Promise<any[]> {
    if (!this.storageClient) throw new Error("STORAGE_URL not configured");
    const candidates = ["/storage/warehouses", "/warehouses"];

    for (const path of candidates) {
      try {
        const resp = await this.storageClient.get(path, { headers, timeout: 10000 });
        return resp.data;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          continue;
        }
        handleAxiosError(err);
      }
    }
    const e = new Error("Warehouses endpoint not found on storage service (tried /storage/warehouses and /warehouses)");
    (e as any).status = 404;
    throw e;
  }

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
  return this.getStoragePackages(headers);
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

  private normalizePerfumeName(name: string) {
  return String(name ?? "")
    .replace(/\(?\s*\d+\s*ml\s*\)?/gi, "") 
    .replace(/\s+/g, " ")
    .trim();
}

async getSalePackages(headers: Record<string, string>): Promise<any[]> {
  if (!this.processingClient) throw new Error("PROCESSING_URL not configured");

  const packages = await this.getStoragePackages(headers, "SENT");

  const stockMap: Record<number, number> = {};
  for (const pkg of packages) {
    const ids = Array.isArray(pkg.perfumeIds) ? pkg.perfumeIds : [];
    for (const raw of ids) {
      const pid = Number(raw);
      if (!Number.isFinite(pid) || pid <= 0) continue;
      stockMap[pid] = (stockMap[pid] || 0) + 1;
    }
  }

  const perfumeIds = Object.keys(stockMap).map(Number);
  if (perfumeIds.length === 0) return [];

  const perfumes = await Promise.all(
    perfumeIds.map(async (id) => {
      try {
        const r = await this.processingClient!.get(`/perfumes/${id}`, { headers });
        const p: any = r.data;

        return {
          id: Number(p.id ?? id),
          name: String(p.name ?? `Perfume ${id}`),
          netVolumeMl: Number(p.netVolumeMl ?? p.volume ?? 150),
          price: Number(p.price ?? 0),
          stock: stockMap[id] ?? 0,
        };
      } catch {
        return {
          id,
          name: `Perfume ${id}`,
          netVolumeMl: 150,
          price: 0,
          stock: stockMap[id] ?? 0,
        };
      }
    })
  );

  type Variant = { perfumeId: number; volumeMl: number; price: number; stock: number };
  type SaleProduct = { name: string; variants: Variant[]; stockTotal: number };

  const productMap = new Map<string, SaleProduct>();

  for (const p of perfumes) {
    const baseName = this.normalizePerfumeName(p.name);
    const vol = Number(p.netVolumeMl ?? 150);

    const ex = productMap.get(baseName) ?? { name: baseName, variants: [], stockTotal: 0 };

    const idx = ex.variants.findIndex(v => Number(v.volumeMl) === vol);
    if (idx >= 0) {
      ex.variants[idx] = {
        ...ex.variants[idx],
        stock: (ex.variants[idx].stock ?? 0) + (p.stock ?? 0),
        price: ex.variants[idx].price ?? (p.price ?? 0),
      };
    } else {
      ex.variants.push({
        perfumeId: p.id,
        volumeMl: vol,
        price: p.price ?? 0,
        stock: p.stock ?? 0,
      });
    }

    ex.stockTotal += (p.stock ?? 0);
    productMap.set(baseName, ex);
  }

  const result = Array.from(productMap.values()).map(prod => ({
    ...prod,
    variants: prod.variants.slice().sort((a, b) => a.volumeMl - b.volumeMl),
  }));

  result.sort((a, b) => (b.stockTotal ?? 0) - (a.stockTotal ?? 0));

  return result;
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

  async listPerformanceReports(headers: Record<string, string>): Promise<any[]> {
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

  async getPerformanceReportPdf(
    id: number,
    headers: Record<string, string>
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    if (!this.performanceClient) throw new Error("PERFORMANCE_URL not configured");
    try {
      const resp = await this.performanceClient.get(`/reports/${id}/pdf`, {
        headers,
        responseType: "arraybuffer",
      });

      const contentType = (resp.headers["content-type"] as string) || "application/pdf";
      const cd = (resp.headers["content-disposition"] as string) || "";
      const match = /filename="?([^"]+)"?/i.exec(cd);
      const filename = match?.[1] || `performance-report-${id}.pdf`;

      return { buffer: Buffer.from(resp.data), contentType, filename };
    } catch (err) {
      handleAxiosError(err);
    }
  }
  // ================= AUDIT =================

  async createAudit(data: any, forwardedHeaders?: string | Record<string, string>): Promise<any> {
    if (!this.auditClient) throw new Error("AUDIT_SERVICE_API not configured");
    try {
      const headers: Record<string, string> = {};
      if (typeof forwardedHeaders === "string" && forwardedHeaders.trim()) {
        headers.Authorization = forwardedHeaders;
      }

      if (typeof forwardedHeaders === "object" && forwardedHeaders !== null) {
        Object.assign(headers, forwardedHeaders);
      }

      const resp = await this.auditClient.post(`/audit`, data, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getAudits(source?: string, forwardedHeaders?: string | Record<string, string>): Promise<any[]> {
    if (!this.auditClient) throw new Error("AUDIT_SERVICE_API not configured");
    try {
      const url = source ? `/audit?source=${encodeURIComponent(source)}` : `/audit`;

      const headers: Record<string, string> = {};
      if (typeof forwardedHeaders === "string" && forwardedHeaders.trim()) {
        headers.Authorization = forwardedHeaders;
      } else if (typeof forwardedHeaders === "object" && forwardedHeaders !== null) {
        Object.assign(headers, forwardedHeaders);
      }

      const resp = await this.auditClient.get(url, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  // ================= ANALYTICS & RECEIPTS =================
  async getTopPerfumes(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
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
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.post("/receipts", dto, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async listReceipts(headers: Record<string, string>): Promise<any[]> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.get("/receipts", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getDailyRevenue(date: string, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.get(`/receipts/daily?date=${encodeURIComponent(date)}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getSalesByProduct(headers: Record<string, string>): Promise<any[]> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.get("/receipts/sales-by-product", { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getTop10Revenue(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const q = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const resp = await this.analyticsClient.get(`/analysis/top10-revenue?${q.toString()}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getSalesSummary(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const q = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const resp = await this.analyticsClient.get(`/analysis/sales-summary?${q.toString()}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getSalesTrend(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const q = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const resp = await this.analyticsClient.get(`/analysis/sales-trend?${q.toString()}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async getReports(query: Record<string, any>, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const q = new URLSearchParams();
      Object.entries(query ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.append(k, String(v));
      });
      const resp = await this.analyticsClient.get(`/analysis/reports?${q.toString()}`, { headers });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async downloadReportPdf(id: number, headers: Record<string, string>): Promise<Buffer> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.get(`/analysis/reports/${id}/pdf`, {
        headers,
        responseType: "arraybuffer",
      });
      return resp.data;
    } catch (err) {
      handleAxiosError(err);
    }
  }

  async createSalesReport(dto: any, headers: Record<string, string>): Promise<any> {
    if (!this.analyticsClient) throw new Error("ANALYSIS_URL not configured");
    try {
      const resp = await this.analyticsClient.post(`/analysis/sales-report`, dto, { headers });
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

export default GatewayService;
