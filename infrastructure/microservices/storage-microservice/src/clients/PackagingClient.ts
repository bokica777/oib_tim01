import axios from "axios";

export class PackagingClient {
  private baseUrl?: string;

  constructor() {
    this.baseUrl = process.env.PACKAGING_URL; // e.g. http://localhost:6003/api/v1
  }

  async requestPackaging(requiredPackages: number): Promise<void> {
    if (!this.baseUrl) throw new Error("PACKAGING_URL not configured");
    await axios.post(`${this.baseUrl}/pack`, { count: requiredPackages });
  }
}
