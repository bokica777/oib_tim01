import axios, { AxiosInstance } from "axios";
import { OrderResponseDTO } from "../../models/sales/OrderResponseDTO";
import { CreateOrderDTO } from "../../models/sales/CreateOrderDTO";

export class SalesAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta.env.VITE_GATEWAY_URL ?? "") + "/sales",
      headers: { "Content-Type": "application/json" },
      timeout: 12000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  async listProducts(): Promise<any[]> {
    try {
      const res = await this.client.get<any[]>("/products");
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri dohvaćanju proizvoda");
    }
  }

  async createOrder(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    try {
      const res = await this.client.post<OrderResponseDTO>("/order", dto);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri kreiranju porudžbine");
    }
  }

  async getOrderById(id: number): Promise<OrderResponseDTO> {
    try {
      const res = await this.client.get<OrderResponseDTO>(`/order/${id}`);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Greška pri dohvaćanju porudžbine");
    }
  }

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
