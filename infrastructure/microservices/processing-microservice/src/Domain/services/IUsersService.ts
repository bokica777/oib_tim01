import { UserDTO } from "../DTOs/PerfumeDTO";

export interface IUsersService {
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;
}
