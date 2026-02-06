import { UserDTO } from "../../models/users/UserDTO";

export interface IUserAPI {
  getAllUsers(token: string): Promise<UserDTO[]>;
  getUserById(token: string, id: number): Promise<UserDTO>;
  getCurrentUser(): Promise<UserDTO>;

  createUser(token: string, dto: Partial<UserDTO>): Promise<UserDTO>;
  updateUser(token: string, id: number, dto: Partial<UserDTO>): Promise<UserDTO>;
  deleteUser(token: string, id: number): Promise<void>;
  searchUsers(
    token: string,
    params: { username?: string; email?: string; role?: string }
  ): Promise<UserDTO[]>;
}
