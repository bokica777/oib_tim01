import axios from "axios";

export class StorageClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.STORAGE_URL!;
  }

  private headers() {
    return {
      "x-gateway-key": process.env.GATEWAY_SECRET
    };
  }

  async requestPackages(count: number, role?: string): Promise<number[]> {
    const url = `${this.baseUrl}/send`;
    const res = await axios.post(url, { count }, {
      timeout: 15000,
      headers: {
        ...this.headers(),
        "x-user-role": role ?? ""
      }
    });
    return res.data.map((p: any) => p.id);
  }
}
