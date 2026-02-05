import axios, { AxiosInstance } from "axios";
import { IUserAPI } from "./IUserAPI";
import { UserDTO } from "../../models/users/UserDTO";

export class UserAPI implements IUserAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAllUsers(token: string): Promise<UserDTO[]> {
    return (
      await this.axiosInstance.get<UserDTO[]>("/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;
  }

  async getUserById(token: string, id: number): Promise<UserDTO> {
    return (
      await this.axiosInstance.get<UserDTO>(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).data;
  }
  async getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token");
  const res = await this.axiosInstance.get("/users/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async createUser(token: string, dto: Partial<UserDTO>): Promise<UserDTO> {
  return (
    await this.axiosInstance.post<UserDTO>("/users", dto, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;
}

async updateUser(token: string, id: number, dto: Partial<UserDTO>): Promise<UserDTO> {
  return (
    await this.axiosInstance.put<UserDTO>(`/users/${id}`, dto, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;
}

async deleteUser(token: string, id: number): Promise<void> {
  await this.axiosInstance.delete(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async searchUsers(token: string, params: { username?: string; email?: string; role?: string }): Promise<UserDTO[]> {
  const qs = new URLSearchParams();
  if (params.username) qs.set("username", params.username);
  if (params.email) qs.set("email", params.email);
  if (params.role) qs.set("role", params.role);

  return (
    await this.axiosInstance.get<UserDTO[]>(`/users/search?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).data;
}
}
