import { Repository } from "typeorm";
import { SaleOrder } from "../Domain/models/SaleOrder";
import { StorageClient } from "../clients/StorageClient";
import { OrderStatus } from "../Domain/enums/OrderStatus";

export class SalesService {
  private storage = new StorageClient();

  constructor(private readonly orderRepo: Repository<SaleOrder>) {}

  async createOrder(customer: string, address: string, count: number, role?: string) {
    const packageIds = await this.storage.requestPackages(count, role);

    if (packageIds.length < count) {
      throw new Error("Not enough packages available for sale");
    }

    const order = this.orderRepo.create({
      customerName: customer,
      deliveryAddress: address,
      packagesRequested: count,
      packageIds,
      status: OrderStatus.SHIPPED
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
