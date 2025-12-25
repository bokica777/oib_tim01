import { LoginUserDTO } from "../DTOs/user/LoginUserDTO"; 
import { RegistrationUserDTO } from "../DTOs/user/RegistrationUserDTO";
import { UserDTO } from "../DTOs/user/UserDTO"; 
import { AuthResponseType } from "../types/AuthResponse";

export interface IGatewayService {
  // Auth
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // Users
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;
}
