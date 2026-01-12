// src/api/sales/SalesAPI.ts
import axios, { AxiosInstance } from "axios";
import { PerfumeDTO } from "../../models/sales/PerfumeDTO";
import { OrderResponseDTO } from "../../models/sales/OrderResponseDTO";

// Novo: DTO za kreiranje porudžbine po backend očekivanju
export interface SimpleCreateOrderDTO {
  customerName: string;
  deliveryAddress: string;
  count: number; // ukupno paketa
}

export class SalesAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta.env.VITE_GATEWAY_URL ?? "") + "/sales",
      headers: { "Content-Type": "application/json" },
      timeout: 12000,
    });

    // Automatski dodaj Authorization header ako postoji token
    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("authToken"); // koristi authToken
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  // 🌸 Dohvati sve proizvode (perfume)
  async listProducts(): Promise<PerfumeDTO[]> {
    try {
      const res = await this.client.get<PerfumeDTO[]>("/products");
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri dohvaćanju proizvoda");
    }
  }

  // 🛒 Kreiraj novu porudžbinu (samo count)
  async createOrder(dto: SimpleCreateOrderDTO): Promise<OrderResponseDTO> {
    try {
      const res = await this.client.post<OrderResponseDTO>("/order", dto);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri kreiranju porudžbine");
    }
  }

  // 📝 Dohvati jednu porudžbinu po ID-u
  async getOrderById(id: number): Promise<OrderResponseDTO> {
    try {
      const res = await this.client.get<OrderResponseDTO>(`/order/${id}`);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri dohvaćanju porudžbine");
    }
  }

  // 📦 Dohvati sve porudžbine
  async listOrders(): Promise<OrderResponseDTO[]> {
    try {
      const res = await this.client.get<OrderResponseDTO[]>("/orders");
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri dohvaćanju porudžbina");
    }
  }
}

export const salesAPI = new SalesAPI();
