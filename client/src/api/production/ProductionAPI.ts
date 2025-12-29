// src/api/production/ProductionAPI.ts
import axios from "axios";

export class ProductionAPI {
  async getLogs(token: string) {
    const resp = await axios.get("http://localhost:4000/api/v1/production/logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return resp.data;
  }
}
