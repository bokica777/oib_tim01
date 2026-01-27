import { LoginUserDTO } from "../DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../DTOs/RegistrationUserDTO";
import { AuthProvider, User } from "../models/User";
import { AuthResponseType } from "../types/AuthResponse";

export interface IAuthService {
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;
  findOrCreateOAuthUser(data: {
    provider: AuthProvider;
    providerUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  }): Promise<User>;

}
