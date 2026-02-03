import axios, { AxiosInstance } from "axios";
import { OrderResponseDTO } from "../../models/sales/OrderResponseDTO";
import { CreateOrderDTO } from "../../models/sales/CreateOrderDTO";
import { LocalPerfume } from "../../models/sales/LocalPerfume";

function buildApiBase() {
  const gateway = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000";
  const clean = gateway.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  return clean + "/api/v1";
}

type RawVariant = {
  perfumeId?: number;
  id?: number;
  volumeMl?: number;
  netVolumeMl?: number;
  volume?: number;
  price?: number;
  stock?: number;
};

type RawGroupedProduct = {
  name?: string;
  stockTotal?: number;
  variants?: RawVariant[];
};

type RawFlatProduct = {
  id?: number | string;
  name?: string;
  netVolumeMl?: number;
  volume?: number;
  price?: number;
  stock?: number;
  variants?: RawVariant[];
};

function normalizePerfumeName(name: string) {
  return String(name ?? "")
    .replace(/\(?\s*\d+\s*ml\s*\)?/gi, "") // "(150 ml)", "250ml"
    .replace(/\s+/g, " ")
    .trim();
}

function toNumberOr(value: any, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildLocalPerfumes(raw: any[]): LocalPerfume[] {
  if (!Array.isArray(raw)) return [];

  // Ako backend već šalje grupisano (name + variants)
  const looksGrouped =
    raw.length > 0 &&
    typeof raw[0] === "object" &&
    raw[0] != null &&
    ("variants" in raw[0]) &&
    ("stockTotal" in raw[0] || "name" in raw[0]) &&
    !("id" in raw[0]); // grupisano obično nema id na top-level

  if (looksGrouped) {
    const result: LocalPerfume[] = raw.map((g: RawGroupedProduct, idx: number) => {
      const baseName = normalizePerfumeName(String(g?.name ?? `Proizvod ${idx + 1}`));
      const variants = Array.isArray(g?.variants) ? g.variants : [];

      // map variants u frontend shape
      const mappedVariants = variants
        .map((v) => {
          const perfumeId = toNumberOr(v.perfumeId ?? v.id, NaN);
          const volume = toNumberOr(v.volumeMl ?? v.netVolumeMl ?? v.volume, 150);
          const price = toNumberOr(v.price, Math.round(volume * 50));
          const stock = toNumberOr(v.stock, 0);

          // id mora postojati (broj ili string) da bi React key bio stabilan
          const id = Number.isFinite(perfumeId) ? perfumeId : `${baseName}-${volume}`;

          return { id, volume, price, stock };
        })
        .sort((a, b) => Number(a.volume) - Number(b.volume));

      const stockTotal =
        typeof g?.stockTotal === "number"
          ? g.stockTotal
          : mappedVariants.reduce((s, x) => s + (x.stock ?? 0), 0);

      // netVolumeMl/price na top-level može biti "default" (npr prva varijanta)
      const primary = mappedVariants[0] ?? { id: `${baseName}-150`, volume: 150, price: 0, stock: 0 };

      return {
        id: `${baseName}-${idx}`, // top-level id može biti string (nije perfumeId!)
        name: baseName,
        netVolumeMl: Number(primary.volume ?? 150),
        price: Number(primary.price ?? 0),
        stock: Number(stockTotal ?? 0),
        variants: mappedVariants as any,
      } as LocalPerfume;
    });

    return result;
  }

  // Inače: backend šalje flat listu (svaki parfem je red), pa grupišemo po imenu
  const map = new Map<string, LocalPerfume>();

  for (const p of raw as RawFlatProduct[]) {
    const rawName = String(p?.name ?? "Unknown");
    const baseName = normalizePerfumeName(rawName);

    const perfumeId = toNumberOr(p?.id, NaN);
    const volume = toNumberOr(p?.netVolumeMl ?? p?.volume, 150);
    const price = toNumberOr(p?.price, Math.round(volume * 50));
    const stock = toNumberOr(p?.stock, 0);

    const ex = map.get(baseName) ?? ({
      id: `${baseName}-${volume}`,
      name: baseName,
      netVolumeMl: volume,
      price,
      stock: 0,
      variants: [],
    } as LocalPerfume);

    // ubaci/merge variantu (po volumenu)
    const variants = Array.isArray(ex.variants) ? [...ex.variants] : [];
    const idx = variants.findIndex((v: any) => Number(v.volume) === Number(volume));

    const vId = Number.isFinite(perfumeId) ? perfumeId : `${baseName}-${volume}`;

    if (idx >= 0) {
      const old = variants[idx] as any;
      variants[idx] = {
        ...old,
        id: old.id ?? vId,
        volume,
        price: typeof old.price === "number" ? old.price : price,
        stock: (old.stock ?? 0) + stock,
      };
    } else {
      variants.push({ id: vId, volume, price, stock } as any);
    }

    variants.sort((a: any, b: any) => Number(a.volume) - Number(b.volume));

    const stockTotal = variants.reduce((s: number, x: any) => s + (x.stock ?? 0), 0);

    map.set(baseName, {
      ...ex,
      variants,
      stock: stockTotal,
      // kao default stavi prvu varijantu
      netVolumeMl: Number(variants[0]?.volume ?? ex.netVolumeMl ?? 150),
      price: Number(variants[0]?.price ?? ex.price ?? 0),
    } as LocalPerfume);
  }

  // Sort: najpre oni sa većim stock-om
  const result = Array.from(map.values());
  result.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
  return result;
}

export class SalesAPI {
  private client: AxiosInstance;

  constructor() {
    const apiBase = buildApiBase();

    this.client = axios.create({
      baseURL: apiBase,
      headers: { "Content-Type": "application/json" },
      timeout: 12000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  // ✅ vraća uvek grupisano, spremno za UI
  async listProducts(): Promise<LocalPerfume[]> {
    const res = await this.client.get<any[]>("/sales/products");
    return buildLocalPerfumes(res.data ?? []);
  }

  async createOrder(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    const res = await this.client.post<OrderResponseDTO>("/sales/order", dto);
    return res.data;
  }

  async getOrderById(id: number): Promise<OrderResponseDTO> {
    const res = await this.client.get<OrderResponseDTO>(`/sales/order/${id}`);
    return res.data;
  }

  async listOrders(): Promise<OrderResponseDTO[]> {
    const res = await this.client.get<OrderResponseDTO[]>("/sales/orders");
    return res.data ?? [];
  }
}

export const salesAPI = new SalesAPI();
