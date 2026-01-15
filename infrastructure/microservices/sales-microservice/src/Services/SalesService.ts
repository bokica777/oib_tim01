import { Repository } from "typeorm";
import { SaleOrder } from "../Domain/models/SaleOrder";

type OrderItem = { perfumeId: number; quantity: number; name?: string; price?: number };

export class SalesService {
  constructor(private readonly orderRepo: Repository<SaleOrder>) {}

  async createOrder(
    customer: string,
    address: string,
    items: OrderItem[],
    role?: string
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Order must contain at least one item");
    }
    
    const normalized = items.map(it => ({
      perfumeId: Number(it.perfumeId),
      quantity: Math.max(1, Number(it.quantity) || 1),
      name: it.name,
      price: it.price
    }));

    if (normalized.some(i => !Number.isFinite(i.perfumeId) || i.perfumeId <= 0)) {
      throw new Error("Invalid perfumeId in items");
    }

    const totalItems = normalized.reduce((s, it) => s + it.quantity, 0);

    const order = this.orderRepo.create({
      customerName: customer,
      deliveryAddress: address,
      items: normalized,
      totalItems,
    });

    const saved = await this.orderRepo.save(order);
    saved.serial = `ORD-2025-${saved.id}`;
    return this.orderRepo.save(saved);
  }

  async getOrderById(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new Error("Order not found");
    return order;
  }

  async listOrders() {
    return await this.orderRepo.find({ order: { createdAt: "DESC" } });
  }
}
