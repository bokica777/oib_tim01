import { UserRole } from "../enums/UserRole";

export interface CreateUserDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
}
