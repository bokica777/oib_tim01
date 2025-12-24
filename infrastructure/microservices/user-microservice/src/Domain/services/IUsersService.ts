import { UserDTO } from "../DTOs/UserDTO";
import { CreateUserDTO } from "../DTOs/CreateUserDTO"; 
import { UpdateUserDTO } from "../DTOs/UpdateUserDTO"; 

export interface IUsersService {
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;

  createUser(data: CreateUserDTO): Promise<UserDTO>;
  updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO>;
  deleteUser(id: number): Promise<void>;

  searchUsers(query: {
    username?: string;
    email?: string;
    role?: string;
  }): Promise<UserDTO[]>;
}
